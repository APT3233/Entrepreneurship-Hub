import { AlreadyExists, BadRequest, NotFound } from "app/core/errors/errorFactory.js";
import { parsePagination } from "app/core/utils/pagination.js";

const clean = (value) => String(value ?? "").trim();
const nullable = (value) => {
  const text = clean(value);
  return text || null;
};
const numberOrDefault = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const createAdminProjectSubmissionService = ({ adminProjectSubmissionRepository, auditService }) => {
  const pageArgs = (query) => parsePagination({ page: query.page, limit: query.limit });

  const listProjects = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminProjectSubmissionRepository.listProjects({
      search: query.search?.trim() || null,
      semesterId: query.semester_id || null,
      classId: query.class_id || null,
      category: query.category || null,
      status: query.status || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getProject = async (id) => {
    const project = await adminProjectSubmissionRepository.findProjectById(id);
    if (!project) throw NotFound("Project");
    return project;
  };

  const updateProject = async (id, data, actor) => {
    const project = await getProject(id);
    const payload = {};
    if (data.topic !== undefined) payload.topic = nullable(data.topic);
    if (data.topic_desc !== undefined) payload.topic_desc = nullable(data.topic_desc);
    if (data.category !== undefined) payload.category = nullable(data.category);
    if (data.zalo_link !== undefined) payload.zalo_link = nullable(data.zalo_link);
    if (data.mentor_name !== undefined) payload.mentor_name = nullable(data.mentor_name);
    if (data.mentor_dept !== undefined) payload.mentor_dept = nullable(data.mentor_dept);
    await adminProjectSubmissionRepository.updateProject(id, payload);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_project_metadata",
      tableName: "groups",
      recordId: id,
      title: project.group_code,
      newValues: payload,
    });
    return getProject(id);
  };

  const normalizeCheckpointPayload = (data, actor, current = null) => ({
    class_id: Number(data.class_id ?? current?.class_id),
    title: clean(data.title ?? current?.title),
    description: data.description !== undefined ? nullable(data.description) : current?.description || null,
    order_index: Number(data.order_index ?? current?.order_index ?? 1),
    deadline: data.deadline ?? current?.deadline,
    open_at: data.open_at !== undefined ? nullable(data.open_at) : current?.open_at || null,
    max_score: numberOrDefault(data.max_score ?? current?.max_score, 10),
    weight: numberOrDefault(data.weight ?? current?.weight, 1),
    required_file_types: data.required_file_types !== undefined ? nullable(data.required_file_types) : current?.required_file_types || null,
    max_file_size_mb: Number(data.max_file_size_mb ?? current?.max_file_size_mb ?? 20),
    max_files: Number(data.max_files ?? current?.max_files ?? 5),
    attachment_url: data.attachment_url !== undefined ? nullable(data.attachment_url) : current?.attachment_url || null,
    status: data.status ?? current?.status ?? "draft",
    created_by: current?.created_by ?? actor?.id ?? null,
  });

  const assertCheckpointOrderAvailable = async (classId, orderIndex, excludeId = null) => {
    const existing = await adminProjectSubmissionRepository.findCheckpointOrder(classId, orderIndex, excludeId);
    if (existing) throw AlreadyExists("Checkpoint order_index đã tồn tại trong lớp");
  };

  const listCheckpoints = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminProjectSubmissionRepository.listCheckpoints({
      search: query.search?.trim() || null,
      classId: query.class_id || null,
      semesterId: query.semester_id || null,
      status: query.status || null,
      deadline: query.deadline || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getCheckpoint = async (id) => {
    const checkpoint = await adminProjectSubmissionRepository.findCheckpointById(id);
    if (!checkpoint) throw NotFound("Checkpoint");
    return checkpoint;
  };

  const createCheckpoint = async (data, actor) => {
    const payload = normalizeCheckpointPayload(data, actor);
    await assertCheckpointOrderAvailable(payload.class_id, payload.order_index);
    const id = await adminProjectSubmissionRepository.createCheckpoint(payload);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_create_checkpoint",
      tableName: "checkpoints",
      recordId: id,
      title: payload.title,
      newValues: { title: payload.title, class_id: payload.class_id },
    });
    return getCheckpoint(id);
  };

  const updateCheckpoint = async (id, data, actor) => {
    const current = await getCheckpoint(id);
    const force = Boolean(data.force);
    const payload = normalizeCheckpointPayload(data, actor, current);
    delete payload.created_by;
    await assertCheckpointOrderAvailable(payload.class_id, payload.order_index, id);
    if ((data.max_score !== undefined || data.weight !== undefined) && !force) {
      const graded = await adminProjectSubmissionRepository.countCheckpointGraded(id);
      if (graded > 0) throw BadRequest("Checkpoint đã có bài graded. Gửi force=true nếu cần đổi max_score/weight.");
    }
    await adminProjectSubmissionRepository.updateCheckpoint(id, payload);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_checkpoint",
      tableName: "checkpoints",
      recordId: id,
      title: payload.title,
      newValues: payload,
    });
    return getCheckpoint(id);
  };

  const updateCheckpointStatus = async (id, status, actor) => {
    const current = await getCheckpoint(id);
    await adminProjectSubmissionRepository.updateCheckpoint(id, { status });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_checkpoint_status",
      tableName: "checkpoints",
      recordId: id,
      title: current.title,
      newValues: { status },
    });
    return getCheckpoint(id);
  };

  const duplicateCheckpoint = async (id, actor) => {
    const current = await getCheckpoint(id);
    const nextOrder = await adminProjectSubmissionRepository.getNextCheckpointOrder(current.class_id);
    const payload = normalizeCheckpointPayload({
      ...current,
      title: `${current.title} (Copy)`,
      order_index: nextOrder,
      status: "draft",
    }, actor);
    const newId = await adminProjectSubmissionRepository.createCheckpoint(payload);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_duplicate_checkpoint",
      tableName: "checkpoints",
      recordId: newId,
      title: payload.title,
      newValues: { source_id: Number(id), class_id: payload.class_id },
    });
    return getCheckpoint(newId);
  };

  const listCheckpointSubmissions = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminProjectSubmissionRepository.listCheckpointSubmissions({
      search: query.search?.trim() || null,
      semesterId: query.semester_id || null,
      classId: query.class_id || null,
      checkpointId: query.checkpoint_id || null,
      status: query.status || null,
      isLate: query.is_late,
      gradedBy: query.graded_by || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getCheckpointSubmission = async (id) => {
    const submission = await adminProjectSubmissionRepository.findCheckpointSubmissionById(id);
    if (!submission) throw NotFound("Checkpoint submission");
    return submission;
  };

  const gradeCheckpointSubmission = async (id, data, actor) => {
    const submission = await getCheckpointSubmission(id);
    const maxScore = Number(submission.max_score);
    const score = Number(data.score);
    if (Number.isNaN(score) || score < 0 || score > maxScore) throw BadRequest(`Điểm phải từ 0 đến ${maxScore}`);
    const feedback = clean(data.feedback);
    if (!feedback) throw BadRequest("Feedback là bắt buộc khi chấm điểm.");
    await adminProjectSubmissionRepository.gradeCheckpointSubmission(id, {
      score,
      feedback,
      graded_by: actor?.id || null,
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_grade_checkpoint_submission",
      tableName: "checkpoint_submissions",
      recordId: id,
      title: submission.checkpoint_title,
      newValues: { score, feedback },
    });
    return getCheckpointSubmission(id);
  };

  const normalizeAssignmentPayload = (data, actor, current = null) => ({
    class_id: Number(data.class_id ?? current?.class_id),
    title: clean(data.title ?? current?.title),
    description: data.description !== undefined ? nullable(data.description) : current?.description || null,
    deadline: data.deadline ?? current?.deadline,
    max_score: numberOrDefault(data.max_score ?? current?.max_score, 10),
    status: data.status ?? current?.status ?? "open",
    required_file_types: data.required_file_types !== undefined ? nullable(data.required_file_types) : current?.required_file_types || "pdf,docx",
    max_file_size_mb: Number(data.max_file_size_mb ?? current?.max_file_size_mb ?? 20),
    max_files: Number(data.max_files ?? current?.max_files ?? 5),
    attachment_url: data.attachment_url !== undefined ? nullable(data.attachment_url) : current?.attachment_url || null,
    created_by: current?.created_by ?? actor?.id ?? null,
  });

  const listAssignments = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminProjectSubmissionRepository.listAssignments({
      search: query.search?.trim() || null,
      classId: query.class_id || null,
      semesterId: query.semester_id || null,
      status: query.status || null,
      deadline: query.deadline || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getAssignment = async (id) => {
    const assignment = await adminProjectSubmissionRepository.findAssignmentById(id);
    if (!assignment) throw NotFound("Assignment");
    return assignment;
  };

  const createAssignment = async (data, actor) => {
    const payload = normalizeAssignmentPayload(data, actor);
    const id = await adminProjectSubmissionRepository.createAssignment(payload);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_create_assignment",
      tableName: "assignments",
      recordId: id,
      title: payload.title,
      newValues: { title: payload.title, class_id: payload.class_id },
    });
    return getAssignment(id);
  };

  const updateAssignment = async (id, data, actor) => {
    const current = await getAssignment(id);
    const force = Boolean(data.force);
    const payload = normalizeAssignmentPayload(data, actor, current);
    delete payload.created_by;
    if (data.max_score !== undefined && !force) {
      const graded = await adminProjectSubmissionRepository.countAssignmentGraded(id);
      if (graded > 0) throw BadRequest("Assignment đã có bài graded. Gửi force=true nếu cần đổi max_score.");
    }
    await adminProjectSubmissionRepository.updateAssignment(id, payload);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_assignment",
      tableName: "assignments",
      recordId: id,
      title: payload.title,
      newValues: payload,
    });
    return getAssignment(id);
  };

  const updateAssignmentStatus = async (id, status, actor) => {
    const current = await getAssignment(id);
    await adminProjectSubmissionRepository.updateAssignment(id, { status });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_assignment_status",
      tableName: "assignments",
      recordId: id,
      title: current.title,
      newValues: { status },
    });
    return getAssignment(id);
  };

  const listAssignmentSubmissions = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminProjectSubmissionRepository.listAssignmentSubmissions({
      search: query.search?.trim() || null,
      semesterId: query.semester_id || null,
      classId: query.class_id || null,
      assignmentId: query.assignment_id || null,
      status: query.status || null,
      isLate: query.is_late,
      gradedBy: query.graded_by || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getAssignmentSubmission = async (id) => {
    const submission = await adminProjectSubmissionRepository.findAssignmentSubmissionById(id);
    if (!submission) throw NotFound("Assignment submission");
    return submission;
  };

  const gradeAssignmentSubmission = async (id, data, actor) => {
    const submission = await getAssignmentSubmission(id);
    const maxScore = Number(submission.max_score);
    const score = Number(data.score);
    if (Number.isNaN(score) || score < 0 || score > maxScore) throw BadRequest(`Điểm phải từ 0 đến ${maxScore}`);
    const feedback = clean(data.feedback);
    if (!feedback) throw BadRequest("Feedback là bắt buộc khi chấm điểm.");
    await adminProjectSubmissionRepository.gradeAssignmentSubmission(id, {
      score,
      feedback,
      graded_by: actor?.id || null,
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_grade_assignment_submission",
      tableName: "assignment_submissions",
      recordId: id,
      title: submission.assignment_title,
      newValues: { score, feedback },
    });
    return getAssignmentSubmission(id);
  };

  const listSubmissionFiles = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminProjectSubmissionRepository.listSubmissionFiles({
      search: query.search?.trim() || null,
      source: query.source || null,
      checkpointId: query.checkpoint_id || null,
      assignmentId: query.assignment_id || null,
      isDeleted: query.is_deleted,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const updateSubmissionFileDeleted = async (source, id, deleted, actor) => {
    await adminProjectSubmissionRepository.updateSubmissionFileDeleted(source, id, deleted);
    await auditService.log({
      userId: actor?.id || null,
      action: deleted ? "admin_delete_submission_file" : "admin_restore_submission_file",
      tableName: `${source}_submission_files`,
      recordId: id,
      newValues: { is_deleted: deleted ? 1 : 0 },
    });
    return { id: Number(id), source, is_deleted: deleted ? 1 : 0 };
  };

  const getLookups = () => adminProjectSubmissionRepository.getLookups();

  return {
    listProjects,
    getProject,
    updateProject,
    listCheckpoints,
    getCheckpoint,
    createCheckpoint,
    updateCheckpoint,
    updateCheckpointStatus,
    duplicateCheckpoint,
    listCheckpointSubmissions,
    getCheckpointSubmission,
    gradeCheckpointSubmission,
    listAssignments,
    getAssignment,
    createAssignment,
    updateAssignment,
    updateAssignmentStatus,
    listAssignmentSubmissions,
    getAssignmentSubmission,
    gradeAssignmentSubmission,
    listSubmissionFiles,
    updateSubmissionFileDeleted,
    getLookups,
  };
};
