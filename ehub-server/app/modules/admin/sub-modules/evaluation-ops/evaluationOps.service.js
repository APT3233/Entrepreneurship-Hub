import { BadRequest, NotFound } from "app/core/errors/errorFactory.js";
import { parsePagination } from "app/core/utils/pagination.js";

const plannedRubricMessage = "Rubric API is not implemented yet";

const gradingConfigDefinitions = {
  feedback_required: {
    data_type: "boolean",
    default_value: true,
    description: "Bắt buộc nhập feedback khi chấm điểm",
  },
  min_feedback_length: {
    data_type: "integer",
    default_value: 15,
    description: "Độ dài feedback tối thiểu",
  },
  allow_resubmit: {
    data_type: "boolean",
    default_value: true,
    description: "Cho phép nhóm nộp lại bài",
  },
  allow_late_submission: {
    data_type: "boolean",
    default_value: true,
    description: "Cho phép nộp bài sau deadline",
  },
  allow_grade_after_closed: {
    data_type: "boolean",
    default_value: false,
    description: "Cho phép chấm điểm sau khi checkpoint/assignment đã đóng",
  },
  final_score_calculation: {
    data_type: "string",
    default_value: "manual",
    description: "Cách tính điểm cuối kỳ: manual hoặc weighted_sum",
  },
  ai_suggestion_enabled: {
    data_type: "boolean",
    default_value: false,
    description: "Bật gợi ý AI cho giảng viên",
  },
  ai_auto_grading_enabled: {
    data_type: "boolean",
    default_value: false,
    description: "AI auto grading luôn tắt trong MVP",
  },
};

const parseBoolean = (value) => value === true || value === "true" || value === "1" || value === 1;

const serializeSettingValue = (key, value) => {
  const def = gradingConfigDefinitions[key];
  if (!def) throw BadRequest(`Cấu hình ${key} không được hỗ trợ.`);
  if (key === "ai_auto_grading_enabled" && parseBoolean(value)) {
    throw BadRequest("AI auto grading không được bật trong giai đoạn này.");
  }
  if (def.data_type === "boolean") return parseBoolean(value) ? "true" : "false";
  if (def.data_type === "integer") {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 0) throw BadRequest(`${key} phải là số nguyên không âm.`);
    return String(number);
  }
  if (key === "final_score_calculation" && !["manual", "weighted_sum"].includes(String(value))) {
    throw BadRequest("final_score_calculation chỉ hỗ trợ manual hoặc weighted_sum.");
  }
  return String(value ?? "");
};

const parseSettingValue = (setting) => {
  if (setting.data_type === "boolean") return parseBoolean(setting.setting_value);
  if (setting.data_type === "integer") return Number(setting.setting_value || 0);
  if (setting.data_type === "json") {
    try {
      return JSON.parse(setting.setting_value);
    } catch {
      return null;
    }
  }
  return setting.setting_value;
};

const plannedAction = (action) => ({
  implemented: false,
  action,
  message: "Endpoint đã được chuẩn bị nhưng API xử lý file/export chưa triển khai.",
});

export const createAdminEvaluationOpsService = ({ adminEvaluationOpsRepository, auditService }) => {
  const pageArgs = (query) => parsePagination({ page: query.page, limit: query.limit });

  const normalizeEvaluationFilters = (query = {}) => ({
    semesterId: query.semester_id || query.semesterId || null,
    subjectId: query.subject_id || query.subjectId || null,
    classId: query.class_id || query.classId || null,
    lecturerId: query.lecturer_id || query.lecturerId || null,
    targetType: query.target_type || query.targetType || query.source_type || null,
  });

  const getEvaluationOverview = (query) => adminEvaluationOpsRepository.getEvaluationOverview(normalizeEvaluationFilters(query));

  const listRubrics = async (query) => {
    const pagination = pageArgs(query);
    const state = await adminEvaluationOpsRepository.getRubricImplementationState();
    if (state.implemented) {
      const result = await adminEvaluationOpsRepository.listRubrics({
        search: query.search?.trim() || null,
        subjectId: query.subject_id || null,
        status: query.status || null,
        limit: pagination.limit,
        offset: pagination.offset,
      });
      return {
        data: result.rows,
        ...pagination,
        total: result.total,
        implemented: true,
        schema_state: state,
        message: "Rubrics retrieved successfully",
      };
    }
    return {
      data: [],
      ...pagination,
      total: 0,
      implemented: false,
      schema_state: state,
      message: plannedRubricMessage,
    };
  };

  const getRubric = async (id) => {
    const state = await adminEvaluationOpsRepository.getRubricImplementationState();
    if (state.implemented) {
      const rubric = await adminEvaluationOpsRepository.findRubricDetail(id);
      if (!rubric) throw NotFound("Rubric");
      return {
        implemented: true,
        schema_state: state,
        rubric,
        criteria: rubric.criteria || [],
        usage: rubric.bindings || [],
        preview: null,
      };
    }
    return {
      implemented: false,
      schema_state: state,
      rubric: null,
      criteria: [],
      usage: [],
      preview: null,
      requested_id: Number(id),
      message: plannedRubricMessage,
    };
  };

  const listEvaluationSessions = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminEvaluationOpsRepository.listEvaluationSessions({
      ...normalizeEvaluationFilters(query),
      search: query.search?.trim() || null,
      evaluatorId: query.evaluator_id || null,
      status: query.status || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getEvaluationSessionDetail = async (id) => {
    const detail = await adminEvaluationOpsRepository.findEvaluationSessionDetail(id);
    if (!detail) throw NotFound("Evaluation session");
    return detail;
  };

  const updateEvaluationSessionStatus = async ({ id, status, action, body = {}, actor, auditMeta = {} }) => {
    const current = await getEvaluationSessionDetail(id);
    if (current.status === status) return current;
    if (status === "confirmed" && current.status === "draft") {
      throw BadRequest("Không thể confirm evaluation còn ở draft.");
    }
    await adminEvaluationOpsRepository.updateEvaluationSessionStatus(id, status);
    const next = await getEvaluationSessionDetail(id);
    await auditService.log({
      userId: actor?.id || null,
      action,
      tableName: "evaluation_sessions",
      recordId: id,
      title: current.target_title,
      oldValues: { status: current.status, total_score: current.total_score, reason: body.reason || null },
      newValues: { status: next.status, total_score: next.total_score, reason: body.reason || null },
      ipAddress: auditMeta.ipAddress || null,
      userAgent: auditMeta.userAgent || null,
    });
    return next;
  };

  const confirmEvaluationSession = (id, body, actor, auditMeta) =>
    updateEvaluationSessionStatus({ id, status: "confirmed", action: "admin_confirm_evaluation", body, actor, auditMeta });

  const reopenEvaluationSession = (id, body, actor, auditMeta) =>
    updateEvaluationSessionStatus({ id, status: "draft", action: "admin_reopen_evaluation", body, actor, auditMeta });

  const getGradingConfig = async () => {
    const rows = await adminEvaluationOpsRepository.listEvaluationSettings();
    const byKey = new Map(rows.map((row) => [row.setting_key, row]));
    return Object.entries(gradingConfigDefinitions).map(([key, definition]) => {
      const row = byKey.get(key);
      return {
        key,
        value: row ? parseSettingValue(row) : definition.default_value,
        data_type: definition.data_type,
        description: row?.description || definition.description,
        updated_at: row?.updated_at || null,
        is_default: !row,
      };
    });
  };

  const updateGradingConfig = async (body, actor) => {
    const updates = {};
    for (const key of Object.keys(gradingConfigDefinitions)) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (!Object.keys(updates).length) throw BadRequest("Không có cấu hình cần cập nhật.");
    for (const [key, value] of Object.entries(updates)) {
      const definition = gradingConfigDefinitions[key];
      await adminEvaluationOpsRepository.upsertEvaluationSetting({
        setting_key: key,
        setting_value: serializeSettingValue(key, value),
        data_type: definition.data_type,
        description: definition.description,
        updated_by: actor?.id || null,
      });
    }
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_grading_config",
      tableName: "system_settings",
      recordId: null,
      newValues: updates,
    });
    return getGradingConfig();
  };

  const listEvaluationResults = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminEvaluationOpsRepository.listEvaluationResults({
      search: query.search?.trim() || null,
      semesterId: query.semester_id || null,
      subjectId: query.subject_id || null,
      classId: query.class_id || null,
      groupId: query.group_id || null,
      gradedBy: query.graded_by || null,
      status: query.status || null,
      sourceType: query.source_type || null,
      scoreMin: query.score_min,
      scoreMax: query.score_max,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const listGradingProgress = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminEvaluationOpsRepository.listGradingProgress({
      ...normalizeEvaluationFilters(query),
      search: query.search?.trim() || null,
      status: query.status || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const listRubricUsage = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminEvaluationOpsRepository.listRubricUsage({
      search: query.search?.trim() || null,
      subjectId: query.subject_id || null,
      status: query.status || null,
      unusedOnly: query.unused_only === true || query.unused_only === "true",
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const listGradeAudit = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminEvaluationOpsRepository.listGradeAudit({
      search: query.search?.trim() || null,
      userId: query.user_id || null,
      action: query.action || null,
      tableName: query.table_name || null,
      dateFrom: query.date_from || null,
      dateTo: query.date_to || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getExportOptions = () => ({
    formats: ["csv", "xlsx"],
    export_types: [
      "results",
      "sessions",
      "progress",
      "rubric_usage",
      "grade_audit",
      "criteria_scores",
    ],
  });

  const exportScores = async ({ export_type, format = "csv", filters = {} }) => {
    const exportQuery = { ...filters, page: 1, limit: 100 };
    let result;
    if (export_type === "results") result = await listEvaluationResults(exportQuery);
    else if (export_type === "sessions") result = await listEvaluationSessions(exportQuery);
    else if (export_type === "progress") result = await listGradingProgress(exportQuery);
    else if (export_type === "rubric_usage") result = await listRubricUsage(exportQuery);
    else if (export_type === "grade_audit") result = await listGradeAudit(exportQuery);
    else if (export_type === "criteria_scores") result = await listEvaluationSessions(exportQuery);
    else throw BadRequest("Loại export không được hỗ trợ.");
    return {
      export_type,
      format,
      generated_at: new Date().toISOString(),
      total: result.total,
      rows: result.data,
      note: "Backend trả dữ liệu theo filter hiện tại; frontend có thể xuất CSV/XLSX từ payload này.",
    };
  };

  const getAnalytics = () => adminEvaluationOpsRepository.getEvaluationAnalytics();

  const listImportLogs = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminEvaluationOpsRepository.listImportLogs({
      search: query.search?.trim() || null,
      status: query.status || null,
      targetTable: query.target_table || null,
      classId: query.class_id || null,
      userId: query.user_id || null,
      dateFrom: query.date_from || null,
      dateTo: query.date_to || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const listInvitations = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminEvaluationOpsRepository.listInvitations({
      search: query.search?.trim() || null,
      type: query.type || null,
      status: query.status || null,
      emailDeliveryStatus: query.email_delivery_status || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const resendInvitation = async (type, id, actor) => {
    if (!["class_invite", "group_invite"].includes(type)) throw BadRequest("Chỉ class/group invite hỗ trợ resend.");
    await adminEvaluationOpsRepository.resendInvitation(type, id);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_resend_invitation",
      tableName: type === "class_invite" ? "class_invites" : "group_invites",
      recordId: id,
      newValues: { type, email_delivery_status: "queued" },
    });
    return { type, id: Number(id), status: "queued" };
  };

  const revokeInvitation = async (type, id, actor) => {
    if (!["class_invite", "group_invite"].includes(type)) throw BadRequest("Chỉ class/group invite hỗ trợ revoke.");
    await adminEvaluationOpsRepository.revokeInvitation(type, id);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_revoke_invitation",
      tableName: type === "class_invite" ? "class_invites" : "group_invites",
      recordId: id,
      newValues: { type },
    });
    return { type, id: Number(id), status: "revoked" };
  };

  const retryEmailEvent = async (id, actor) => {
    await adminEvaluationOpsRepository.retryEmailEvent(id);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_retry_email_event",
      tableName: "outbox_events",
      recordId: id,
      newValues: { status: "pending" },
    });
    return { type: "email_event", id: Number(id), status: "pending" };
  };

  const listAuditLogs = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminEvaluationOpsRepository.listAuditLogs({
      search: query.search?.trim() || null,
      userId: query.user_id || null,
      action: query.action || null,
      tableName: query.table_name || null,
      dateFrom: query.date_from || null,
      dateTo: query.date_to || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const listApiAccessLogs = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminEvaluationOpsRepository.listApiAccessLogs({
      search: query.search?.trim() || null,
      method: query.method || null,
      statusCode: query.status_code || null,
      userId: query.user_id || null,
      dateFrom: query.date_from || null,
      dateTo: query.date_to || null,
      slow: query.slow === true || query.slow === "true",
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getLookups = () => adminEvaluationOpsRepository.getLookups();

  return {
    getEvaluationOverview,
    listRubrics,
    getRubric,
    listEvaluationSessions,
    getEvaluationSessionDetail,
    confirmEvaluationSession,
    reopenEvaluationSession,
    getGradingConfig,
    updateGradingConfig,
    listEvaluationResults,
    listGradingProgress,
    listRubricUsage,
    listGradeAudit,
    getExportOptions,
    exportScores,
    getAnalytics,
    listImportLogs,
    listInvitations,
    resendInvitation,
    revokeInvitation,
    retryEmailEvent,
    listAuditLogs,
    listApiAccessLogs,
    getLookups,
    plannedAction,
  };
};
