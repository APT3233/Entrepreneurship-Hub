import { BadRequest, Forbidden, NotFound } from "app/core/errors/errorFactory.js";
import { parsePagination } from "app/core/utils/pagination.js";
import { getFileProxyUrl } from "app/core/utils/file.js";

const clean = (value) => String(value ?? "").trim();
const nullable = (value) => {
  const text = clean(value);
  return text || null;
};

const DEFAULT_GRADING_CONFIG = {
  feedback_required: true,
  min_feedback_length: 15,
};

export const createEvaluationService = ({ evaluationRepository, transaction, auditService }) => {
  const userRoles = (user) => (user?.roles || []).map((role) => String(role).toLowerCase());
  const hasRole = (user, ...roles) => userRoles(user).some((role) => roles.includes(role));
  const isAdmin = (user) => hasRole(user, "admin");
  const isAdminOrDept = (user) => hasRole(user, "admin", "department_head");
  const isLecturer = (user) => hasRole(user, "lecturer");
  const pageArgs = (query) => parsePagination({ page: query.page, limit: query.limit });

  const assertCanGrade = (context, user) => {
    if (isAdminOrDept(user)) return;
    if (isLecturer(user) && Number(context.lecturer_id) === Number(user.id)) return;
    throw Forbidden("Bạn không có quyền chấm bài nộp này.");
  };

  const getEvaluatorRole = (user) => {
    if (isAdmin(user)) return "admin";
    if (hasRole(user, "department_head")) return "department_head";
    if (isLecturer(user)) return "lecturer";
    return "unknown";
  };

  const parseBoolean = (value) => value === true || value === "true" || value === "1" || value === 1;

  const getGradingConfig = async () => {
    const rows = await evaluationRepository.listEvaluationSettings();
    const config = { ...DEFAULT_GRADING_CONFIG };
    for (const row of rows) {
      if (row.setting_key === "feedback_required") config.feedback_required = parseBoolean(row.setting_value);
      if (row.setting_key === "min_feedback_length") {
        const minLength = Number(row.setting_value);
        if (Number.isInteger(minLength) && minLength >= 0) config.min_feedback_length = minLength;
      }
    }
    return config;
  };

  const lecturerScope = (actor) => (isLecturer(actor) && !isAdminOrDept(actor) ? actor.id : null);

  const assertRubricExists = async (id) => {
    const rubric = await evaluationRepository.findRubricById(id);
    if (!rubric) throw NotFound("Rubric");
    return rubric;
  };

  const assertCriterionBelongsToRubric = async (rubricId, criterionId) => {
    const criterion = await evaluationRepository.findCriterionById(criterionId);
    if (!criterion || Number(criterion.rubric_id) !== Number(rubricId)) throw NotFound("Rubric criterion");
    return criterion;
  };

  const assertRubricEditable = async (id) => {
    const rubric = await assertRubricExists(id);
    const usageCount = await evaluationRepository.countRubricEvaluations(id);
    if (usageCount > 0) {
      throw BadRequest("Rubric đã được dùng để chấm. Hãy clone rubric để tạo version mới thay vì sửa trực tiếp.");
    }
    return rubric;
  };

  const normalizeRubricPayload = (data, actor, current = null) => ({
    subject_id: data.subject_id !== undefined
      ? (data.subject_id ? Number(data.subject_id) : null)
      : current?.subject_id || null,
    name: clean(data.name ?? current?.name),
    description: data.description !== undefined ? nullable(data.description) : current?.description || null,
    total_score: Number(data.total_score ?? current?.total_score ?? 10),
    version: Number(data.version ?? current?.version ?? 1),
    parent_rubric_id: data.parent_rubric_id !== undefined
      ? (data.parent_rubric_id ? Number(data.parent_rubric_id) : null)
      : current?.parent_rubric_id || null,
    status: data.status ?? current?.status ?? "draft",
    created_by: current?.created_by ?? actor?.id ?? null,
  });

  const normalizeCriterionPayload = (rubricId, data, current = null) => ({
    rubric_id: Number(rubricId),
    name: clean(data.name ?? current?.name),
    description: data.description !== undefined ? nullable(data.description) : current?.description || null,
    max_score: Number(data.max_score ?? current?.max_score),
    weight: Number(data.weight ?? current?.weight ?? 1),
    order_index: Number(data.order_index ?? current?.order_index ?? 1),
    is_required_feedback: data.is_required_feedback !== undefined
      ? Boolean(data.is_required_feedback)
      : Boolean(current?.is_required_feedback),
  });

  const listRubrics = async (query) => {
    const pagination = pageArgs(query);
    const result = await evaluationRepository.listRubrics({
      search: query.search?.trim() || null,
      subjectId: query.subject_id || null,
      status: query.status || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getRubric = async (id) => {
    const rubric = await evaluationRepository.findRubricDetailById(id);
    if (!rubric) throw NotFound("Rubric");
    return rubric;
  };

  const createRubric = async (data, actor) => {
    const payload = normalizeRubricPayload(data, actor);
    if (!payload.name) throw BadRequest("Tên rubric là bắt buộc.");
    if (!Number.isFinite(payload.total_score) || payload.total_score <= 0) throw BadRequest("total_score phải lớn hơn 0.");
    const id = await evaluationRepository.createRubric(payload);
    await auditService.log({
      userId: actor?.id || null,
      action: "create_rubric",
      tableName: "rubrics",
      recordId: id,
      title: payload.name,
      newValues: payload,
    });
    return getRubric(id);
  };

  const updateRubric = async (id, data, actor) => {
    const current = await assertRubricEditable(id);
    const payload = normalizeRubricPayload(data, actor, current);
    delete payload.created_by;
    if (!payload.name) throw BadRequest("Tên rubric là bắt buộc.");
    if (!Number.isFinite(payload.total_score) || payload.total_score <= 0) throw BadRequest("total_score phải lớn hơn 0.");
    await evaluationRepository.updateRubric(id, payload);
    await auditService.log({
      userId: actor?.id || null,
      action: "update_rubric",
      tableName: "rubrics",
      recordId: id,
      title: payload.name,
      oldValues: current,
      newValues: payload,
    });
    return getRubric(id);
  };

  const deleteRubric = async (id, actor) => {
    const current = await assertRubricEditable(id);
    await evaluationRepository.softDeleteRubric(id);
    await auditService.log({
      userId: actor?.id || null,
      action: "delete_rubric",
      tableName: "rubrics",
      recordId: id,
      title: current.name,
      oldValues: current,
    });
    return { id: Number(id), deleted: true };
  };

  const getCloneName = (source, version, requestedName) => {
    const name = clean(requestedName);
    if (name) return name;
    const baseName = clean(source.name).replace(/\s+v\d+$/i, "");
    return `${baseName} v${version}`;
  };

  const cloneRubric = async (id, data = {}, actor) => {
    const source = await evaluationRepository.findRubricDetailById(id);
    if (!source) throw NotFound("Rubric");
    const rootId = Number(source.parent_rubric_id || source.id);
    const nextVersion = await evaluationRepository.findNextRubricVersion(rootId);
    const payload = normalizeRubricPayload({
      subject_id: source.subject_id,
      name: getCloneName(source, nextVersion, data.name),
      description: data.description !== undefined ? data.description : source.description,
      total_score: source.total_score,
      version: nextVersion,
      parent_rubric_id: rootId,
      status: data.status || "draft",
    }, actor);

    const cloneId = await transaction.run(async (conn) => {
      const newRubricId = await evaluationRepository.createRubric(payload, conn);
      for (const criterion of source.criteria || []) {
        await evaluationRepository.createCriterion({
          rubric_id: newRubricId,
          name: criterion.name,
          description: criterion.description,
          max_score: criterion.max_score,
          weight: criterion.weight,
          order_index: criterion.order_index,
          is_required_feedback: criterion.is_required_feedback,
        }, conn);
      }
      return newRubricId;
    });

    await auditService.log({
      userId: actor?.id || null,
      action: "clone_rubric",
      tableName: "rubrics",
      recordId: cloneId,
      title: payload.name,
      oldValues: { source_rubric_id: Number(id), version: Number(source.version) },
      newValues: payload,
    });
    return getRubric(cloneId);
  };

  const createCriterion = async (rubricId, data, actor) => {
    await assertRubricEditable(rubricId);
    const payload = normalizeCriterionPayload(rubricId, data);
    if (!payload.name) throw BadRequest("Tên tiêu chí là bắt buộc.");
    if (!Number.isFinite(payload.max_score) || payload.max_score <= 0) throw BadRequest("max_score phải lớn hơn 0.");
    if (!Number.isFinite(payload.weight) || payload.weight < 0) throw BadRequest("weight phải >= 0.");
    const id = await evaluationRepository.createCriterion(payload);
    await auditService.log({
      userId: actor?.id || null,
      action: "create_rubric_criterion",
      tableName: "rubric_criteria",
      recordId: id,
      title: payload.name,
      newValues: payload,
    });
    return getRubric(rubricId);
  };

  const updateCriterion = async (rubricId, criterionId, data, actor) => {
    const current = await assertCriterionBelongsToRubric(rubricId, criterionId);
    await assertRubricEditable(rubricId);
    const payload = normalizeCriterionPayload(rubricId, data, current);
    if (!payload.name) throw BadRequest("Tên tiêu chí là bắt buộc.");
    if (!Number.isFinite(payload.max_score) || payload.max_score <= 0) throw BadRequest("max_score phải lớn hơn 0.");
    if (!Number.isFinite(payload.weight) || payload.weight < 0) throw BadRequest("weight phải >= 0.");
    delete payload.rubric_id;
    await evaluationRepository.updateCriterion(criterionId, payload);
    await auditService.log({
      userId: actor?.id || null,
      action: "update_rubric_criterion",
      tableName: "rubric_criteria",
      recordId: criterionId,
      title: payload.name,
      oldValues: current,
      newValues: payload,
    });
    return getRubric(rubricId);
  };

  const deleteCriterion = async (rubricId, criterionId, actor) => {
    const current = await assertCriterionBelongsToRubric(rubricId, criterionId);
    await assertRubricEditable(rubricId);
    const usedCount = await evaluationRepository.countCriterionScores(criterionId);
    if (usedCount > 0) throw BadRequest("Tiêu chí đã được dùng để chấm, không thể xóa.");
    await evaluationRepository.deleteCriterion(criterionId);
    await auditService.log({
      userId: actor?.id || null,
      action: "delete_rubric_criterion",
      tableName: "rubric_criteria",
      recordId: criterionId,
      title: current.name,
      oldValues: current,
    });
    return getRubric(rubricId);
  };

  const bindRubric = async (rubricId, data, actor) => {
    const rubric = await assertRubricExists(rubricId);
    if (rubric.status !== "active") throw BadRequest("Chỉ rubric active mới được bind vào checkpoint/assignment.");
    const target = await evaluationRepository.findTarget(data.target_type, data.target_id);
    if (!target) throw NotFound(data.target_type === "checkpoint" ? "Checkpoint" : "Assignment");
    const existing = await evaluationRepository.findBindingByTarget(data.target_type, data.target_id);
    if (existing && Number(existing.rubric_id) !== Number(rubricId)) {
      throw BadRequest("Target này đã được bind với rubric khác. Hãy clone/version rubric và bind vào target mới.");
    }
    const payload = {
      rubric_id: Number(rubricId),
      target_type: data.target_type,
      target_id: Number(data.target_id),
      created_by: actor?.id || null,
    };
    if (!existing) await evaluationRepository.createBinding(payload);
    await auditService.log({
      userId: actor?.id || null,
      action: "bind_rubric",
      tableName: "rubric_bindings",
      recordId: Number(data.target_id),
      title: rubric.name,
      oldValues: existing || null,
      newValues: payload,
    });
    return getRubric(rubricId);
  };

  const getGradingForm = async (targetType, targetId, user) => {
    const context = await evaluationRepository.findSubmissionContext(targetType, targetId);
    if (!context) throw NotFound("Submission");
    assertCanGrade(context, user);
    if (!context.rubric_id) throw BadRequest("Submission này chưa được bind rubric.");
    const rubric = await evaluationRepository.findRubricDetailById(context.rubric_id);
    if (!rubric) throw NotFound("Rubric");
    const existing = await evaluationRepository.findOpenEvaluationSession({
      rubricId: context.rubric_id,
      targetType,
      targetId,
      evaluatorId: user.id,
    });
    const detail = existing ? await evaluationRepository.findEvaluationDetailById(existing.id) : null;
    const files = await evaluationRepository.listSubmissionFiles(targetType, targetId);
    return {
      target_type: targetType,
      target_id: Number(targetId),
      source_id: context.source_id,
      source_title: context.source_title,
      source_deadline: context.source_deadline,
      source_status: context.source_status,
      source_max_score: context.source_max_score != null ? Number(context.source_max_score) : null,
      class_id: context.class_id,
      class_code: context.class_code,
      subject_code: context.subject_code,
      subject_name: context.subject_name,
      semester_code: context.semester_code,
      semester_name: context.semester_name,
      year: context.year,
      group_id: context.group_id,
      group_code: context.group_code,
      group_name: context.group_name,
      topic: context.topic,
      topic_desc: context.topic_desc,
      submission_status: context.status,
      submitted_at: context.submitted_at,
      is_late: Boolean(context.is_late),
      current_score: context.score != null ? Number(context.score) : null,
      current_feedback: context.feedback || null,
      graded_by: context.graded_by || null,
      graded_at: context.graded_at || null,
      files: files.map((file) => ({
        id: file.id,
        file_name: file.file_name,
        file_type: file.file_type,
        mime_type: file.mime_type,
        file_size: file.file_size != null ? Number(file.file_size) : null,
        uploaded_at: file.uploaded_at,
        download_url: getFileProxyUrl(file.file_path, file.file_name),
      })),
      scoring: {
        method: "sum",
        total_score_formula: "sum(evaluation_scores.score)",
        weight_used: false,
      },
      rubric,
      evaluation: detail,
    };
  };

  const validateScores = ({ criteria, scores, requireComplete }) => {
    const byCriterion = new Map(criteria.map((criterion) => [Number(criterion.id), criterion]));
    const normalized = [];
    const seen = new Set();
    for (const item of scores || []) {
      const criterionId = Number(item.criterion_id);
      const criterion = byCriterion.get(criterionId);
      if (!criterion) throw BadRequest(`Tiêu chí ${criterionId} không thuộc rubric.`);
      if (seen.has(criterionId)) throw BadRequest(`Tiêu chí ${criterionId} bị lặp.`);
      seen.add(criterionId);
      const score = Number(item.score);
      if (!Number.isFinite(score) || score < 0) throw BadRequest(`Điểm tiêu chí ${criterion.name} không hợp lệ.`);
      if (score > Number(criterion.max_score)) {
        throw BadRequest(`Điểm tiêu chí ${criterion.name} không được vượt ${Number(criterion.max_score)}.`);
      }
      const feedback = nullable(item.feedback);
      if (requireComplete && Boolean(criterion.is_required_feedback) && !feedback) {
        throw BadRequest(`Feedback là bắt buộc cho tiêu chí ${criterion.name}.`);
      }
      normalized.push({ criterion_id: criterionId, score, feedback });
    }
    if (requireComplete) {
      for (const criterion of criteria) {
        if (!seen.has(Number(criterion.id))) throw BadRequest(`Chưa chấm tiêu chí ${criterion.name}.`);
      }
    }
    return normalized;
  };

  const summarizeEvaluation = (detail) => {
    if (!detail) return null;
    return {
      id: Number(detail.id),
      rubric_id: Number(detail.rubric_id),
      target_type: detail.target_type,
      target_id: Number(detail.target_id),
      group_id: Number(detail.group_id),
      status: detail.status,
      total_score: Number(detail.total_score),
      overall_feedback: detail.overall_feedback || null,
      evaluator_id: Number(detail.evaluator_id),
      evaluated_at: detail.evaluated_at || null,
      scores: (detail.scores || []).map((score) => ({
        criterion_id: Number(score.criterion_id),
        score: Number(score.score),
        feedback: score.feedback || null,
      })),
    };
  };

  const summarizeLegacySubmission = (context) => ({
    score: context.score === null || context.score === undefined ? null : Number(context.score),
    feedback: context.feedback || null,
    graded_by: context.graded_by || null,
    graded_at: context.graded_at || null,
    status: context.status || null,
  });

  const saveEvaluation = async ({ body, actor, finalStatus, auditMeta = {} }) => {
    const targetType = body.target_type;
    const targetId = Number(body.target_id);
    const context = await evaluationRepository.findSubmissionContext(targetType, targetId);
    if (!context) throw NotFound("Submission");
    assertCanGrade(context, actor);
    if (!context.rubric_id) throw BadRequest("Submission này chưa được bind rubric.");
    const rubric = await evaluationRepository.findRubricById(context.rubric_id);
    if (!rubric || rubric.status === "archived") throw BadRequest("Rubric không khả dụng.");
    const criteria = await evaluationRepository.listCriteriaByRubricId(context.rubric_id);
    if (!criteria.length) throw BadRequest("Rubric chưa có tiêu chí.");
    const normalizedScores = validateScores({
      criteria,
      scores: body.scores || [],
      requireComplete: finalStatus !== "draft",
    });
    const totalScore = normalizedScores.reduce((sum, item) => sum + Number(item.score), 0);
    if (totalScore > Number(rubric.total_score)) {
      throw BadRequest(`Tổng điểm ${totalScore} vượt total_score của rubric (${Number(rubric.total_score)}).`);
    }
    if (totalScore > Number(context.source_max_score)) {
      throw BadRequest(`Tổng điểm ${totalScore} vượt điểm tối đa của bài (${Number(context.source_max_score)}).`);
    }
    const overallFeedback = nullable(body.overall_feedback);
    if (finalStatus !== "draft") {
      const gradingConfig = await getGradingConfig();
      if (gradingConfig.feedback_required && !overallFeedback) {
        throw BadRequest("overall_feedback là bắt buộc khi submit evaluation.");
      }
      if (overallFeedback && overallFeedback.length < gradingConfig.min_feedback_length) {
        throw BadRequest(`overall_feedback phải có ít nhất ${gradingConfig.min_feedback_length} ký tự.`);
      }
    }

    let session = null;
    if (body.evaluation_session_id) {
      session = await evaluationRepository.findEvaluationSessionById(body.evaluation_session_id);
      if (!session) throw NotFound("Evaluation session");
      if (Number(session.target_id) !== targetId || session.target_type !== targetType) {
        throw BadRequest("Evaluation session không khớp submission.");
      }
      if (Number(session.evaluator_id) !== Number(actor.id)) {
        throw Forbidden("Bạn không được sửa phiên chấm của người khác.");
      }
      if (session.status === "confirmed") throw BadRequest("Evaluation đã confirmed, không thể sửa.");
      if (session.status !== "draft" && finalStatus === "draft") {
        throw BadRequest("Không thể chuyển evaluation đã submit về draft.");
      }
    } else {
      session = await evaluationRepository.findOpenEvaluationSession({
        rubricId: context.rubric_id,
        targetType,
        targetId,
        evaluatorId: actor.id,
      });
    }
    const previousEvaluation = session ? await evaluationRepository.findEvaluationDetailById(session.id) : null;
    const previousLegacySubmission = summarizeLegacySubmission(context);

    const sessionId = await transaction.run(async (conn) => {
      const payload = {
        rubric_id: Number(context.rubric_id),
        target_type: targetType,
        target_id: targetId,
        group_id: Number(context.group_id),
        evaluator_id: Number(actor.id),
        evaluator_role: getEvaluatorRole(actor),
        is_official: 1,
        total_score: totalScore,
        overall_feedback: overallFeedback,
        status: finalStatus,
        evaluated_at: finalStatus === "draft" ? null : new Date(),
      };

      const id = session
        ? Number(session.id)
        : await evaluationRepository.createEvaluationSession(payload, conn);
      if (session) {
        await evaluationRepository.updateEvaluationSession(id, {
          total_score: payload.total_score,
          overall_feedback: payload.overall_feedback,
          status: payload.status,
          evaluated_at: payload.evaluated_at,
          evaluator_role: payload.evaluator_role,
          is_official: payload.is_official,
        }, conn);
      }
      await evaluationRepository.replaceEvaluationScores(id, normalizedScores, conn);
      if (finalStatus !== "draft" && payload.is_official) {
        await evaluationRepository.updateLegacySubmissionGrade({
          targetType,
          targetId,
          totalScore,
          feedback: overallFeedback,
          evaluatorId: actor.id,
        }, conn);
      }
      return id;
    });

    const detail = await evaluationRepository.findEvaluationDetailById(sessionId);
    await auditService.log({
      userId: actor?.id || null,
      action: finalStatus === "draft" ? "save_evaluation_draft" : "submit_evaluation",
      tableName: "evaluation_sessions",
      recordId: sessionId,
      title: context.source_title,
      oldValues: {
        submission: { target_type: targetType, target_id: targetId, group_id: Number(context.group_id) },
        evaluation: summarizeEvaluation(previousEvaluation),
        legacy_submission: previousLegacySubmission,
      },
      newValues: {
        submission: { target_type: targetType, target_id: targetId, group_id: Number(context.group_id) },
        evaluation: summarizeEvaluation(detail),
        legacy_submission: finalStatus === "draft"
          ? previousLegacySubmission
          : {
              score: totalScore,
              feedback: overallFeedback,
              graded_by: actor.id,
              status: "graded",
            },
      },
      ipAddress: auditMeta.ipAddress || null,
      userAgent: auditMeta.userAgent || null,
    });
    return detail;
  };

  const getGradingDashboard = async (query, actor) => {
    if (!isAdminOrDept(actor) && !isLecturer(actor)) throw Forbidden("Bạn không có quyền xem dashboard chấm điểm.");
    const row = await evaluationRepository.getGradingDashboardStats({
      classId: query.class_id || null,
      lecturerId: lecturerScope(actor),
    });
    return {
      total_need_grading: Number(row.total_need_grading || 0),
      checkpoint_need_grading: Number(row.checkpoint_need_grading || 0),
      assignment_need_grading: Number(row.assignment_need_grading || 0),
      late_submissions: Number(row.late_submissions || 0),
      draft_evaluations: Number(row.draft_evaluations || 0),
      nearest_deadline: row.nearest_deadline || null,
    };
  };

  const listGradingSubmissions = async (query, actor) => {
    if (!isAdminOrDept(actor) && !isLecturer(actor)) throw Forbidden("Bạn không có quyền xem danh sách bài chấm.");
    const pagination = pageArgs(query);
    const result = await evaluationRepository.listGradingSubmissions({
      search: query.search?.trim() || null,
      sourceType: query.source_type || null,
      classId: query.class_id || null,
      checkpointId: query.checkpoint_id || null,
      assignmentId: query.assignment_id || null,
      status: query.status || null,
      isLate: query.is_late,
      evaluationStatus: query.evaluation_status || null,
      lecturerId: lecturerScope(actor),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const saveDraft = (body, actor, auditMeta) => saveEvaluation({ body, actor, finalStatus: "draft", auditMeta });
  const submitEvaluation = (body, actor, auditMeta) => saveEvaluation({ body, actor, finalStatus: "submitted", auditMeta });

  const getEvaluation = async (id, actor) => {
    const detail = await evaluationRepository.findEvaluationDetailById(id);
    if (!detail) throw NotFound("Evaluation");
    const context = await evaluationRepository.findSubmissionContext(detail.target_type, detail.target_id);
    if (!context) throw NotFound("Submission");
    if (!isAdminOrDept(actor) && !(isLecturer(actor) && Number(context.lecturer_id) === Number(actor.id))) {
      throw Forbidden("Bạn không có quyền xem evaluation này.");
    }
    return detail;
  };

  const listEvaluations = async (query, actor) => {
    if (!isAdminOrDept(actor) && !isLecturer(actor)) throw Forbidden("Bạn không có quyền xem danh sách evaluation.");
    const pagination = pageArgs(query);
    const result = await evaluationRepository.listEvaluations({
      classId: query.class_id || null,
      checkpointId: query.checkpoint_id || null,
      assignmentId: query.assignment_id || null,
      groupId: query.group_id || null,
      status: query.status || null,
      lecturerId: isLecturer(actor) && !isAdminOrDept(actor) ? actor.id : null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  return {
    listRubrics,
    getRubric,
    createRubric,
    updateRubric,
    deleteRubric,
    cloneRubric,
    createCriterion,
    updateCriterion,
    deleteCriterion,
    bindRubric,
    getGradingForm,
    getGradingDashboard,
    listGradingSubmissions,
    saveDraft,
    submitEvaluation,
    getEvaluation,
    listEvaluations,
  };
};
