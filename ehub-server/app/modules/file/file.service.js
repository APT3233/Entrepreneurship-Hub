import { BadRequest, Forbidden, NotFound } from "app/core/errors/errorFactory.js";

const STORAGE_BUCKET = process.env.MINIO_BUCKET || "ehub";

export const createFileService = ({ fileRepository, storageService }) => {
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

  const canReadOwnedPendingAttachment = (filePath, user) => {
    if (!isAdminOrDept(user) && !isLecturer(user)) return false;
    return filePath.startsWith(`assignments/attachments/${Number(user.id)}/`);
  };

  const assertCanDownload = async (rawPath, user) => {
    if (!user?.id || !user?.roles?.length) throw Forbidden("File access denied");
    const filePath = normalizeFilePath(rawPath);

    const [
      assignmentAttachments,
      checkpointAttachments,
      assignmentSubmissionFiles,
      checkpointSubmissionFiles,
    ] = await Promise.all([
      fileRepository.findAssignmentAttachmentsByPath(filePath),
      fileRepository.findCheckpointAttachmentsByPath(filePath),
      fileRepository.findAssignmentSubmissionFilesByPath(filePath),
      fileRepository.findCheckpointSubmissionFilesByPath(filePath),
    ]);

    const classResources = [...assignmentAttachments, ...checkpointAttachments];
    for (const row of classResources) {
      if (await canReadClassResource(row, user)) return filePath;
    }

    const groupSubmissions = [...assignmentSubmissionFiles, ...checkpointSubmissionFiles];
    for (const row of groupSubmissions) {
      if (await canReadGroupSubmission(row, user)) return filePath;
    }

    if (
      classResources.length === 0 &&
      groupSubmissions.length === 0 &&
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

  return {
    assertCanDownload,
    getDownloadStream,
  };
};
