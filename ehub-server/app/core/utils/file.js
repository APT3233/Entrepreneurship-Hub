import { appConfig } from "app/config/app.js";

/**
 * File Helpers
 */

/**
 * Generate a secure proxy download URL for a file
 * @param {string} filePathOrUrl Internal storage path OR legacy MinIO URL
 * @param {string} fileName Original file name for the download
 * @returns {string} Proxy URL
 */
export const getFileProxyUrl = (filePathOrUrl, fileName) => {
  if (!filePathOrUrl) return null;
  const prefix = appConfig.apiPrefix;

  // Nếu đã là proxy URL (bắt đầu bằng prefix + /files/download), trả về nguyên trạng
  if (filePathOrUrl.startsWith(`${prefix}/files/download`) || filePathOrUrl.startsWith("/api/v1/files/download")) {
    return filePathOrUrl;
  }

  let path = filePathOrUrl;

  // Nếu là URL cũ (legacy MinIO URL), bóc tách phần path
  if (filePathOrUrl.includes("http://") || filePathOrUrl.includes("https://")) {
    try {
      const url = new URL(filePathOrUrl);
      // MinIO URL format: http://host:port/bucket/path/to/file?params
      // Path sẽ bắt đầu sau tên bucket. Ví dụ bucket là 'ehub'
      const bucketName = process.env.MINIO_BUCKET || "ehub";
      const parts = url.pathname.split("/");
      const bucketIndex = parts.indexOf(bucketName);
      if (bucketIndex !== -1 && parts.length > bucketIndex + 1) {
        path = parts.slice(bucketIndex + 1).join("/");
      }

      // Nếu không tìm thấy fileName trong query, cố gắng lấy từ path
      if (!fileName) {
        fileName = url.pathname.split("/").pop();
      }
    } catch (err) {
      // Nếu không parse được URL, giữ nguyên path như cũ
    }
  }

  return `${prefix}/files/download?path=${encodeURIComponent(path)}&name=${encodeURIComponent(fileName || "")}`;
};
