import { required, optional } from './validate.js'

const isProd = process.env.NODE_ENV === 'production'

export const jwtConfig = Object.freeze({
  secret:       isProd ? required('JWT_SECRET') : optional('JWT_SECRET', 'dev-secret'),
  refreshSecret: isProd
    ? required('JWT_REFRESH_SECRET')
    : optional('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
  expiresIn:    optional('JWT_EXPIRES_IN', '15m'),
  refreshIn:    optional('JWT_REFRESH_IN', '30d'),
  issuer:       optional('JWT_ISSUER', 'eprofile'),
  algorithm:    'HS256',
})