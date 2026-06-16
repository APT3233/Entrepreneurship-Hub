import { createBaseService } from "app/core/services/baseService.js";
import { v7 as uuidv7 } from "uuid";
import { BadRequest, Forbidden, NotFound } from "app/core/errors/errorFactory.js";
import { Events } from "app/core/constants/events.js";
import { logger } from "app/core/logger/index.js";
import { getFileProxyUrl } from "app/core/utils/file.js";

/**
 * Checkpoint Service
 * Handles business logic for checkpoints
 */
export const createCheckpointService = ({ checkpointRepository, eventBus, storageService, auditService, evaluationRepository }) => {
  const base = createBaseService(checkpointRepository, "Checkpoint");

  const userRoles = (user) => (user?.roles || []).map((r) => String(r).toLowerCase());
  const hasRole = (user, ...roles) => userRoles(user).some((role) => roles.includes(role));
  const isAdminOrDept = (user) => hasRole(user, "admin", "department_head");
  const isLecturerOnly = (user) =>
    hasRole(user, "lecturer") && !isAdminOrDept(user);

  const parseLecturerAttachmentUrlsForDto = (raw) => {
    if (raw == null || raw === "") return [];
    const s = String(raw).trim();
    let urls = [];
    if (s.startsWith("[")) {
      try {
        const p = JSON.parse(s);
        urls = Array.isArray(p) ? p.map(String).filter(Boolean) : [];
      } catch {
        urls = s ? [s] : [];
      }
    } else {
      urls = s ? [s] : [];
    }

    // Proxy-ify all URLs
    return urls.map((url) => getFileProxyUrl(url));
  };

  const enrichCheckpointRow = (row) => {
    if (!row || typeof row !== "object") return row;
    const { attachment_url, rubric_id, rubric_name, ...rowData } = row;
    return {
      ...rowData,
      attachmentUrls: parseLecturerAttachmentUrlsForDto(attachment_url),
      rubricId: rubric_id || null,
      rubricName: rubric_name || null,
    };
  };

  const toStudentEvaluationDto = (evaluation) => {
    if (!evaluation) return null;
    return {
      id: evaluation.id,
      rubricId: evaluation.rubric_id,
      rubricName: evaluation.rubric_name,
      rubricVersion: Number(evaluation.rubric_version || 1),
      totalScore: evaluation.total_score != null ? Number(evaluation.total_score) : null,
      maxScore: evaluation.rubric_total_score != null ? Number(evaluation.rubric_total_score) : null,
      overallFeedback: evaluation.overall_feedback || null,
      status: evaluation.status,
      evaluatedAt: evaluation.evaluated_at || null,
      evaluatorName: evaluation.evaluator_name || null,
      scores: (evaluation.scores || []).map((score) => ({
        criterionId: score.criterion_id,
        criterionName: score.criterion_name,
        description: score.criterion_description || null,
        maxScore: score.max_score != null ? Number(score.max_score) : null,
        weight: score.weight != null ? Number(score.weight) : null,
        orderIndex: score.order_index != null ? Number(score.order_index) : null,
        requiredFeedback: Boolean(score.is_required_feedback),
        score: score.score != null ? Number(score.score) : null,
        feedback: score.feedback || null,
      })),
    };
  };

  const attachStudentEvaluation = async (checkpoint) => {
    if (
      !checkpoint?.submission_id ||
      checkpoint.submission_status !== "graded" ||
      !evaluationRepository?.findPublishedEvaluationDetailByTarget
    ) {
      checkpoint.evaluation = null;
      return checkpoint;
    }
    const evaluation = await evaluationRepository.findPublishedEvaluationDetailByTarget(
      "checkpoint_submission",
      checkpoint.submission_id,
    );
    checkpoint.evaluation = toStudentEvaluationDto(evaluation);
    return checkpoint;
  };

  const enrichCheckpointSubmissionForLecturer = async (submission) => {
    if (!submission) return null;
    const gid = Number(submission.group_id);
    const membersByGroup = await checkpointRepository.findGroupMembersByGroupIds([gid]);
    const members = membersByGroup[gid] || [];
    const files = [];
    for (const f of submission.files || []) {
      if (f.is_deleted) continue;
      const fileUrl = getFileProxyUrl(f.file_path, f.file_name);
      files.push({
        id: f.id,
        fileName: f.file_name,
        filePath: f.file_path,
        fileUrl,
        fileType: f.file_type,
        mimeType: f.mime_type,
        fileSize: f.file_size != null ? Number(f.file_size) : null,
      });
    }
    return {
      submissionId: submission.id,
      groupId: gid,
      groupName: submission.group_name,
      groupCode: submission.group_code,
      status: submission.status,
      submittedAt: submission.submitted_at,
      submittedByName: submission.submitter_name || null,
      isLate: Boolean(submission.is_late),
      note: submission.note || null,
      score: submission.score != null ? Number(submission.score) : null,
      feedback:
        submission.feedback != null && String(submission.feedback).length
          ? String(submission.feedback)
          : null,
      gradedAt: submission.graded_at || null,
      graderName: submission.grader_name || null,
      members,
      files,
    };
  };

  const cleanData = (data, current = null) => {
    const cleaned = { ...data };
    if (cleaned.open_at === "") cleaned.open_at = null;
    const nextStatus = cleaned.status ?? current?.status;
    if (!cleaned.open_at && nextStatus === "open" && !current?.open_at) {
      cleaned.open_at = new Date();
    }
    return cleaned;
  };

  const assertDeadlineNotPast = (deadlineIso) => {
    const t = new Date(deadlineIso).getTime();
    if (Number.isNaN(t) || t <= Date.now()) {
      throw BadRequest("Hạn nộp không được là thời điểm đã qua.");
    }
  };

  /**
   * Check if user has permission to manage checkpoint
   * @param {number} checkpointId 
   * @param {Object} user 
   */
  const checkOwnership = async (checkpointId, user) => {
    const row = await checkpointRepository.findByIdWithClass(checkpointId);
    if (!row) throw NotFound("Checkpoint");
    if (!user?.roles?.length) throw Forbidden("User not authorized");
    
    // Admin and Department Head have full access
    if (isAdminOrDept(user)) return row;

    // Lecturer must own the class
    if (!isLecturerOnly(user) || Number(row.lecturer_id) !== Number(user.id)) {
      throw Forbidden("You do not have permission to manage this checkpoint");
    }
    return row;
  };

  const assertLecturerCanReadClass = async (classId, user) => {
    if (!classId || !isLecturerOnly(user)) return;
    const cls = await checkpointRepository.findClassByIdAndLecturer(classId, user.id);
    if (!cls) throw Forbidden("Class does not belong to you");
  };

  /**
   * Create a new checkpoint
   */
  const create = async (data, user) => {
    if (!user?.id) throw Forbidden("User not authorized");

    // Check if class belongs to lecturer
    const classRow = await checkpointRepository.findClassByIdAndLecturer(data.class_id, user.id);
    if (!classRow) {
      throw BadRequest("Lớp học không tồn tại hoặc không thuộc quyền quản lý của bạn");
    }

    assertDeadlineNotPast(data.deadline);

    // Check if checkpoint number already exists for this class
    const alreadyExists = await checkpointRepository.exists({ 
      class_id: data.class_id, 
      order_index: data.order_index, 
      deleted_at: null 
    });
    if (alreadyExists) {
      throw BadRequest(`Checkpoint ${data.order_index} đã tồn tại trong lớp này. Vui lòng chọn số khác.`);
    }

    const id = uuidv7().replace(/-/g, "");
    const result = await base.create({ id, ...cleanData(data), created_by: user.id });
    
    // Ghi log audit
    await auditService.log({
      userId: user.id,
      action: "create_checkpoint",
      tableName: "checkpoints",
      recordId: result.id,
      title: result.title,
      newValues: { title: result.title, class_id: data.class_id, order_index: data.order_index }
    });

    eventBus.emit(Events.CHECKPOINT_CREATED, { checkpointId: result.id, classId: data.class_id, createdBy: user.id });
    return enrichCheckpointRow(result);
  };

  /**
   * Create checkpoints for multiple classes
   */
  const createBulk = async (data, user) => {
    if (!user?.id) throw Forbidden("User not authorized");
    const { class_ids, ...checkpointData } = data;

    assertDeadlineNotPast(checkpointData.deadline);

    const results = [];
    const errors = [];

    for (const classId of class_ids) {
      try {
        // Check if class belongs to lecturer
        const classRow = await checkpointRepository.findClassByIdAndLecturer(classId, user.id);
        if (!classRow) {
          errors.push({ classId, error: "Lớp học không tồn tại hoặc không thuộc quyền quản lý của bạn" });
          continue;
        }

        // Check if checkpoint number already exists for this class
        const alreadyExists = await checkpointRepository.exists({ 
          class_id: classId, 
          order_index: checkpointData.order_index, 
          deleted_at: null 
        });
        if (alreadyExists) {
          errors.push({ classId, error: `Checkpoint ${checkpointData.order_index} đã tồn tại trong lớp này.` });
          continue;
        }

        const id = uuidv7().replace(/-/g, "");
        const result = await checkpointRepository.create({ 
          id,
          ...cleanData(checkpointData), 
          class_id: classId,
          created_by: user.id 
        });
        
        // Ghi log audit
        await auditService.log({
          userId: user.id,
          action: "create_checkpoint",
          tableName: "checkpoints",
          recordId: result.id,
          newValues: { title: result.title, class_id: classId, order_index: checkpointData.order_index }
        });

        eventBus.emit(Events.CHECKPOINT_CREATED, { checkpointId: result.id, classId, createdBy: user.id });
        results.push(enrichCheckpointRow(result));
      } catch (err) {
        errors.push({ classId, error: err.message });
      }
    }

    if (results.length === 0 && errors.length > 0) {
      throw BadRequest(errors[0].error);
    }

    return { results, errors };
  };

  /**
   * List checkpoints for a class
   */
  const getList = async (query, user) => {
    if (!user?.roles?.length) throw Forbidden("User not authorized");
    const filters = {
      ...(query.class_id && { class_id: Number(query.class_id) }),
      ...(query.semester_id && { semester_id: Number(query.semester_id) }),
      ...(query.year && { year: Number(query.year) }),
      ...(query.status && { status: query.status }),
    };

    if (isLecturerOnly(user)) {
      await assertLecturerCanReadClass(query.class_id, user);
      filters.lecturer_id = user.id;
      const data = (await checkpointRepository.findWithFilters(filters)).map(enrichCheckpointRow);
      return { data };
    }

    if (!isAdminOrDept(user)) throw Forbidden("Checkpoint access denied");

    const data = (await checkpointRepository.findWithFilters(filters)).map(enrichCheckpointRow);
    return { data };
  };

  /**
   * Update a checkpoint
   */
  const update = async (id, data, user) => {
    const checkpoint = await checkOwnership(id, user);

    // If order_index is changing, check for uniqueness
    if (data.order_index && Number(data.order_index) !== Number(checkpoint.order_index)) {
      const alreadyExists = await checkpointRepository.exists({ 
        class_id: checkpoint.class_id, 
        order_index: data.order_index, 
        deleted_at: null 
      });
      if (alreadyExists) {
        throw BadRequest(`Checkpoint ${data.order_index} đã tồn tại trong lớp này.`);
      }
    }

    if (data.deadline != null) assertDeadlineNotPast(data.deadline);

    const result = await base.update(id, cleanData(data, checkpoint));
    
    // Ghi log audit
    await auditService.log({
      userId: user.id,
      action: "update_checkpoint",
      tableName: "checkpoints",
      recordId: id,
      title: data.title || checkpoint.title,
      newValues: data
    });

    eventBus.emit(Events.CHECKPOINT_UPDATED, { checkpointId: id, updatedBy: user.id });
    return enrichCheckpointRow(result);
  };

  /**
   * Delete a checkpoint
   */
  const remove = async (id, user) => {
    const checkpoint = await checkOwnership(id, user);

    const gradedCount = await checkpointRepository.countGradedSubmissions(id);
    if (gradedCount > 0) {
      throw new BadRequest("Không thể xóa checkpoint đã có bài nộp được chấm điểm.");
    }

    await base.remove(id, true); // soft delete
    
    // Ghi log audit
    await auditService.log({
      userId: user.id,
      action: "delete_checkpoint",
      tableName: "checkpoints",
      recordId: id,
      title: checkpoint.title,
      oldValues: { title: checkpoint.title }
    });

    eventBus.emit(Events.CHECKPOINT_DELETED, { checkpointId: id, deletedBy: user.id });
  };

  /**
   * List all submissions for a checkpoint
   */
  const getSubmissions = async (checkpointId, user) => {
    await checkOwnership(checkpointId, user);
    const rows = await checkpointRepository.findSubmissionsByCheckpoint(checkpointId);
    const data = rows.map((r) => ({
      groupId: r.group_id,
      groupName: r.group_name,
      groupCode: r.group_code,
      status: r.status,
      score: r.score != null ? Number(r.score) : null,
      submittedAt: r.submitted_at,
      memberCount: Number(r.member_count || 0),
      fileCount: Number(r.file_count || 0),
    }));
    return { data };
  };

  /**
   * Get detail of a specific group's submission
   */
  const getSubmissionDetail = async (checkpointId, groupId, user) => {
    await checkOwnership(checkpointId, user);
    const data = await checkpointRepository.findSubmissionDetail(checkpointId, groupId);
    return enrichCheckpointSubmissionForLecturer(data);
  };

  /**
   * Update grade for a group's submission
   */
  const updateGrade = async (checkpointId, groupId, { score, feedback }, user) => {
    await checkOwnership(checkpointId, user);
    
    const submissionId = await checkpointRepository.updateSubmissionGrade(checkpointId, groupId, {
      score,
      feedback,
      gradedBy: user.id
    });

    const row = await checkpointRepository.findSubmissionDetail(checkpointId, groupId);

    // Ghi log audit
    await auditService.log({
      userId: user.id,
      action: "grade_checkpoint",
      tableName: "checkpoint_submissions",
      recordId: submissionId,
      title: row.checkpoint_title || `Checkpoint ${row.order_index}`,
      newValues: { 
        title: row.checkpoint_title || `Checkpoint ${row.order_index}`, 
        score, 
        feedback 
      }
    });

    eventBus.emit(Events.CHECKPOINT_UPDATED, { checkpointId: checkpointId, submissionId, gradedBy: user.id });
    
    return enrichCheckpointSubmissionForLecturer(row);
  };


  /**
   * Get all checkpoints for a group (from its class)
   */
  const getByGroup = async (groupId, user) => {
    if (!user?.roles?.length) throw Forbidden("User not authorized");
    if (isLecturerOnly(user)) {
      const group = await checkpointRepository.findGroupClassById(groupId);
      if (!group) throw NotFound("Group");
      if (Number(group.lecturer_id) !== Number(user.id)) {
        throw Forbidden("Group does not belong to your class");
      }
    } else if (!isAdminOrDept(user)) {
      throw Forbidden("Checkpoint access denied");
    }
    const data = (await checkpointRepository.findCheckpointsByGroup(groupId)).map(enrichCheckpointRow);
    return { data };
  };

  /**
   * Get all checkpoints for the currently logged in student
   */
  const getStudentCheckpoints = async (user, filters = {}) => {
    const checkpoints = (await checkpointRepository.findCheckpointsByStudent(user.id, filters)).map(
      enrichCheckpointRow,
    );
    
    // Fetch files for each checkpoint that has a submission
    for (const cp of checkpoints) {
      if (cp.submission_id) {
        const files = await checkpointRepository.findFilesBySubmissionId(cp.submission_id);
        
        // Ensure each file has a fresh URL
        for (const file of files) {
          file.file_url = getFileProxyUrl(file.file_path, file.file_name);
        }
        
        cp.files = files;
      } else {
        cp.files = [];
      }
      await attachStudentEvaluation(cp);
    }

    return { data: checkpoints };
  };

  /**
   * Initiate a presigned URL upload session
   * Returns presigned PUT URLs for each file so client uploads directly to MinIO
   */
  const initiateUpload = async (checkpointId, userId, filesMeta) => {
    const checkpoint = await checkpointRepository.findByIdWithSubjectAndClass(checkpointId);
    if (!checkpoint) throw NotFound("Checkpoint");
    if (checkpoint.status !== "open") throw BadRequest("Checkpoint chưa mở hoặc đã đóng");

    const group = await checkpointRepository.findStudentGroupByClass(userId, checkpoint.class_id);
    if (!group) throw BadRequest("Bạn chưa tham gia nhóm nào trong lớp này");

    const existingSubmission = await checkpointRepository.findSubmissionByCheckpointAndGroup(checkpointId, group.id);
    if (existingSubmission?.status === "graded") {
      throw BadRequest("Bài đã được giảng viên chấm điểm. Không thể nộp lại.");
    }

    // Validate file count
    const maxFiles = checkpoint.max_files || 5;
    if (filesMeta.length > maxFiles) {
      throw BadRequest(`Tối đa ${maxFiles} file cho mỗi checkpoint`);
    }

    // Validate each file size
    const maxSizeBytes = (checkpoint.max_file_size_mb || 20) * 1024 * 1024;
    for (const f of filesMeta) {
      if (f.size > maxSizeBytes) {
        throw BadRequest(`File "${f.name}" vượt quá ${checkpoint.max_file_size_mb || 20}MB`);
      }
    }

    // Create/update submission record
    const isLate = new Date() > new Date(checkpoint.deadline) ? 1 : 0;
    let submissionId;
    try {
      submissionId = await checkpointRepository.createOrUpdateSubmission({
        checkpoint_id: checkpointId,
        group_id: group.id,
        submitted_by: userId,
        is_late: isLate,
      });
    } catch (e) {
      if (e?.code === "SUBMISSION_GRADED") {
        throw BadRequest("Bài đã được giảng viên chấm điểm. Không thể nộp lại.");
      }
      throw e;
    }

    // Clear old files from previous submissions
    await checkpointRepository.deleteSubmissionFiles(submissionId);

    // Create upload session (presigned URLs expire in 15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const sessionId = await checkpointRepository.createUploadSession({
      userId,
      checkpointId,
      groupId: group.id,
      fileCount: filesMeta.length,
      expiresAt,
    });

    // Generate presigned URLs and create pending file records
    const { v4: uuidv4 } = await import("uuid");
    const uploadFiles = [];

    const semesterFolder = (checkpoint.semester_code || "UNKNOWN").toUpperCase();
    const subjectFolder = (checkpoint.subject_code || "UNKNOWN").toUpperCase();
    const classFolder = (checkpoint.class_code || "UNKNOWN").toUpperCase();

    for (const fileMeta of filesMeta) {
      const ext = fileMeta.name.split(".").pop();
      const objectKey = `${semesterFolder}/${subjectFolder}/${classFolder}/checkpoints/${checkpointId}/groups/${group.id}/submissions/${submissionId}/${uuidv4()}.${ext}`;

      const presignedUrl = await storageService.generatePresignedPutUrl(objectKey, 900);

      uploadFiles.push({
        file_name: fileMeta.name,
        file_path: objectKey,
        file_type: ext,
        mime_type: fileMeta.type,
        file_size: fileMeta.size,
        uploaded_by: userId,
        presignedUrl,
      });
    }

    // Save pending file records to DB
    await checkpointRepository.addPendingFiles(submissionId, sessionId, uploadFiles);

    await checkpointRepository.updateUploadSessionStatus(sessionId, "uploading");

    return {
      sessionId,
      submissionId,
      expiresAt: expiresAt.toISOString(),
      files: uploadFiles.map((f) => ({
        fileName: f.file_name,
        objectKey: f.file_path,
        presignedUrl: f.presignedUrl,
      })),
    };
  };

  /**
   * Confirm upload — verify files exist in MinIO, finalize submission
   */
  const confirmUpload = async (checkpointId, sessionId, userId, { note } = {}) => {
    const session = await checkpointRepository.findUploadSession(sessionId);
    if (!session) throw NotFound("Upload session");
    if (session.user_id !== userId) throw Forbidden("Bạn không có quyền xác nhận session này");
    if (session.checkpoint_id !== checkpointId) throw BadRequest("Session không khớp checkpoint");
    if (session.status === "completed") throw BadRequest("Session đã hoàn tất");
    if (new Date() > new Date(session.expires_at)) {
      await checkpointRepository.updateUploadSessionStatus(sessionId, "expired");
      throw BadRequest("Session đã hết hạn, vui lòng thử lại");
    }

    const submissionRow = await checkpointRepository.findSubmissionByCheckpointAndGroup(
      session.checkpoint_id,
      session.group_id
    );
    if (submissionRow?.status === "graded") {
      throw BadRequest("Bài đã được giảng viên chấm điểm. Không thể xác nhận nộp bài này.");
    }

    // Verify each file exists in MinIO
    const pendingFiles = await checkpointRepository.findPendingFilesBySession(sessionId);
    
    // Debug: List all objects to see what's actually there
    try {
      const objects = await storageService.listObjects();
      logger.debug(`[CheckpointService] Objects in bucket: ${JSON.stringify(objects)}`);
    } catch (err) {
      logger.error(`[CheckpointService] Failed to list objects: ${err.message}`);
    }

    // Small delay for consistency
    await new Promise(resolve => setTimeout(resolve, 500));

    let allUploaded = true;
    for (const file of pendingFiles) {
      logger.debug(`[CheckpointService] Verifying file: ${file.file_path} (ID: ${file.id})`);
      
      let verified = false;
      let retries = 3;
      
      while (retries > 0 && !verified) {
        try {
          const stat = await storageService.statObject(file.file_path);
          if (stat) {
            logger.debug(`[CheckpointService] File verified: ${file.file_path}, ETag: ${stat.etag}`);
            await checkpointRepository.updateFileUploadStatus(file.id, "uploaded", stat.etag || null);
            
            const fileUrl = getFileProxyUrl(file.file_path, file.file_name);
            await checkpointRepository.rawQuery(
              "UPDATE checkpoint_submission_files SET file_url = :fileUrl WHERE id = :fileId",
              { fileUrl, fileId: file.id }
            );
            verified = true;
          } else {
            logger.warn(`[CheckpointService] File NOT found (retry ${4 - retries}/3): ${file.file_path}`);
            if (retries > 1) {
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        } catch (err) {
          logger.error(`[CheckpointService] Error stating object ${file.file_path}: ${err.message}`);
        }
        retries--;
      }

      if (!verified) {
        await checkpointRepository.updateFileUploadStatus(file.id, "failed");
        allUploaded = false;
      }
    }

    if (!allUploaded) {
      throw BadRequest("Một số file chưa được upload thành công. Vui lòng thử lại.");
    }

    // Update submission note if provided
    if (note) {
      await checkpointRepository.rawQuery(
        "UPDATE checkpoint_submissions SET note = :note WHERE checkpoint_id = :checkpointId AND group_id = :groupId",
        { note, checkpointId: session.checkpoint_id, groupId: session.group_id }
      );
    }

    // Ghi log audit
    await auditService.log({
      userId: userId,
      action: "submit_checkpoint",
      tableName: "checkpoint_submissions",
      recordId: submissionRow?.id || session.checkpoint_id,
      title: submissionRow?.checkpoint_title || `Checkpoint ${submissionRow?.order_index}`,
      newValues: { 
        title: submissionRow?.checkpoint_title || `Checkpoint ${submissionRow?.order_index}`, 
        checkpoint_id: checkpointId, 
        group_id: session.group_id, 
        note 
      }
    });

    await checkpointRepository.updateUploadSessionStatus(sessionId, "completed");

    return { sessionId, status: "completed" };
  };

  const getById = async (id, user) => {
    await checkOwnership(id, user);
    const row = await checkpointRepository.findByIdWithSubjectAndClass(id);
    if (!row) throw NotFound("Checkpoint");
    return enrichCheckpointRow(row);
  };

  return {
    ...base,
    getById,
    create,
    getList,
    getSubmissions,
    getSubmissionDetail,
    updateGrade,
    getByGroup,
    getStudentCheckpoints,
    initiateUpload,
    confirmUpload,
    update,
    remove,
    createBulk,
  };
};
