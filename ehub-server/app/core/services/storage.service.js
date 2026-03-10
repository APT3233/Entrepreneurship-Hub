import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "app/core/logger/index.js";

/**
 * Enterprise Storage Service
 * Abstraction layer to handle file uploads locally or via cloud (S3/GCS)
 */
export const createStorageService = (
  config = { driver: "local", uploadDir: "uploads" },
) => {
  const isLocal = config.driver === "local";

  /**
   * Initialize storage (ensure directories exist)
   */
  const init = async () => {
    if (isLocal) {
      await fs.mkdir(config.uploadDir, { recursive: true });
      logger.debug(
        `[Storage] Local storage initialized at: ${config.uploadDir}`,
      );
    }
  };

  /**
   * Save a file
   * @param {Buffer|Readable} fileData - The file content
   * @param {string} fileName - Destination filename
   * @returns {Promise<string>} The file path or URL
   */
  const save = async (fileData, fileName) => {
    const filePath = path.join(config.uploadDir, fileName);

    if (isLocal) {
      await fs.writeFile(filePath, fileData);
      logger.debug(`[Storage] File saved: ${fileName}`);
      return filePath;
    }

    // Placeholder for S3/GCS
    throw new Error("Cloud storage driver not yet implemented");
  };

  /**
   * Delete a file
   * @param {string} fileName
   */
  const remove = async (fileName) => {
    const filePath = path.join(config.uploadDir, fileName);

    if (isLocal) {
      try {
        await fs.unlink(filePath);
        logger.debug(`[Storage] File deleted: ${fileName}`);
      } catch (err) {
        logger.warn(`[Storage] Failed to delete file: ${fileName}`, { err });
      }
      return;
    }
  };

  return { init, save, remove };
};
