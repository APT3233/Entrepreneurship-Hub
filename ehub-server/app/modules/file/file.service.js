import { BadRequest, Forbidden, NotFound } from "app/core/errors/errorFactory.js";
import { getFileProxyUrl } from "app/core/utils/file.js";

const STORAGE_BUCKET = process.env.MINIO_BUCKET || "ehub";

export const createFileService = ({ fileRepository, storageService, tokenService }) => {
  const userRoles = (user) => (user?.roles || []).map((r) => String(r).toLowerCase());
  const hasRole = (user, ...roles) => userRoles(user).some((role) => roles.includes(role));
  const isAdminOrDept = (user) => hasRole(user, "admin", "department_head");
  const isLecturer = (user) => hasRole(user, "lecturer");
  const isStudent = (user) => hasRole(user, "student");

  const normalizeFilePath = (rawPath) => {
    let filePath = String(rawPath || "").trim();
    if (!filePath) throw BadRequest("File path is required");

    try {
      if (filePath.startsWith("/api/") || filePath.startsWith("http://") || filePath.startsWith("https://")) {
        const parsed = filePath.startsWith("/api/")
          ? new URL(filePath, "http://localhost")
          : new URL(filePath);
        const proxyPath = parsed.searchParams.get("path");
        if (proxyPath) filePath = proxyPath;
      }
    } catch {
      throw BadRequest("File path is invalid");
    }

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      try {
        const url = new URL(filePath);
        const parts = url.pathname.split("/");
        const bucketIndex = parts.indexOf(STORAGE_BUCKET);
        if (bucketIndex >= 0 && parts.length > bucketIndex + 1) {
          filePath = parts.slice(bucketIndex + 1).join("/");
        }
      } catch {
        throw BadRequest("File path is invalid");
      }
    }

    try {
      filePath = decodeURIComponent(filePath);
    } catch {
      throw BadRequest("File path is invalid");
    }

    filePath = filePath.replace(/^\/+/, "");
    if (
      !filePath ||
      filePath.includes("\0") ||
      filePath.includes("\\") ||
      filePath.split("/").some((part) => part === "..")
    ) {
      throw BadRequest("File path is invalid");
    }

    return filePath;
  };

  const canReadClassResource = async (row, user) => {
    if (isAdminOrDept(user)) return true;
    if (isLecturer(user) && Number(row.lecturer_id) === Number(user.id)) return true;
    if (!isStudent(user)) return false;
    if (row.source === "checkpoint_attachment" && row.status === "draft") return false;
    return fileRepository.isStudentEnrolledInClass(user.id, row.class_id);
  };

  const canReadGroupSubmission = async (row, user) => {
    if (isAdminOrDept(user)) return true;
    if (isLecturer(user) && Number(row.lecturer_id) === Number(user.id)) return true;
    if (!isStudent(user)) return false;
    return fileRepository.isStudentInGroup(user.id, row.group_id);
  };

  const canReadMentorDocument = async (row, user) => {
    if (Number(row.mentor_user_id) === Number(user?.id)) return true;
    if (!isAdminOrDept(user)) return false;
    const [canManageDocs, canAdminRead] = await Promise.all([
      fileRepository.userHasPermission(user.id, "mentor.document.manage"),
      fileRepository.userHasPermission(user.id, "mentor.admin_read"),
    ]);
    return canManageDocs || canAdminRead;
  };

  const canReadOwnedPendingAttachment = (filePath, user) => {
    // Allow lecturers/admin to read their own assignment attachments
    if ((isAdminOrDept(user) || isLecturer(user)) && filePath.startsWith(`assignments/attachments/${Number(user.id)}/`)) {
      return true;
    }
    // Allow any authenticated user to read files in general uploads (avatars, general)
    if (filePath.startsWith("uploads/avatars/") || filePath.startsWith("uploads/general/")) {
      return true;
    }
    return false;
  };

  const assertCanDownload = async (rawPath, user) => {
    if (!user?.id || !user?.roles?.length) throw Forbidden("File access denied");
    const filePath = normalizeFilePath(rawPath);

    // General upload paths (avatars, general) — accessible by any authenticated user
    if (filePath.startsWith("uploads/avatars/") || filePath.startsWith("uploads/general/")) {
      return filePath;
    }

    const [
      assignmentAttachments,
      checkpointAttachments,
      assignmentSubmissionFiles,
      checkpointSubmissionFiles,
      mentorDocuments,
    ] = await Promise.all([
      fileRepository.findAssignmentAttachmentsByPath(filePath),
      fileRepository.findCheckpointAttachmentsByPath(filePath),
      fileRepository.findAssignmentSubmissionFilesByPath(filePath),
      fileRepository.findCheckpointSubmissionFilesByPath(filePath),
      fileRepository.findMentorDocumentsByPath(filePath),
    ]);

    const classResources = [...assignmentAttachments, ...checkpointAttachments];
    for (const row of classResources) {
      if (await canReadClassResource(row, user)) return filePath;
    }

    const groupSubmissions = [...assignmentSubmissionFiles, ...checkpointSubmissionFiles];
    for (const row of groupSubmissions) {
      if (await canReadGroupSubmission(row, user)) return filePath;
    }

    for (const row of mentorDocuments) {
      if (await canReadMentorDocument(row, user)) return filePath;
    }

    if (
      classResources.length === 0 &&
      groupSubmissions.length === 0 &&
      mentorDocuments.length === 0 &&
      canReadOwnedPendingAttachment(filePath, user)
    ) {
      return filePath;
    }

    throw Forbidden("File access denied");
  };

  const getDownloadStream = async (rawPath, user) => {
    const filePath = await assertCanDownload(rawPath, user);
    const stat = await storageService.statObject(filePath);
    if (!stat) throw NotFound("File not found in storage");

    return {
      filePath,
      stat,
      stream: await storageService.getStream(filePath),
    };
  };

  /**
   * General-purpose file upload (avatar, general attachments)
   * Supports purpose: 'avatar' | 'general'
   */
  const initiateUpload = async (file, user, purpose = "general") => {
    if (!user?.id) throw Forbidden("User not authorized");
    const maxSizeBytes = purpose === "avatar" ? 5 * 1024 * 1024 : 25 * 1024 * 1024;
    if (Number(file.size) > maxSizeBytes) {
      throw BadRequest(`Dung lượng file vượt quá giới hạn (${purpose === "avatar" ? "5MB" : "25MB"}).`);
    }

    const safeName = String(file.name || "file")
      .replace(/[\\/]/g, "_")
      .replace(/\s+/g, "_");

    let objectKey;
    if (purpose === "avatar") {
      objectKey = `uploads/avatars/${user.id}/${Date.now()}_${safeName}`;
    } else {
      objectKey = `uploads/general/${user.id}/${Date.now()}_${safeName}`;
    }

    const presignedUrl = await storageService.generatePresignedPutUrl(objectKey, 900);
    const uploadToken = tokenService.signPayload({
      p: "file_upload",
      purpose,
      u: Number(user.id),
      k: objectKey,
      n: safeName,
      t: file.type || "application/octet-stream",
      s: Number(file.size),
    }, "15m");

    return {
      uploadToken,
      fileName: safeName,
      objectKey,
      uploadUrl: presignedUrl,
    };
  };

  const confirmUpload = async (uploadToken, user) => {
    if (!user?.id) throw Forbidden("User not authorized");

    let payload = null;
    try {
      payload = tokenService.verifyPayload(uploadToken);
    } catch {
      throw BadRequest("Upload token không hợp lệ");
    }

    if (payload?.p !== "file_upload") throw BadRequest("Token không dùng cho upload file chung");
    if (Number(payload?.u) !== Number(user.id)) throw Forbidden("Upload token không thuộc về bạn");
    if (!payload?.k) throw BadRequest("Upload token thiếu object key");

    const stat = await storageService.statObject(payload.k);
    if (!stat) throw BadRequest("Không tìm thấy file đã upload. Vui lòng thử lại.");

    const url = getFileProxyUrl(payload.k, payload.n);

    return {
      url,
      objectKey: payload.k,
      fileName: payload.n,
      contentType: payload.t,
      size: payload.s,
      etag: stat.etag || null,
    };
  };

  return {
    assertCanDownload,
    getDownloadStream,
    initiateUpload,
    confirmUpload,
  };
};
