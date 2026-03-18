const LOCK_TTL = 30;

/**
 * Acquire Redis lock to prevent duplicate/concurrent upload for same resource.
 * @param {Object} redis - Redis client
 * @param {string} lockKey - e.g. lock:upload:EXE101-01:SP2026
 * @returns {Promise<boolean>} true if acquired
 */
export const acquireUploadLock = async (redis, lockKey) => {
  if (!redis) return true;
  const acquired = await redis.set(lockKey, "1", "EX", LOCK_TTL, "NX");
  return acquired === "OK";
};

/**
 * Release lock — must be called in finally block.
 */
export const releaseUploadLock = async (redis, lockKey) => {
  if (!redis) return;
  await redis.del(lockKey);
};
