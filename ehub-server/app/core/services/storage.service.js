import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "app/core/logger/index.js";

/**
 * Enterprise Storage Service
 * Abstraction layer to handle file uploads locally or via cloud (MinIO/S3/GCS)
 */
export const createStorageService = (
  { minio } = {},
  config = { 
    driver: process.env.STORAGE_DRIVER || "minio", 
    uploadDir: "uploads", 
    bucket: process.env.MINIO_BUCKET || "ehub" 
  },
) => {
  const isLocal = config.driver === "local";
  const isMinio = config.driver === "minio";

  /**
   * Initialize storage (ensure bucket exists)
   */
  const init = async () => {
    if (isLocal) {
      await fs.mkdir(config.uploadDir, { recursive: true });
      logger.debug(`[Storage] Local storage initialized at: ${config.uploadDir}`);
    }
    
    if (isMinio && minio) {
      try {
        const exists = await minio.bucketExists(config.bucket);
        if (!exists) {
          await minio.makeBucket(config.bucket);
          logger.info(`[Storage] MinIO bucket created: ${config.bucket}`);
        }
      } catch (err) {
        logger.error(`[Storage] MinIO init failed: ${err.message}`);
      }
    }
  };

  /**
   * Save a file
   */
  const save = async (fileData, fileName) => {
    if (isLocal) {
      const filePath = path.join(config.uploadDir, fileName);
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, fileData);
      return filePath;
    }

    if (isMinio && minio) {
      await minio.putObject(config.bucket, fileName, fileData);
      return fileName;
    }

    throw new Error(`Storage driver [${config.driver}] not implemented or client missing`);
  };

  /**
   * Delete a file
   */
  const remove = async (fileName) => {
    if (isLocal) {
      const filePath = path.join(config.uploadDir, fileName);
      try { await fs.unlink(filePath); } catch {}
      return;
    }

    if (isMinio && minio) {
      await minio.removeObject(config.bucket, fileName);
    }
  };

  /**
   * Get public/private URL (Legacy presigned)
   */
  const getUrl = async (fileName, expiry = 3600) => {
    if (isLocal) return `/uploads/${fileName}`;
    if (isMinio && minio) {
      return await minio.presignedGetObject(config.bucket, fileName, expiry);
    }
    return null;
  };

  /**
   * Get file stream (Recommended for proxy download)
   */
  const getStream = async (fileName) => {
    if (isLocal) {
      const filePath = path.join(config.uploadDir, fileName);
      return (await fs.readFile(filePath)); // Local returns buffer
    }
    if (isMinio && minio) {
      return await minio.getObject(config.bucket, fileName);
    }
    return null;
  };

  /**
   * Generate a presigned PUT URL for direct client upload
   */
  const generatePresignedPutUrl = async (objectKey, expiry = 900) => {
    if (isMinio && minio) {
      return await minio.presignedPutObject(config.bucket, objectKey, expiry);
    }
    throw new Error(`presignedPut not supported for driver [${config.driver}]`);
  };

  /**
   * Verify an object exists in storage (returns stat metadata or null)
   */
  const statObject = async (objectKey) => {
    if (isMinio && minio) {
      try {
        logger.debug(`[StorageService] Stating object: bucket=${config.bucket}, key=${objectKey}`);
        return await minio.statObject(config.bucket, objectKey);
      } catch (err) {
        logger.error(`[StorageService] statObject failed for ${objectKey}: ${err.message}`);
        return null;
      }
    }
    return null;
  };

  /**
   * List all objects (for debugging)
   */
  const listObjects = async (prefix = "") => {
    if (isMinio && minio) {
      const stream = minio.listObjectsV2(config.bucket, prefix, true);
      const objects = [];
      try {
        for await (const obj of stream) {
          objects.push(obj.name);
        }
      } catch (err) {
        logger.error(`[StorageService] listObjects failed: ${err.message}`);
      }
      return objects;
    }
    return [];
  };

  return { init, save, remove, getUrl, getStream, generatePresignedPutUrl, statObject, listObjects };
};
