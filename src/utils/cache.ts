import NodeCache from 'node-cache';
import { logger } from './logger';

// Cache-Konfiguration für Raspberry Pi 3
// Kurze TTL wegen begrenztem RAM
const cache = new NodeCache({
  stdTTL: 300, // 5 Minuten Standard-TTL
  checkperiod: 60, // Prüfe jede Minute auf abgelaufene Keys
  useClones: false, // Performance: Keine Klone erstellen
  maxKeys: 100, // Max 100 Cache-Einträge
});

// Cache-Statistiken für Monitoring
let hits = 0;
let misses = 0;

export const cacheService = {
  /**
   * Hole Wert aus dem Cache
   */
  get: <T>(key: string): T | undefined => {
    const value = cache.get<T>(key);
    if (value !== undefined) {
      hits++;
      logger.debug(`Cache HIT: ${key}`);
    } else {
      misses++;
      logger.debug(`Cache MISS: ${key}`);
    }
    return value;
  },

  /**
   * Setze Wert in den Cache
   */
  set: <T>(key: string, value: T, ttl?: number): boolean => {
    return cache.set(key, value, ttl || 300);
  },

  /**
   * Lösche Wert aus dem Cache
   */
  del: (key: string | string[]): number => {
    return cache.del(key);
  },

  /**
   * Lösche alle Werte mit bestimmtem Prefix
   */
  delByPrefix: (prefix: string): number => {
    const keys = cache.keys();
    const matchingKeys = keys.filter((key) => key.startsWith(prefix));
    return cache.del(matchingKeys);
  },

  /**
   * Lösche alle Cache-Einträge
   */
  flush: (): void => {
    cache.flushAll();
    hits = 0;
    misses = 0;
    logger.info('Cache geleert');
  },

  /**
   * Cache-Statistiken
   */
  stats: () => {
    const stats = cache.getStats();
    return {
      ...stats,
      hits,
      misses,
      hitRate: hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0,
    };
  },

  /**
   * Wrapper für cached Funktionen
   */
  wrap: async <T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    const cached = cacheService.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn();
    cacheService.set(key, result, ttl);
    return result;
  },
};

// Log Cache-Stats alle 5 Minuten
setInterval(() => {
  const stats = cacheService.stats();
  if (stats.hits + stats.misses > 0) {
    logger.info(
      `Cache Stats - Hits: ${stats.hits}, Misses: ${stats.misses}, Hit Rate: ${stats.hitRate.toFixed(1)}%, Keys: ${stats.keys}`
    );
  }
}, 300000);

export default cacheService;
