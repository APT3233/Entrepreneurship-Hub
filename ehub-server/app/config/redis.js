import { optional, toInt } from "./validate.js";

// Phân tích REDIS_URL nếu có (đặc biệt khi chạy trong Docker)
const redisUrlStr = process.env.REDIS_URL;
let hostUrl = null;
let portUrl = null;

if (redisUrlStr) {
  try {
    const parsed = new URL(redisUrlStr);
    hostUrl = parsed.hostname;
    portUrl = parsed.port;
  } catch (err) {
    // URL parse failed, do nothing
  }
}

export const redisConfig = Object.freeze({
  host: hostUrl || optional("REDIS_HOST", "localhost"),
  port: toInt(portUrl || optional("REDIS_PORT", "6379"), 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  db: toInt(optional("REDIS_DB", "0"), 0),
  keyPrefix: optional("REDIS_PREFIX", "ep:"),
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 200, 5_000),
  lazyConnect: true,
  ttl: {
    short: 60, // 1 phút
    medium: 60 * 15, // 15 phút
    long: 60 * 60, // 1 giờ
    day: 60 * 60 * 24, // 1 ngày
  },
});
