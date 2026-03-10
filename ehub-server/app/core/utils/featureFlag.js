import { CacheKeys } from "../constants/cacheKeys.js";

/**
 * Simple feature flag check qua Redis
 * Container inject redis client
 */
export const createFeatureFlag = (redis) => ({
  isEnabled: async (flagName) => {
    const val = await redis.get(CacheKeys.FEATURE_FLAG(flagName));
    return val === "1" || val === "true";
  },

  enable: (flagName) => redis.set(CacheKeys.FEATURE_FLAG(flagName), "1"),

  disable: (flagName) => redis.del(CacheKeys.FEATURE_FLAG(flagName)),

  toggle: async (flagName) => {
    const current = await redis.get(CacheKeys.FEATURE_FLAG(flagName));
    return current === "1"
      ? redis.del(CacheKeys.FEATURE_FLAG(flagName))
      : redis.set(CacheKeys.FEATURE_FLAG(flagName), "1");
  },
});
