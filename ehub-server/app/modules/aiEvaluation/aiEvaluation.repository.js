const pageSql = (limit, offset) => `LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

const countRows = async (db, sql, params = {}) => {
  const [rows] = await db.execute(sql, params);
  return Number(rows[0]?.total || 0);
};

const jsonOrNull = (value) => (value === undefined ? null : JSON.stringify(value));

const addOptionalFilters = (where, params, filters = {}) => {
  if (filters.classId) {
    where.push("q.class_id = :classId");
    params.classId = Number(filters.classId);
  }
  if (filters.lecturerId) {
    where.push("q.lecturer_id = :lecturerId");
    params.lecturerId = Number(filters.lecturerId);
  }
  if (filters.status) {
    where.push("q.status = :status");
    params.status = filters.status;
  }
  if (filters.model) {
    where.push("q.model_name = :model");
    params.model = filters.model;
  }
  if (filters.providerKey) {
    if (filters.providerKey === "third-party-api") {
      where.push("q.provider_key IN ('third-party-api', 'cmd-api')");
    } else {
      where.push("q.provider_key = :providerKey");
      params.providerKey = filters.providerKey;
    }
  }
  if (filters.dateFrom) {
    where.push("q.created_at >= :dateFrom");
    params.dateFrom = filters.dateFrom;
  }
  if (filters.dateTo) {
    where.push("q.created_at <= :dateTo");
    params.dateTo = filters.dateTo;
  }
};

export const createAiEvaluationRepository = ({ db }) => {
  const suggestionListSql = `
    SELECT
      CONCAT('job-', j.id) AS id,
      aes.id AS suggestion_id,
      aes.job_id,
      j.id AS analysis_job_id,
      j.target_type,
      j.target_id,
      aes.rubric_id,
      aes.summary,
      aes.suggested_total_score,
      aes.confidence_score,
      aes.project_potential_level,
      aes.project_potential_confidence_score,
      aes.model_name,
      aes.created_at,
      j.status,
      j.error_message,
      COALESCE(aes.provider_key, j.provider_key) AS provider_key,
      j.model_name AS job_model_name,
      j.requested_by,
      requester.full_name AS requested_by_name,
      j.completed_at,
      COALESCE(cp.title, a.title) AS target_title,
      COALESCE(cpc.id, ac.id) AS class_id,
      COALESCE(cpc.class_code, ac.class_code) AS class_code,
      COALESCE(cpc.lecturer_id, ac.lecturer_id) AS lecturer_id,
      lecturer.full_name AS lecturer_name,
      g.id AS group_id,
      g.group_code,
      g.group_name,
      g.topic,
      r.name AS rubric_name
    FROM ai_analysis_jobs j
    LEFT JOIN ai_evaluation_suggestions aes ON aes.job_id = j.id
    JOIN users requester ON requester.id = j.requested_by
    LEFT JOIN rubrics r ON r.id = aes.rubric_id
    LEFT JOIN checkpoint_submissions cs ON j.target_type = 'checkpoint_submission' AND cs.id = j.target_id
    LEFT JOIN checkpoints cp ON cp.id = cs.checkpoint_id
    LEFT JOIN classes cpc ON cpc.id = cp.class_id
    LEFT JOIN assignment_submissions ans ON j.target_type = 'assignment_submission' AND ans.id = j.target_id
    LEFT JOIN assignments a ON a.id = ans.assignment_id
    LEFT JOIN classes ac ON ac.id = a.class_id
    LEFT JOIN \`groups\` g ON g.id = COALESCE(cs.group_id, ans.group_id)
    LEFT JOIN users lecturer ON lecturer.id = COALESCE(cpc.lecturer_id, ac.lecturer_id)
  `;

  const findSubmissionContext = async (targetType, targetId) => {
    if (targetType === "checkpoint_submission") {
      const [rows] = await db.execute(
        `
          SELECT cs.*, cp.id AS source_id, cp.title AS source_title, cp.description AS source_description,
                 cp.max_score AS source_max_score, cp.deadline AS source_deadline, cp.status AS source_status,
                 cp.attachment_url AS source_attachment_url,
                 cp.class_id, c.class_code, c.lecturer_id,
                 sub.subject_code, sub.subject_name, sem.semester_code, sem.semester_name, sem.year,
                 g.id AS group_id, g.group_code, g.group_name, g.description AS group_description,
                 g.category, g.topic, g.topic_desc, rb.rubric_id
          FROM checkpoint_submissions cs
          JOIN checkpoints cp ON cp.id = cs.checkpoint_id AND cp.deleted_at IS NULL
          JOIN classes c ON c.id = cp.class_id AND c.deleted_at IS NULL
          JOIN subjects sub ON sub.id = c.subject_id
          JOIN semesters sem ON sem.id = c.semester_id
          JOIN \`groups\` g ON g.id = cs.group_id AND g.deleted_at IS NULL
          LEFT JOIN rubric_bindings rb ON rb.target_type = 'checkpoint' AND rb.target_id = cp.id
          WHERE cs.id = :targetId
          LIMIT 1
        `,
        { targetId: Number(targetId) },
      );
      return rows[0] || null;
    }
    const [rows] = await db.execute(
      `
        SELECT s.*, a.id AS source_id, a.title AS source_title, a.description AS source_description,
               a.max_score AS source_max_score, a.deadline AS source_deadline, a.status AS source_status,
               a.attachment_url AS source_attachment_url,
               a.class_id, c.class_code, c.lecturer_id,
               sub.subject_code, sub.subject_name, sem.semester_code, sem.semester_name, sem.year,
               g.id AS group_id, g.group_code, g.group_name, g.description AS group_description,
               g.category, g.topic, g.topic_desc, rb.rubric_id
        FROM assignment_submissions s
        JOIN assignments a ON a.id = s.assignment_id AND a.deleted_at IS NULL
        JOIN classes c ON c.id = a.class_id AND c.deleted_at IS NULL
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        JOIN \`groups\` g ON g.id = s.group_id AND g.deleted_at IS NULL
        LEFT JOIN rubric_bindings rb ON rb.target_type = 'assignment' AND rb.target_id = a.id
        WHERE s.id = :targetId
        LIMIT 1
      `,
      { targetId: Number(targetId) },
    );
    return rows[0] || null;
  };

  const listSubmissionFiles = async (targetType, targetId) => {
    if (targetType === "checkpoint_submission") {
      const [rows] = await db.execute(
        `
          SELECT id, file_name, file_path, file_type, mime_type, file_size, uploaded_at
          FROM checkpoint_submission_files
          WHERE submission_id = :targetId
            AND is_deleted = 0
            AND (upload_status IS NULL OR upload_status = 'uploaded')
          ORDER BY uploaded_at ASC, id ASC
        `,
        { targetId: Number(targetId) },
      );
      return rows;
    }
    const [rows] = await db.execute(
      `
        SELECT id, file_name, file_path, file_type, mime_type, file_size, uploaded_at
        FROM assignment_submission_files
        WHERE submission_id = :targetId AND is_deleted = 0
        ORDER BY uploaded_at ASC, id ASC
      `,
      { targetId: Number(targetId) },
    );
    return rows;
  };

  const findRubricDetailById = async (id) => {
    const [rubrics] = await db.execute("SELECT * FROM rubrics WHERE id = :id AND deleted_at IS NULL LIMIT 1", { id: Number(id) });
    const rubric = rubrics[0] || null;
    if (!rubric) return null;
    const [criteria] = await db.execute(
      "SELECT * FROM rubric_criteria WHERE rubric_id = :id ORDER BY order_index ASC, id ASC",
      { id: Number(id) },
    );
    return { ...rubric, criteria };
  };

  const findLatestCompletedSuggestionByTarget = async (targetType, targetId) => {
    const [rows] = await db.execute(
      `
        SELECT *
        FROM ai_evaluation_suggestions
        WHERE target_type = :targetType AND target_id = :targetId
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
      { targetType, targetId: Number(targetId) },
    );
    return rows[0] || null;
  };

  const findActiveJobByTarget = async (targetType, targetId) => {
    const [rows] = await db.execute(
      `
        SELECT *
        FROM ai_analysis_jobs
        WHERE target_type = :targetType
          AND target_id = :targetId
          AND status IN ('pending','processing')
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
      { targetType, targetId: Number(targetId) },
    );
    return rows[0] || null;
  };

  const createJob = async ({ target_type, target_id, requested_by, provider_key = null, model_name = null }) => {
    const [result] = await db.execute(
      `
        INSERT INTO ai_analysis_jobs (target_type, target_id, requested_by, provider_key, model_name, status)
        VALUES (:target_type, :target_id, :requested_by, :provider_key, :model_name, 'pending')
      `,
      { target_type, target_id: Number(target_id), requested_by: Number(requested_by), provider_key, model_name },
    );
    return result.insertId;
  };

  const findJobById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM ai_analysis_jobs WHERE id = :id LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const resetStaleJobs = async (staleMinutes, maxAttempts) => {
    await db.execute(
      `
        UPDATE ai_analysis_jobs
        SET status = CASE WHEN attempts >= :maxAttempts THEN 'failed' ELSE 'pending' END,
            error_message = CASE WHEN attempts >= :maxAttempts THEN 'stale_processing' ELSE error_message END,
            next_retry_at = CASE WHEN attempts >= :maxAttempts THEN next_retry_at ELSE NOW() END,
            updated_at = CURRENT_TIMESTAMP
        WHERE status = 'processing'
          AND updated_at < DATE_SUB(NOW(), INTERVAL :staleMinutes MINUTE)
      `,
      { staleMinutes: Number(staleMinutes), maxAttempts: Number(maxAttempts) },
    );
  };

  const markJobProcessing = async (id, attempt, maxAttempts) => {
    const [result] = await db.execute(
      `
        UPDATE ai_analysis_jobs
        SET status = 'processing',
            attempts = GREATEST(attempts, :attempt),
            started_at = COALESCE(started_at, NOW()),
            next_retry_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
          AND status IN ('pending','processing')
          AND attempts < :maxAttempts
      `,
      { id: Number(id), attempt: Number(attempt), maxAttempts: Number(maxAttempts) },
    );
    if (!result.affectedRows) return null;
    return findJobById(id);
  };

  const listPendingJobsForQueue = async (limit, maxAttempts) => {
    const [rows] = await db.execute(
      `
        SELECT id
        FROM ai_analysis_jobs
        WHERE status = 'pending'
          AND attempts < :maxAttempts
          AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        ORDER BY id ASC
        LIMIT ${Number(limit)}
      `,
      { maxAttempts: Number(maxAttempts) },
    );
    return rows;
  };

  const markJobFailed = async (id, message, retry = false) => {
    await db.execute(
      `
        UPDATE ai_analysis_jobs
        SET status = :status,
            error_message = :message,
            next_retry_at = :nextRetryAt,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
      `,
      {
        id: Number(id),
        status: retry ? "pending" : "failed",
        message: String(message || "ai_job_failed").slice(0, 1000),
        nextRetryAt: retry ? new Date(Date.now() + 2 * 60 * 1000) : null,
      },
    );
  };

  const createSuggestion = async (payload, conn = db) => {
    const [result] = await conn.execute(
      `
        INSERT INTO ai_evaluation_suggestions
          (job_id, target_type, target_id, rubric_id, summary, strengths, weaknesses, missing_requirements,
           suggested_overall_feedback, suggested_total_score, confidence_score, project_potential_level,
           project_potential_reasons, project_potential_next_steps, project_potential_confidence_score,
           model_name, provider_key, raw_response)
        VALUES
          (:job_id, :target_type, :target_id, :rubric_id, :summary, :strengths, :weaknesses, :missing_requirements,
           :suggested_overall_feedback, :suggested_total_score, :confidence_score, :project_potential_level,
           :project_potential_reasons, :project_potential_next_steps, :project_potential_confidence_score,
           :model_name, :provider_key, :raw_response)
      `,
      {
        ...payload,
        strengths: jsonOrNull(payload.strengths || []),
        weaknesses: jsonOrNull(payload.weaknesses || []),
        missing_requirements: jsonOrNull(payload.missing_requirements || []),
        project_potential_reasons: jsonOrNull(payload.project_potential_reasons || []),
        project_potential_next_steps: jsonOrNull(payload.project_potential_next_steps || []),
      },
    );
    return result.insertId;
  };

  const createCriterionSuggestion = async (payload, conn = db) => {
    await conn.execute(
      `
        INSERT INTO ai_criterion_suggestions
          (ai_suggestion_id, criterion_id, suggested_score, suggested_feedback, evidence_text, confidence_score)
        VALUES
          (:ai_suggestion_id, :criterion_id, :suggested_score, :suggested_feedback, :evidence_text, :confidence_score)
      `,
      payload,
    );
  };

  const markJobCompleted = async (id, conn = db) => {
    await conn.execute(
      "UPDATE ai_analysis_jobs SET status = 'completed', completed_at = NOW(), updated_at = CURRENT_TIMESTAMP WHERE id = :id",
      { id: Number(id) },
    );
  };

  const findSuggestionById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM ai_evaluation_suggestions WHERE id = :id LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const listCriterionSuggestions = async (suggestionId) => {
    const [rows] = await db.execute(
      `
        SELECT acs.*, rc.name AS criterion_name, rc.max_score
        FROM ai_criterion_suggestions acs
        JOIN rubric_criteria rc ON rc.id = acs.criterion_id
        WHERE acs.ai_suggestion_id = :suggestionId
        ORDER BY rc.order_index ASC, rc.id ASC
      `,
      { suggestionId: Number(suggestionId) },
    );
    return rows;
  };

  const createAction = async ({ ai_suggestion_id, user_id, action, field_name }) => {
    const [result] = await db.execute(
      `
        INSERT INTO ai_suggestion_actions (ai_suggestion_id, user_id, action, field_name)
        VALUES (:ai_suggestion_id, :user_id, :action, :field_name)
      `,
      { ai_suggestion_id: Number(ai_suggestion_id), user_id: Number(user_id), action, field_name: field_name || null },
    );
    return result.insertId;
  };

  const listAdminSuggestions = async ({ classId, lecturerId, status, model, providerKey, dateFrom, dateTo, limit, offset }) => {
    const params = {};
    const where = ["1 = 1"];
    addOptionalFilters(where, params, { classId, lecturerId, status, model, providerKey, dateFrom, dateTo });
    const whereSql = where.join(" AND ");
    const fromSql = `FROM (${suggestionListSql}) q`;
    const [rows] = await db.execute(
      `
        SELECT q.*
        ${fromSql}
        WHERE ${whereSql}
        ORDER BY q.created_at DESC, q.id DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(db, `SELECT COUNT(*) AS total ${fromSql} WHERE ${whereSql}`, params);
    return { rows, total };
  };

  const listAiSettings = async () => {
    const [rows] = await db.execute(
      "SELECT * FROM system_settings WHERE module = 'ai' ORDER BY setting_key ASC",
    );
    return rows;
  };

  const upsertAiSetting = async ({ setting_key, setting_value, data_type, description, updated_by }) => {
    await db.execute(
      `
        INSERT INTO system_settings (setting_key, setting_value, data_type, module, description, updated_by)
        VALUES (:setting_key, :setting_value, :data_type, 'ai', :description, :updated_by)
        ON DUPLICATE KEY UPDATE
          setting_value = VALUES(setting_value),
          data_type = VALUES(data_type),
          description = VALUES(description),
          updated_by = VALUES(updated_by),
          updated_at = CURRENT_TIMESTAMP
      `,
      { setting_key, setting_value, data_type, description, updated_by: updated_by || null },
    );
  };

  return {
    findSubmissionContext,
    listSubmissionFiles,
    findRubricDetailById,
    findLatestCompletedSuggestionByTarget,
    findActiveJobByTarget,
    createJob,
    findJobById,
    resetStaleJobs,
    markJobProcessing,
    listPendingJobsForQueue,
    markJobFailed,
    createSuggestion,
    createCriterionSuggestion,
    markJobCompleted,
    findSuggestionById,
    listCriterionSuggestions,
    createAction,
    listAdminSuggestions,
    listAiSettings,
    upsertAiSetting,
  };
};
