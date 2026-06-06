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

export const createEvaluationRepository = ({ db }) => {
  const latestEvaluationSql = `
    SELECT es.*
    FROM evaluation_sessions es
    JOIN (
      SELECT target_type, target_id, MAX(id) AS id
      FROM evaluation_sessions
      WHERE is_official = 1
      GROUP BY target_type, target_id
    ) latest ON latest.id = es.id
  `;

  const gradingSubmissionUnionSql = `
    SELECT
      'checkpoint' AS source_type,
      cs.id AS submission_id,
      'checkpoint_submission' AS target_type,
      cs.id AS target_id,
      cp.id AS source_id,
      cp.title AS source_title,
      cp.deadline,
      cp.max_score,
      cp.status AS source_status,
      c.id AS class_id,
      c.class_code,
      c.lecturer_id,
      sub.subject_code,
      sub.subject_name,
      sem.semester_code,
      sem.semester_name,
      sem.year,
      g.id AS group_id,
      g.group_code,
      g.group_name,
      g.topic,
      g.topic_desc,
      cs.status AS submission_status,
      cs.submitted_at,
      cs.is_late,
      cs.score AS current_score,
      cs.feedback AS current_feedback,
      cs.graded_by,
      cs.graded_at,
      grader.full_name AS graded_by_name,
      (SELECT COUNT(*) FROM checkpoint_submission_files f WHERE f.submission_id = cs.id AND f.is_deleted = 0) AS file_count,
      ev.id AS evaluation_id,
      COALESCE(ev.status, 'not_started') AS evaluation_status,
      ev.total_score AS evaluation_score,
      ev.evaluator_id,
      ev.evaluated_at,
      evaluator.full_name AS evaluator_name
    FROM checkpoint_submissions cs
    JOIN checkpoints cp ON cp.id = cs.checkpoint_id AND cp.deleted_at IS NULL
    JOIN classes c ON c.id = cp.class_id AND c.deleted_at IS NULL
    JOIN subjects sub ON sub.id = c.subject_id
    JOIN semesters sem ON sem.id = c.semester_id
    JOIN \`groups\` g ON g.id = cs.group_id AND g.deleted_at IS NULL
    LEFT JOIN users grader ON grader.id = cs.graded_by
    LEFT JOIN (${latestEvaluationSql}) ev ON ev.target_type = 'checkpoint_submission' AND ev.target_id = cs.id
    LEFT JOIN users evaluator ON evaluator.id = ev.evaluator_id
    WHERE cs.status IN ('submitted','resubmitted','graded')
    UNION ALL
    SELECT
      'assignment' AS source_type,
      s.id AS submission_id,
      'assignment_submission' AS target_type,
      s.id AS target_id,
      a.id AS source_id,
      a.title AS source_title,
      a.deadline,
      a.max_score,
      a.status AS source_status,
      c.id AS class_id,
      c.class_code,
      c.lecturer_id,
      sub.subject_code,
      sub.subject_name,
      sem.semester_code,
      sem.semester_name,
      sem.year,
      g.id AS group_id,
      g.group_code,
      g.group_name,
      g.topic,
      g.topic_desc,
      s.status AS submission_status,
      s.submitted_at,
      s.is_late,
      s.score AS current_score,
      s.feedback AS current_feedback,
      s.graded_by,
      s.graded_at,
      grader.full_name AS graded_by_name,
      (SELECT COUNT(*) FROM assignment_submission_files f WHERE f.submission_id = s.id AND f.is_deleted = 0) AS file_count,
      ev.id AS evaluation_id,
      COALESCE(ev.status, 'not_started') AS evaluation_status,
      ev.total_score AS evaluation_score,
      ev.evaluator_id,
      ev.evaluated_at,
      evaluator.full_name AS evaluator_name
    FROM assignment_submissions s
    JOIN assignments a ON a.id = s.assignment_id AND a.deleted_at IS NULL
    JOIN classes c ON c.id = a.class_id AND c.deleted_at IS NULL
    JOIN subjects sub ON sub.id = c.subject_id
    JOIN semesters sem ON sem.id = c.semester_id
    JOIN \`groups\` g ON g.id = s.group_id AND g.deleted_at IS NULL
    LEFT JOIN users grader ON grader.id = s.graded_by
    LEFT JOIN (${latestEvaluationSql}) ev ON ev.target_type = 'assignment_submission' AND ev.target_id = s.id
    LEFT JOIN users evaluator ON evaluator.id = ev.evaluator_id
    WHERE s.status IN ('submitted','resubmitted','graded')
  `;

  const buildGradingSubmissionWhere = ({
    search,
    sourceType,
    classId,
    checkpointId,
    assignmentId,
    status,
    isLate,
    evaluationStatus,
    lecturerId,
  }) => {
    const params = {};
    const where = ["1 = 1"];
    addSearch(where, params, ["q.source_title", "q.group_code", "q.group_name", "q.topic", "q.class_code"], search);
    if (sourceType) {
      where.push("q.source_type = :sourceType");
      params.sourceType = sourceType;
    }
    if (classId) {
      where.push("q.class_id = :classId");
      params.classId = Number(classId);
    }
    if (checkpointId) {
      where.push("q.source_type = 'checkpoint' AND q.source_id = :checkpointId");
      params.checkpointId = Number(checkpointId);
    }
    if (assignmentId) {
      where.push("q.source_type = 'assignment' AND q.source_id = :assignmentId");
      params.assignmentId = Number(assignmentId);
    }
    if (status) {
      where.push("q.submission_status = :status");
      params.status = status;
    }
    if (isLate !== null && isLate !== undefined && isLate !== "") {
      where.push("COALESCE(q.is_late, 0) = :isLate");
      params.isLate = Number(isLate);
    }
    if (evaluationStatus) {
      where.push("q.evaluation_status = :evaluationStatus");
      params.evaluationStatus = evaluationStatus;
    }
    if (lecturerId) {
      where.push("q.lecturer_id = :lecturerId");
      params.lecturerId = Number(lecturerId);
    }
    return { whereSql: where.join(" AND "), params };
  };

  const listRubrics = async ({ search, subjectId, status, creatorId, limit, offset }) => {
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
    if (creatorId) {
      where.push("r.created_by = :creatorId");
      params.creatorId = Number(creatorId);
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT r.*, s.subject_code, s.subject_name, u.full_name AS created_by_name,
               COUNT(DISTINCT rc.id) AS criteria_count,
               COUNT(DISTINCT rb.id) AS bindings_count,
               COUNT(DISTINCT es.id) AS evaluation_count
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

  const findRubricById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT r.*, s.subject_code, s.subject_name, u.full_name AS created_by_name,
               (SELECT COUNT(*) FROM evaluation_sessions es WHERE es.rubric_id = r.id) AS evaluation_count
        FROM rubrics r
        LEFT JOIN subjects s ON s.id = r.subject_id
        LEFT JOIN users u ON u.id = r.created_by
        WHERE r.id = :id AND r.deleted_at IS NULL
        LIMIT 1
      `,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const findRubricDetailById = async (id) => {
    const rubric = await findRubricById(id);
    if (!rubric) return null;
    const [criteria] = await db.execute(
      "SELECT * FROM rubric_criteria WHERE rubric_id = :id ORDER BY order_index ASC, id ASC",
      { id: Number(id) },
    );
    const [bindings] = await db.execute(
      `
        SELECT rb.*,
          CASE WHEN rb.target_type = 'checkpoint' THEN cp.title ELSE a.title END AS target_title,
          CASE WHEN rb.target_type = 'checkpoint' THEN ccp.class_code ELSE ca.class_code END AS class_code
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

  const createRubric = async (data, conn = db) => {
    const [result] = await conn.execute(
      `
        INSERT INTO rubrics
          (subject_id, name, description, total_score, version, parent_rubric_id, status, created_by)
        VALUES
          (:subject_id, :name, :description, :total_score, :version, :parent_rubric_id, :status, :created_by)
      `,
      data,
    );
    return result.insertId;
  };

  const updateRubric = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE rubrics SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`,
      { ...data, id: Number(id) },
    );
  };

  const softDeleteRubric = async (id) => {
    await db.execute(
      "UPDATE rubrics SET deleted_at = CURRENT_TIMESTAMP, status = 'archived' WHERE id = :id AND deleted_at IS NULL",
      { id: Number(id) },
    );
  };

  const createCriterion = async (data, conn = db) => {
    const [result] = await conn.execute(
      `
        INSERT INTO rubric_criteria
          (rubric_id, name, description, max_score, weight, order_index, is_required_feedback)
        VALUES
          (:rubric_id, :name, :description, :max_score, :weight, :order_index, :is_required_feedback)
      `,
      data,
    );
    return result.insertId;
  };

  const findCriterionById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM rubric_criteria WHERE id = :id LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const updateCriterion = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE rubric_criteria SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`,
      { ...data, id: Number(id) },
    );
  };

  const deleteCriterion = async (id) => {
    await db.execute("DELETE FROM rubric_criteria WHERE id = :id", { id: Number(id) });
  };

  const countCriterionScores = async (criterionId) =>
    countRows(db, "SELECT COUNT(*) AS total FROM evaluation_scores WHERE criterion_id = :criterionId", {
      criterionId: Number(criterionId),
    });

  const countRubricEvaluations = async (rubricId) =>
    countRows(db, "SELECT COUNT(*) AS total FROM evaluation_sessions WHERE rubric_id = :rubricId", {
      rubricId: Number(rubricId),
    });

  const findNextRubricVersion = async (rootRubricId) => {
    const [rows] = await db.execute(
      `
        SELECT COALESCE(MAX(version), 0) + 1 AS next_version
        FROM rubrics
        WHERE deleted_at IS NULL
          AND (id = :rootRubricId OR parent_rubric_id = :rootRubricId)
      `,
      { rootRubricId: Number(rootRubricId) },
    );
    return Number(rows[0]?.next_version || 1);
  };

  const findTarget = async (targetType, targetId) => {
    const table = targetType === "checkpoint" ? "checkpoints" : "assignments";
    const titleColumn = targetType === "checkpoint" ? "cp.title" : "a.title";
    const alias = targetType === "checkpoint" ? "cp" : "a";
    const [rows] = await db.execute(
      `
        SELECT ${alias}.id, ${titleColumn} AS title, ${alias}.class_id, c.class_code, c.lecturer_id
        FROM ${table} ${alias}
        JOIN classes c ON c.id = ${alias}.class_id AND c.deleted_at IS NULL
        WHERE ${alias}.id = :targetId AND ${alias}.deleted_at IS NULL
        LIMIT 1
      `,
      { targetId: Number(targetId) },
    );
    return rows[0] || null;
  };

  const createBinding = async ({ rubric_id, target_type, target_id, created_by }) => {
    await db.execute(
      `
        INSERT INTO rubric_bindings (rubric_id, target_type, target_id, created_by)
        VALUES (:rubric_id, :target_type, :target_id, :created_by)
      `,
      { rubric_id, target_type, target_id, created_by },
    );
  };

  const findBindingByTarget = async (targetType, targetId) => {
    const [rows] = await db.execute(
      `
        SELECT rb.*, r.name AS rubric_name, r.total_score, r.status AS rubric_status
        FROM rubric_bindings rb
        JOIN rubrics r ON r.id = rb.rubric_id AND r.deleted_at IS NULL
        WHERE rb.target_type = :targetType AND rb.target_id = :targetId
        LIMIT 1
      `,
      { targetType, targetId: Number(targetId) },
    );
    return rows[0] || null;
  };

  const findSubmissionContext = async (targetType, targetId) => {
    if (targetType === "checkpoint_submission") {
      const [rows] = await db.execute(
        `
          SELECT cs.*, cp.id AS source_id, cp.title AS source_title, cp.max_score AS source_max_score,
                 cp.deadline AS source_deadline, cp.status AS source_status,
                 cp.class_id, c.class_code, c.lecturer_id,
                 sub.subject_code, sub.subject_name, sem.semester_code, sem.semester_name, sem.year,
                 g.id AS group_id, g.group_code, g.group_name, g.topic, g.topic_desc,
                 rb.rubric_id
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
        SELECT s.*, a.id AS source_id, a.title AS source_title, a.max_score AS source_max_score,
               a.deadline AS source_deadline, a.status AS source_status,
               a.class_id, c.class_code, c.lecturer_id,
               sub.subject_code, sub.subject_name, sem.semester_code, sem.semester_name, sem.year,
               g.id AS group_id, g.group_code, g.group_name, g.topic, g.topic_desc,
               rb.rubric_id
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

  const listCriteriaByRubricId = async (rubricId) => {
    const [rows] = await db.execute(
      "SELECT * FROM rubric_criteria WHERE rubric_id = :rubricId ORDER BY order_index ASC, id ASC",
      { rubricId: Number(rubricId) },
    );
    return rows;
  };

  const listSubmissionFiles = async (targetType, targetId) => {
    if (targetType === "checkpoint_submission") {
      const [rows] = await db.execute(
        `
          SELECT id, file_name, file_type, mime_type, file_size, file_path, uploaded_at
          FROM checkpoint_submission_files
          WHERE submission_id = :targetId AND is_deleted = 0
          ORDER BY uploaded_at DESC, id DESC
        `,
        { targetId: Number(targetId) },
      );
      return rows;
    }
    const [rows] = await db.execute(
      `
        SELECT id, file_name, file_type, mime_type, file_size, file_path, uploaded_at
        FROM assignment_submission_files
        WHERE submission_id = :targetId AND is_deleted = 0
        ORDER BY uploaded_at DESC, id DESC
      `,
      { targetId: Number(targetId) },
    );
    return rows;
  };

  const listEvaluationSettings = async () => {
    const [rows] = await db.execute(
      `
        SELECT setting_key, setting_value, data_type
        FROM system_settings
        WHERE module = 'evaluation'
          AND setting_key IN ('feedback_required', 'min_feedback_length')
      `,
    );
    return rows;
  };

  const listGradingSubmissions = async ({
    search,
    sourceType,
    classId,
    checkpointId,
    assignmentId,
    status,
    isLate,
    evaluationStatus,
    lecturerId,
    limit,
    offset,
  }) => {
    const { whereSql, params } = buildGradingSubmissionWhere({
      search,
      sourceType,
      classId,
      checkpointId,
      assignmentId,
      status,
      isLate,
      evaluationStatus,
      lecturerId,
    });
    const fromSql = `FROM (${gradingSubmissionUnionSql}) q`;
    const [rows] = await db.execute(
      `
        SELECT q.*
        ${fromSql}
        WHERE ${whereSql}
        ORDER BY q.deadline ASC, q.class_code ASC, q.group_code ASC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(db, `SELECT COUNT(*) AS total ${fromSql} WHERE ${whereSql}`, params);
    return { rows, total };
  };

  const getGradingDashboardStats = async ({ classId, lecturerId }) => {
    const { whereSql, params } = buildGradingSubmissionWhere({ classId, lecturerId });
    const [rows] = await db.execute(
      `
        SELECT
          SUM(CASE WHEN q.submission_status IN ('submitted','resubmitted') AND q.evaluation_status IN ('not_started','draft') THEN 1 ELSE 0 END) AS total_need_grading,
          SUM(CASE WHEN q.source_type = 'checkpoint' AND q.submission_status IN ('submitted','resubmitted') AND q.evaluation_status IN ('not_started','draft') THEN 1 ELSE 0 END) AS checkpoint_need_grading,
          SUM(CASE WHEN q.source_type = 'assignment' AND q.submission_status IN ('submitted','resubmitted') AND q.evaluation_status IN ('not_started','draft') THEN 1 ELSE 0 END) AS assignment_need_grading,
          SUM(CASE WHEN COALESCE(q.is_late, 0) = 1 THEN 1 ELSE 0 END) AS late_submissions,
          SUM(CASE WHEN q.evaluation_status = 'draft' THEN 1 ELSE 0 END) AS draft_evaluations,
          MIN(CASE WHEN q.submission_status IN ('submitted','resubmitted') AND q.evaluation_status IN ('not_started','draft') AND q.deadline >= NOW() THEN q.deadline ELSE NULL END) AS nearest_deadline
        FROM (${gradingSubmissionUnionSql}) q
        WHERE ${whereSql}
      `,
      params,
    );
    return rows[0] || {};
  };

  const findOpenEvaluationSession = async ({ rubricId, targetType, targetId, evaluatorId }) => {
    const [rows] = await db.execute(
      `
        SELECT *
        FROM evaluation_sessions
        WHERE rubric_id = :rubricId
          AND target_type = :targetType
          AND target_id = :targetId
          AND evaluator_id = :evaluatorId
          AND status IN ('draft','submitted','confirmed')
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      {
        rubricId: Number(rubricId),
        targetType,
        targetId: Number(targetId),
        evaluatorId: Number(evaluatorId),
      },
    );
    return rows[0] || null;
  };

  const findEvaluationSessionById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT es.*, r.name AS rubric_name, r.total_score AS rubric_total_score,
               g.group_code, g.group_name, u.full_name AS evaluator_name
        FROM evaluation_sessions es
        JOIN rubrics r ON r.id = es.rubric_id
        JOIN \`groups\` g ON g.id = es.group_id
        LEFT JOIN users u ON u.id = es.evaluator_id
        WHERE es.id = :id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const findEvaluationDetailById = async (id) => {
    const session = await findEvaluationSessionById(id);
    if (!session) return null;
    const [scores] = await db.execute(
      `
        SELECT es.*, rc.name AS criterion_name, rc.description AS criterion_description,
               rc.max_score, rc.weight, rc.order_index, rc.is_required_feedback
        FROM evaluation_scores es
        JOIN rubric_criteria rc ON rc.id = es.criterion_id
        WHERE es.evaluation_session_id = :id
        ORDER BY rc.order_index ASC, rc.id ASC
      `,
      { id: Number(id) },
    );
    return { ...session, scores };
  };

  const findPublishedEvaluationDetailByTarget = async (targetType, targetId) => {
    const [sessions] = await db.execute(
      `
        SELECT es.*, r.name AS rubric_name, r.version AS rubric_version,
               r.total_score AS rubric_total_score,
               g.group_code, g.group_name, u.full_name AS evaluator_name
        FROM evaluation_sessions es
        JOIN rubrics r ON r.id = es.rubric_id
        JOIN \`groups\` g ON g.id = es.group_id
        JOIN users u ON u.id = es.evaluator_id
        WHERE es.target_type = :targetType
          AND es.target_id = :targetId
          AND es.is_official = 1
          AND es.status IN ('submitted', 'confirmed')
        ORDER BY es.evaluated_at DESC, es.updated_at DESC, es.id DESC
        LIMIT 1
      `,
      { targetType, targetId: Number(targetId) },
    );
    const session = sessions[0] || null;
    if (!session) return null;

    const [scores] = await db.execute(
      `
        SELECT es.*, rc.name AS criterion_name, rc.description AS criterion_description,
               rc.max_score, rc.weight, rc.order_index, rc.is_required_feedback
        FROM evaluation_scores es
        JOIN rubric_criteria rc ON rc.id = es.criterion_id
        WHERE es.evaluation_session_id = :id
        ORDER BY rc.order_index ASC, rc.id ASC
      `,
      { id: Number(session.id) },
    );
    return { ...session, scores };
  };

  const createEvaluationSession = async (data, conn = db) => {
    const [result] = await conn.execute(
      `
        INSERT INTO evaluation_sessions
          (rubric_id, target_type, target_id, group_id, evaluator_id, evaluator_role, is_official, total_score, overall_feedback, status, evaluated_at)
        VALUES
          (:rubric_id, :target_type, :target_id, :group_id, :evaluator_id, :evaluator_role, :is_official, :total_score, :overall_feedback, :status, :evaluated_at)
      `,
      data,
    );
    return result.insertId;
  };

  const updateEvaluationSession = async (id, data, conn = db) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await conn.execute(
      `UPDATE evaluation_sessions SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`,
      { ...data, id: Number(id) },
    );
  };

  const replaceEvaluationScores = async (sessionId, scores, conn = db) => {
    await conn.execute("DELETE FROM evaluation_scores WHERE evaluation_session_id = :sessionId", {
      sessionId: Number(sessionId),
    });
    for (const score of scores) {
      await conn.execute(
        `
          INSERT INTO evaluation_scores (evaluation_session_id, criterion_id, score, feedback)
          VALUES (:sessionId, :criterionId, :score, :feedback)
        `,
        {
          sessionId: Number(sessionId),
          criterionId: Number(score.criterion_id),
          score: Number(score.score),
          feedback: score.feedback || null,
        },
      );
    }
  };

  const updateLegacySubmissionGrade = async ({ targetType, targetId, totalScore, feedback, evaluatorId }, conn = db) => {
    const table = targetType === "checkpoint_submission" ? "checkpoint_submissions" : "assignment_submissions";
    await conn.execute(
      `
        UPDATE ${table}
        SET score = :totalScore,
            feedback = :feedback,
            graded_by = :evaluatorId,
            graded_at = CURRENT_TIMESTAMP,
            status = 'graded'
        WHERE id = :targetId
      `,
      {
        totalScore: Number(totalScore),
        feedback: feedback || null,
        evaluatorId: Number(evaluatorId),
        targetId: Number(targetId),
      },
    );
  };

  const listEvaluations = async ({ classId, checkpointId, assignmentId, groupId, status, lecturerId, limit, offset }) => {
    const params = {};
    const where = ["1 = 1"];
    if (classId) {
      where.push("COALESCE(cp.class_id, a.class_id) = :classId");
      params.classId = Number(classId);
    }
    if (checkpointId) {
      where.push("cp.id = :checkpointId");
      params.checkpointId = Number(checkpointId);
    }
    if (assignmentId) {
      where.push("a.id = :assignmentId");
      params.assignmentId = Number(assignmentId);
    }
    if (groupId) {
      where.push("es.group_id = :groupId");
      params.groupId = Number(groupId);
    }
    if (status) {
      where.push("es.status = :status");
      params.status = status;
    }
    if (lecturerId) {
      where.push("COALESCE(cpc.lecturer_id, ac.lecturer_id) = :lecturerId");
      params.lecturerId = Number(lecturerId);
    }
    const whereSql = where.join(" AND ");
    const fromSql = `
      FROM evaluation_sessions es
      JOIN rubrics r ON r.id = es.rubric_id
      JOIN \`groups\` g ON g.id = es.group_id
      JOIN users u ON u.id = es.evaluator_id
      LEFT JOIN checkpoint_submissions cs ON es.target_type = 'checkpoint_submission' AND cs.id = es.target_id
      LEFT JOIN checkpoints cp ON cp.id = cs.checkpoint_id
      LEFT JOIN classes cpc ON cpc.id = cp.class_id
      LEFT JOIN assignment_submissions ans ON es.target_type = 'assignment_submission' AND ans.id = es.target_id
      LEFT JOIN assignments a ON a.id = ans.assignment_id
      LEFT JOIN classes ac ON ac.id = a.class_id
    `;
    const [rows] = await db.execute(
      `
        SELECT es.*, r.name AS rubric_name, g.group_code, g.group_name,
               u.full_name AS evaluator_name,
               COALESCE(cp.title, a.title) AS target_title,
               COALESCE(cp.class_id, a.class_id) AS class_id,
               COALESCE(cpc.class_code, ac.class_code) AS class_code
        ${fromSql}
        WHERE ${whereSql}
        ORDER BY es.updated_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(db, `SELECT COUNT(*) AS total ${fromSql} WHERE ${whereSql}`, params);
    return { rows, total };
  };

  return {
    listRubrics,
    findRubricById,
    findRubricDetailById,
    createRubric,
    updateRubric,
    softDeleteRubric,
    createCriterion,
    findCriterionById,
    updateCriterion,
    deleteCriterion,
    countCriterionScores,
    countRubricEvaluations,
    findNextRubricVersion,
    findTarget,
    createBinding,
    findBindingByTarget,
    findSubmissionContext,
    listCriteriaByRubricId,
    listSubmissionFiles,
    listEvaluationSettings,
    listGradingSubmissions,
    getGradingDashboardStats,
    findOpenEvaluationSession,
    findEvaluationSessionById,
    findEvaluationDetailById,
    findPublishedEvaluationDetailByTarget,
    createEvaluationSession,
    updateEvaluationSession,
    replaceEvaluationScores,
    updateLegacySubmissionGrade,
    listEvaluations,
  };
};
