import { RateLimitExceeded } from "app/core/errors/errorFactory.js";
import { rateLimitConfig } from "app/config/rateLimit.js";

const safeKeyPart = (value, fallback = "anonymous") =>
  String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:@-]/g, "_")
    .slice(0, 120) || fallback;

const defaultKeyGenerator = (req) => {
  if (req.user?.id) return `user:${Number(req.user.id)}`;
  return `ip:${safeKeyPart(req.ip)}`;
};

const loginKeyGenerator = (req) => {
  const username = safeKeyPart(req.body?.username || req.body?.email || "unknown");
  return `ip:${safeKeyPart(req.ip)}:login:${username}`;
};

const ipKeyGenerator = (req) => `ip:${safeKeyPart(req.ip)}`;

const getRetryTiming = async (redis, key, requestCount, max, windowMs, now) => {
  const entriesToExpire = Math.max(requestCount - max + 1, 1);
  const oldestBlockingEntry = await redis.zrange(
    key,
    entriesToExpire - 1,
    entriesToExpire - 1,
    "WITHSCORES",
  );
  const oldestBlockingScore = Number(oldestBlockingEntry?.[1]);
  const retryAtMs = Number.isFinite(oldestBlockingScore)
    ? oldestBlockingScore + windowMs
    : now + windowMs;
  const retryAfter = Math.max(1, Math.ceil((retryAtMs - now) / 1000));

  return {
    retryAfter,
    retryAt: new Date(retryAtMs).toISOString(),
  };
};

/**
 * Rate limiter dùng Redis sliding window
 * createRateLimiter(redis, { windowMs: 60000, max: 100 })
 */
export const createRateLimiter =
  (redis, { enabled = true, windowMs = 60_000, max = 100, keyPrefix = "rl", keyGenerator = defaultKeyGenerator, methods = null } = {}) =>
  async (req, res, next) => {
    if (!enabled || !redis) return next();
    if (Array.isArray(methods) && methods.length && !methods.includes(req.method)) return next();

    const key = `${keyPrefix}:${keyGenerator(req)}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, windowStart); // xóa entries cũ
    multi.zadd(key, now, `${now}:${Math.random().toString(36).slice(2)}`); // thêm request hiện tại
    multi.zcard(key); // đếm requests trong window
    multi.pexpire(key, windowMs); // set TTL

    const results = await multi.exec();
    const requestCount = results[2][1];

    if (requestCount > max) {
      const { retryAfter, retryAt } = await getRetryTiming(redis, key, requestCount, max, windowMs, now);
      res.setHeader("Retry-After", String(retryAfter));
      res.setHeader("X-RateLimit-Reset", retryAt);
      return next(RateLimitExceeded(retryAfter, retryAt));
    }

    next();
  };

export const createRateLimiters = (container) => {
  const redis = container.cradle.redis;
  return {
    api: createRateLimiter(redis, rateLimitConfig.api),
    mutation: createRateLimiter(redis, rateLimitConfig.mutation),
    default: createRateLimiter(redis, rateLimitConfig.default),
    login: createRateLimiter(redis, {
      ...rateLimitConfig.login,
      keyGenerator: loginKeyGenerator,
    }),
    loginIp: createRateLimiter(redis, {
      ...rateLimitConfig.loginIp,
      keyGenerator: ipKeyGenerator,
    }),
    upload: createRateLimiter(redis, rateLimitConfig.upload),
    ai: createRateLimiter(redis, rateLimitConfig.ai),
  };
};
