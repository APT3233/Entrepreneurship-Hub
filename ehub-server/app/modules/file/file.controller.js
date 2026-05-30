import { catchAsync } from "app/core/utils/catchAsync.js";
import { NotFound } from "app/core/errors/errorFactory.js";

/**
 * File Controller — Handles secure file downloads via proxy & general uploads
 */
export const createFileController = ({ fileService }) => {
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
      const { stat, stream } = await fileService.getDownloadStream(filePath, req.user);

      // Set headers for download
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName || "download")}"`);
      res.setHeader("Content-Type", stat.metaData?.["content-type"] || "application/octet-stream");
      res.setHeader("Content-Length", stat.size);

      // Stream file from storage to response
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

  /**
   * Initiate a general-purpose file upload (avatar, general attachments)
   * POST /api/v1/files/initiate-upload
   * Body: { file: { name, size, type }, purpose?: 'avatar' | 'general' }
   */
  const initiateUpload = catchAsync(async (req, res) => {
    const { file, purpose } = req.body;
    const result = await fileService.initiateUpload(file, req.user, purpose || "general");
    res.json({ data: result });
  });

  /**
   * Confirm a general-purpose file upload
   * POST /api/v1/files/confirm-upload
   * Body: { upload_token }
   */
  const confirmUpload = catchAsync(async (req, res) => {
    const result = await fileService.confirmUpload(req.body.upload_token, req.user);
    res.json({ data: result });
  });

  return { download, initiateUpload, confirmUpload };
};
