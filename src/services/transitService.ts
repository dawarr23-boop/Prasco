import { createClient, HafasClient } from 'hafas-client';
import { profile as nrwProfile } from 'hafas-client/p/db-busradar-nrw/index.js';
import { profile as insaProfile } from 'hafas-client/p/insa/index.js';
import NodeCache from 'node-cache';
import logger from '../utils/logger';

// Typen für Transit-Daten
export interface Station {
  id: string;
  name: string;
  location?: {
    type: 'location';
    latitude: number;
    longitude: number;
  };
  products?: Record<string, boolean>;
}

export interface Departure {
  tripId: string;
  line: {
    id?: string;
    name: string;
    mode: string; // 'train', 'bus', 'tram', 'subway', etc.
    product: string;
    productName?: string;
  };
  direction: string;
  when: string; // ISO timestamp
  plannedWhen: string;
  delay?: number; // in seconds
  platform?: string;
  plannedPlatform?: string;
  isDelayed?: boolean;
  cancelled?: boolean;
}

export interface TransitServiceConfig {
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
  maxDepartures: number;
  defaultStationId?: string;
}

class TransitService {
  private busClient: HafasClient;
  private insaClient: HafasClient;
  private cache: NodeCache;
  private config: TransitServiceConfig;

  // DB Timetables API (offizielle DB API mit Echtzeit)
  private readonly DB_TIMETABLES_BASE = 'https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1';
  private readonly DB_CLIENT_ID = process.env.DB_TIMETABLES_CLIENT_ID || '';
  private readonly DB_API_KEY = process.env.DB_TIMETABLES_API_KEY || '';

  // DB REST API Fallback
  private readonly DB_REST_API = 'https://v6.db.transport.rest';

  // Station-ID Mapping: db-busradar-nrw (Busse) nutzt andere IDs als DB (EVA-Nummern)
  private readonly TRAIN_STATION_MAP: Record<string, string> = {
    '9424069': '8000441', // Ahlen Bahnhof: busradar-ID -> DB EVA-ID
  };

  constructor() {
    // Bus-Client: DB Busradar NRW (db-regio.hafas.de) - für Busse
    this.busClient = createClient(nrwProfile, 'prasco-transit-v1');
    // INSA-Client: Fallback für Züge wenn DB REST API nicht verfügbar
    this.insaClient = createClient(insaProfile, 'prasco-transit-v1');
    
    // Standard-Konfiguration
    this.config = {
      cacheEnabled: true,
      cacheTTL: 30, // 30 Sekunden Cache für Live-Abfahrten
      maxDepartures: 10,
    };

    // Cache-Initialisierung
    this.cache = new NodeCache({
      stdTTL: this.config.cacheTTL,
      checkperiod: 60,
      useClones: false,
    });

    logger.info(`TransitService initialisiert mit Dual-HAFAS (Bus + Zug), DB Timetables API ${this.DB_CLIENT_ID ? 'konfiguriert' : 'NICHT konfiguriert'}`);
  }

  /**
   * Suche Stationen nach Name
   */
  async searchStations(query: string, limit: number = 5): Promise<Station[]> {
    try {
      const cacheKey = `stations:${query}:${limit}`;
      
      // Cache-Check
      if (this.config.cacheEnabled) {
        const cached = this.cache.get<Station[]>(cacheKey);
        if (cached) {
          logger.debug(`Stations cache hit: ${query}`);
          return cached;
        }
      }

      logger.info(`Suche Stationen: "${query}"`);
      
      const locations = await this.busClient.locations(query, {
        results: limit,
        stops: true,
        addresses: false,
        poi: false,
      });

      const stations: Station[] = locations
        .filter((loc: any) => loc.type === 'stop' || loc.type === 'station')
        .map((loc: any) => ({
          id: loc.id,
          name: loc.name,
          location: loc.location,
          products: loc.products,
        }));

      // In Cache speichern (längerer TTL für Stationsdaten)
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, stations, 3600); // 1 Stunde
      }

      return stations;
    } catch (error) {
      logger.error('Fehler bei Stationssuche:', error);
      throw new Error(`Stationssuche fehlgeschlagen: ${(error as Error).message}`);
    }
  }

  /**
   * Lade Zug-Abfahrten — 3-stufige Strategie:
   * 1. DB Timetables API (offizielle API, Echtzeit mit Verspätungen)
   * 2. v6.db.transport.rest (öffentlich, Echtzeit)
   * 3. INSA HAFAS (zuverlässig, ohne Echtzeit-Delay)
   */
  private async fetchTrainDepartures(stationId: string, limit: number, duration: number): Promise<any[]> {
    // Versuch 1: Offizielle DB Timetables API
    if (this.DB_CLIENT_ID && this.DB_API_KEY) {
      try {
        const departures = await this.fetchFromDbTimetables(stationId, limit);
        if (departures.length > 0) {
          logger.info(`DB Timetables API: ${departures.length} Zug-Abfahrten mit Echtzeit geladen`);
          return departures;
        }
      } catch (dbTimetablesError: any) {
        logger.warn(`DB Timetables API fehlgeschlagen (${dbTimetablesError.message}), versuche Fallback`);
      }
    }

    // Versuch 2: DB REST API (Echtzeit)
    try {
      const url = `${this.DB_REST_API}/stops/${stationId}/departures?duration=${duration}&results=${limit}&bus=false&taxi=false`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'prasco-transit-v1' },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        throw new Error(`DB REST API HTTP ${response.status}`);
      }

      const data: any = await response.json();
      const departures = data.departures || [];

      logger.info(`DB REST API: ${departures.length} Zug-Abfahrten mit Echtzeit geladen`);

      return departures.map((dep: any) => ({
        tripId: dep.tripId || '',
        line: {
          id: dep.line?.id,
          name: dep.line?.name || 'Unknown',
          mode: dep.line?.mode || 'train',
          product: dep.line?.product || 'regional',
          productName: dep.line?.productName,
        },
        direction: dep.direction || 'Unknown',
        when: dep.when,
        plannedWhen: dep.plannedWhen,
        delay: dep.delay,
        platform: dep.platform,
        plannedPlatform: dep.plannedPlatform,
        cancelled: dep.cancelled || false,
      }));
    } catch (dbError: any) {
      logger.warn(`DB REST API nicht verfügbar (${dbError.message}), Fallback auf INSA HAFAS`);
    }

    // Versuch 3: INSA HAFAS Fallback (zuverlässig, ohne Echtzeit-Delay)
    const insaResult = await this.insaClient.departures(stationId, {
      duration,
      results: limit,
    });

    logger.info(`INSA Fallback: ${insaResult.departures.length} Zug-Abfahrten geladen (ohne Echtzeit)`);
    return insaResult.departures;
  }

  /**
   * DB Timetables API: Plan + Echtzeit-Änderungen zusammenführen
   * Liefert exakte Verspätungsdaten direkt von der Deutschen Bahn
   */
  private async fetchFromDbTimetables(evaNumber: string, limit: number): Promise<any[]> {
    const headers = {
      'DB-Client-Id': this.DB_CLIENT_ID,
      'DB-Api-Key': this.DB_API_KEY,
      'accept': 'application/xml',
    };

    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const hour = String(now.getHours()).padStart(2, '0');

    // Parallele Abfrage: Planmäßige Abfahrten + Echtzeit-Änderungen
    const [planRes, fchgRes] = await Promise.all([
      fetch(`${this.DB_TIMETABLES_BASE}/plan/${evaNumber}/${dateStr}/${hour}`, {
        headers, signal: AbortSignal.timeout(8000),
      }),
      fetch(`${this.DB_TIMETABLES_BASE}/fchg/${evaNumber}`, {
        headers, signal: AbortSignal.timeout(8000),
      }),
    ]);

    if (!planRes.ok) throw new Error(`Plan API HTTP ${planRes.status}`);
    if (!fchgRes.ok) throw new Error(`Fchg API HTTP ${fchgRes.status}`);

    const planXml = await planRes.text();
    const fchgXml = await fchgRes.text();

    // XML parsen (einfacher Regex-basierter Parser für die DB Timetables XML-Struktur)
    const planStops = this.parseTimetableXml(planXml);
    const fchgChanges = this.parseFchgXml(fchgXml);

    // Echtzeit-Änderungen auf Plan anwenden
    const departures: any[] = [];
    const nowMs = now.getTime();

    for (const stop of planStops) {
      if (!stop.dpTime) continue; // Kein Abfahrt (Endstation)
      
      const change = fchgChanges.get(stop.id);
      const plannedTime = this.parseTimetableTime(stop.dpTime);
      if (!plannedTime) continue;

      let actualTime = plannedTime;
      let delay = 0;
      let cancelled = false;

      if (change) {
        if (change.dpCancelled) {
          cancelled = true;
        }
        if (change.dpChangedTime) {
          actualTime = this.parseTimetableTime(change.dpChangedTime) || plannedTime;
          delay = Math.round((actualTime.getTime() - plannedTime.getTime()) / 1000);
        }
      }

      // Nur zukünftige Abfahrten
      if (actualTime.getTime() < nowMs - 60000) continue;

      departures.push({
        tripId: stop.id,
        line: {
          id: (stop.line || '').toLowerCase(),
          name: stop.line || 'Unknown',
          mode: 'train',
          product: stop.category === 'NX' ? 'nationalExpress' : 'regional',
          productName: stop.category || 'RE',
        },
        direction: stop.dpPath?.split('|').pop() || 'Unknown',
        when: actualTime.toISOString(),
        plannedWhen: plannedTime.toISOString(),
        delay,
        platform: change?.dpChangedPlatform || stop.dpPlatform,
        plannedPlatform: stop.dpPlatform,
        cancelled,
      });
    }

    // Nach Zeit sortieren und limitieren
    departures.sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime());
    return departures.slice(0, limit);
  }

  /**
   * Parse DB Timetables Plan-XML (Planmäßige Stops)
   */
  private parseTimetableXml(xml: string): Array<{
    id: string; line: string; category: string;
    dpTime?: string; dpPlatform?: string; dpPath?: string;
    arTime?: string; arPlatform?: string;
  }> {
    const stops: any[] = [];
    const stopRegex = /<s id="([^"]+)">([\s\S]*?)<\/s>/g;
    let match;

    while ((match = stopRegex.exec(xml)) !== null) {
      const id = match[1];
      const content = match[2];

      // Kategorie und Linie aus <tl>
      const tlMatch = content.match(/<tl[^>]*\bc="([^"]*)"[^>]*/);
      const category = tlMatch?.[1] || '';

      // Departure
      const dpMatch = content.match(/<dp\s+([^>]+)/);
      let dpTime, dpPlatform, dpPath, line;
      if (dpMatch) {
        dpTime = dpMatch[1].match(/\bpt="([^"]+)"/)?.[1];
        dpPlatform = dpMatch[1].match(/\bpp="([^"]+)"/)?.[1];
        dpPath = dpMatch[1].match(/\bppth="([^"]+)"/)?.[1];
        line = dpMatch[1].match(/\bl="([^"]+)"/)?.[1];
      }

      // Arrival (für line-Fallback)
      const arMatch = content.match(/<ar\s+([^>]+)/);
      let arTime, arPlatform;
      if (arMatch) {
        arTime = arMatch[1].match(/\bpt="([^"]+)"/)?.[1];
        arPlatform = arMatch[1].match(/\bpp="([^"]+)"/)?.[1];
        if (!line) line = arMatch[1].match(/\bl="([^"]+)"/)?.[1];
      }

      stops.push({ id, line: line || '', category, dpTime, dpPlatform, dpPath, arTime, arPlatform });
    }

    return stops;
  }

  /**
   * Parse DB Timetables Fchg-XML (Echtzeit-Änderungen)
   */
  private parseFchgXml(xml: string): Map<string, {
    dpChangedTime?: string; dpChangedPlatform?: string; dpCancelled?: boolean;
    arChangedTime?: string; arCancelled?: boolean;
  }> {
    const changes = new Map<string, any>();
    const stopRegex = /<s id="([^"]+)">([\s\S]*?)<\/s>/g;
    let match;

    while ((match = stopRegex.exec(xml)) !== null) {
      const id = match[1];
      const content = match[2];

      const entry: any = {};

      // Departure changes
      const dpMatch = content.match(/<dp\s+([^>]*?)\/?>(?:[\s\S]*?<\/dp>)?/);
      if (dpMatch) {
        const dpAttrs = dpMatch[1];
        entry.dpChangedTime = dpAttrs.match(/\bct="([^"]+)"/)?.[1];
        entry.dpChangedPlatform = dpAttrs.match(/\bcp="([^"]+)"/)?.[1];
        entry.dpCancelled = dpAttrs.match(/\bcs="c"/) !== null;
      }

      // Arrival changes
      const arMatch = content.match(/<ar\s+([^>]*?)\/?>(?:[\s\S]*?<\/ar>)?/);
      if (arMatch) {
        const arAttrs = arMatch[1];
        entry.arChangedTime = arAttrs.match(/\bct="([^"]+)"/)?.[1];
        entry.arCancelled = arAttrs.match(/\bcs="c"/) !== null;
      }

      changes.set(id, entry);
    }

    return changes;
  }

  /**
   * Parse DB Timetable-Zeitformat (YYMMDDHHMM) zu Date
   */
  private parseTimetableTime(timeStr: string): Date | null {
    if (!timeStr || timeStr.length < 10) return null;
    const year = 2000 + parseInt(timeStr.slice(0, 2));
    const month = parseInt(timeStr.slice(2, 4)) - 1;
    const day = parseInt(timeStr.slice(4, 6));
    const hour = parseInt(timeStr.slice(6, 8));
    const minute = parseInt(timeStr.slice(8, 10));
    return new Date(year, month, day, hour, minute);
  }

  /**
   * Hole Abfahrten für eine Station
   */
  async getDepartures(
    stationId: string,
    maxResults?: number,
    duration?: number // Minuten in die Zukunft
  ): Promise<Departure[]> {
    try {
      const limit = maxResults || this.config.maxDepartures;
      const durationMinutes = duration || 60;
      const cacheKey = `departures:${stationId}:${limit}:${durationMinutes}`;

      // Cache-Check
      if (this.config.cacheEnabled) {
        const cached = this.cache.get<Departure[]>(cacheKey);
        if (cached) {
          logger.debug(`Departures cache hit: ${stationId}`);
          return cached;
        }
      }

      logger.info(`Lade Abfahrten für Station: ${stationId}`);

      // Parallele Abfrage: Busse (db-busradar-nrw HAFAS) + Züge (DB REST API mit Echtzeit)
      const trainStationId = this.TRAIN_STATION_MAP[stationId] || stationId;
      
      const [busResult, trainResult] = await Promise.allSettled([
        this.busClient.departures(stationId, {
          duration: durationMinutes,
          results: limit,
        }),
        this.fetchTrainDepartures(trainStationId, limit, durationMinutes),
      ]);

      const allDepartures: any[] = [];
      
      // DB REST API hat Echtzeit → Priorität für Züge; Busradar für Busse
      if (trainResult.status === 'fulfilled') {
        allDepartures.push(...trainResult.value);
        logger.info(`${trainResult.value.length} Zug-Abfahrten geladen (DB REST API mit Echtzeit)`);
      } else {
        logger.warn('Zug-Abfahrten fehlgeschlagen:', trainResult.reason?.message);
      }

      if (busResult.status === 'fulfilled') {
        // Deduplizierung: Busradar-Einträge nur hinzufügen wenn nicht schon von DB REST vorhanden
        const existingKeys = new Set(allDepartures.map((d: any) => 
          `${(d.line?.name || '').toLowerCase()}:${d.plannedWhen}`
        ));
        const busOnlyDeps = busResult.value.departures.filter((d: any) => {
          const key = `${(d.line?.name || '').toLowerCase()}:${d.plannedWhen}`;
          return !existingKeys.has(key);
        });
        allDepartures.push(...busOnlyDeps);
        logger.info(`${busOnlyDeps.length} Bus-Abfahrten hinzugefügt (${busResult.value.departures.length} total, nach Deduplizierung)`);
      } else {
        logger.warn('Bus-Abfahrten fehlgeschlagen:', busResult.reason?.message);
      }

      const formattedDepartures: Departure[] = allDepartures.map((dep: any) => ({
        tripId: dep.tripId,
        line: {
          id: dep.line?.id,
          name: dep.line?.name || 'Unknown',
          mode: dep.line?.mode || 'unknown',
          product: dep.line?.product || 'unknown',
          productName: dep.line?.productName,
        },
        direction: dep.direction || 'Unknown',
        when: dep.when,
        plannedWhen: dep.plannedWhen,
        delay: dep.delay || 0,
        platform: dep.platform,
        plannedPlatform: dep.plannedPlatform,
        isDelayed: dep.delay && dep.delay > 0,
        cancelled: dep.cancelled || false,
      }));

      // Nach Abfahrtszeit sortieren
      formattedDepartures.sort((a, b) => {
        const timeA = new Date(a.when || a.plannedWhen).getTime();
        const timeB = new Date(b.when || b.plannedWhen).getTime();
        return timeA - timeB;
      });

      // In Cache speichern
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, formattedDepartures);
      }

      logger.info(`${formattedDepartures.length} Abfahrten geladen für Station ${stationId} (Bus+DB-REST)`);
      return formattedDepartures;
    } catch (error) {
      logger.error('Fehler beim Laden der Abfahrten:', error);
      throw new Error(`Abfahrten konnten nicht geladen werden: ${(error as Error).message}`);
    }
  }

  /**
   * Suche nahegelegene Stationen (GPS)
   */
  async getNearbyStations(
    latitude: number,
    longitude: number,
    radius: number = 1000, // Meter
    limit: number = 5
  ): Promise<Station[]> {
    try {
      const cacheKey = `nearby:${latitude}:${longitude}:${radius}:${limit}`;

      // Cache-Check
      if (this.config.cacheEnabled) {
        const cached = this.cache.get<Station[]>(cacheKey);
        if (cached) {
          logger.debug(`Nearby stations cache hit: ${latitude},${longitude}`);
          return cached;
        }
      }

      logger.info(`Suche Stationen in der Nähe: ${latitude}, ${longitude}`);

      const locations = await this.busClient.nearby(
        { type: 'location', latitude, longitude },
        {
          results: limit,
          distance: radius,
        }
      );

      const stations: Station[] = locations
        .filter((loc: any) => loc.type === 'stop' || loc.type === 'station')
        .map((loc: any) => ({
          id: loc.id,
          name: loc.name,
          location: loc.location,
          products: loc.products,
        }));

      // In Cache speichern
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, stations, 3600); // 1 Stunde
      }

      return stations;
    } catch (error) {
      logger.error('Fehler bei Nearby-Suche:', error);
      throw new Error(`Nearby-Suche fehlgeschlagen: ${(error as Error).message}`);
    }
  }

  /**
   * Konfiguration aktualisieren
   */
  updateConfig(config: Partial<TransitServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Cache TTL aktualisieren
    if (config.cacheTTL !== undefined) {
      this.cache.options.stdTTL = config.cacheTTL;
    }

    logger.info('TransitService Konfiguration aktualisiert:', this.config);
  }

  /**
   * Cache leeren
   */
  clearCache(): void {
    this.cache.flushAll();
    logger.info('TransitService Cache geleert');
  }

  /**
   * Cache-Statistiken
   */
  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      stats: this.cache.getStats(),
    };
  }
}

// Singleton Export
export default new TransitService();
