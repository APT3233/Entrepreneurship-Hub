/**
 * Redis key patterns for caching and token management
 * Convention: {module}:{entity}:{identifier}
 */

/** Refresh token → user mapping. TTL = refreshToken expiry */
export const refreshTokenKey = (userId, tokenId) =>
  `auth:refresh:${userId}:${tokenId}`;

/** Pattern to match ALL refresh tokens of a user (for logout-all) */
export const refreshTokenPattern = (userId) => `auth:refresh:${userId}:*`;

/** Blacklisted access token (after logout). TTL = remaining access token life */
export const blacklistKey = (jti) => `auth:blacklist:${jti}`;

/** User profile cache */
export const userCacheKey = (userId) => `user:profile:${userId}`;
