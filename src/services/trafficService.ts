import axios, { AxiosInstance } from 'axios';
import NodeCache from 'node-cache';
import logger from '../utils/logger';

// Typen für Verkehrsdaten
export interface TrafficWarning {
  identifier: string;
  title: string;
  subtitle?: string;
  description?: string;
  startTimestamp?: string;
  isBlocked?: boolean;
  roadTypes?: string[];
  coordinate?: {
    lat: string;
    long: string;
  };
  extent?: string; // z.B. "5 km"
  icon?: string;
  lorryParkingFeatureIcons?: string[];
  futureBlocking?: boolean;
  displayType?: string;
}

export interface RoadworkInfo {
  identifier: string;
  title: string;
  subtitle?: string;
  startTimestamp?: string;
  extent?: string;
  roadTypes?: string[];
  coordinate?: {
    lat: string;
    long: string;
  };
}

export interface HighwayStatus {
  roadId: string; // z.B. "A1", "A7"
  name: string;
  warnings: TrafficWarning[];
  roadworks: RoadworkInfo[];
  status: 'free' | 'slow' | 'congested' | 'blocked';
  statusColor: 'green' | 'yellow' | 'orange' | 'red';
}

export interface TrafficServiceConfig {
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
  apiBaseUrl: string;
  defaultRoads: string[];
  centerPoint?: {
    lat: number;
    lon: number;
  };
  maxDistance?: number; // km - Maximaler Radius für Verkehrsmeldungen
}

class TrafficService {
  private client: AxiosInstance;
  private cache: NodeCache;
  private config: TrafficServiceConfig;

  constructor() {
    // Standard-Konfiguration
    this.config = {
      cacheEnabled: true,
      cacheTTL: 300, // 5 Minuten Cache für Verkehrsdaten
      apiBaseUrl: 'https://verkehr.autobahn.de/o/autobahn',
      defaultRoads: ['A1', 'A2'], // Autobahnen im Umkreis von Ahlen
      centerPoint: {
        lat: 51.7633, // Ahlen, NRW
        lon: 7.8919,
      },
      maxDistance: 20, // 20 km Radius um Ahlen
    };

    // Axios Client für Autobahn API
    this.client = axios.create({
      baseURL: this.config.apiBaseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PRASCO-Infoscreen/2.0',
      },
    });

    // Cache-Initialisierung
    this.cache = new NodeCache({
      stdTTL: this.config.cacheTTL,
      checkperiod: 120,
      useClones: false,
    });

    logger.info('TrafficService initialisiert mit Autobahn API');
  }

  /**
   * Berechne Distanz zwischen zwei Koordinaten (Haversine-Formel)
   * @returns Distanz in Kilometern
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Erdradius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Konvertiere Grad zu Radiant
   */
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Filtere Meldungen nach Distanz vom Zentrum
   */
  private filterByDistance<T extends { coordinate?: { lat: string; long: string } }>(
    items: T[]
  ): T[] {
    if (!this.config.centerPoint || !this.config.maxDistance) {
      return items;
    }

    const filtered = items.filter(item => {
      if (!item.coordinate || !item.coordinate.lat || !item.coordinate.long) {
        // Keine Koordinaten -> behalten (sicherheitshalber)
        return true;
      }

      try {
        const itemLat = parseFloat(item.coordinate.lat);
        const itemLon = parseFloat(item.coordinate.long);

        if (isNaN(itemLat) || isNaN(itemLon)) {
          return true;
        }

        const distance = this.calculateDistance(
          this.config.centerPoint!.lat,
          this.config.centerPoint!.lon,
          itemLat,
          itemLon
        );

        return distance <= this.config.maxDistance!;
      } catch (error) {
        logger.warn('Fehler beim Filtern nach Distanz:', error);
        return true;
      }
    });

    logger.debug(
      `Gefiltert: ${items.length} -> ${filtered.length} Meldungen (max ${this.config.maxDistance}km von Zentrum)`
    );

    return filtered;
  }

  /**
   * Hole Verkehrswarnungen für eine Autobahn
   */
  async getWarnings(roadId: string): Promise<TrafficWarning[]> {
    try {
      const cacheKey = `warnings:${roadId}`;

      // Cache-Check
      if (this.config.cacheEnabled) {
        const cached = this.cache.get<TrafficWarning[]>(cacheKey);
        if (cached) {
          logger.debug(`Traffic warnings cache hit: ${roadId}`);
          return cached;
        }
      }

      logger.info(`Lade Verkehrswarnungen für ${roadId}`);

      const response = await this.client.get(`/${roadId}/services/warning`);
      const warnings: TrafficWarning[] = response.data.warning || [];

      // Nach Distanz filtern
      const filtered = this.filterByDistance(warnings);

      // In Cache speichern
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, filtered);
      }

      logger.info(`${filtered.length} Warnungen geladen für ${roadId} (${warnings.length} gesamt, gefiltert nach Umkreis)`);
      return filtered;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Fehler beim Laden der Verkehrswarnungen für ${roadId}:`, error.message);
      } else {
        logger.error(`Unerwarteter Fehler bei Verkehrswarnungen:`, error);
      }
      // Bei Fehler leeres Array zurückgeben statt zu werfen
      return [];
    }
  }

  /**
   * Hole Baustellen-Informationen für eine Autobahn
   */
  async getRoadworks(roadId: string): Promise<RoadworkInfo[]> {
    try {
      const cacheKey = `roadworks:${roadId}`;

      // Cache-Check
      if (this.config.cacheEnabled) {
        const cached = this.cache.get<RoadworkInfo[]>(cacheKey);
        if (cached) {
          logger.debug(`Roadworks cache hit: ${roadId}`);
          return cached;
        }
      }

      logger.info(`Lade Baustellen für ${roadId}`);

      const response = await this.client.get(`/${roadId}/services/roadworks`);
      const roadworks: RoadworkInfo[] = response.data.roadworks || [];

      // Nach Distanz filtern
      const filtered = this.filterByDistance(roadworks);

      // In Cache speichern
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, filtered);
      }

      logger.info(`${filtered.length} Baustellen geladen für ${roadId} (${roadworks.length} gesamt, gefiltert nach Umkreis)`);
      return filtered;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Fehler beim Laden der Baustellen für ${roadId}:`, error.message);
      } else {
        logger.error(`Unerwarteter Fehler bei Baustellen:`, error);
      }
      return [];
    }
  }

  /**
   * Hole kompletten Highway-Status mit Warnungen und Baustellen
   */
  async getHighwayStatus(roadId: string): Promise<HighwayStatus> {
    try {
      const [warnings, roadworks] = await Promise.all([
        this.getWarnings(roadId),
        this.getRoadworks(roadId),
      ]);

      // Bestimme Status basierend auf Warnungen
      const status = this.determineStatus(warnings);

      return {
        roadId,
        name: roadId,
        warnings,
        roadworks,
        status: status.status,
        statusColor: status.color,
      };
    } catch (error) {
      logger.error(`Fehler beim Laden des Highway-Status für ${roadId}:`, error);
      
      // Fallback-Status
      return {
        roadId,
        name: roadId,
        warnings: [],
        roadworks: [],
        status: 'free',
        statusColor: 'green',
      };
    }
  }

  /**
   * Hole Status für mehrere Autobahnen
   */
  async getMultipleHighwayStatus(roadIds: string[]): Promise<HighwayStatus[]> {
    try {
      logger.info(`Lade Status für ${roadIds.length} Autobahnen: ${roadIds.join(', ')}`);
      
      const statusPromises = roadIds.map(roadId => this.getHighwayStatus(roadId));
      const results = await Promise.all(statusPromises);
      
      return results;
    } catch (error) {
      logger.error('Fehler beim Laden mehrerer Highway-Status:', error);
      throw error;
    }
  }

  /**
   * Bestimme Verkehrsstatus basierend auf Warnungen
   */
  private determineStatus(warnings: TrafficWarning[]): {
    status: 'free' | 'slow' | 'congested' | 'blocked';
    color: 'green' | 'yellow' | 'orange' | 'red';
  } {
    if (warnings.length === 0) {
      return { status: 'free', color: 'green' };
    }

    // Prüfe auf Sperrungen
    const hasBlocking = warnings.some(w => w.isBlocked || w.title.toLowerCase().includes('gesperrt'));
    if (hasBlocking) {
      return { status: 'blocked', color: 'red' };
    }

    // Prüfe auf Staus
    const hasJam = warnings.some(w => 
      w.title.toLowerCase().includes('stau') ||
      w.subtitle?.toLowerCase().includes('stau')
    );
    if (hasJam) {
      // Großer Stau (>5km) = congested, kleiner = slow
      const hasLargeJam = warnings.some(w => {
        const extent = w.extent || '';
        const km = parseInt(extent.match(/(\d+)\s*km/)?.[1] || '0');
        return km > 5;
      });
      
      return hasLargeJam 
        ? { status: 'congested', color: 'red' }
        : { status: 'slow', color: 'orange' };
    }

    // Prüfe auf Behinderungen
    const hasDelay = warnings.some(w =>
      w.title.toLowerCase().includes('behinderung') ||
      w.title.toLowerCase().includes('verzögerung')
    );
    if (hasDelay) {
      return { status: 'slow', color: 'yellow' };
    }

    // Sonstige Warnungen
    return { status: 'slow', color: 'yellow' };
  }

  /**
   * Liste verfügbare Autobahnen
   */
  async getAvailableRoads(): Promise<string[]> {
    try {
      const cacheKey = 'available_roads';

      // Cache-Check
      if (this.config.cacheEnabled) {
        const cached = this.cache.get<string[]>(cacheKey);
        if (cached) {
          logger.debug('Available roads cache hit');
          return cached;
        }
      }

      logger.info('Lade verfügbare Autobahnen');

      const response = await this.client.get('/');
      const roads: string[] = response.data.roads || [];

      // In Cache speichern (lange TTL, ändert sich selten)
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, roads, 86400); // 24 Stunden
      }

      logger.info(`${roads.length} Autobahnen verfügbar`);
      return roads;
    } catch (error) {
      logger.error('Fehler beim Laden verfügbarer Autobahnen:', error);
      // Fallback auf Standard-Autobahnen
      return this.config.defaultRoads;
    }
  }

  /**
   * Konfiguration aktualisieren
   */
  updateConfig(config: Partial<TrafficServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Cache TTL aktualisieren
    if (config.cacheTTL !== undefined) {
      this.cache.options.stdTTL = config.cacheTTL;
    }

    // API Base URL aktualisieren
    if (config.apiBaseUrl !== undefined) {
      this.client.defaults.baseURL = config.apiBaseUrl;
    }

    logger.info('TrafficService Konfiguration aktualisiert:', this.config);
  }

  /**
   * Cache leeren
   */
  clearCache(): void {
    this.cache.flushAll();
    logger.info('TrafficService Cache geleert');
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
export default new TrafficService();
