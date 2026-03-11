// ── Mocks (must come before imports) ──────────────────────────────────────────

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// node-cache mock
const mockCacheGet = jest.fn().mockReturnValue(undefined);
const mockCacheSet = jest.fn().mockReturnValue(true);
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => ({
    get: mockCacheGet,
    set: mockCacheSet,
    del: jest.fn().mockReturnValue(1),
    keys: jest.fn().mockReturnValue([]),
    getStats: jest.fn().mockReturnValue({ keys: 0, hits: 0, misses: 0 }),
    flushAll: jest.fn(),
  }));
});

// hafas-client mock — both nrw and insa profiles
const mockLocations = jest.fn();
const mockDepartures = jest.fn();
const mockHafasClient = {
  locations: mockLocations,
  departures: mockDepartures,
};
jest.mock('hafas-client', () => ({
  createClient: jest.fn().mockReturnValue(mockHafasClient),
}));

// Mock hafas profiles (just plain objects, values don't matter for unit tests)
jest.mock('hafas-client/p/db-busradar-nrw/index.js', () => ({ profile: {} }), { virtual: true });
jest.mock('hafas-client/p/insa/index.js', () => ({ profile: {} }), { virtual: true });

// ── Imports (after mocks) ──────────────────────────────────────────────────────
import transitService from '../../src/services/transitService';
import type {
  Station,
  Departure,
  TransitServiceConfig,
} from '../../src/services/transitService';

// ── Test helpers ───────────────────────────────────────────────────────────────
function makeHafasStop(overrides: any = {}): any {
  return {
    type: 'stop',
    id: '9424069',
    name: 'Ahlen Bahnhof',
    location: { type: 'location', latitude: 51.7633, longitude: 7.8919 },
    products: { bus: true, national: false },
    ...overrides,
  };
}

function makeDeparture(overrides: Partial<Departure> = {}): any {
  return {
    tripId: 'trip-001',
    line: { id: 'bus-1', name: 'Bus 1', mode: 'bus', product: 'bus' },
    direction: 'Ahlen Zentrum',
    when: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    plannedWhen: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    delay: 0,
    cancelled: false,
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('TransitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheGet.mockReturnValue(undefined);
    mockLocations.mockResolvedValue([makeHafasStop()]);
    mockDepartures.mockResolvedValue({ departures: [makeDeparture()] });
  });

  // ----------------------------------------------------------------
  // searchStations
  // ----------------------------------------------------------------
  describe('searchStations', () => {
    it('should return stations from the HAFAS client', async () => {
      mockLocations.mockResolvedValue([makeHafasStop()]);

      const results = await transitService.searchStations('Ahlen');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should map HAFAS locations to Station objects', async () => {
      mockLocations.mockResolvedValue([
        makeHafasStop({ id: 'S1', name: 'Ahlen Bf' }),
      ]);

      const results = await transitService.searchStations('Ahlen');
      expect(results[0]).toMatchObject({ id: 'S1', name: 'Ahlen Bf' });
    });

    it('should filter out non-stop/non-station location types', async () => {
      mockLocations.mockResolvedValue([
        makeHafasStop({ type: 'stop' }),
        makeHafasStop({ type: 'station' }),
        makeHafasStop({ type: 'address' }), // should be filtered
        makeHafasStop({ type: 'poi' }),      // should be filtered
      ]);

      const results = await transitService.searchStations('Ahlen');
      expect(results).toHaveLength(2);
    });

    it('should pass query and limit to HAFAS locations()', async () => {
      mockLocations.mockResolvedValue([]);
      await transitService.searchStations('Dortmund', 10);

      expect(mockLocations).toHaveBeenCalledWith(
        'Dortmund',
        expect.objectContaining({ results: 10 })
      );
    });

    it('should use default limit of 5 when not specified', async () => {
      mockLocations.mockResolvedValue([]);
      await transitService.searchStations('Münster');

      expect(mockLocations).toHaveBeenCalledWith(
        'Münster',
        expect.objectContaining({ results: 5 })
      );
    });

    it('should request only stops (not addresses or POIs)', async () => {
      mockLocations.mockResolvedValue([]);
      await transitService.searchStations('Ahlen');

      expect(mockLocations).toHaveBeenCalledWith(
        'Ahlen',
        expect.objectContaining({ stops: true, addresses: false, poi: false })
      );
    });

    it('should cache results and return from cache on second call', async () => {
      const cached: Station[] = [{ id: 'S1', name: 'Cached Station' }];
      mockCacheGet.mockReturnValueOnce(undefined).mockReturnValueOnce(cached);
      mockLocations.mockResolvedValue([]);

      await transitService.searchStations('Ahlen');
      const result2 = await transitService.searchStations('Ahlen');

      expect(result2).toBe(cached);
      expect(mockLocations).toHaveBeenCalledTimes(1);
    });

    it('should store results in cache after API call', async () => {
      mockLocations.mockResolvedValue([makeHafasStop()]);
      await transitService.searchStations('Ahlen');
      expect(mockCacheSet).toHaveBeenCalled();
    });

    it('should throw a descriptive error when HAFAS call fails', async () => {
      mockLocations.mockRejectedValue(new Error('HAFAS offline'));

      await expect(transitService.searchStations('Ahlen')).rejects.toThrow(
        'Stationssuche fehlgeschlagen'
      );
    });

    it('should return an empty array when no stops match the query', async () => {
      mockLocations.mockResolvedValue([]); // empty result from HAFAS
      const results = await transitService.searchStations('NoSuchPlace');
      expect(results).toEqual([]);
    });

    it('should include location data when available', async () => {
      mockLocations.mockResolvedValue([
        makeHafasStop({
          location: { type: 'location', latitude: 51.7633, longitude: 7.8919 },
        }),
      ]);

      const results = await transitService.searchStations('Ahlen');
      expect(results[0].location).toBeDefined();
      expect(results[0].location?.latitude).toBe(51.7633);
    });

    it('should include products data when available', async () => {
      mockLocations.mockResolvedValue([
        makeHafasStop({ products: { bus: true, national: false, regional: true } }),
      ]);

      const results = await transitService.searchStations('Ahlen');
      expect(results[0].products).toBeDefined();
      expect(results[0].products?.bus).toBe(true);
    });
  });

  // ----------------------------------------------------------------
  // Station interface
  // ----------------------------------------------------------------
  describe('Station interface', () => {
    it('should accept a minimal station with id and name', () => {
      const station: Station = { id: 'S-001', name: 'Testbahnhof' };
      expect(station.id).toBe('S-001');
      expect(station.name).toBe('Testbahnhof');
    });

    it('should accept station with full location', () => {
      const station: Station = {
        id: 'S-001',
        name: 'Ahlen Bf',
        location: { type: 'location', latitude: 51.76, longitude: 7.89 },
      };
      expect(station.location?.latitude).toBe(51.76);
    });

    it('optional fields should be undefined when not provided', () => {
      const station: Station = { id: 'X', name: 'Y' };
      expect(station.location).toBeUndefined();
      expect(station.products).toBeUndefined();
    });
  });

  // ----------------------------------------------------------------
  // Departure interface
  // ----------------------------------------------------------------
  describe('Departure interface', () => {
    it('should accept a valid departure', () => {
      const dep: Departure = makeDeparture();
      expect(dep.tripId).toBe('trip-001');
      expect(dep.line.name).toBe('Bus 1');
      expect(dep.direction).toBe('Ahlen Zentrum');
    });

    it('should support cancelled departures', () => {
      const dep: Departure = makeDeparture({ cancelled: true });
      expect(dep.cancelled).toBe(true);
    });

    it('should support delayed departures', () => {
      const dep: Departure = makeDeparture({ delay: 120 }); // 2 minutes
      expect(dep.delay).toBe(120);
    });

    it('isDelayed flag should be settable', () => {
      const dep: Departure = makeDeparture({ isDelayed: true });
      expect(dep.isDelayed).toBe(true);
    });

    it('platform data should be optional', () => {
      const dep: Departure = makeDeparture();
      // platform is optional — may or may not be defined
      expect(typeof dep.platform === 'string' || dep.platform === undefined).toBe(true);
    });

    it('transport modes should be valid strings', () => {
      const modes = ['bus', 'train', 'tram', 'subway'];
      modes.forEach((mode) => {
        const dep: Departure = makeDeparture({ line: { id: '1', name: 'L1', mode, product: mode } });
        expect(dep.line.mode).toBe(mode);
      });
    });
  });

  // ----------------------------------------------------------------
  // TransitServiceConfig interface
  // ----------------------------------------------------------------
  describe('TransitServiceConfig interface', () => {
    it('should accept a minimal config', () => {
      const config: TransitServiceConfig = {
        cacheEnabled: true,
        cacheTTL: 30,
        maxDepartures: 10,
      };
      expect(config.cacheEnabled).toBe(true);
      expect(config.maxDepartures).toBe(10);
    });

    it('should accept optional duration and stationId', () => {
      const config: TransitServiceConfig = {
        cacheEnabled: false,
        cacheTTL: 60,
        maxDepartures: 5,
        defaultDuration: 90,
        defaultStationId: '9424069',
      };
      expect(config.defaultDuration).toBe(90);
      expect(config.defaultStationId).toBe('9424069');
    });
  });
});
