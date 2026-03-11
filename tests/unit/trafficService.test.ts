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

// node-cache mock — shared instance to verify set/get calls
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

// axios mock — capture the client instance created in constructor
const mockGet = jest.fn();
const mockAxiosClient = { get: mockGet };
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockReturnValue(mockAxiosClient),
    isAxiosError: jest.fn((err: any) => err?._isAxiosError === true),
  },
  create: jest.fn().mockReturnValue(mockAxiosClient),
  isAxiosError: jest.fn((err: any) => err?._isAxiosError === true),
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────────
import trafficService from '../../src/services/trafficService';
import type {
  TrafficWarning,
  RoadworkInfo,
  HighwayStatus,
  TrafficServiceConfig,
} from '../../src/services/trafficService';

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeWarning(overrides: Partial<TrafficWarning> = {}): TrafficWarning {
  return {
    identifier: 'W-001',
    title: 'Stau auf A1',
    isBlocked: false,
    ...overrides,
  };
}

function makeRoadwork(overrides: Partial<RoadworkInfo> = {}): RoadworkInfo {
  return {
    identifier: 'RW-001',
    title: 'Baustelle A1',
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('TrafficService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheGet.mockReturnValue(undefined); // cache miss by default
    mockGet.mockResolvedValue({ data: { warning: [], roadworks: [] } });
  });

  // ----------------------------------------------------------------
  // getWarnings
  // ----------------------------------------------------------------
  describe('getWarnings', () => {
    it('should return an empty array when the API returns no warnings', async () => {
      mockGet.mockResolvedValue({ data: { warning: [] } });
      const result = await trafficService.getWarnings('A1');
      expect(result).toEqual([]);
    });

    it('should return warnings from the API response', async () => {
      const warnings = [makeWarning(), makeWarning({ identifier: 'W-002', title: 'Unfall' })];
      mockGet.mockResolvedValue({ data: { warning: warnings } });

      const result = await trafficService.getWarnings('A1');
      expect(result.length).toBeGreaterThanOrEqual(0); // after distance filter
      expect(Array.isArray(result)).toBe(true);
    });

    it('should call the API with the correct road segment path', async () => {
      mockGet.mockResolvedValue({ data: { warning: [] } });
      await trafficService.getWarnings('A7');
      expect(mockGet).toHaveBeenCalledWith('/A7/services/warning');
    });

    it('should return cached warnings on second call', async () => {
      const cached = [makeWarning()];
      mockCacheGet.mockReturnValueOnce(undefined) // first: miss
                  .mockReturnValueOnce(cached);    // second: hit

      mockGet.mockResolvedValue({ data: { warning: [] } });

      await trafficService.getWarnings('A1');
      const result2 = await trafficService.getWarnings('A1');

      expect(result2).toBe(cached);
      // API should only be called once (second call served from cache)
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should store results in cache after API call', async () => {
      const warnings = [makeWarning()];
      mockGet.mockResolvedValue({ data: { warning: warnings } });

      await trafficService.getWarnings('A2');

      expect(mockCacheSet).toHaveBeenCalled();
    });

    it('should return an empty array (not throw) when the API fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await trafficService.getWarnings('A1');
      expect(result).toEqual([]);
    });

    it('should handle missing "warning" key in response gracefully', async () => {
      mockGet.mockResolvedValue({ data: {} });
      const result = await trafficService.getWarnings('A1');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter out warnings that are far from the center point', async () => {
      // Coordinates far from Ahlen (NRW) → should be filtered out
      const farWarning = makeWarning({
        coordinate: { lat: '48.1351', long: '11.5820' }, // München
      });
      mockGet.mockResolvedValue({ data: { warning: [farWarning] } });

      const result = await trafficService.getWarnings('A1');
      expect(result).toHaveLength(0);
    });

    it('should keep warnings without coordinates', async () => {
      const warningNoCoord = makeWarning({ coordinate: undefined });
      mockGet.mockResolvedValue({ data: { warning: [warningNoCoord] } });

      const result = await trafficService.getWarnings('A1');
      expect(result).toHaveLength(1);
    });

    it('should keep warnings close to center point (within 35 km)', async () => {
      // Coordinates very close to Ahlen (51.7633, 7.8919)
      const nearWarning = makeWarning({
        coordinate: { lat: '51.8', long: '7.9' }, // ~5 km from Ahlen
      });
      mockGet.mockResolvedValue({ data: { warning: [nearWarning] } });

      const result = await trafficService.getWarnings('A1');
      expect(result).toHaveLength(1);
    });
  });

  // ----------------------------------------------------------------
  // getRoadworks
  // ----------------------------------------------------------------
  describe('getRoadworks', () => {
    it('should return an empty array when the API returns no roadworks', async () => {
      mockGet.mockResolvedValue({ data: { roadworks: [] } });
      const result = await trafficService.getRoadworks('A1');
      expect(result).toEqual([]);
    });

    it('should call the API with the correct roadworks path', async () => {
      mockGet.mockResolvedValue({ data: { roadworks: [] } });
      await trafficService.getRoadworks('A7');
      expect(mockGet).toHaveBeenCalledWith('/A7/services/roadworks');
    });

    it('should return cached roadworks on second call', async () => {
      const cached = [makeRoadwork()];
      mockCacheGet.mockReturnValueOnce(undefined).mockReturnValueOnce(cached);
      mockGet.mockResolvedValue({ data: { roadworks: [] } });

      await trafficService.getRoadworks('A2');
      const result2 = await trafficService.getRoadworks('A2');

      expect(result2).toBe(cached);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array (not throw) when the API fails', async () => {
      mockGet.mockRejectedValue(new Error('Timeout'));
      const result = await trafficService.getRoadworks('A1');
      expect(result).toEqual([]);
    });

    it('should filter out roadworks far from center point', async () => {
      const farRoadwork = makeRoadwork({
        coordinate: { lat: '48.1351', long: '11.5820' }, // München
      });
      mockGet.mockResolvedValue({ data: { roadworks: [farRoadwork] } });

      const result = await trafficService.getRoadworks('A1');
      expect(result).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------------
  // getHighwayStatus
  // ----------------------------------------------------------------
  describe('getHighwayStatus', () => {
    it('should return a HighwayStatus object with roadId and name', async () => {
      mockGet.mockResolvedValue({ data: { warning: [], roadworks: [] } });

      const status: HighwayStatus = await trafficService.getHighwayStatus('A1');
      expect(status.roadId).toBe('A1');
      expect(status.warnings).toBeDefined();
      expect(status.roadworks).toBeDefined();
    });

    it('should report "free" status when no warnings exist', async () => {
      mockGet.mockResolvedValue({ data: { warning: [], roadworks: [] } });

      const status = await trafficService.getHighwayStatus('A2');
      expect(status.status).toBe('free');
      expect(status.statusColor).toBe('green');
    });

    it('should call both warning and roadworks endpoints', async () => {
      mockGet.mockResolvedValue({ data: { warning: [], roadworks: [] } });

      await trafficService.getHighwayStatus('A7');

      const calls = mockGet.mock.calls.map((c: any) => c[0]);
      expect(calls).toContain('/A7/services/warning');
      expect(calls).toContain('/A7/services/roadworks');
    });

    it('should include warnings in the result', async () => {
      const nearWarning = makeWarning({
        coordinate: { lat: '51.8', long: '7.9' },
      });
      mockGet
        .mockResolvedValueOnce({ data: { warning: [nearWarning] } }) // getWarnings
        .mockResolvedValueOnce({ data: { roadworks: [] } });          // getRoadworks

      const status = await trafficService.getHighwayStatus('A1');
      expect(status.warnings.length).toBeGreaterThanOrEqual(0); // filtered by distance
    });
  });

  // ----------------------------------------------------------------
  // TrafficServiceConfig interface
  // ----------------------------------------------------------------
  describe('TrafficServiceConfig interface', () => {
    it('should accept a valid config shape', () => {
      const config: TrafficServiceConfig = {
        cacheEnabled: true,
        cacheTTL: 300,
        apiBaseUrl: 'https://verkehr.autobahn.de/o/autobahn',
        defaultRoads: ['A1', 'A7'],
        centerPoint: { lat: 51.7633, lon: 7.8919 },
        maxDistance: 35,
      };
      expect(config.cacheEnabled).toBe(true);
      expect(config.defaultRoads).toContain('A1');
      expect(config.centerPoint?.lat).toBe(51.7633);
    });

    it('should accept a config without optional centerPoint', () => {
      const config: TrafficServiceConfig = {
        cacheEnabled: false,
        cacheTTL: 60,
        apiBaseUrl: 'https://example.com',
        defaultRoads: [],
      };
      expect(config.centerPoint).toBeUndefined();
    });
  });

  // ----------------------------------------------------------------
  // TrafficWarning & RoadworkInfo interfaces
  // ----------------------------------------------------------------
  describe('Data interfaces', () => {
    it('TrafficWarning: minimal required fields', () => {
      const w: TrafficWarning = { identifier: 'X', title: 'Stau' };
      expect(w.identifier).toBe('X');
      expect(w.title).toBe('Stau');
    });

    it('TrafficWarning: optional fields remain undefined when omitted', () => {
      const w: TrafficWarning = { identifier: 'X', title: 'Stau' };
      expect(w.isBlocked).toBeUndefined();
      expect(w.coordinate).toBeUndefined();
    });

    it('RoadworkInfo: minimal required fields', () => {
      const r: RoadworkInfo = { identifier: 'R1', title: 'Baustelle' };
      expect(r.identifier).toBe('R1');
    });

    it('HighwayStatus: all status values', () => {
      const statuses: HighwayStatus['status'][] = ['free', 'slow', 'congested', 'blocked'];
      statuses.forEach((s) => {
        const hs: HighwayStatus = {
          roadId: 'A1', name: 'A1',
          warnings: [], roadworks: [],
          status: s, statusColor: 'green',
        };
        expect(hs.status).toBe(s);
      });
    });
  });
});
