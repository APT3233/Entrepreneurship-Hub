import { RateLimitExceeded } from "../errors/errorFactory.js";

/**
 * Rate limiter dùng Redis sliding window
 * createRateLimiter(redis, { windowMs: 60000, max: 100 })
 */
export const createRateLimiter =
  (redis, { windowMs = 60_000, max = 100, keyPrefix = "rl" } = {}) =>
  async (req, _res, next) => {
    const key = `${keyPrefix}:${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, windowStart); // xóa entries cũ
    multi.zadd(key, now, `${now}`); // thêm request hiện tại
    multi.zcard(key); // đếm requests trong window
    multi.pexpire(key, windowMs); // set TTL

    const results = await multi.exec();
    const requestCount = results[2][1];

    if (requestCount > max) {
      return next(RateLimitExceeded(Math.ceil(windowMs / 1000)));
    }

    next();
  };
