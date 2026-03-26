import Redis from "ioredis";
import { redisConfig } from "app/config/index.js";
import { logger } from "app/core/logger/index.js";

let redisInstance = null;

export const getRedis = () => {
  if (!redisInstance) {
    redisInstance = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
      maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
      lazyConnect: true,
    });
  }
  return redisInstance;
};

export const loadRedis = async () => {
  const redis = getRedis();

  try {
    await redis.connect();
    await redis.ping();
    logger.info("[Bootstrap] Redis connected");
  } catch (err) {
    logger.fatal({ err }, "❌ Redis connection failed");
    throw err;
  }

  redis.on("error", (err) => logger.error("Redis error", { err }));
  redis.on("reconnecting", () => logger.warn("Redis reconnecting..."));

  return redis;
};

export const disconnectRedis = () => redisInstance?.disconnect();
