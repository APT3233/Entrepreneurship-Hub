import { Client as MinioClient } from 'minio'
import { minioConfig } from 'app/config/minio.js'
import { logger } from 'app/core/logger/index.js'

let minioInstance = null

export const getMinio = () => {
  if (!minioInstance) {
    minioInstance = new MinioClient({
      endPoint:  minioConfig.endPoint,
      port:      minioConfig.port,
      useSSL:    minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
      region:    minioConfig.region,
    })
  }
  return minioInstance
}

export const loadMinio = async () => {
  const minio = getMinio()
  try {
    await minio.listBuckets()
    logger.info('[Bootstrap] MinIO connected')
  } catch (err) {
    logger.fatal({ err }, '❌ MinIO connection failed')
    throw err
  }

  return minio
}
