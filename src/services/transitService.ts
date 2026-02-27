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

  // DB REST API Base-URL (Echtzeit-Daten für RE, RB, S-Bahn, National Express)
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

    logger.info('TransitService initialisiert mit Dual-HAFAS (Bus + Zug)');
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
   * Lade Zug-Abfahrten über DB REST API (v6.db.transport.rest)
   * Liefert Echtzeit-Daten inkl. Verspätungen für RE, RB, S-Bahn, National Express
   * Fallback: INSA HAFAS (ohne Echtzeit-Delay, aber zuverlässig)
   */
  private async fetchTrainDepartures(stationId: string, limit: number, duration: number): Promise<any[]> {
    // Versuch 1: DB REST API (Echtzeit)
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

      // In HAFAS-kompatibles Format umwandeln
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

    // Versuch 2: INSA HAFAS Fallback (zuverlässig, ohne Echtzeit-Delay)
    const insaResult = await this.insaClient.departures(stationId, {
      duration,
      results: limit,
    });

    logger.info(`INSA Fallback: ${insaResult.departures.length} Zug-Abfahrten geladen (ohne Echtzeit)`);
    return insaResult.departures;
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
