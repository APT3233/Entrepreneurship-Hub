import { createBaseService } from "app/core/services/baseService.js";
import { parsePagination, parseSort } from "app/core/utils/pagination.js";
import { BadRequest, Forbidden, NotFound } from "app/core/errors/errorFactory.js";
import { Events } from "app/core/constants/events.js";
import { getFileProxyUrl } from "app/core/utils/file.js";

export const createAssignmentService = ({ assignmentRepository, storageService, transaction, eventBus, tokenService, auditService, evaluationRepository }) => {
  const base = createBaseService(assignmentRepository, "Assignment");
  const ALLOWED_SORT = ["title", "deadline", "max_score", "status", "created_at"];

  const userRoles = (user) => (user?.roles || []).map((r) => String(r).toLowerCase());
  const hasRole = (user, ...roles) => userRoles(user).some((role) => roles.includes(role));
  const isAdminOrDept = (user) => hasRole(user, "admin", "department_head");
  const isLecturerOnly = (user) =>
    hasRole(user, "lecturer") && !isAdminOrDept(user);
  const isStudent = (user) => hasRole(user, "student");
  const canManageAssignmentAttachments = (user) =>
    isAdminOrDept(user) || hasRole(user, "lecturer");

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

  const toSubmissionFileDto = (f) => ({
    id: f.id,
    fileName: f.file_name,
    fileUrl: f.file_url,
    mimeType: f.mime_type,
    fileSize: f.file_size != null ? Number(f.file_size) : null,
  });

  const toCardDto = (row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    deadline: row.deadline,
    maxScore: Number(row.max_score),
    status: row.status,
    classId: row.class_id,
    classCode: row.class_code,
    required_file_types: row.required_file_types,
    max_file_size_mb: row.max_file_size_mb,
    max_files: row.max_files,
    attachmentUrls: parseLecturerAttachmentUrlsForDto(row.attachment_url),
    submittedGroups: Number(row.submitted_groups || 0),
    totalGroups: Number(row.total_groups || 0),
    submissionStatus: row.submission_status || null,
    score: row.score != null ? Number(row.score) : null,
    feedback: row.submission_feedback != null && String(row.submission_feedback).length
      ? String(row.submission_feedback)
      : null,
    submittedAt: row.submitted_at || null,
    submissionId: row.submission_id || null,
    rubricId: row.rubric_id || null,
    rubricName: row.rubric_name || null,
  });

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

  const attachStudentEvaluation = async (dto, submissionId, submissionStatus) => {
    if (
      !submissionId ||
      submissionStatus !== "graded" ||
      !evaluationRepository?.findPublishedEvaluationDetailByTarget
    ) {
      dto.evaluation = null;
      return dto;
    }
    const evaluation = await evaluationRepository.findPublishedEvaluationDetailByTarget(
      "assignment_submission",
      submissionId,
    );
    dto.evaluation = toStudentEvaluationDto(evaluation);
    return dto;
  };

  const checkOwnership = async (assignmentId, user) => {
    const row = await assignmentRepository.findByIdWithClass(assignmentId);
    if (!row) throw NotFound("Assignment");
    if (!user?.roles?.length) throw Forbidden("User not authorized");
    if (!isAdminOrDept(user) && Number(row.lecturer_id) !== Number(user.id)) {
      throw Forbidden("Assignment does not belong to your class");
    }
    return row;
  };

  const assertDeadlineNotPast = (deadlineIso) => {
    const t = new Date(deadlineIso).getTime();
    if (Number.isNaN(t) || t <= Date.now()) {
      throw BadRequest("Hạn nộp không được là thời điểm đã qua.");
    }
  };

  const createBulk = async (data, user) => {
    const classIds = [...new Set((data.class_ids || []).map((id) => Number(id)).filter(Boolean))];
    if (!classIds.length) throw BadRequest("class_ids is required");
    if (!user?.id) throw Forbidden("User not authorized");
    assertDeadlineNotPast(data.deadline);
    const classes = await assignmentRepository.findClassesByIdsAndLecturer(classIds, user.id);
    if (classes.length !== classIds.length) throw BadRequest("Một hoặc nhiều lớp không tồn tại hoặc không thuộc quyền giảng viên");
    const payloads = classIds.map((classId) => ({
      class_id: classId,
      title: data.title,
      description: data.description || null,
      deadline: data.deadline,
      max_score: Number(data.max_score),
      status: data.status || "open",
      required_file_types: data.required_file_types || "pdf,docx",
      max_file_size_mb: Number(data.max_file_size_mb) || 20,
      max_files: Number(data.max_files) || 5,
      attachment_url: data.attachment_url || null,
      created_by: user.id,
    }));
    const insertedIds = await transaction.run(async (conn) => assignmentRepository.insertMany(payloads, conn));
    const createdRows = await Promise.all(insertedIds.map((id) => assignmentRepository.findDetailById(id)));
    
    // Ghi log audit cho từng bài tập được tạo
    for (const row of createdRows) {
      await auditService.log({
        userId: user.id,
        action: "create_assignment",
        tableName: "assignments",
        recordId: row.id,
        title: row.title,
        newValues: { title: row.title, class_id: row.class_id }
      });
    }

    eventBus.emit(Events.ASSIGNMENT_CREATED, { assignmentIds: insertedIds, classIds, createdBy: user.id });
    return createdRows.map(toCardDto);
  };

  const getList = async (query, user) => {
    if (!user?.roles?.length) throw Forbidden("User not authorized");
    const pagination = parsePagination(query);
    const sort = parseSort(query.sort, ALLOWED_SORT);
    const filters = {
      ...(query.class_id && { class_id: Number(query.class_id) }),
      ...(query.status && { status: query.status }),
      ...(query.semester_id && { semester_id: Number(query.semester_id) }),
      ...(query.year && { year: Number(query.year) }),
    };

    // If student, filter by enrolled classes and include submission info
    if (isStudent(user)) {
      const data = await assignmentRepository.findByStudent(user.id, filters);
      const cards = await Promise.all(
        data.map(async (row) => {
          const dto = toCardDto(row);
          if (row.submission_id) {
            const files = await assignmentRepository.findFilesByAssignmentSubmission(row.submission_id);
            for (const f of files) {
              f.file_url = getFileProxyUrl(f.file_path, f.file_name);
            }
            dto.submissionFiles = files.map(toSubmissionFileDto);
          } else {
            dto.submissionFiles = [];
          }
          return attachStudentEvaluation(dto, row.submission_id, row.submission_status);
        })
      );
      return { data: cards, total: cards.length, page: 1, limit: 1000 };
    }

    if (isLecturerOnly(user)) {
      if (query.class_id) {
        const classes = await assignmentRepository.findClassesByIdsAndLecturer([query.class_id], user.id);
        if (classes.length !== 1) throw Forbidden("Class does not belong to you");
      }
      filters.lecturer_id = user.id;
    } else if (!isAdminOrDept(user)) {
      throw Forbidden("Assignment access denied");
    }

    const [data, total] = await Promise.all([
      assignmentRepository.findManyWithStats({ filters, pagination, sort }),
      assignmentRepository.countManyWithStats(filters),
    ]);
    return { data: data.map(toCardDto), ...pagination, total };
  };

  const getById = async (id, user) => {
    const isStudent = user.roles?.some((r) => String(r).toLowerCase() === "student");
    if (isStudent) {
      const row = await assignmentRepository.findByIdForStudent(id, user.id);
      if (!row) throw NotFound("Assignment");
      const dto = toCardDto(row);
      if (row.submission_id) {
        const files = await assignmentRepository.findFilesByAssignmentSubmission(row.submission_id);
        for (const f of files) {
          f.file_url = getFileProxyUrl(f.file_path, f.file_name);
        }
        dto.submissionFiles = files.map(toSubmissionFileDto);
      } else {
        dto.submissionFiles = [];
      }
      return attachStudentEvaluation(dto, row.submission_id, row.submission_status);
    }

    await checkOwnership(id, user);
    const row = await assignmentRepository.findDetailById(id);
    if (!row) throw NotFound("Assignment");
    return toCardDto(row);
  };

  const getSubmissions = async (assignmentId, user) => {
    await checkOwnership(assignmentId, user);
    const rows = await assignmentRepository.listSubmissionsByAssignmentForLecturer(assignmentId);
    const groupIds = rows.map((r) => Number(r.group_id));
    const membersByGroup = await assignmentRepository.findGroupMembersByGroupIds(groupIds);
    const out = await Promise.all(
      rows.map(async (r) => {
        const files = await assignmentRepository.findFilesByAssignmentSubmission(r.id);
        for (const f of files) {
          f.file_url = getFileProxyUrl(f.file_path, f.file_name);
        }
        const gid = Number(r.group_id);
        return {
          submissionId: r.id,
          groupId: gid,
          groupName: r.group_name,
          groupCode: r.group_code,
          members: membersByGroup[gid] || [],
          submittedByName: r.submitter_name || null,
          status: r.status,
          submittedAt: r.submitted_at,
          isLate: Boolean(r.is_late),
          score: r.score != null ? Number(r.score) : null,
          feedback: r.feedback != null && String(r.feedback).length ? String(r.feedback) : null,
          gradedAt: r.graded_at || null,
          graderName: r.grader_name || null,
          files: files.map(toSubmissionFileDto),
        };
      })
    );
    return out;
  };

  const gradeGroupSubmission = async (assignmentId, groupId, { score, feedback }, user) => {
    await checkOwnership(assignmentId, user);
    const detail = await assignmentRepository.findDetailById(assignmentId);
    if (!detail) throw NotFound("Assignment");
    const maxScore = Number(detail.max_score);
    if (Number.isNaN(Number(score)) || Number(score) < 0 || Number(score) > maxScore) {
      throw BadRequest(`Điểm phải từ 0 đến ${maxScore}`);
    }
    const fb = feedback != null && String(feedback).trim() ? String(feedback).trim() : null;
    const updated = await assignmentRepository.updateSubmissionGrade(
      { assignmentId, groupId: Number(groupId), score: Number(score), feedback: fb, gradedBy: user.id }
    );
    if (!updated) throw BadRequest("Chưa có bài nộp từ nhóm này — không thể chấm");

    // Ghi log audit
    await auditService.log({
      userId: user.id,
      action: "grade_assignment",
      tableName: "assignment_submissions",
      recordId: updated.id,
      title: detail.title,
      newValues: { title: detail.title, score, feedback: fb }
    });

    eventBus.emit(Events.ASSIGNMENT_SUBMISSION_GRADED, {
      assignmentId,
      groupId: Number(groupId),
      submissionId: updated.id,
      gradedBy: user.id,
      score: Number(score),
    });
    return getSubmissions(assignmentId, user);
  };

  const update = async (id, data, user) => {
    const assignment = await checkOwnership(id, user);
    if (data.deadline != null) assertDeadlineNotPast(data.deadline);
    await base.update(id, data);

    // Ghi log audit
    await auditService.log({
      userId: user?.id || null,
      action: "update_assignment",
      tableName: "assignments",
      recordId: id,
      title: data.title || assignment.title,
      newValues: data
    });

    eventBus.emit(Events.ASSIGNMENT_UPDATED, { assignmentId: id, updatedBy: user?.id || null });
    return getById(id, user);
  };

  const updateStatus = async (id, status, user) => {
    const assignment = await checkOwnership(id, user);
    await base.update(id, { status });

    // Ghi log audit
    await auditService.log({
      userId: user?.id || null,
      action: "update_assignment_status",
      tableName: "assignments",
      recordId: id,
      title: assignment.title,
      newValues: { status }
    });

    eventBus.emit(Events.ASSIGNMENT_UPDATED, { assignmentId: id, status, updatedBy: user?.id || null });
    return getById(id, user);
  };

  const remove = async (id, user) => {
    await checkOwnership(id, user);
    const assignment = await assignmentRepository.findDetailById(id);
    await base.remove(id, true);

    // Ghi log audit
    await auditService.log({
      userId: user?.id || null,
      action: "delete_assignment",
      tableName: "assignments",
      recordId: id,
      title: assignment?.title,
      oldValues: { title: assignment?.title }
    });

    eventBus.emit(Events.ASSIGNMENT_DELETED, { assignmentId: id, deletedBy: user?.id || null });
  };

  const initiateUpload = async (file, user) => {
    if (!user?.id) throw Forbidden("User not authorized");
    if (!canManageAssignmentAttachments(user)) throw Forbidden("Assignment attachment upload denied");
    const maxSizeBytes = 25 * 1024 * 1024;
    if (Number(file.size) > maxSizeBytes) throw BadRequest("Dung lượng file vượt quá giới hạn cho phép (25MB).");

    const safeName = String(file.name || "attachment")
      .replace(/[\\/]/g, "_")
      .replace(/\s+/g, "_");
    const objectKey = `assignments/attachments/${user.id}/${Date.now()}_${safeName}`;
    const presignedUrl = await storageService.generatePresignedPutUrl(objectKey, 900);
    const uploadToken = tokenService.signPayload({
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
    if (!canManageAssignmentAttachments(user)) throw Forbidden("Assignment attachment upload denied");

    let payload = null;
    try {
      payload = tokenService.verifyPayload(uploadToken);
    } catch {
      throw BadRequest("Upload token không hợp lệ");
    }

    if (payload?.p === "asubmit") {
      throw BadRequest("Token nộp bài — dùng endpoint xác nhận nộp bài cho sinh viên");
    }

    if (Number(payload?.u) !== Number(user.id)) throw Forbidden("Upload token không thuộc về bạn");
    if (!payload?.k) throw BadRequest("Upload token thiếu object key");

    const stat = await storageService.statObject(payload.k);
    if (!stat) throw BadRequest("Không tìm thấy file đã upload. Vui lòng thử lại.");

    const url = getFileProxyUrl(payload.k, payload.n);
    eventBus.emit(Events.ASSIGNMENT_UPDATED, {
      updatedBy: user.id,
      action: "attachment_upload_confirmed",
      objectKey: payload.k,
    });

    return {
      url,
      objectKey: payload.k,
      fileName: payload.n,
      contentType: payload.t,
      size: payload.s,
      etag: stat.etag || null,
    };
  };

  const validateFilesAgainstAssignment = (assignment, filesMeta) => {
    const maxFiles = Number(assignment.max_files) || 5;
    if (filesMeta.length > maxFiles) {
      throw BadRequest(`Tối đa ${maxFiles} file cho bài tập này`);
    }
    const maxSizeBytes = (Number(assignment.max_file_size_mb) || 20) * 1024 * 1024;
    const allowed = (assignment.required_file_types || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
    for (const f of filesMeta) {
      if (f.size > maxSizeBytes) {
        throw BadRequest(`File "${f.name}" vượt quá ${assignment.max_file_size_mb || 20}MB`);
      }
      if (f.size > 25 * 1024 * 1024) {
        throw BadRequest(`File "${f.name}" vượt quá giới hạn hệ thống (25MB)`);
      }
      const ext = (f.name || "").split(".").pop()?.toLowerCase() || "";
      if (allowed.length && !allowed.includes(ext)) {
        throw BadRequest(`File "${f.name}" không đúng định dạng cho phép (${assignment.required_file_types || ""})`);
      }
    }
  };

  const initiateStudentSubmit = async (assignmentId, user, filesMeta) => {
    if (!user?.id) throw Forbidden("User not authorized");
    if (!Array.isArray(filesMeta) || !filesMeta.length) throw BadRequest("Cần ít nhất một file");

    const access = await assignmentRepository.findByIdForStudent(assignmentId, user.id);
    if (!access) throw NotFound("Assignment");

    if (access.status && ["closed", "archived"].includes(String(access.status))) {
      throw BadRequest("Bài tập đã đóng hoặc lưu trữ");
    }

    validateFilesAgainstAssignment(access, filesMeta);

    const group = await assignmentRepository.findStudentGroupByClass(user.id, access.class_id);
    if (!group) throw BadRequest("Bạn chưa tham gia nhóm nào trong lớp này");

    const ts = Date.now();
    const outFiles = [];
    const tokens = [];

    const semesterFolder = (access.semester_code || "UNKNOWN").toUpperCase();
    for (let i = 0; i < filesMeta.length; i++) {
      const f = filesMeta[i];
      const safeName = String(f.name || "file")
        .replace(/[\\/]/g, "_")
        .replace(/\s+/g, "_");
      const objectKey = `${semesterFolder}/assignments/submit/${assignmentId}/group_${Number(group.id)}/${ts}_${i}_${safeName}`;

      const presignedUrl = await storageService.generatePresignedPutUrl(objectKey, 900);
      const uploadToken = tokenService.signPayload(
        {
          p: "asubmit",
          u: Number(user.id),
          k: objectKey,
          n: f.name,
          t: f.type || "application/octet-stream",
          s: Number(f.size),
          aid: assignmentId,
          gid: Number(group.id),
        },
        "15m"
      );
      outFiles.push({ originalName: f.name, uploadUrl: presignedUrl, uploadToken });
      tokens.push(uploadToken);
    }

    const sessionId = Buffer.from(JSON.stringify(tokens), "utf8").toString("base64");

    return { sessionId, files: outFiles };
  };

  const confirmStudentSubmit = async (assignmentId, user, sessionId) => {
    if (!user?.id) throw Forbidden("User not authorized");
    if (!sessionId) throw BadRequest("Thiếu session_id");

    let tokenList;
    try {
      tokenList = JSON.parse(Buffer.from(String(sessionId), "base64").toString("utf8"));
    } catch {
      throw BadRequest("Session không hợp lệ");
    }
    if (!Array.isArray(tokenList) || !tokenList.length) {
      throw BadRequest("Session không hợp lệ");
    }

    const access = await assignmentRepository.findByIdForStudent(assignmentId, user.id);
    if (!access) throw NotFound("Assignment");
    if (access.status && ["closed", "archived"].includes(String(access.status))) {
      throw BadRequest("Bài tập đã đóng hoặc lưu trữ");
    }

    const payloads = [];
    for (const t of tokenList) {
      let pl;
      try {
        pl = tokenService.verifyPayload(t);
      } catch (e) {
        throw BadRequest(e?.message || "Upload token không hợp lệ");
      }
      if (pl.p !== "asubmit") throw BadRequest("Token không dùng cho nộp bài");
      if (Number(pl.u) !== Number(user.id)) throw Forbidden("Upload token không thuộc về bạn");
      if (pl.aid !== assignmentId) throw BadRequest("Token không khớp bài tập");
      const semesterFolder = (access.semester_code || "UNKNOWN").toUpperCase();
      const expectedPrefix = `${semesterFolder}/assignments/submit/${assignmentId}/group_${Number(pl.gid)}/`;
      if (!String(pl.k || "").startsWith(expectedPrefix)) throw BadRequest("Object key không hợp lệ");
      payloads.push({ pl });
    }

    const stats = await Promise.all(payloads.map(({ pl }) => storageService.statObject(pl.k)));
    stats.forEach((stat, i) => {
      if (!stat) throw BadRequest(`Không tìm thấy file đã upload: ${payloads[i].pl.n || ""}`);
      payloads[i].stat = stat;
    });

    const gid = Number(payloads[0].pl.gid);
    for (const { pl } of payloads) {
      if (Number(pl.gid) !== gid) throw BadRequest("Các file phải cùng một nhóm");
    }

    const group = await assignmentRepository.findStudentGroupByClass(user.id, access.class_id);
    if (!group || Number(group.id) !== gid) {
      throw Forbidden("Bạn không thuộc nhóm được chọn");
    }

    const deadline = access.deadline ? new Date(access.deadline) : null;
    const isLate = Boolean(deadline && new Date() > deadline);

    await transaction.run(async (conn) => {
      const { id: submissionId, previousStatus } = await assignmentRepository.getOrCreateAssignmentSubmission(
        { assignmentId, groupId: gid },
        conn
      );

      const fileRows = payloads.map(({ pl }, i) => {
        const ext = String(pl.n || "file")
          .split(".")
          .pop()
          ?.toLowerCase() || null;
        return {
          file_name: pl.n,
          file_path: pl.k,
          file_url: getFileProxyUrl(pl.k, pl.n),
          file_type: ext,
          mime_type: pl.t,
          file_size: pl.s,
          uploaded_by: user.id,
        };
      });
      await assignmentRepository.addAssignmentSubmissionFiles(submissionId, fileRows, conn);

      let nextStatus = "submitted";
      if (previousStatus === "graded" || previousStatus === "submitted" || previousStatus === "resubmitted") {
        nextStatus = "resubmitted";
      }

      await assignmentRepository.finalizeAssignmentSubmission(
        { submissionId, submittedBy: user.id, isLate, status: nextStatus },
        conn
      );

      // Ghi log audit (trong transaction cho chắc chắn)
      await auditService.log({
        userId: user.id,
        action: "submit_assignment",
        tableName: "assignment_submissions",
        recordId: submissionId,
        title: access.title,
        newValues: { title: access.title, assignment_id: assignmentId, group_id: gid, is_late: isLate }
      });
    });

    eventBus.emit(Events.ASSIGNMENT_SUBMISSION_COMPLETED, {
      assignmentId: assignmentId,
      groupId: gid,
      userId: user.id,
    });

    return { status: "completed" };
  };

  return {
    createBulk,
    getList,
    getById,
    getSubmissions,
    gradeGroupSubmission,
    update,
    updateStatus,
    remove,
    initiateUpload,
    confirmUpload,
    initiateStudentSubmit,
    confirmStudentSubmit,
  };
};
