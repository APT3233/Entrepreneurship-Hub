const num = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

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

const scoreRowsSql = `
  SELECT
    'checkpoint' AS target_type,
    cp.id AS target_id,
    cp.title AS target_title,
    cp.deadline,
    cp.max_score,
    c.id AS class_id,
    c.class_code,
    c.lecturer_id,
    lecturer.full_name AS lecturer_name,
    sub.id AS subject_id,
    sub.subject_code,
    sub.subject_name,
    sem.id AS semester_id,
    sem.semester_code,
    g.id AS group_id,
    g.group_code,
    g.group_name,
    g.topic,
    g.topic_desc,
    COALESCE(g.category, 'uncategorized') AS category,
    cs.id AS submission_id,
    cs.status AS submission_status,
    cs.submitted_at,
    cs.is_late,
    cs.score,
    cs.feedback,
    cs.graded_by,
    cs.graded_at,
    ev.id AS evaluation_session_id,
    ev.status AS evaluation_status,
    ev.rubric_id,
    COALESCE(cs.graded_at, cs.submitted_at, cp.deadline) AS event_at,
    CASE WHEN cs.score IS NOT NULL AND cp.max_score > 0 THEN ROUND((cs.score / cp.max_score) * 10, 2) ELSE NULL END AS score_10
  FROM checkpoint_submissions cs
  JOIN checkpoints cp ON cp.id = cs.checkpoint_id AND cp.deleted_at IS NULL
  JOIN classes c ON c.id = cp.class_id AND c.deleted_at IS NULL
  JOIN subjects sub ON sub.id = c.subject_id
  JOIN semesters sem ON sem.id = c.semester_id
  JOIN \`groups\` g ON g.id = cs.group_id AND g.deleted_at IS NULL
  LEFT JOIN users lecturer ON lecturer.id = c.lecturer_id
  LEFT JOIN (${latestEvaluationSql}) ev ON ev.target_type = 'checkpoint_submission' AND ev.target_id = cs.id
  WHERE cs.status IN ('submitted','resubmitted','graded')
  UNION ALL
  SELECT
    'assignment' AS target_type,
    a.id AS target_id,
    a.title AS target_title,
    a.deadline,
    a.max_score,
    c.id AS class_id,
    c.class_code,
    c.lecturer_id,
    lecturer.full_name AS lecturer_name,
    sub.id AS subject_id,
    sub.subject_code,
    sub.subject_name,
    sem.id AS semester_id,
    sem.semester_code,
    g.id AS group_id,
    g.group_code,
    g.group_name,
    g.topic,
    g.topic_desc,
    COALESCE(g.category, 'uncategorized') AS category,
    s.id AS submission_id,
    s.status AS submission_status,
    s.submitted_at,
    s.is_late,
    s.score,
    s.feedback,
    s.graded_by,
    s.graded_at,
    ev.id AS evaluation_session_id,
    ev.status AS evaluation_status,
    ev.rubric_id,
    COALESCE(s.graded_at, s.submitted_at, a.deadline) AS event_at,
    CASE WHEN s.score IS NOT NULL AND a.max_score > 0 THEN ROUND((s.score / a.max_score) * 10, 2) ELSE NULL END AS score_10
  FROM assignment_submissions s
  JOIN assignments a ON a.id = s.assignment_id AND a.deleted_at IS NULL
  JOIN classes c ON c.id = a.class_id AND c.deleted_at IS NULL
  JOIN subjects sub ON sub.id = c.subject_id
  JOIN semesters sem ON sem.id = c.semester_id
  JOIN \`groups\` g ON g.id = s.group_id AND g.deleted_at IS NULL
  LEFT JOIN users lecturer ON lecturer.id = c.lecturer_id
  LEFT JOIN (${latestEvaluationSql}) ev ON ev.target_type = 'assignment_submission' AND ev.target_id = s.id
  WHERE s.status IN ('submitted','resubmitted','graded')
`;

const progressRowsSql = `
  SELECT
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
    sub.subject_name,
    sem.id AS semester_id,
    sem.semester_code,
    g.id AS group_id,
    g.group_code,
    g.group_name,
    g.topic,
    g.topic_desc,
    COALESCE(g.category, 'uncategorized') AS category,
    cs.id AS submission_id,
    COALESCE(cs.status, 'not_submitted') AS submission_status,
    cs.submitted_at,
    COALESCE(cs.is_late, 0) AS is_late,
    cs.score,
    cs.feedback,
    cs.graded_by,
    cs.graded_at,
    ev.id AS evaluation_session_id,
    ev.status AS evaluation_status,
    ev.rubric_id,
    COALESCE(cs.graded_at, cs.submitted_at, cp.deadline) AS event_at,
    CASE WHEN cs.score IS NOT NULL AND cp.max_score > 0 THEN ROUND((cs.score / cp.max_score) * 10, 2) ELSE NULL END AS score_10
  FROM checkpoints cp
  JOIN classes c ON c.id = cp.class_id AND c.deleted_at IS NULL
  JOIN subjects sub ON sub.id = c.subject_id
  JOIN semesters sem ON sem.id = c.semester_id
  JOIN \`groups\` g ON g.class_id = c.id AND g.deleted_at IS NULL
  LEFT JOIN users lecturer ON lecturer.id = c.lecturer_id
  LEFT JOIN checkpoint_submissions cs ON cs.checkpoint_id = cp.id AND cs.group_id = g.id
  LEFT JOIN (${latestEvaluationSql}) ev ON ev.target_type = 'checkpoint_submission' AND ev.target_id = cs.id
  WHERE cp.deleted_at IS NULL AND cp.status <> 'draft'
  UNION ALL
  SELECT
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
    sub.subject_name,
    sem.id AS semester_id,
    sem.semester_code,
    g.id AS group_id,
    g.group_code,
    g.group_name,
    g.topic,
    g.topic_desc,
    COALESCE(g.category, 'uncategorized') AS category,
    s.id AS submission_id,
    COALESCE(s.status, 'not_submitted') AS submission_status,
    s.submitted_at,
    COALESCE(s.is_late, 0) AS is_late,
    s.score,
    s.feedback,
    s.graded_by,
    s.graded_at,
    ev.id AS evaluation_session_id,
    ev.status AS evaluation_status,
    ev.rubric_id,
    COALESCE(s.graded_at, s.submitted_at, a.deadline) AS event_at,
    CASE WHEN s.score IS NOT NULL AND a.max_score > 0 THEN ROUND((s.score / a.max_score) * 10, 2) ELSE NULL END AS score_10
  FROM assignments a
  JOIN classes c ON c.id = a.class_id AND c.deleted_at IS NULL
  JOIN subjects sub ON sub.id = c.subject_id
  JOIN semesters sem ON sem.id = c.semester_id
  JOIN \`groups\` g ON g.class_id = c.id AND g.deleted_at IS NULL
  LEFT JOIN users lecturer ON lecturer.id = c.lecturer_id
  LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.group_id = g.id
  LEFT JOIN (${latestEvaluationSql}) ev ON ev.target_type = 'assignment_submission' AND ev.target_id = s.id
  WHERE a.deleted_at IS NULL AND a.status <> 'archived'
`;

const rubricScoreRowsSql = `
  SELECT
    'checkpoint' AS target_type,
    cp.id AS target_id,
    cp.title AS target_title,
    c.id AS class_id,
    c.class_code,
    c.lecturer_id,
    sub.id AS subject_id,
    sub.subject_code,
    sub.subject_name,
    sem.id AS semester_id,
    sem.semester_code,
    g.id AS group_id,
    g.group_code,
    g.group_name,
    g.topic,
    r.id AS rubric_id,
    r.name AS rubric_name,
    r.version AS rubric_version,
    rc.id AS criterion_id,
    rc.name AS criterion_name,
    rc.max_score,
    rc.weight,
    esc.score,
    esc.feedback,
    es.id AS evaluation_session_id,
    es.status AS evaluation_status,
    es.evaluator_id,
    es.evaluated_at,
    CASE WHEN rc.max_score > 0 THEN ROUND((esc.score / rc.max_score) * 100, 2) ELSE NULL END AS score_percentage
  FROM evaluation_scores esc
  JOIN evaluation_sessions es ON es.id = esc.evaluation_session_id AND es.target_type = 'checkpoint_submission' AND es.is_official = 1
  JOIN rubric_criteria rc ON rc.id = esc.criterion_id
  JOIN rubrics r ON r.id = es.rubric_id
  JOIN checkpoint_submissions cs ON cs.id = es.target_id
  JOIN checkpoints cp ON cp.id = cs.checkpoint_id AND cp.deleted_at IS NULL
  JOIN classes c ON c.id = cp.class_id AND c.deleted_at IS NULL
  JOIN subjects sub ON sub.id = c.subject_id
  JOIN semesters sem ON sem.id = c.semester_id
  JOIN \`groups\` g ON g.id = cs.group_id AND g.deleted_at IS NULL
  UNION ALL
  SELECT
    'assignment' AS target_type,
    a.id AS target_id,
    a.title AS target_title,
    c.id AS class_id,
    c.class_code,
    c.lecturer_id,
    sub.id AS subject_id,
    sub.subject_code,
    sub.subject_name,
    sem.id AS semester_id,
    sem.semester_code,
    g.id AS group_id,
    g.group_code,
    g.group_name,
    g.topic,
    r.id AS rubric_id,
    r.name AS rubric_name,
    r.version AS rubric_version,
    rc.id AS criterion_id,
    rc.name AS criterion_name,
    rc.max_score,
    rc.weight,
    esc.score,
    esc.feedback,
    es.id AS evaluation_session_id,
    es.status AS evaluation_status,
    es.evaluator_id,
    es.evaluated_at,
    CASE WHEN rc.max_score > 0 THEN ROUND((esc.score / rc.max_score) * 100, 2) ELSE NULL END AS score_percentage
  FROM evaluation_scores esc
  JOIN evaluation_sessions es ON es.id = esc.evaluation_session_id AND es.target_type = 'assignment_submission' AND es.is_official = 1
  JOIN rubric_criteria rc ON rc.id = esc.criterion_id
  JOIN rubrics r ON r.id = es.rubric_id
  JOIN assignment_submissions s ON s.id = es.target_id
  JOIN assignments a ON a.id = s.assignment_id AND a.deleted_at IS NULL
  JOIN classes c ON c.id = a.class_id AND c.deleted_at IS NULL
  JOIN subjects sub ON sub.id = c.subject_id
  JOIN semesters sem ON sem.id = c.semester_id
  JOIN \`groups\` g ON g.id = s.group_id AND g.deleted_at IS NULL
`;

const addCommonFilters = (where, params, filters = {}, alias = "q") => {
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
  if (filters.targetType && filters.targetType !== "all") {
    where.push(`${prefix}target_type = :targetType`);
    params.targetType = filters.targetType;
  }
  if (filters.rubricId) {
    where.push(`${prefix}rubric_id = :rubricId`);
    params.rubricId = Number(filters.rubricId);
  }
  if (filters.dateFrom) {
    where.push(`DATE(${prefix}event_at) >= :dateFrom`);
    params.dateFrom = filters.dateFrom;
  }
  if (filters.dateTo) {
    where.push(`DATE(${prefix}event_at) <= :dateTo`);
    params.dateTo = filters.dateTo;
  }
};

const filteredProgress = (filters = {}) => {
  const where = ["1 = 1"];
  const params = {};
  addCommonFilters(where, params, filters);
  return {
    sql: `SELECT q.* FROM (${progressRowsSql}) q WHERE ${where.join(" AND ")}`,
    params,
  };
};

const filteredScores = (filters = {}) => {
  const where = ["q.score_10 IS NOT NULL"];
  const params = {};
  addCommonFilters(where, params, filters);
  return {
    sql: `SELECT q.* FROM (${scoreRowsSql}) q WHERE ${where.join(" AND ")}`,
    params,
  };
};

const filteredRubricScores = (filters = {}) => {
  const where = ["1 = 1"];
  const params = {};
  addCommonFilters(where, params, filters);
  if (filters.criterionId) {
    where.push("q.criterion_id = :criterionId");
    params.criterionId = Number(filters.criterionId);
  }
  return {
    sql: `SELECT q.* FROM (${rubricScoreRowsSql}) q WHERE ${where.join(" AND ")}`,
    params,
  };
};

export const createAnalyticsRepository = ({ db }) => {
  const findClassById = async (id) => {
    const [rows] = await db.execute(
      "SELECT id, class_code, lecturer_id FROM classes WHERE id = :id AND deleted_at IS NULL LIMIT 1",
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const getOverview = async (filters = {}) => {
    const progress = filteredProgress(filters);
    const scores = filteredScores(filters);
    const [[cards], [topClasses], [lowClasses], [statusRows], [scoreByClass], [completionByClass]] = await Promise.all([
      db.execute(
        `
          SELECT
            COUNT(DISTINCT class_id) AS total_classes,
            COUNT(DISTINCT group_id) AS total_groups,
            COUNT(DISTINCT group_id) AS total_projects,
            SUM(CASE WHEN submission_status IN ('submitted','resubmitted','graded') THEN 1 ELSE 0 END) AS total_submissions,
            SUM(CASE WHEN score IS NOT NULL OR submission_status = 'graded' OR evaluation_status IN ('submitted','confirmed') THEN 1 ELSE 0 END) AS graded_submissions,
            SUM(CASE WHEN submission_status IN ('submitted','resubmitted') AND score IS NULL AND COALESCE(evaluation_status, 'not_started') IN ('not_started','draft') THEN 1 ELSE 0 END) AS pending_grading,
            ROUND(AVG(score_10), 2) AS average_score,
            ROUND((SUM(CASE WHEN is_late = 1 AND submission_status IN ('submitted','resubmitted','graded') THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN submission_status IN ('submitted','resubmitted','graded') THEN 1 ELSE 0 END), 0)) * 100, 2) AS late_submission_rate,
            ROUND((SUM(CASE WHEN score IS NOT NULL OR submission_status = 'graded' OR evaluation_status IN ('submitted','confirmed') THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 2) AS completion_rate
          FROM (${progress.sql}) p
        `,
        progress.params,
      ),
      db.execute(
        `
          SELECT class_id, class_code, ROUND(AVG(score_10), 2) AS average_score, COUNT(*) AS graded_count
          FROM (${scores.sql}) s
          GROUP BY class_id, class_code
          ORDER BY average_score DESC, graded_count DESC
          LIMIT 1
        `,
        scores.params,
      ),
      db.execute(
        `
          SELECT class_id, class_code, ROUND(AVG(score_10), 2) AS average_score, COUNT(*) AS graded_count
          FROM (${scores.sql}) s
          GROUP BY class_id, class_code
          HAVING graded_count > 0
          ORDER BY average_score ASC, graded_count DESC
          LIMIT 1
        `,
        scores.params,
      ),
      db.execute(
        `
          SELECT submission_status AS status, COUNT(*) AS total
          FROM (${progress.sql}) p
          GROUP BY submission_status
          ORDER BY total DESC
        `,
        progress.params,
      ),
      db.execute(
        `
          SELECT class_id, class_code, ROUND(AVG(score_10), 2) AS average_score, COUNT(*) AS graded_count
          FROM (${scores.sql}) s
          GROUP BY class_id, class_code
          ORDER BY class_code ASC
          LIMIT 12
        `,
        scores.params,
      ),
      db.execute(
        `
          SELECT
            class_id,
            class_code,
            ROUND((SUM(CASE WHEN score IS NOT NULL OR submission_status = 'graded' OR evaluation_status IN ('submitted','confirmed') THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 2) AS completion_rate
          FROM (${progress.sql}) p
          GROUP BY class_id, class_code
          ORDER BY class_code ASC
          LIMIT 12
        `,
        progress.params,
      ),
    ]);

    const row = cards[0] || {};
    return {
      cards: {
        total_classes: num(row.total_classes),
        total_groups: num(row.total_groups),
        total_projects: num(row.total_projects),
        total_submissions: num(row.total_submissions),
        graded_submissions: num(row.graded_submissions),
        pending_grading: num(row.pending_grading),
        average_score: row.average_score === null ? null : num(row.average_score),
        late_submission_rate: row.late_submission_rate === null ? null : num(row.late_submission_rate),
        completion_rate: row.completion_rate === null ? null : num(row.completion_rate),
      },
      top_performing_class: topClasses[0] || null,
      lowest_performing_class: lowClasses[0] || null,
      charts: {
        submission_status_distribution: statusRows,
        average_score_by_class: scoreByClass,
        completion_rate_by_class: completionByClass,
      },
    };
  };

  const getAcademicQuality = async (filters = {}) => {
    const progress = filteredProgress(filters);
    const scores = filteredScores(filters);
    const [
      [bySemester],
      [bySubject],
      [byClass],
      [distribution],
      [completionByClass],
      [lateByClass],
      [topGroups],
      [bottomGroups],
      [tableRows],
    ] = await Promise.all([
      db.execute(
        `
          SELECT semester_id, semester_code, ROUND(AVG(score_10), 2) AS average_score, COUNT(*) AS graded_count
          FROM (${scores.sql}) s
          GROUP BY semester_id, semester_code
          ORDER BY semester_code ASC
        `,
        scores.params,
      ),
      db.execute(
        `
          SELECT subject_id, subject_code, subject_name, ROUND(AVG(score_10), 2) AS average_score, COUNT(*) AS graded_count
          FROM (${scores.sql}) s
          GROUP BY subject_id, subject_code, subject_name
          ORDER BY average_score DESC
        `,
        scores.params,
      ),
      db.execute(
        `
          SELECT class_id, class_code, ROUND(AVG(score_10), 2) AS average_score, COUNT(*) AS graded_count
          FROM (${scores.sql}) s
          GROUP BY class_id, class_code
          ORDER BY average_score DESC
        `,
        scores.params,
      ),
      db.execute(
        `
          SELECT bucket, COUNT(*) AS total
          FROM (
            SELECT
              CASE
                WHEN score_10 < 5 THEN '<5'
                WHEN score_10 < 6.5 THEN '5-6.5'
                WHEN score_10 < 8 THEN '6.5-8'
                ELSE '>=8'
              END AS bucket
            FROM (${scores.sql}) s
          ) buckets
          GROUP BY bucket
          ORDER BY FIELD(bucket, '<5', '5-6.5', '6.5-8', '>=8')
        `,
        scores.params,
      ),
      db.execute(
        `
          SELECT class_id, class_code,
                 ROUND((SUM(CASE WHEN score IS NOT NULL OR submission_status = 'graded' OR evaluation_status IN ('submitted','confirmed') THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 2) AS completion_rate
          FROM (${progress.sql}) p
          GROUP BY class_id, class_code
          ORDER BY completion_rate DESC
        `,
        progress.params,
      ),
      db.execute(
        `
          SELECT class_id, class_code,
                 ROUND((SUM(CASE WHEN is_late = 1 AND submission_status IN ('submitted','resubmitted','graded') THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN submission_status IN ('submitted','resubmitted','graded') THEN 1 ELSE 0 END), 0)) * 100, 2) AS late_rate
          FROM (${progress.sql}) p
          GROUP BY class_id, class_code
          ORDER BY late_rate DESC
        `,
        progress.params,
      ),
      db.execute(
        `
          SELECT group_id, group_code, group_name, topic, class_code, ROUND(AVG(score_10), 2) AS average_score, COUNT(*) AS graded_count
          FROM (${scores.sql}) s
          GROUP BY group_id, group_code, group_name, topic, class_code
          ORDER BY average_score DESC, graded_count DESC
          LIMIT 10
        `,
        scores.params,
      ),
      db.execute(
        `
          SELECT group_id, group_code, group_name, topic, class_code, ROUND(AVG(score_10), 2) AS average_score, COUNT(*) AS graded_count
          FROM (${scores.sql}) s
          GROUP BY group_id, group_code, group_name, topic, class_code
          ORDER BY average_score ASC, graded_count DESC
          LIMIT 10
        `,
        scores.params,
      ),
      db.execute(
        `
          SELECT
            semester_id,
            semester_code,
            subject_id,
            subject_code,
            subject_name,
            class_id,
            class_code,
            COUNT(DISTINCT group_id) AS total_groups,
            ROUND(AVG(score_10), 2) AS average_score,
            NULL AS median_score,
            ROUND(MAX(score_10), 2) AS highest_score,
            ROUND(MIN(score_10), 2) AS lowest_score,
            SUM(CASE WHEN score IS NOT NULL OR submission_status = 'graded' OR evaluation_status IN ('submitted','confirmed') THEN 1 ELSE 0 END) AS graded_count,
            SUM(CASE WHEN submission_status IN ('submitted','resubmitted') AND score IS NULL AND COALESCE(evaluation_status, 'not_started') IN ('not_started','draft') THEN 1 ELSE 0 END) AS pending_count,
            ROUND((SUM(CASE WHEN score IS NOT NULL OR submission_status = 'graded' OR evaluation_status IN ('submitted','confirmed') THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 2) AS completion_rate,
            ROUND((SUM(CASE WHEN is_late = 1 AND submission_status IN ('submitted','resubmitted','graded') THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN submission_status IN ('submitted','resubmitted','graded') THEN 1 ELSE 0 END), 0)) * 100, 2) AS late_rate
          FROM (${progress.sql}) p
          GROUP BY semester_id, semester_code, subject_id, subject_code, subject_name, class_id, class_code
          ORDER BY semester_code DESC, subject_code ASC, class_code ASC
        `,
        progress.params,
      ),
    ]);

    return {
      average_score_by_semester: bySemester,
      average_score_by_subject: bySubject,
      average_score_by_class: byClass,
      score_distribution: distribution,
      completion_rate_by_class: completionByClass,
      late_submission_rate_by_class: lateByClass,
      top_groups: topGroups,
      bottom_groups: bottomGroups,
      table: tableRows,
    };
  };

  const getGradingAnalytics = async (filters = {}) => {
    const progress = filteredProgress(filters);
    const [[tableRows], [waitingLongest]] = await Promise.all([
      db.execute(
        `
          SELECT
            COALESCE(lecturer_id, 0) AS lecturer_id,
            COALESCE(lecturer_name, 'Unassigned') AS lecturer,
            COUNT(DISTINCT class_id) AS assigned_classes,
            SUM(CASE WHEN submission_status IN ('submitted','resubmitted','graded') THEN 1 ELSE 0 END) AS total_submissions,
            SUM(CASE WHEN score IS NOT NULL OR submission_status = 'graded' OR evaluation_status IN ('submitted','confirmed') THEN 1 ELSE 0 END) AS graded_submissions,
            SUM(CASE WHEN submission_status IN ('submitted','resubmitted') AND score IS NULL AND COALESCE(evaluation_status, 'not_started') IN ('not_started','draft') THEN 1 ELSE 0 END) AS pending_submissions,
            SUM(CASE WHEN evaluation_status = 'draft' THEN 1 ELSE 0 END) AS draft_evaluations,
            SUM(CASE WHEN evaluation_status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_evaluations,
            ROUND(AVG(CASE WHEN submitted_at IS NOT NULL AND graded_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, submitted_at, graded_at) END), 2) AS average_grading_delay_hours,
            MAX(graded_at) AS last_graded_at
          FROM (${progress.sql}) p
          GROUP BY lecturer_id, lecturer_name
          ORDER BY pending_submissions DESC, graded_submissions DESC
        `,
        progress.params,
      ),
      db.execute(
        `
          SELECT target_type, target_id, target_title, class_code, group_code, group_name, submitted_at,
                 TIMESTAMPDIFF(HOUR, submitted_at, NOW()) AS waiting_hours
          FROM (${progress.sql}) p
          WHERE submission_status IN ('submitted','resubmitted')
            AND score IS NULL
            AND COALESCE(evaluation_status, 'not_started') IN ('not_started','draft')
            AND submitted_at IS NOT NULL
          ORDER BY submitted_at ASC
          LIMIT 10
        `,
        progress.params,
      ),
    ]);

    return {
      table: tableRows,
      pending_grading_by_lecturer: tableRows.map((row) => ({ lecturer: row.lecturer, total: num(row.pending_submissions) })),
      graded_count_by_lecturer: tableRows.map((row) => ({ lecturer: row.lecturer, total: num(row.graded_submissions) })),
      draft_evaluations_count: tableRows.reduce((sum, row) => sum + num(row.draft_evaluations), 0),
      confirmed_evaluations_count: tableRows.reduce((sum, row) => sum + num(row.confirmed_evaluations), 0),
      submissions_waiting_longest: waitingLongest,
    };
  };

  const getRubricAnalytics = async (filters = {}) => {
    const rubricScores = filteredRubricScores(filters);
    const [[tableRows], [usageRows], [lowScoreGroups]] = await Promise.all([
      db.execute(
        `
          SELECT
            rubric_id,
            rubric_name,
            rubric_version,
            criterion_id,
            criterion_name,
            max_score,
            weight,
            ROUND(AVG(score), 2) AS average_score,
            ROUND(AVG(score_percentage), 2) AS average_percentage,
            COUNT(*) AS total_evaluations,
            SUM(CASE WHEN score_percentage < 50 THEN 1 ELSE 0 END) AS low_score_count,
            SUM(CASE WHEN feedback IS NOT NULL AND TRIM(feedback) <> '' THEN 1 ELSE 0 END) AS feedback_count
          FROM (${rubricScores.sql}) q
          GROUP BY rubric_id, rubric_name, rubric_version, criterion_id, criterion_name, max_score, weight
          ORDER BY average_percentage ASC, total_evaluations DESC
        `,
        rubricScores.params,
      ),
      db.execute(
        `
          SELECT r.id AS rubric_id, r.name AS rubric_name, r.version AS rubric_version,
                 COUNT(DISTINCT rb.id) AS binding_count,
                 COUNT(DISTINCT es.id) AS evaluation_count
          FROM rubrics r
          LEFT JOIN rubric_bindings rb ON rb.rubric_id = r.id
          LEFT JOIN evaluation_sessions es ON es.rubric_id = r.id AND es.is_official = 1
          WHERE r.deleted_at IS NULL
          GROUP BY r.id, r.name, r.version
          ORDER BY evaluation_count DESC, binding_count DESC
          LIMIT 20
        `,
      ),
      db.execute(
        `
          SELECT group_id, group_code, group_name, topic, class_code, rubric_name, criterion_name,
                 score, max_score, score_percentage, feedback
          FROM (${rubricScores.sql}) q
          WHERE score_percentage < 50
          ORDER BY score_percentage ASC, evaluated_at DESC
          LIMIT 20
        `,
        rubricScores.params,
      ),
    ]);

    const sortedByAverage = [...tableRows].sort((a, b) => num(a.average_percentage) - num(b.average_percentage));
    return {
      table: tableRows,
      average_score_by_criterion: tableRows,
      lowest_scoring_criteria: sortedByAverage.slice(0, 10),
      highest_scoring_criteria: sortedByAverage.slice(-10).reverse(),
      criteria_requiring_most_feedback: [...tableRows].sort((a, b) => num(b.feedback_count) - num(a.feedback_count)).slice(0, 10),
      rubric_usage_count: usageRows,
      low_score_groups: lowScoreGroups,
    };
  };

  const getProjectAnalytics = async (filters = {}) => {
    const progress = filteredProgress(filters);
    const projectSql = `
      SELECT
        group_id,
        group_code,
        group_name,
        topic,
        topic_desc,
        category,
        class_id,
        class_code,
        semester_id,
        semester_code,
        COUNT(*) AS expected_items,
        SUM(CASE WHEN submission_status IN ('submitted','resubmitted','graded') THEN 1 ELSE 0 END) AS submitted_items,
        SUM(CASE WHEN score IS NOT NULL OR submission_status = 'graded' OR evaluation_status IN ('submitted','confirmed') THEN 1 ELSE 0 END) AS graded_items,
        SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END) AS late_count,
        ROUND(AVG(score_10), 2) AS average_score,
        ROUND(MAX(CASE WHEN LOWER(target_title) LIKE '%final%' THEN score_10 END), 2) AS final_score,
        ROUND((SUM(CASE WHEN score IS NOT NULL OR submission_status = 'graded' OR evaluation_status IN ('submitted','confirmed') THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 2) AS completion_rate
      FROM (${progress.sql}) p
      GROUP BY group_id, group_code, group_name, topic, topic_desc, category, class_id, class_code, semester_id, semester_code
    `;
    const [[projectRows], [categoryRows], [averageByCategory], [missingRows]] = await Promise.all([
      db.execute(
        `
          SELECT projects.*,
                 CASE
                   WHEN average_score >= 8 AND completion_rate >= 80 AND late_count <= 1 THEN 'high_potential'
                   WHEN average_score < 5 OR completion_rate < 50 OR late_count >= 3 OR submitted_items < expected_items THEN 'at_risk'
                   ELSE 'watchlist'
                 END AS recommendation_flag
          FROM (${projectSql}) projects
          ORDER BY
            FIELD(
              CASE
                WHEN average_score >= 8 AND completion_rate >= 80 AND late_count <= 1 THEN 'high_potential'
                WHEN average_score < 5 OR completion_rate < 50 OR late_count >= 3 OR submitted_items < expected_items THEN 'at_risk'
                ELSE 'watchlist'
              END,
              'high_potential', 'watchlist', 'at_risk'
            ),
            average_score DESC,
            completion_rate DESC
        `,
        progress.params,
      ),
      db.execute(
        `
          SELECT category, COUNT(*) AS total
          FROM (${projectSql}) projects
          GROUP BY category
          ORDER BY total DESC
        `,
        progress.params,
      ),
      db.execute(
        `
          SELECT category, ROUND(AVG(average_score), 2) AS average_score, COUNT(*) AS total
          FROM (${projectSql}) projects
          WHERE average_score IS NOT NULL
          GROUP BY category
          ORDER BY average_score DESC
        `,
        progress.params,
      ),
      db.execute(
        `
          SELECT *
          FROM (${projectSql}) projects
          WHERE submitted_items < expected_items
          ORDER BY (expected_items - submitted_items) DESC, group_code ASC
          LIMIT 20
        `,
        progress.params,
      ),
    ]);

    return {
      projects_by_category: categoryRows,
      average_score_by_category: averageByCategory,
      potential_projects: projectRows,
      top_potential_projects: projectRows.filter((row) => row.recommendation_flag === "high_potential").slice(0, 10),
      high_score_projects: projectRows.filter((row) => num(row.average_score) >= 8).slice(0, 10),
      projects_missing_submissions: missingRows,
      projects_with_consistent_improvement: [],
      projects_with_strong_feedback_keywords: [],
    };
  };

  const getLecturerAnalytics = async (filters = {}) => {
    const [overview, academicQuality, grading, rubric, projects] = await Promise.all([
      getOverview(filters),
      getAcademicQuality(filters),
      getGradingAnalytics(filters),
      getRubricAnalytics(filters),
      getProjectAnalytics(filters),
    ]);

    return {
      cards: {
        my_classes: overview.cards.total_classes,
        my_classes_average_score: overview.cards.average_score,
        pending_grading: overview.cards.pending_grading,
        late_submissions: overview.cards.late_submission_rate,
        groups_needing_attention: projects.potential_projects.filter((row) => row.recommendation_flag === "at_risk").length,
      },
      class_performance: academicQuality.table,
      top_groups: academicQuality.top_groups,
      groups_needing_attention: projects.potential_projects.filter((row) => row.recommendation_flag === "at_risk").slice(0, 10),
      average_score_by_target: overview.charts.average_score_by_class,
      rubric_criteria_weakness: rubric.lowest_scoring_criteria,
      submissions_waiting_longest: grading.submissions_waiting_longest,
    };
  };

  return {
    findClassById,
    getOverview,
    getAcademicQuality,
    getGradingAnalytics,
    getRubricAnalytics,
    getProjectAnalytics,
    getLecturerAnalytics,
  };
};
