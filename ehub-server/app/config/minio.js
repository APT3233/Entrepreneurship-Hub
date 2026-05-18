import { optional, toInt, toBool } from './validate.js'

export const minioConfig = Object.freeze({
  endPoint:  optional('MINIO_ENDPOINT', 'localhost'),
  port:      toInt(optional('MINIO_PORT', '9000'), 9000),
  useSSL:    toBool(optional('MINIO_USE_SSL', 'false'), false),
  accessKey: optional('MINIO_ROOT_USER', 'admin'),
  secretKey: optional('MINIO_ROOT_PASSWORD', 'admin123'),
  bucket:    optional('MINIO_BUCKET', 'ehub'),
  region:    optional('MINIO_REGION', 'us-east-1'),
  publicEndPoint: optional('MINIO_PUBLIC_ENDPOINT', optional('MINIO_ENDPOINT', 'localhost')),
  publicPort: toInt(optional('MINIO_PUBLIC_PORT', optional('MINIO_PORT', '9000')), 9000),
  publicUseSSL: toBool(optional('MINIO_PUBLIC_USE_SSL', optional('MINIO_USE_SSL', 'false')), false),
})
