import { catchAsync } from "app/core/utils/catchAsync.js";
import { NotFound } from "app/core/errors/errorFactory.js";

/**
 * File Controller — Handles secure file downloads via proxy
 */
export const createFileController = ({ storageService }) => {
  /**
   * Proxy download: GET /api/v1/files/download?path=...&name=...
   * This hides MinIO credentials and internal structure from the user.
   */
  const download = catchAsync(async (req, res, next) => {
    const { path: filePath, name: fileName } = req.query;

    if (!filePath) {
      return next(NotFound("File path is required"));
    }

    try {
      // Check if file exists
      const stat = await storageService.statObject(filePath);
      if (!stat) {
        return next(NotFound("File not found in storage"));
      }

      // Set headers for download
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName || "download")}"`);
      res.setHeader("Content-Type", stat.metaData?.["content-type"] || "application/octet-stream");
      res.setHeader("Content-Length", stat.size);

      // Stream file from storage to response
      const stream = await storageService.getStream(filePath);
      
      if (stream.pipe) {
        stream.pipe(res);
      } else {
        // Local driver might return buffer
        res.send(stream);
      }
    } catch (err) {
      return next(err);
    }
  });

  return { download };
};
