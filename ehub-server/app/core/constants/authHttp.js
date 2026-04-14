/**
 * Cookie httpOnly JWT + prefix header Authorization — dùng thống nhất auth middleware & controller.
 */

export const AUTH_COOKIE_ACCESS_TOKEN = "access_token";
export const AUTH_COOKIE_REFRESH_TOKEN = "refresh_token";

/** `Authorization: Bearer <jwt>` */
export const AUTH_HEADER_BEARER_PREFIX = "Bearer ";
