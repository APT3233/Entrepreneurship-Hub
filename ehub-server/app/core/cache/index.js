/**
 * Cache helper — thin wrapper over ioredis với JSON serialize/deserialize
 *
 * Usage:
 *   const cache = createCache(redis)
 *   await cache.get('key')
 *   await cache.set('key', value, 300)  // TTL in seconds
 *   await cache.del('key')
 *   await cache.flush('prefix:*')       // xóa theo pattern
 */
export const createCache = (redis) => {
  const get = async (key) => {
    const raw = await redis.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };

  const set = async (key, value, ttlSeconds = null) => {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      return redis.set(key, serialized, "EX", ttlSeconds);
    }
    return redis.set(key, serialized);
  };

  const del = async (...keys) => {
    if (!keys.length) return 0;
    return redis.del(...keys);
  };

  /**
   * Xóa tất cả keys theo pattern (dùng SCAN, không dùng KEYS để tránh block)
   */
  const flush = async (pattern) => {
    let cursor = "0";
    let deleted = 0;
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = nextCursor;
      if (keys.length) {
        await redis.del(...keys);
        deleted += keys.length;
      }
    } while (cursor !== "0");
    return deleted;
  };

  /**
   * Cache-aside pattern: nếu cache hit thì trả về, miss thì gọi fn() và cache lại
   */
  const remember = async (key, ttlSeconds, fn) => {
    const cached = await get(key);
    if (cached !== null) return cached;
    const value = await fn();
    await set(key, value, ttlSeconds);
    return value;
  };

  return { get, set, del, flush, remember };
};
