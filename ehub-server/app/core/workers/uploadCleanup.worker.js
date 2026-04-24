import { logger } from "../../core/logger/index.js";
import { createCheckpointRepository } from "../../modules/checkpoint/checkpoint.repository.js";
import { createStorageService } from "../../core/services/storage.service.js";
import { appConfig } from "../../config/app.js";

/**
 * Starts a worker that periodically cleans up orphaned files from MinIO
 * and marks expired upload sessions in the database.
 */
export const startUploadCleanupWorker = ({ db, minio, container }) => {
  const intervalMs = 60 * 60 * 1000; // 1 hour by default (can be lowered for testing)
  
  // We extract repositories and services from container if available,
  // or construct them manually using db/minio if container is not fully resolving yet.
  const checkpointRepo = container ? container.resolve("checkpointRepository") : createCheckpointRepository({ db });
  const storageService = container ? container.resolve("storageService") : createStorageService({ minio });

  logger.info(`[UploadCleanupWorker] starting (interval: ${intervalMs}ms)`);

  const runCleanup = async () => {
    try {
      const expiredSessions = await checkpointRepo.findExpiredUploadSessions();
      if (!expiredSessions.length) return;

      for (const session of expiredSessions) {
        logger.info(`[UploadCleanupWorker] Cleaning up expired session ${session.id}`);

        // Mark as expired immediately to prevent concurrency issues
        await checkpointRepo.updateUploadSessionStatus(session.id, "expired");

        // Find pending files for this session
        const pendingFiles = await checkpointRepo.findPendingFilesBySession(session.id);
        if (!pendingFiles.length) continue;

        // Delete from MinIO
        for (const file of pendingFiles) {
          try {
            await storageService.remove(file.file_path);
            logger.debug(`[UploadCleanupWorker] Deleted orphaned file from MinIO: ${file.file_path}`);
          } catch (err) {
            logger.warn(`[UploadCleanupWorker] Failed to delete from MinIO ${file.file_path}: ${err.message}`);
          }
        }

        // Delete file records from DB
        const fileIds = pendingFiles.map(f => f.id);
        await checkpointRepo.deletePendingFiles(fileIds);
      }
    } catch (err) {
      logger.error({ err }, "[UploadCleanupWorker] cleanup loop failed");
    }
  };

  const timer = setInterval(runCleanup, intervalMs);

  // Run once on startup (after a small delay)
  setTimeout(runCleanup, 10000);

  return async () => {
    logger.info("[UploadCleanupWorker] stopping...");
    clearInterval(timer);
  };
};
