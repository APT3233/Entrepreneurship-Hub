import { optional, toInt } from './validate.js'

export const storageConfig = Object.freeze({
  driver:       optional('STORAGE_DRIVER', 'local'), // local | s3
  local: {
    uploadDir: optional('UPLOAD_DIR', 'uploads'),
  },
  s3: {
    bucket:    optional('S3_BUCKET', ''),
    region:    optional('S3_REGION', 'ap-southeast-1'),
    accessKey: optional('S3_ACCESS_KEY', ''),
    secretKey: optional('S3_SECRET_KEY', ''),
    endpoint:  process.env.S3_ENDPOINT || undefined,
  },
  limits: {
    fileSize:   toInt(optional('MAX_FILE_SIZE', '5242880'), 5 * 1024 * 1024), // 5MB
    maxFiles:   toInt(optional('MAX_FILES', '5'), 5),
    allowedMimes: [
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf',
    ],
  },
})