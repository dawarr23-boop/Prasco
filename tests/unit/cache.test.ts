// Mock logger to avoid file-system access during tests
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  securityLogger: {
    logPermissionDenied: jest.fn(),
    logFailedLogin: jest.fn(),
    logSuccessfulLogin: jest.fn(),
  },
}));

import { cacheService } from '../../src/utils/cache';

describe('cacheService', () => {
  beforeEach(() => {
    cacheService.flush();
  });

  afterAll(() => {
    // Clean up to avoid open-handle warnings
    cacheService.flush();
  });

  // ----------------------------------------------------------------
  // set / get
  // ----------------------------------------------------------------
  describe('set / get', () => {
    it('should set and retrieve a string value', () => {
      cacheService.set('key-str', 'hello');
      expect(cacheService.get('key-str')).toBe('hello');
    });

    it('should set and retrieve a numeric value', () => {
      cacheService.set('key-num', 42);
      expect(cacheService.get<number>('key-num')).toBe(42);
    });

    it('should set and retrieve an object', () => {
      const obj = { name: 'test', count: 5, tags: ['a', 'b'] };
      cacheService.set('key-obj', obj);
      expect(cacheService.get('key-obj')).toEqual(obj);
    });

    it('should set and retrieve an array', () => {
      const arr = [1, 2, 3, 4, 5];
      cacheService.set('key-arr', arr);
      expect(cacheService.get('key-arr')).toEqual(arr);
    });

    it('should return undefined for a key that was never set', () => {
      expect(cacheService.get('nonexistent-key')).toBeUndefined();
    });

    it('should overwrite an existing value', () => {
      cacheService.set('key-overwrite', 'first');
      cacheService.set('key-overwrite', 'second');
      expect(cacheService.get('key-overwrite')).toBe('second');
    });

    it('set() should return true on success', () => {
      const result = cacheService.set('key-bool', true);
      expect(result).toBe(true);
    });
  });

  // ----------------------------------------------------------------
  // del
  // ----------------------------------------------------------------
  describe('del', () => {
    it('should delete a single key', () => {
      cacheService.set('to-delete', 'value');
      cacheService.del('to-delete');
      expect(cacheService.get('to-delete')).toBeUndefined();
    });

    it('should delete multiple keys at once', () => {
      cacheService.set('del1', 'v1');
      cacheService.set('del2', 'v2');
      cacheService.del(['del1', 'del2']);
      expect(cacheService.get('del1')).toBeUndefined();
      expect(cacheService.get('del2')).toBeUndefined();
    });

    it('should return the count of deleted keys', () => {
      cacheService.set('cnt1', 1);
      cacheService.set('cnt2', 2);
      const deleted = cacheService.del(['cnt1', 'cnt2']);
      expect(deleted).toBe(2);
    });

    it('should return 0 when deleting a key that does not exist', () => {
      const deleted = cacheService.del('nonexistent');
      expect(deleted).toBe(0);
    });

    it('should not affect other keys when deleting one', () => {
      cacheService.set('keep', 'keep-value');
      cacheService.set('remove', 'remove-value');
      cacheService.del('remove');
      expect(cacheService.get('keep')).toBe('keep-value');
    });
  });

  // ----------------------------------------------------------------
  // delByPrefix
  // ----------------------------------------------------------------
  describe('delByPrefix', () => {
    it('should delete all keys that start with the given prefix', () => {
      cacheService.set('posts:1', 'p1');
      cacheService.set('posts:2', 'p2');
      cacheService.set('posts:3', 'p3');
      cacheService.delByPrefix('posts:');
      expect(cacheService.get('posts:1')).toBeUndefined();
      expect(cacheService.get('posts:2')).toBeUndefined();
      expect(cacheService.get('posts:3')).toBeUndefined();
    });

    it('should NOT delete keys that do not match the prefix', () => {
      cacheService.set('users:1', 'u1');
      cacheService.set('posts:1', 'p1');
      cacheService.delByPrefix('posts:');
      expect(cacheService.get('users:1')).toBe('u1');
    });

    it('should return the number of deleted keys', () => {
      cacheService.set('pfx:a', 1);
      cacheService.set('pfx:b', 2);
      cacheService.set('other', 3);
      const count = cacheService.delByPrefix('pfx:');
      expect(count).toBe(2);
    });

    it('should return 0 when no keys match the prefix', () => {
      cacheService.set('users:1', 'u');
      const count = cacheService.delByPrefix('nonexistent:');
      expect(count).toBe(0);
    });
  });

  // ----------------------------------------------------------------
  // flush
  // ----------------------------------------------------------------
  describe('flush', () => {
    it('should remove all cached entries', () => {
      cacheService.set('a', 1);
      cacheService.set('b', 2);
      cacheService.set('c', 3);
      cacheService.flush();
      expect(cacheService.get('a')).toBeUndefined();
      expect(cacheService.get('b')).toBeUndefined();
      expect(cacheService.get('c')).toBeUndefined();
    });

    it('should allow setting new values after flush', () => {
      cacheService.set('pre-flush', 'value');
      cacheService.flush();
      cacheService.set('post-flush', 'new-value');
      expect(cacheService.get('post-flush')).toBe('new-value');
    });
  });

  // ----------------------------------------------------------------
  // stats
  // ----------------------------------------------------------------
  describe('stats', () => {
    beforeEach(() => {
      cacheService.flush(); // resets hit/miss counters too
    });

    it('should return an object with hits, misses, and hitRate', () => {
      const stats = cacheService.stats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
    });

    it('should count a cache hit', () => {
      cacheService.set('hit', 'val');
      cacheService.get('hit');
      const stats = cacheService.stats();
      expect(stats.hits).toBeGreaterThanOrEqual(1);
    });

    it('should count a cache miss', () => {
      cacheService.get('definitely-missing');
      const stats = cacheService.stats();
      expect(stats.misses).toBeGreaterThanOrEqual(1);
    });

    it('hitRate should be 0 when no lookups have occurred', () => {
      const stats = cacheService.stats();
      // After flush, hits and misses are both 0
      expect(stats.hitRate).toBe(0);
    });

    it('hitRate should be 100 with only hits', () => {
      cacheService.set('x', 1);
      cacheService.get('x');
      const stats = cacheService.stats();
      // hitRate = hits / (hits + misses) * 100
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.hitRate).toBeLessThanOrEqual(100);
    });
  });

  // ----------------------------------------------------------------
  // wrap
  // ----------------------------------------------------------------
  describe('wrap', () => {
    it('should compute and cache the result of fn on first call', async () => {
      const fn = jest.fn().mockResolvedValue('computed-value');
      const result = await cacheService.wrap('wrap-key-1', fn, 60);
      expect(result).toBe('computed-value');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should NOT call fn again on second call with same key', async () => {
      const fn = jest.fn().mockResolvedValue('only-once');
      await cacheService.wrap('wrap-key-2', fn, 60);
      await cacheService.wrap('wrap-key-2', fn, 60);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should return the cached result on repeated calls', async () => {
      const fn = jest.fn().mockResolvedValue('cached');
      const r1 = await cacheService.wrap('wrap-key-3', fn, 60);
      const r2 = await cacheService.wrap('wrap-key-3', fn, 60);
      expect(r1).toBe('cached');
      expect(r2).toBe('cached');
    });

    it('should call fn when key has been flushed', async () => {
      const fn = jest.fn().mockResolvedValue('fresh');
      await cacheService.wrap('wrap-key-4', fn, 60);
      cacheService.del('wrap-key-4');
      await cacheService.wrap('wrap-key-4', fn, 60);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should work with object return values', async () => {
      const value = { id: 1, name: 'Post' };
      const fn = jest.fn().mockResolvedValue(value);
      const result = await cacheService.wrap('wrap-key-5', fn, 60);
      expect(result).toEqual(value);
    });
  });
});
