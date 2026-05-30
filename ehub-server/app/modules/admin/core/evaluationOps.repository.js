const pageSql = (limit, offset) => `LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

const countRows = async (db, sql, params = {}) => {
  const [rows] = await db.execute(sql, params);
  return Number(rows[0]?.total || 0);
};

const addSearch = (where, params, fields, search) => {
  if (!search) return;
  where.push(`(${fields.map((field) => `${field} LIKE :search`).join(" OR ")})`);
  params.search = `%${search}%`;
};

const addDateRange = (where, params, column, dateFrom, dateTo) => {
  if (dateFrom) {
    where.push(`${column} >= :dateFrom`);
    params.dateFrom = dateFrom;
  }
  if (dateTo) {
    where.push(`${column} <= :dateTo`);
    params.dateTo = dateTo;
  }
};

const evaluationResultsSql = `
  SELECT
    CONCAT('checkpoint-', cs.id) AS id,
    'checkpoint' AS source_type,
    cs.id AS submission_id,
    cp.id AS item_id,
    cp.title AS item_title,
    g.id AS group_id,
    g.group_code,
    g.group_name,
    g.topic,
    c.id AS class_id,
    c.class_code,
    sub.id AS subject_id,
    sub.subject_code,
    sub.subject_name,
    sem.id AS semester_id,
    sem.semester_code,
    cs.score,
    cp.max_score,
    CASE WHEN cp.max_score > 0 AND cs.score IS NOT NULL THEN ROUND((cs.score / cp.max_score) * 100, 2) ELSE NULL END AS percentage,
    cs.feedback,
    cs.graded_by,
    grader.full_name AS graded_by_name,
    cs.graded_at,
    cs.submitted_at,
    cs.is_late,
    cs.status
  FROM checkpoint_submissions cs
  JOIN checkpoints cp ON cp.id = cs.checkpoint_id AND cp.deleted_at IS NULL
  JOIN \`groups\` g ON g.id = cs.group_id AND g.deleted_at IS NULL
  JOIN classes c ON c.id = cp.class_id AND c.deleted_at IS NULL
  JOIN subjects sub ON sub.id = c.subject_id
  JOIN semesters sem ON sem.id = c.semester_id
  LEFT JOIN users grader ON grader.id = cs.graded_by
  UNION ALL
  SELECT
    CONCAT('assignment-', s.id) AS id,
    'assignment' AS source_type,
    s.id AS submission_id,
    a.id AS item_id,
    a.title AS item_title,
    g.id AS group_id,
    g.group_code,
    g.group_name,
    g.topic,
    c.id AS class_id,
    c.class_code,
    sub.id AS subject_id,
    sub.subject_code,
    sub.subject_name,
    sem.id AS semester_id,
    sem.semester_code,
    s.score,
    a.max_score,
    CASE WHEN a.max_score > 0 AND s.score IS NOT NULL THEN ROUND((s.score / a.max_score) * 100, 2) ELSE NULL END AS percentage,
    s.feedback,
    s.graded_by,
    grader.full_name AS graded_by_name,
    s.graded_at,
    s.submitted_at,
    s.is_late,
    s.status
  FROM assignment_submissions s
  JOIN assignments a ON a.id = s.assignment_id AND a.deleted_at IS NULL
  JOIN \`groups\` g ON g.id = s.group_id AND g.deleted_at IS NULL
  JOIN classes c ON c.id = a.class_id AND c.deleted_at IS NULL
  JOIN subjects sub ON sub.id = c.subject_id
  JOIN semesters sem ON sem.id = c.semester_id
  LEFT JOIN users grader ON grader.id = s.graded_by
`;

const evaluationSessionSql = `
  SELECT
    es.id AS session_id,
    es.id,
    es.target_type,
    'checkpoint' AS source_type,
    cs.id AS submission_id,
    cp.id AS target_id,
    cp.title AS target_title,
    cp.deadline AS target_deadline,
    cp.max_score,
    cs.status AS submission_status,
    cs.submitted_at,
    cs.is_late,
    cs.note AS submission_note,
    c.id AS class_id,
    c.class_code,
    c.lecturer_id,
    lecturer.full_name AS lecturer_name,
    sub.id AS subject_id,
    sub.subject_code,
    sub.subject_name,
    sem.id AS semester_id,
    sem.semester_code,
    sem.year,
    g.id AS group_id,
    g.group_code,
    g.group_name,
    g.topic,
    g.topic_desc,
    r.id AS rubric_id,
    r.name AS rubric_name,
    r.version AS rubric_version,
    r.total_score AS rubric_total_score,
    u.id AS evaluator_id,
    u.full_name AS evaluator_name,
    u.email AS evaluator_email,
    es.total_score,
    es.overall_feedback,
    es.status,
    es.evaluated_at,
    es.created_at,
    es.updated_at
  FROM evaluation_sessions es
  JOIN checkpoint_submissions cs ON es.target_type = 'checkpoint_submission' AND cs.id = es.target_id
  JOIN checkpoints cp ON cp.id = cs.checkpoint_id AND cp.deleted_at IS NULL
  JOIN classes c ON c.id = cp.class_id AND c.deleted_at IS NULL
  JOIN subjects sub ON sub.id = c.subject_id
  JOIN semesters sem ON sem.id = c.semester_id
  JOIN \`groups\` g ON g.id = cs.group_id AND g.deleted_at IS NULL
  JOIN rubrics r ON r.id = es.rubric_id
  JOIN users u ON u.id = es.evaluator_id
  LEFT JOIN users lecturer ON lecturer.id = c.lecturer_id
  UNION ALL
  SELECT
    es.id AS session_id,
    es.id,
    es.target_type,
    'assignment' AS source_type,
    s.id AS submission_id,
    a.id AS target_id,
    a.title AS target_title,
    a.deadline AS target_deadline,
    a.max_score,
    s.status AS submission_status,
    s.submitted_at,
    s.is_late,
    s.note AS submission_note,
    c.id AS class_id,
    c.class_code,
    c.lecturer_id,
    lecturer.full_name AS lecturer_name,
    sub.id AS subject_id,
    sub.subject_code,
    sub.subject_name,
    sem.id AS semester_id,
    sem.semester_code,
    sem.year,
    g.id AS group_id,
    g.group_code,
    g.group_name,
    g.topic,
    g.topic_desc,
    r.id AS rubric_id,
    r.name AS rubric_name,
    r.version AS rubric_version,
    r.total_score AS rubric_total_score,
    u.id AS evaluator_id,
    u.full_name AS evaluator_name,
    u.email AS evaluator_email,
    es.total_score,
    es.overall_feedback,
    es.status,
    es.evaluated_at,
    es.created_at,
    es.updated_at
  FROM evaluation_sessions es
  JOIN assignment_submissions s ON es.target_type = 'assignment_submission' AND s.id = es.target_id
  JOIN assignments a ON a.id = s.assignment_id AND a.deleted_at IS NULL
  JOIN classes c ON c.id = a.class_id AND c.deleted_at IS NULL
  JOIN subjects sub ON sub.id = c.subject_id
  JOIN semesters sem ON sem.id = c.semester_id
  JOIN \`groups\` g ON g.id = s.group_id AND g.deleted_at IS NULL
  JOIN rubrics r ON r.id = es.rubric_id
  JOIN users u ON u.id = es.evaluator_id
  LEFT JOIN users lecturer ON lecturer.id = c.lecturer_id
`;

const gradingProgressSql = `
  SELECT
    CONCAT('checkpoint-', cp.id, '-', g.id) AS id,
    'checkpoint' AS target_type,
    cp.id AS target_id,
    cp.title AS target_title,
    cp.status AS target_status,
    cp.deadline,
    cp.max_score,
    c.id AS class_id,
    c.class_code,
    c.lecturer_id,
    lecturer.full_name AS lecturer_name,
    sub.id AS subject_id,
    sub.subject_code,
    sem.id AS semester_id,
    sem.semester_code,
    g.id AS group_id,
    cs.id AS submission_id,
    COALESCE(cs.status, 'not_submitted') AS submission_status,
    COALESCE(cs.is_late, 0) AS is_late,
    ev.status AS evaluation_status
  FROM checkpoints cp
  JOIN classes c ON c.id = cp.class_id AND c.deleted_at IS NULL
  JOIN subjects sub ON sub.id = c.subject_id
  JOIN semesters sem ON sem.id = c.semester_id
  JOIN \`groups\` g ON g.class_id = c.id AND g.deleted_at IS NULL
  LEFT JOIN users lecturer ON lecturer.id = c.lecturer_id
  LEFT JOIN checkpoint_submissions cs ON cs.checkpoint_id = cp.id AND cs.group_id = g.id
  LEFT JOIN evaluation_sessions ev ON ev.target_type = 'checkpoint_submission' AND ev.target_id = cs.id AND ev.is_official = 1
  WHERE cp.deleted_at IS NULL
  UNION ALL
  SELECT
    CONCAT('assignment-', a.id, '-', g.id) AS id,
    'assignment' AS target_type,
    a.id AS target_id,
    a.title AS target_title,
    a.status AS target_status,
    a.deadline,
    a.max_score,
    c.id AS class_id,
    c.class_code,
    c.lecturer_id,
    lecturer.full_name AS lecturer_name,
    sub.id AS subject_id,
    sub.subject_code,
    sem.id AS semester_id,
    sem.semester_code,
    g.id AS group_id,
    s.id AS submission_id,
    COALESCE(s.status, 'not_submitted') AS submission_status,
    COALESCE(s.is_late, 0) AS is_late,
    ev.status AS evaluation_status
  FROM assignments a
  JOIN classes c ON c.id = a.class_id AND c.deleted_at IS NULL
  JOIN subjects sub ON sub.id = c.subject_id
  JOIN semesters sem ON sem.id = c.semester_id
  JOIN \`groups\` g ON g.class_id = c.id AND g.deleted_at IS NULL
  LEFT JOIN users lecturer ON lecturer.id = c.lecturer_id
  LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.group_id = g.id
  LEFT JOIN evaluation_sessions ev ON ev.target_type = 'assignment_submission' AND ev.target_id = s.id AND ev.is_official = 1
  WHERE a.deleted_at IS NULL
`;

const addEvaluationManagementFilters = (where, params, filters = {}, alias = "", typeColumn = "source_type") => {
  const prefix = alias ? `${alias}.` : "";
  if (filters.semesterId) {
    where.push(`${prefix}semester_id = :semesterId`);
    params.semesterId = Number(filters.semesterId);
  }
  if (filters.subjectId) {
    where.push(`${prefix}subject_id = :subjectId`);
    params.subjectId = Number(filters.subjectId);
  }
  if (filters.classId) {
    where.push(`${prefix}class_id = :classId`);
    params.classId = Number(filters.classId);
  }
  if (filters.lecturerId) {
    where.push(`${prefix}lecturer_id = :lecturerId`);
    params.lecturerId = Number(filters.lecturerId);
  }
  if (filters.targetType) {
    where.push(`${prefix}${typeColumn} = :targetType`);
    params.targetType = filters.targetType;
  }
};

const gradedScoreSql = `
  SELECT g.id AS group_id, g.group_code, g.group_name, g.topic, c.id AS class_id, c.class_code,
         (cs.score / NULLIF(cp.max_score, 0)) * 100 AS percent_score,
         cp.order_index, cp.deadline, cp.title AS item_title, 'checkpoint' AS source_type
  FROM checkpoint_submissions cs
  JOIN checkpoints cp ON cp.id = cs.checkpoint_id AND cp.deleted_at IS NULL
  JOIN \`groups\` g ON g.id = cs.group_id AND g.deleted_at IS NULL
  JOIN classes c ON c.id = cp.class_id AND c.deleted_at IS NULL
  WHERE cs.score IS NOT NULL AND cp.max_score > 0
  UNION ALL
  SELECT g.id AS group_id, g.group_code, g.group_name, g.topic, c.id AS class_id, c.class_code,
         (s.score / NULLIF(a.max_score, 0)) * 100 AS percent_score,
         NULL AS order_index, a.deadline, a.title AS item_title, 'assignment' AS source_type
  FROM assignment_submissions s
  JOIN assignments a ON a.id = s.assignment_id AND a.deleted_at IS NULL
  JOIN \`groups\` g ON g.id = s.group_id AND g.deleted_at IS NULL
  JOIN classes c ON c.id = a.class_id AND c.deleted_at IS NULL
  WHERE s.score IS NOT NULL AND a.max_score > 0
`;

export const createAdminEvaluationOpsRepository = ({ db }) => {
  const getRubricImplementationState = async () => {
    const [rows] = await db.execute(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name IN ('rubrics', 'rubric_criteria', 'evaluation_scores')
      `,
    );
    const tableCount = Number(rows[0]?.total || 0);
    return {
      implemented: tableCount >= 3,
      table_count: tableCount,
      missing_tables: tableCount >= 3 ? [] : ["rubrics", "rubric_criteria", "evaluation_scores"],
    };
  };

  const listRubrics = async ({ search, subjectId, status, limit, offset }) => {
    const params = {};
    const where = ["r.deleted_at IS NULL"];
    addSearch(where, params, ["r.name", "r.description", "s.subject_code", "s.subject_name"], search);
    if (subjectId) {
      where.push("r.subject_id = :subjectId");
      params.subjectId = Number(subjectId);
    }
    if (status) {
      where.push("r.status = :status");
      params.status = status;
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT r.*, r.name AS rubric_name, MIN(rb.target_type) AS type,
               s.subject_code, s.subject_name, u.full_name AS created_by_name,
               COUNT(DISTINCT rc.id) AS total_criteria,
               COUNT(DISTINCT rb.id) AS total_bindings,
               COUNT(DISTINCT es.id) AS total_evaluations
        FROM rubrics r
        LEFT JOIN subjects s ON s.id = r.subject_id
        LEFT JOIN users u ON u.id = r.created_by
        LEFT JOIN rubric_criteria rc ON rc.rubric_id = r.id
        LEFT JOIN rubric_bindings rb ON rb.rubric_id = r.id
        LEFT JOIN evaluation_sessions es ON es.rubric_id = r.id
        WHERE ${whereSql}
        GROUP BY r.id
        ORDER BY r.updated_at DESC, r.created_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(
      db,
      `
        SELECT COUNT(*) AS total
        FROM rubrics r
        LEFT JOIN subjects s ON s.id = r.subject_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total };
  };

  const findRubricDetail = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT r.*, r.name AS rubric_name, MIN(rb.target_type) AS type,
               s.subject_code, s.subject_name, u.full_name AS created_by_name,
               COUNT(DISTINCT es.id) AS total_evaluations
        FROM rubrics r
        LEFT JOIN subjects s ON s.id = r.subject_id
        LEFT JOIN users u ON u.id = r.created_by
        LEFT JOIN evaluation_sessions es ON es.rubric_id = r.id
        LEFT JOIN rubric_bindings rb ON rb.rubric_id = r.id
        WHERE r.id = :id AND r.deleted_at IS NULL
        GROUP BY r.id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    const rubric = rows[0] || null;
    if (!rubric) return null;
    const [criteria] = await db.execute(
      "SELECT * FROM rubric_criteria WHERE rubric_id = :id ORDER BY order_index ASC, id ASC",
      { id: Number(id) },
    );
    const [bindings] = await db.execute(
      `
        SELECT rb.*,
               CASE WHEN rb.target_type = 'checkpoint' THEN cp.title ELSE a.title END AS target_title,
               CASE WHEN rb.target_type = 'checkpoint' THEN ccp.class_code ELSE ca.class_code END AS class_code,
               CASE WHEN rb.target_type = 'checkpoint' THEN cp.deadline ELSE a.deadline END AS deadline
        FROM rubric_bindings rb
        LEFT JOIN checkpoints cp ON rb.target_type = 'checkpoint' AND cp.id = rb.target_id
        LEFT JOIN classes ccp ON ccp.id = cp.class_id
        LEFT JOIN assignments a ON rb.target_type = 'assignment' AND a.id = rb.target_id
        LEFT JOIN classes ca ON ca.id = a.class_id
        WHERE rb.rubric_id = :id
        ORDER BY rb.created_at DESC
      `,
      { id: Number(id) },
    );
    return { ...rubric, criteria, bindings };
  };

  const getEvaluationOverview = async ({ semesterId, subjectId, classId, lecturerId, targetType }) => {
    const params = {};
    const where = ["1 = 1"];
    addEvaluationManagementFilters(where, params, { semesterId, subjectId, classId, lecturerId, targetType }, "q", "target_type");
    const whereSql = where.join(" AND ");
    const [cardsRows] = await db.execute(
      `
        SELECT
          SUM(CASE WHEN q.submission_status = 'graded' THEN 1 ELSE 0 END) AS total_graded,
          SUM(CASE WHEN q.submission_status IN ('submitted','resubmitted') AND COALESCE(q.evaluation_status, 'not_started') IN ('not_started','draft') THEN 1 ELSE 0 END) AS total_pending,
          SUM(CASE WHEN q.evaluation_status = 'draft' THEN 1 ELSE 0 END) AS total_draft,
          SUM(CASE WHEN q.evaluation_status = 'submitted' THEN 1 ELSE 0 END) AS total_submitted,
          SUM(CASE WHEN q.evaluation_status = 'confirmed' THEN 1 ELSE 0 END) AS total_confirmed
        FROM (${gradingProgressSql}) q
        WHERE ${whereSql}
      `,
      params,
    );
    const [rubricRows] = await db.execute("SELECT COUNT(*) AS active_rubrics FROM rubrics WHERE status = 'active' AND deleted_at IS NULL");
    const [unboundRows] = await db.execute(
      `
        SELECT SUM(total) AS unbound_targets
        FROM (
          SELECT COUNT(*) AS total
          FROM checkpoints cp
          JOIN classes c ON c.id = cp.class_id AND c.deleted_at IS NULL
          LEFT JOIN rubric_bindings rb ON rb.target_type = 'checkpoint' AND rb.target_id = cp.id
          WHERE cp.deleted_at IS NULL AND rb.id IS NULL
          UNION ALL
          SELECT COUNT(*) AS total
          FROM assignments a
          JOIN classes c ON c.id = a.class_id AND c.deleted_at IS NULL
          LEFT JOIN rubric_bindings rb ON rb.target_type = 'assignment' AND rb.target_id = a.id
          WHERE a.deleted_at IS NULL AND rb.id IS NULL
        ) t
      `,
    );
    const [editedRows] = await db.execute(
      `
        SELECT COUNT(*) AS edited_grades
        FROM audit_logs
        WHERE table_name IN ('evaluation_sessions','evaluation_scores','checkpoint_submissions','assignment_submissions')
          AND action IN ('submit_evaluation','save_evaluation_draft','admin_confirm_evaluation','admin_reopen_evaluation','grade_checkpoint_submission','grade_assignment_submission')
      `,
    );
    const [topPendingClasses] = await db.execute(
      `
        SELECT q.class_id, q.class_code, q.semester_code, q.subject_code,
               SUM(CASE WHEN q.submission_status IN ('submitted','resubmitted') AND COALESCE(q.evaluation_status, 'not_started') IN ('not_started','draft') THEN 1 ELSE 0 END) AS pending_count
        FROM (${gradingProgressSql}) q
        WHERE ${whereSql}
        GROUP BY q.class_id, q.class_code, q.semester_code, q.subject_code
        HAVING pending_count > 0
        ORDER BY pending_count DESC, q.class_code ASC
        LIMIT 5
      `,
      params,
    );
    return {
      cards: {
        total_graded: Number(cardsRows[0]?.total_graded || 0),
        total_pending: Number(cardsRows[0]?.total_pending || 0),
        total_draft: Number(cardsRows[0]?.total_draft || 0),
        total_submitted: Number(cardsRows[0]?.total_submitted || 0),
        total_confirmed: Number(cardsRows[0]?.total_confirmed || 0),
        active_rubrics: Number(rubricRows[0]?.active_rubrics || 0),
        unbound_targets: Number(unboundRows[0]?.unbound_targets || 0),
        edited_grades: Number(editedRows[0]?.edited_grades || 0),
      },
      top_pending_classes: topPendingClasses,
    };
  };

  const listEvaluationSessions = async ({
    search,
    semesterId,
    subjectId,
    classId,
    lecturerId,
    targetType,
    evaluatorId,
    status,
    limit,
    offset,
  }) => {
    const params = {};
    const where = ["1 = 1"];
    addSearch(where, params, ["q.target_title", "q.group_code", "q.group_name", "q.class_code", "q.evaluator_name", "q.rubric_name"], search);
    addEvaluationManagementFilters(where, params, { semesterId, subjectId, classId, lecturerId, targetType }, "q", "source_type");
    if (evaluatorId) {
      where.push("q.evaluator_id = :evaluatorId");
      params.evaluatorId = Number(evaluatorId);
    }
    if (status) {
      where.push("q.status = :status");
      params.status = status;
    }
    const whereSql = where.join(" AND ");
    const fromSql = `FROM (${evaluationSessionSql}) q`;
    const [rows] = await db.execute(
      `
        SELECT q.*
        ${fromSql}
        WHERE ${whereSql}
        ORDER BY q.updated_at DESC, q.session_id DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(db, `SELECT COUNT(*) AS total ${fromSql} WHERE ${whereSql}`, params);
    return { rows, total };
  };

  const findEvaluationSessionDetail = async (id) => {
    const [sessions] = await db.execute(
      `
        SELECT q.*
        FROM (${evaluationSessionSql}) q
        WHERE q.session_id = :id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    const session = sessions[0] || null;
    if (!session) return null;
    const [scores] = await db.execute(
      `
        SELECT esc.*, rc.name AS criterion_name, rc.description AS criterion_description,
               rc.max_score, rc.weight, rc.order_index, rc.is_required_feedback
        FROM evaluation_scores esc
        JOIN rubric_criteria rc ON rc.id = esc.criterion_id
        WHERE esc.evaluation_session_id = :id
        ORDER BY rc.order_index ASC, rc.id ASC
      `,
      { id: Number(id) },
    );
    const fileTable = session.source_type === "checkpoint" ? "checkpoint_submission_files" : "assignment_submission_files";
    const [files] = await db.execute(
      `
        SELECT id, file_name, file_path, file_url, file_type, mime_type, file_size, uploaded_by, uploaded_at, is_deleted
        FROM ${fileTable}
        WHERE submission_id = :submissionId AND is_deleted = 0
        ORDER BY uploaded_at DESC, id DESC
      `,
      { submissionId: Number(session.submission_id) },
    );
    const [auditLogs] = await db.execute(
      `
        SELECT al.*, u.full_name AS user_name, u.email AS user_email
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        WHERE (al.table_name = 'evaluation_sessions' AND al.record_id = :id)
           OR (al.table_name IN ('checkpoint_submissions','assignment_submissions') AND al.record_id = :submissionId)
        ORDER BY al.created_at DESC
        LIMIT 20
      `,
      { id: Number(id), submissionId: Number(session.submission_id) },
    );
    return { ...session, scores, files, audit_logs: auditLogs };
  };

  const updateEvaluationSessionStatus = async (id, status) => {
    await db.execute(
      "UPDATE evaluation_sessions SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id",
      { id: Number(id), status },
    );
  };

  const listEvaluationSettings = async () => {
    const [rows] = await db.execute(
      `
        SELECT id, setting_key, setting_value, data_type, module, description, updated_by, updated_at
        FROM system_settings
        WHERE module = 'evaluation'
        ORDER BY setting_key ASC
      `,
    );
    return rows;
  };

  const upsertEvaluationSetting = async (setting) => {
    await db.execute(
      `
        INSERT INTO system_settings
          (setting_key, setting_value, data_type, module, description, updated_by)
        VALUES
          (:setting_key, :setting_value, :data_type, 'evaluation', :description, :updated_by)
        ON DUPLICATE KEY UPDATE
          setting_value = VALUES(setting_value),
          data_type = VALUES(data_type),
          description = VALUES(description),
          updated_by = VALUES(updated_by),
          updated_at = CURRENT_TIMESTAMP
      `,
      setting,
    );
  };

  const listEvaluationResults = async ({
    search,
    semesterId,
    subjectId,
    classId,
    groupId,
    gradedBy,
    status,
    scoreMin,
    scoreMax,
    sourceType,
    limit,
    offset,
  }) => {
    const params = {};
    const where = [];
    addSearch(where, params, ["item_title", "group_name", "group_code", "topic", "class_code"], search);
    if (semesterId) {
      where.push("semester_id = :semesterId");
      params.semesterId = Number(semesterId);
    }
    if (subjectId) {
      where.push("subject_id = :subjectId");
      params.subjectId = Number(subjectId);
    }
    if (classId) {
      where.push("class_id = :classId");
      params.classId = Number(classId);
    }
    if (groupId) {
      where.push("group_id = :groupId");
      params.groupId = Number(groupId);
    }
    if (gradedBy) {
      where.push("graded_by = :gradedBy");
      params.gradedBy = Number(gradedBy);
    }
    if (status) {
      where.push("status = :status");
      params.status = status;
    }
    if (sourceType) {
      where.push("source_type = :sourceType");
      params.sourceType = sourceType;
    }
    if (scoreMin !== undefined && scoreMin !== null && scoreMin !== "") {
      where.push("score >= :scoreMin");
      params.scoreMin = Number(scoreMin);
    }
    if (scoreMax !== undefined && scoreMax !== null && scoreMax !== "") {
      where.push("score <= :scoreMax");
      params.scoreMax = Number(scoreMax);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await db.execute(
      `
        SELECT *
        FROM (${evaluationResultsSql}) results
        ${whereSql}
        ORDER BY graded_at DESC, submitted_at DESC, source_type ASC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(db, `SELECT COUNT(*) AS total FROM (${evaluationResultsSql}) results ${whereSql}`, params);
    return { rows, total };
  };

  const listGradingProgress = async ({
    search,
    semesterId,
    subjectId,
    classId,
    lecturerId,
    targetType,
    status,
    limit,
    offset,
  }) => {
    const params = {};
    const where = ["1 = 1"];
    addSearch(where, params, ["q.target_title", "q.class_code", "q.subject_code", "q.semester_code", "q.lecturer_name"], search);
    addEvaluationManagementFilters(where, params, { semesterId, subjectId, classId, lecturerId, targetType }, "q", "target_type");
    if (status) {
      where.push("q.target_status = :status");
      params.status = status;
    }
    const whereSql = where.join(" AND ");
    const groupedSql = `
      SELECT
        CONCAT(q.target_type, '-', q.target_id) AS id,
        q.target_type,
        q.target_id,
        q.target_title,
        q.target_status,
        q.deadline,
        q.max_score,
        q.class_id,
        q.class_code,
        q.lecturer_id,
        q.lecturer_name,
        q.subject_id,
        q.subject_code,
        q.semester_id,
        q.semester_code,
        COUNT(DISTINCT q.group_id) AS total_groups,
        SUM(CASE WHEN q.submission_status = 'not_submitted' THEN 1 ELSE 0 END) AS not_submitted_count,
        SUM(CASE WHEN q.submission_status IN ('submitted','resubmitted','graded') THEN 1 ELSE 0 END) AS submitted_count,
        SUM(CASE WHEN q.submission_status IN ('submitted','resubmitted') AND COALESCE(q.evaluation_status, 'not_started') IN ('not_started','draft') THEN 1 ELSE 0 END) AS pending_grading_count,
        SUM(CASE WHEN q.evaluation_status = 'draft' THEN 1 ELSE 0 END) AS draft_evaluation_count,
        SUM(CASE WHEN q.submission_status = 'graded' OR q.evaluation_status IN ('submitted','confirmed') THEN 1 ELSE 0 END) AS graded_count,
        SUM(CASE WHEN q.evaluation_status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_count,
        SUM(CASE WHEN q.is_late = 1 THEN 1 ELSE 0 END) AS late_submission_count,
        ROUND((SUM(CASE WHEN q.submission_status = 'graded' OR q.evaluation_status IN ('submitted','confirmed') THEN 1 ELSE 0 END) / NULLIF(COUNT(DISTINCT q.group_id), 0)) * 100, 2) AS completion_rate
      FROM (${gradingProgressSql}) q
      WHERE ${whereSql}
      GROUP BY q.target_type, q.target_id, q.target_title, q.target_status, q.deadline, q.max_score,
               q.class_id, q.class_code, q.lecturer_id, q.lecturer_name, q.subject_id, q.subject_code, q.semester_id, q.semester_code
    `;
    const [rows] = await db.execute(
      `
        SELECT *
        FROM (${groupedSql}) progress
        ORDER BY progress.deadline DESC, progress.class_code ASC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(db, `SELECT COUNT(*) AS total FROM (${groupedSql}) progress`, params);
    return { rows, total };
  };

  const listRubricUsage = async ({ search, subjectId, status, unusedOnly, limit, offset }) => {
    const params = {};
    const where = ["r.deleted_at IS NULL"];
    addSearch(where, params, ["r.name", "r.description", "s.subject_code", "s.subject_name"], search);
    if (subjectId) {
      where.push("r.subject_id = :subjectId");
      params.subjectId = Number(subjectId);
    }
    if (status) {
      where.push("r.status = :status");
      params.status = status;
    }
    const whereSql = where.join(" AND ");
    const groupedSql = `
      SELECT
        r.id,
        r.name AS rubric_name,
        r.version AS rubric_version,
        r.status,
        r.total_score,
        r.subject_id,
        s.subject_code,
        s.subject_name,
        COUNT(DISTINCT rc.id) AS total_criteria,
        COUNT(DISTINCT rb.id) AS total_bindings,
        COUNT(DISTINCT CASE WHEN rb.target_type = 'checkpoint' THEN rb.id END) AS used_in_checkpoints,
        COUNT(DISTINCT CASE WHEN rb.target_type = 'assignment' THEN rb.id END) AS used_in_assignments,
        COUNT(DISTINCT es.id) AS total_evaluations,
        MAX(es.evaluated_at) AS last_used_at,
        MAX(r.updated_at) AS updated_at
      FROM rubrics r
      LEFT JOIN subjects s ON s.id = r.subject_id
      LEFT JOIN rubric_criteria rc ON rc.rubric_id = r.id
      LEFT JOIN rubric_bindings rb ON rb.rubric_id = r.id
      LEFT JOIN evaluation_sessions es ON es.rubric_id = r.id
      WHERE ${whereSql}
      GROUP BY r.id, r.name, r.version, r.status, r.total_score, r.subject_id, s.subject_code, s.subject_name
    `;
    const havingSql = unusedOnly ? "WHERE total_bindings = 0 AND total_evaluations = 0" : "";
    const [rows] = await db.execute(
      `
        SELECT usage_rows.*,
               CASE WHEN usage_rows.status = 'active' AND usage_rows.total_bindings = 0 THEN 1 ELSE 0 END AS warning_unused_active
        FROM (${groupedSql}) usage_rows
        ${havingSql}
        ORDER BY usage_rows.updated_at DESC, usage_rows.rubric_name ASC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(db, `SELECT COUNT(*) AS total FROM (${groupedSql}) usage_rows ${havingSql}`, params);
    return { rows, total };
  };

  const listGradeAudit = async ({ search, userId, action, tableName, dateFrom, dateTo, limit, offset }) => {
    const gradeTables = [
      "evaluation_sessions",
      "evaluation_scores",
      "checkpoint_submissions",
      "assignment_submissions",
      "rubrics",
      "rubric_criteria",
      "rubric_bindings",
    ];
    const params = { gradeTables };
    const where = ["al.table_name IN (:gradeTables)"];
    addSearch(where, params, ["al.action", "al.table_name", "u.full_name", "u.email"], search);
    if (userId) {
      where.push("al.user_id = :userId");
      params.userId = Number(userId);
    }
    if (action) {
      where.push("al.action = :action");
      params.action = action;
    }
    if (tableName) {
      where.push("al.table_name = :tableName");
      params.tableName = tableName;
    }
    addDateRange(where, params, "al.created_at", dateFrom, dateTo);
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT al.*, u.full_name AS user_name, u.email AS user_email
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        WHERE ${whereSql}
        ORDER BY al.created_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(
      db,
      `
        SELECT COUNT(*) AS total
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total };
  };

  const getEvaluationAnalytics = async () => {
    const [
      [classRows],
      [groupRows],
      [submissionRows],
      [pendingRows],
      [averageRows],
      [lateRows],
      [topGroups],
      [atRiskGroups],
      [scoreByClass],
      [statusDistribution],
      [groupsByCategory],
      [lateByCheckpoint],
      [scoreTrend],
    ] = await Promise.all([
      db.execute("SELECT COUNT(*) AS total FROM classes WHERE deleted_at IS NULL"),
      db.execute("SELECT COUNT(*) AS total FROM `groups` WHERE deleted_at IS NULL"),
      db.execute(
        `
          SELECT SUM(total) AS total
          FROM (
            SELECT COUNT(*) AS total FROM checkpoint_submissions WHERE status IN ('submitted','resubmitted','graded')
            UNION ALL
            SELECT COUNT(*) AS total FROM assignment_submissions WHERE status IN ('submitted','resubmitted','graded')
          ) t
        `,
      ),
      db.execute(
        `
          SELECT SUM(total) AS total
          FROM (
            SELECT COUNT(*) AS total FROM checkpoint_submissions WHERE status IN ('submitted','resubmitted') AND score IS NULL
            UNION ALL
            SELECT COUNT(*) AS total FROM assignment_submissions WHERE status IN ('submitted','resubmitted') AND score IS NULL
          ) t
        `,
      ),
      db.execute(`SELECT ROUND(AVG(percent_score), 2) AS average_score FROM (${gradedScoreSql}) graded_scores`),
      db.execute(
        `
          SELECT SUM(total) AS total
          FROM (
            SELECT COUNT(*) AS total FROM checkpoint_submissions WHERE is_late = 1
            UNION ALL
            SELECT COUNT(*) AS total FROM assignment_submissions WHERE is_late = 1
          ) t
        `,
      ),
      db.execute(
        `
          SELECT group_id, group_code, group_name, topic, ROUND(AVG(percent_score), 2) AS average_score, COUNT(*) AS graded_count
          FROM (${gradedScoreSql}) graded_scores
          GROUP BY group_id, group_code, group_name, topic
          ORDER BY average_score DESC, graded_count DESC
          LIMIT 5
        `,
      ),
      db.execute(
        `
          SELECT
            g.id AS group_id,
            g.group_code,
            g.group_name,
            g.topic,
            c.class_code,
            (
              SELECT COUNT(*) FROM checkpoints cp
              WHERE cp.class_id = g.class_id AND cp.deleted_at IS NULL AND cp.status <> 'draft'
            ) + (
              SELECT COUNT(*) FROM assignments a
              WHERE a.class_id = g.class_id AND a.deleted_at IS NULL AND a.status <> 'archived'
            ) AS expected_items,
            (
              SELECT COUNT(*) FROM checkpoint_submissions cs
              JOIN checkpoints cp ON cp.id = cs.checkpoint_id AND cp.deleted_at IS NULL
              WHERE cs.group_id = g.id AND cp.status <> 'draft' AND cs.status IN ('submitted','resubmitted','graded')
            ) + (
              SELECT COUNT(*) FROM assignment_submissions s
              JOIN assignments a ON a.id = s.assignment_id AND a.deleted_at IS NULL
              WHERE s.group_id = g.id AND a.status <> 'archived' AND s.status IN ('submitted','resubmitted','graded')
            ) AS submitted_items,
            (
              SELECT ROUND(AVG(percent_score), 2)
              FROM (${gradedScoreSql}) graded_scores
              WHERE graded_scores.group_id = g.id
            ) AS average_score
          FROM \`groups\` g
          JOIN classes c ON c.id = g.class_id AND c.deleted_at IS NULL
          WHERE g.deleted_at IS NULL
          HAVING expected_items > 0
            AND (average_score IS NULL OR average_score < 60 OR submitted_items < expected_items)
          ORDER BY (expected_items - submitted_items) DESC, average_score ASC
          LIMIT 5
        `,
      ),
      db.execute(
        `
          SELECT class_id, class_code, ROUND(AVG(percent_score), 2) AS average_score, COUNT(*) AS graded_count
          FROM (${gradedScoreSql}) graded_scores
          GROUP BY class_id, class_code
          ORDER BY class_code ASC
          LIMIT 12
        `,
      ),
      db.execute(
        `
          SELECT status, SUM(total) AS total
          FROM (
            SELECT status, COUNT(*) AS total FROM checkpoint_submissions GROUP BY status
            UNION ALL
            SELECT status, COUNT(*) AS total FROM assignment_submissions GROUP BY status
          ) t
          GROUP BY status
          ORDER BY total DESC
        `,
      ),
      db.execute(
        `
          SELECT COALESCE(category, 'uncategorized') AS category, COUNT(*) AS total
          FROM \`groups\`
          WHERE deleted_at IS NULL
          GROUP BY COALESCE(category, 'uncategorized')
          ORDER BY total DESC
          LIMIT 10
        `,
      ),
      db.execute(
        `
          SELECT cp.id, cp.title, c.class_code, COUNT(cs.id) AS late_count
          FROM checkpoints cp
          JOIN classes c ON c.id = cp.class_id AND c.deleted_at IS NULL
          LEFT JOIN checkpoint_submissions cs ON cs.checkpoint_id = cp.id AND cs.is_late = 1
          WHERE cp.deleted_at IS NULL
          GROUP BY cp.id, cp.title, c.class_code
          ORDER BY late_count DESC, cp.deadline DESC
          LIMIT 10
        `,
      ),
      db.execute(
        `
          SELECT item_title, source_type, ROUND(AVG(percent_score), 2) AS average_score, COUNT(*) AS graded_count
          FROM (${gradedScoreSql}) graded_scores
          GROUP BY item_title, source_type, deadline
          ORDER BY deadline ASC
          LIMIT 12
        `,
      ),
    ]);

    return {
      cards: {
        total_classes: Number(classRows[0]?.total || 0),
        total_groups: Number(groupRows[0]?.total || 0),
        total_submissions: Number(submissionRows[0]?.total || 0),
        pending_grading: Number(pendingRows[0]?.total || 0),
        average_score: averageRows[0]?.average_score === null ? null : Number(averageRows[0]?.average_score || 0),
        late_submissions: Number(lateRows[0]?.total || 0),
      },
      top_groups: topGroups,
      at_risk_groups: atRiskGroups,
      charts: {
        average_score_by_class: scoreByClass,
        submission_status_distribution: statusDistribution,
        groups_by_category: groupsByCategory,
        late_submissions_by_checkpoint: lateByCheckpoint,
        score_trend_by_checkpoint: scoreTrend,
      },
    };
  };

  const listImportLogs = async ({ search, status, targetTable, classId, userId, dateFrom, dateTo, limit, offset }) => {
    const params = {};
    const where = ["1 = 1"];
    addSearch(where, params, ["il.file_name", "il.target_table", "c.class_code", "u.full_name", "u.email"], search);
    if (status) {
      where.push("il.status = :status");
      params.status = status;
    }
    if (targetTable) {
      where.push("il.target_table = :targetTable");
      params.targetTable = targetTable;
    }
    if (classId) {
      where.push("il.target_class_id = :classId");
      params.classId = Number(classId);
    }
    if (userId) {
      where.push("il.user_id = :userId");
      params.userId = Number(userId);
    }
    addDateRange(where, params, "il.started_at", dateFrom, dateTo);
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT il.*, u.full_name AS user_name, u.email AS user_email, c.class_code
        FROM import_logs il
        JOIN users u ON u.id = il.user_id
        LEFT JOIN classes c ON c.id = il.target_class_id
        WHERE ${whereSql}
        ORDER BY il.started_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(
      db,
      `
        SELECT COUNT(*) AS total
        FROM import_logs il
        JOIN users u ON u.id = il.user_id
        LEFT JOIN classes c ON c.id = il.target_class_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total };
  };

  const listInvitations = async ({ search, type, status, emailDeliveryStatus, limit, offset }) => {
    const params = {};
    const where = [];
    addSearch(where, params, [
      "email",
      "student_code",
      "student_name",
      "class_code",
      "group_name",
      "group_code",
      "event_type",
      "public_id",
    ], search);
    if (type) {
      where.push("type = :type");
      params.type = type;
    }
    if (status) {
      where.push("status = :status");
      params.status = status;
    }
    if (emailDeliveryStatus) {
      where.push("email_delivery_status = :emailDeliveryStatus");
      params.emailDeliveryStatus = emailDeliveryStatus;
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const unionSql = `
      SELECT
        CONCAT('class-', ci.id) AS id,
        'class_invite' AS type,
        ci.id AS source_id,
        ci.email,
        s.student_code,
        s.full_name AS student_name,
        c.id AS class_id,
        c.class_code,
        NULL AS group_id,
        NULL AS group_code,
        NULL AS group_name,
        NULL AS event_type,
        NULL AS public_id,
        CASE
          WHEN ci.used = 1 THEN 'used'
          WHEN ci.expires_at < NOW() THEN 'expired'
          ELSE 'pending'
        END AS status,
        ci.email_delivery_status,
        ci.email_attempts AS attempts,
        ci.email_last_error AS last_error,
        ci.expires_at,
        ci.created_at,
        NULL AS payload
      FROM class_invites ci
      JOIN students s ON s.id = ci.student_id
      JOIN classes c ON c.id = ci.class_id
      UNION ALL
      SELECT
        CONCAT('group-', gi.id) AS id,
        'group_invite' AS type,
        gi.id AS source_id,
        st.email,
        st.student_code,
        st.full_name AS student_name,
        c.id AS class_id,
        c.class_code,
        g.id AS group_id,
        g.group_code,
        g.group_name,
        NULL AS event_type,
        NULL AS public_id,
        gi.status,
        gi.email_delivery_status,
        gi.email_attempts AS attempts,
        gi.email_last_error AS last_error,
        gi.expires_at,
        gi.created_at,
        NULL AS payload
      FROM group_invites gi
      JOIN students st ON st.id = gi.student_id
      JOIN \`groups\` g ON g.id = gi.group_id
      JOIN classes c ON c.id = g.class_id
      UNION ALL
      SELECT
        CONCAT('outbox-', oe.id) AS id,
        'email_event' AS type,
        oe.id AS source_id,
        NULL AS email,
        NULL AS student_code,
        NULL AS student_name,
        NULL AS class_id,
        NULL AS class_code,
        NULL AS group_id,
        NULL AS group_code,
        NULL AS group_name,
        oe.event_type,
        oe.public_id,
        oe.status,
        oe.status AS email_delivery_status,
        oe.attempts,
        oe.last_error,
        oe.next_retry_at AS expires_at,
        oe.created_at,
        oe.payload
      FROM outbox_events oe
    `;
    const [rows] = await db.execute(
      `
        SELECT *
        FROM (${unionSql}) invitations
        ${whereSql}
        ORDER BY created_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(db, `SELECT COUNT(*) AS total FROM (${unionSql}) invitations ${whereSql}`, params);
    return { rows, total };
  };

  const resendInvitation = async (type, id) => {
    if (type === "class_invite") {
      await db.execute(
        `
          UPDATE class_invites
          SET email_delivery_status = 'queued', email_last_error = NULL, email_next_retry_at = NOW()
          WHERE id = :id
        `,
        { id: Number(id) },
      );
      return;
    }
    if (type === "group_invite") {
      await db.execute(
        `
          UPDATE group_invites
          SET status = 'pending', email_delivery_status = 'queued', email_last_error = NULL, email_next_retry_at = NOW()
          WHERE id = :id
        `,
        { id: Number(id) },
      );
    }
  };

  const revokeInvitation = async (type, id) => {
    if (type === "class_invite") {
      await db.execute("UPDATE class_invites SET expires_at = NOW() WHERE id = :id", { id: Number(id) });
      return;
    }
    if (type === "group_invite") {
      await db.execute("UPDATE group_invites SET status = 'revoked' WHERE id = :id", { id: Number(id) });
    }
  };

  const retryEmailEvent = async (id) => {
    await db.execute(
      `
        UPDATE outbox_events
        SET status = 'pending', last_error = NULL, next_retry_at = NOW(), updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
      `,
      { id: Number(id) },
    );
  };

  const listAuditLogs = async ({ search, userId, action, tableName, dateFrom, dateTo, limit, offset }) => {
    const params = {};
    const where = ["1 = 1"];
    addSearch(where, params, ["al.action", "al.table_name", "u.full_name", "u.email"], search);
    if (userId) {
      where.push("al.user_id = :userId");
      params.userId = Number(userId);
    }
    if (action) {
      where.push("al.action = :action");
      params.action = action;
    }
    if (tableName) {
      where.push("al.table_name = :tableName");
      params.tableName = tableName;
    }
    addDateRange(where, params, "al.created_at", dateFrom, dateTo);
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT al.*, u.full_name AS user_name, u.email AS user_email
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        WHERE ${whereSql}
        ORDER BY al.created_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(
      db,
      `
        SELECT COUNT(*) AS total
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total };
  };

  const listApiAccessLogs = async ({ search, method, statusCode, userId, dateFrom, dateTo, slow, limit, offset }) => {
    const params = {};
    const where = ["1 = 1"];
    addSearch(where, params, ["aal.request_id", "aal.path", "aal.ip_address", "u.full_name", "u.email"], search);
    if (method) {
      where.push("aal.method = :method");
      params.method = method;
    }
    if (statusCode) {
      where.push("aal.status_code = :statusCode");
      params.statusCode = Number(statusCode);
    }
    if (userId) {
      where.push("aal.user_id = :userId");
      params.userId = Number(userId);
    }
    if (slow) where.push("aal.response_time >= 1000");
    addDateRange(where, params, "aal.timestamp", dateFrom, dateTo);
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT aal.*, u.full_name AS user_name, u.email AS user_email
        FROM api_access_logs aal
        LEFT JOIN users u ON u.id = aal.user_id
        WHERE ${whereSql}
        ORDER BY aal.timestamp DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(
      db,
      `
        SELECT COUNT(*) AS total
        FROM api_access_logs aal
        LEFT JOIN users u ON u.id = aal.user_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total };
  };

  const getLookups = async () => {
    const [
      [subjects],
      [semesters],
      [classes],
      [groups],
      [graders],
      [auditActions],
      [auditTables],
      [importTargets],
    ] = await Promise.all([
      db.execute("SELECT id, subject_code, subject_name FROM subjects WHERE deleted_at IS NULL ORDER BY subject_code ASC"),
      db.execute("SELECT id, semester_code, semester_name, year, status FROM semesters WHERE deleted_at IS NULL ORDER BY year DESC, start_date DESC"),
      db.execute(
        `
          SELECT c.id, c.class_code, c.class_name, c.semester_id, sem.semester_code
          FROM classes c
          JOIN semesters sem ON sem.id = c.semester_id
          WHERE c.deleted_at IS NULL
          ORDER BY sem.year DESC, c.class_code ASC
        `,
      ),
      db.execute(
        `
          SELECT g.id, g.group_code, g.group_name, g.class_id, c.class_code
          FROM \`groups\` g
          JOIN classes c ON c.id = g.class_id
          WHERE g.deleted_at IS NULL
          ORDER BY g.group_name ASC
        `,
      ),
      db.execute(
        `
          SELECT DISTINCT u.id, u.full_name, u.email
          FROM users u
          JOIN user_roles ur ON ur.user_id = u.id
          JOIN roles r ON r.id = ur.role_id
          WHERE u.deleted_at IS NULL AND r.role_code IN ('admin','department_head','lecturer')
          ORDER BY u.full_name ASC
        `,
      ),
      db.execute("SELECT DISTINCT action FROM audit_logs ORDER BY action ASC"),
      db.execute("SELECT DISTINCT table_name FROM audit_logs ORDER BY table_name ASC"),
      db.execute("SELECT DISTINCT target_table FROM import_logs ORDER BY target_table ASC"),
    ]);
    return { subjects, semesters, classes, groups, graders, auditActions, auditTables, importTargets };
  };

  return {
    getRubricImplementationState,
    listRubrics,
    findRubricDetail,
    getEvaluationOverview,
    listEvaluationSessions,
    findEvaluationSessionDetail,
    updateEvaluationSessionStatus,
    listEvaluationSettings,
    upsertEvaluationSetting,
    listEvaluationResults,
    listGradingProgress,
    listRubricUsage,
    listGradeAudit,
    getEvaluationAnalytics,
    listImportLogs,
    listInvitations,
    resendInvitation,
    revokeInvitation,
    retryEmailEvent,
    listAuditLogs,
    listApiAccessLogs,
    getLookups,
  };
};
