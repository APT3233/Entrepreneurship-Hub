const pageSql = (limit, offset) => `LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
const num = (value) => Number(value || 0);

const addClassFilters = (where, params, classAlias, filters = {}) => {
  if (filters.classId) { where.push(`${classAlias}.id = :classId`); params.classId = Number(filters.classId); }
  if (filters.semesterId) { where.push(`${classAlias}.semester_id = :semesterId`); params.semesterId = Number(filters.semesterId); }
  if (filters.subjectId) { where.push(`${classAlias}.subject_id = :subjectId`); params.subjectId = Number(filters.subjectId); }
  if (filters.lecturerId) { where.push(`${classAlias}.lecturer_id = :lecturerId`); params.lecturerId = Number(filters.lecturerId); }
};

const addMentorFilters = (where, params, mentorAlias, filters = {}) => {
  if (filters.mentorType) { where.push(`${mentorAlias}.mentor_type = :mentorType`); params.mentorType = filters.mentorType; }
  if (filters.expertiseId) {
    where.push(`EXISTS (SELECT 1 FROM mentor_expertise_map mem_filter WHERE mem_filter.mentor_id = ${mentorAlias}.id AND mem_filter.expertise_id = :expertiseId)`);
    params.expertiseId = Number(filters.expertiseId);
  }
};

const addDateFilters = (where, params, dateExpr, filters = {}) => {
  if (filters.dateFrom) { where.push(`${dateExpr} >= :dateFrom`); params.dateFrom = filters.dateFrom; }
  if (filters.dateTo) { where.push(`${dateExpr} <= :dateTo`); params.dateTo = filters.dateTo; }
};

const assignmentWhere = (filters = {}) => {
  const where = ["ma.deleted_at IS NULL"];
  const params = {};
  addClassFilters(where, params, "c", filters);
  addMentorFilters(where, params, "mp", filters);
  addDateFilters(where, params, "ma.created_at", filters);
  return { sql: where.join(" AND "), params };
};

const sessionWhere = (filters = {}) => {
  const where = ["ms.deleted_at IS NULL"];
  const params = {};
  addClassFilters(where, params, "c", filters);
  addMentorFilters(where, params, "mp", filters);
  addDateFilters(where, params, "ms.scheduled_start_at", filters);
  return { sql: where.join(" AND "), params };
};

export const createMentorAnalyticsRepository = ({ db }) => {
  const getOverview = async (filters = {}) => {
    const mentorWhere = ["mp.deleted_at IS NULL"];
    const mentorParams = {};
    addMentorFilters(mentorWhere, mentorParams, "mp", filters);
    const [mentorRows] = await db.execute(
      `SELECT COUNT(*) AS total_mentors,
              SUM(mp.status = 'active') AS active_mentors,
              SUM(mp.status = 'pending') AS pending_mentors,
              SUM(mp.mentor_type = 'business') AS business_mentors,
              SUM(mp.mentor_type = 'technical') AS technical_mentors
       FROM mentor_profiles mp WHERE ${mentorWhere.join(" AND ")}`,
      mentorParams,
    );

    const aw = assignmentWhere(filters);
    const [assignmentRows] = await db.execute(
      `SELECT COUNT(*) AS active_assignments
       FROM mentor_assignments ma JOIN mentor_profiles mp ON mp.id = ma.mentor_id JOIN classes c ON c.id = ma.class_id
       WHERE ma.status = 'active' AND ${aw.sql}`,
      aw.params,
    );

    const sw = sessionWhere(filters);
    const [sessionRows] = await db.execute(
      `SELECT SUM(ms.status = 'completed') AS completed_sessions,
              COALESCE(SUM(CASE WHEN ms.status = 'completed' THEN ms.duration_minutes ELSE 0 END), 0) AS total_minutes,
              AVG(mf.rating) AS average_mentor_rating
       FROM mentoring_sessions ms
       JOIN mentor_profiles mp ON mp.id = ms.mentor_id
       JOIN classes c ON c.id = ms.class_id
       LEFT JOIN mentoring_feedbacks mf ON mf.session_id = ms.id AND mf.target_type = 'mentor' AND mf.rating IS NOT NULL
       WHERE ${sw.sql}`,
      sw.params,
    );

    const groupWhere = ["g.deleted_at IS NULL"];
    const groupParams = {};
    addClassFilters(groupWhere, groupParams, "c", filters);
    const [groupRows] = await db.execute(
      `SELECT SUM(NOT EXISTS (SELECT 1 FROM mentor_assignments ma WHERE ma.group_id = g.id AND ma.status = 'active' AND ma.deleted_at IS NULL)) AS groups_without_mentor,
              SUM(EXISTS (SELECT 1 FROM mentor_assignments ma WHERE ma.group_id = g.id AND ma.status = 'active' AND ma.deleted_at IS NULL)
                  AND NOT EXISTS (SELECT 1 FROM mentoring_sessions ms WHERE ms.group_id = g.id AND ms.deleted_at IS NULL)) AS groups_without_session
       FROM \`groups\` g JOIN classes c ON c.id = g.class_id WHERE ${groupWhere.join(" AND ")}`,
      groupParams,
    );

    return {
      ...mentorRows[0],
      ...assignmentRows[0],
      completed_sessions: num(sessionRows[0]?.completed_sessions),
      total_mentoring_hours: Number((num(sessionRows[0]?.total_minutes) / 60).toFixed(2)),
      average_mentor_rating: sessionRows[0]?.average_mentor_rating == null ? null : Number(Number(sessionRows[0].average_mentor_rating).toFixed(2)),
      groups_without_mentor: num(groupRows[0]?.groups_without_mentor),
      groups_without_session: num(groupRows[0]?.groups_without_session),
    };
  };

  const listWorkload = async (filters = {}) => {
    const where = ["mp.deleted_at IS NULL"];
    const params = { limit: filters.limit, offset: filters.offset };
    addMentorFilters(where, params, "mp", filters);
    addClassFilters(where, params, "c", filters);
    if (filters.search) { where.push("(mp.full_name LIKE :search OR mp.organization LIKE :search)"); params.search = `%${filters.search}%`; }
    const [rows] = await db.execute(
      `SELECT mp.id, mp.full_name, mp.mentor_type, mp.organization,
              COUNT(DISTINCT CASE WHEN ma.status = 'active' THEN ma.id END) AS active_assignments,
              COUNT(DISTINCT CASE WHEN ms.status = 'scheduled' THEN ms.id END) AS scheduled_sessions,
              COUNT(DISTINCT CASE WHEN ms.status = 'completed' THEN ms.id END) AS completed_sessions,
              COALESCE(SUM(CASE WHEN ms.status = 'completed' THEN ms.duration_minutes ELSE 0 END), 0) AS total_minutes,
              AVG(mf.rating) AS average_rating,
              SUM(CASE WHEN ms.status = 'completed' AND mf.id IS NULL THEN 1 ELSE 0 END) AS pending_feedback_count,
              MAX(ms.scheduled_start_at) AS last_session_at
       FROM mentor_profiles mp
       LEFT JOIN mentor_assignments ma ON ma.mentor_id = mp.id AND ma.deleted_at IS NULL
       LEFT JOIN classes c ON c.id = ma.class_id
       LEFT JOIN mentoring_sessions ms ON ms.mentor_id = mp.id AND ms.deleted_at IS NULL
       LEFT JOIN mentoring_feedbacks mf ON mf.session_id = ms.id AND mf.target_type = 'mentor'
       WHERE ${where.join(" AND ")}
       GROUP BY mp.id ORDER BY active_assignments DESC, scheduled_sessions DESC, mp.full_name ASC ${pageSql(filters.limit, filters.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(
      `SELECT COUNT(DISTINCT mp.id) AS total
       FROM mentor_profiles mp
       LEFT JOIN mentor_assignments ma ON ma.mentor_id = mp.id AND ma.deleted_at IS NULL
       LEFT JOIN classes c ON c.id = ma.class_id
       WHERE ${where.join(" AND ")}`,
      params,
    );
    return { rows: rows.map((row) => ({ ...row, total_hours: Number((num(row.total_minutes) / 60).toFixed(2)), workload_status: num(row.active_assignments) >= 6 ? "overloaded" : num(row.active_assignments) >= 4 ? "high" : num(row.active_assignments) >= 2 ? "normal" : "low" })), total: num(totalRows[0]?.total) };
  };

  const listEffectiveness = async (filters = {}) => {
    const where = ["mp.deleted_at IS NULL"];
    const params = { limit: filters.limit, offset: filters.offset };
    addMentorFilters(where, params, "mp", filters);
    addClassFilters(where, params, "c", filters);
    const [rows] = await db.execute(
      `SELECT mp.id, mp.full_name, mp.mentor_type, mp.organization,
              COUNT(DISTINCT ma.group_id) AS total_groups_supported,
              NULL AS average_group_score_before,
              NULL AS average_group_score_after,
              AVG(mf.rating) AS average_session_rating,
              AVG(CASE WHEN mf.from_role = 'student' THEN mf.rating END) AS student_feedback_score,
              AVG(CASE WHEN mf.from_role = 'lecturer' THEN mf.rating END) AS lecturer_feedback_score,
              ROUND((SUM(ai.status = 'done') / NULLIF(COUNT(ai.id), 0)) * 100, 2) AS completed_action_items_rate,
              COUNT(DISTINCT ma.semester_id) AS semesters_supported
       FROM mentor_profiles mp
       LEFT JOIN mentor_assignments ma ON ma.mentor_id = mp.id AND ma.deleted_at IS NULL
       LEFT JOIN classes c ON c.id = ma.class_id
       LEFT JOIN mentoring_sessions ms ON ms.assignment_id = ma.id AND ms.deleted_at IS NULL
       LEFT JOIN mentoring_feedbacks mf ON mf.session_id = ms.id AND mf.rating IS NOT NULL
       LEFT JOIN mentoring_action_items ai ON ai.session_id = ms.id
       WHERE ${where.join(" AND ")}
       GROUP BY mp.id ORDER BY average_session_rating DESC, total_groups_supported DESC ${pageSql(filters.limit, filters.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(
      `SELECT COUNT(DISTINCT mp.id) AS total
       FROM mentor_profiles mp
       LEFT JOIN mentor_assignments ma ON ma.mentor_id = mp.id AND ma.deleted_at IS NULL
       LEFT JOIN classes c ON c.id = ma.class_id
       WHERE ${where.join(" AND ")}`,
      params,
    );
    return { rows: rows.map((row) => ({ ...row, continuation_rate: num(row.semesters_supported) > 1 ? 100 : 0 })), total: num(totalRows[0]?.total) };
  };

  const getMatchingAnalytics = async (filters = {}) => {
    const where = ["1=1"];
    const params = {};
    addClassFilters(where, params, "c", filters);
    const [summaryRows] = await db.execute(
      `SELECT COUNT(DISTINCT mmr.id) AS total_matching_requests,
              COUNT(ms.id) AS generated_suggestions,
              SUM(a.action = 'converted_to_assignment') AS suggestions_converted_to_assignments,
              AVG(ms.score) AS average_matching_score,
              SUM(ms.matching_method = 'ai') AS ai_suggestions,
              SUM(ms.matching_method = 'rule_based') AS rule_based_suggestions,
              SUM(ms.matching_method = 'hybrid') AS hybrid_suggestions
       FROM mentor_matching_requests mmr
       JOIN classes c ON c.id = mmr.class_id
       LEFT JOIN mentor_matching_suggestions ms ON ms.request_id = mmr.id
       LEFT JOIN mentor_matching_actions a ON a.suggestion_id = ms.id
       WHERE ${where.join(" AND ")}`,
      params,
    );
    const [expertiseRows] = await db.execute(
      `SELECT ea.id, ea.name, ea.category, COUNT(*) AS demand_count
       FROM mentor_matching_requests mmr
       JOIN classes c ON c.id = mmr.class_id
       JOIN JSON_TABLE(mmr.required_expertise, '$[*]' COLUMNS (expertise_id BIGINT PATH '$')) jt
       JOIN mentor_expertise_areas ea ON ea.id = jt.expertise_id
       WHERE ${where.join(" AND ")}
       GROUP BY ea.id ORDER BY demand_count DESC LIMIT 10`,
      params,
    );
    const [typeRows] = await db.execute(
      `SELECT preferred_mentor_type, COUNT(*) AS total FROM mentor_matching_requests mmr JOIN classes c ON c.id = mmr.class_id WHERE ${where.join(" AND ")} GROUP BY preferred_mentor_type`,
      params,
    );
    const summary = summaryRows[0] || {};
    const generated = num(summary.generated_suggestions);
    const converted = num(summary.suggestions_converted_to_assignments);
    return { ...summary, conversion_rate: generated ? Number(((converted / generated) * 100).toFixed(2)) : 0, top_expertise_requested: expertiseRows, most_matched_mentor_types: typeRows };
  };

  const getExpertiseHeatmap = async () => {
    const [rows] = await db.execute(
      `SELECT ea.id, ea.code, ea.name, ea.category,
              COUNT(DISTINCT mem.mentor_id) AS number_of_mentors,
              COALESCE(demand.demand_from_groups, 0) AS demand_from_groups,
              COUNT(DISTINCT ma.id) AS assignment_count
       FROM mentor_expertise_areas ea
       LEFT JOIN mentor_expertise_map mem ON mem.expertise_id = ea.id
       LEFT JOIN mentor_assignments ma ON ma.mentor_id = mem.mentor_id AND ma.deleted_at IS NULL
       LEFT JOIN (
         SELECT jt.expertise_id, COUNT(DISTINCT mmr.id) AS demand_from_groups
         FROM mentor_matching_requests mmr
         JOIN JSON_TABLE(mmr.required_expertise, '$[*]' COLUMNS (expertise_id BIGINT PATH '$')) jt
         GROUP BY jt.expertise_id
       ) demand ON demand.expertise_id = ea.id
       WHERE ea.status = 'active'
       GROUP BY ea.id, demand.demand_from_groups ORDER BY demand_from_groups DESC, number_of_mentors ASC`,
    );
    return rows.map((row) => {
      const mentors = num(row.number_of_mentors);
      const demand = num(row.demand_from_groups) + num(row.assignment_count);
      const gap_status = mentors === 0 && demand > 0 ? "critical" : demand > mentors * 3 ? "shortage" : "enough";
      return { ...row, gap_status };
    });
  };

  const listGroupSupport = async (filters = {}) => {
    const where = ["g.deleted_at IS NULL"];
    const params = { limit: filters.limit, offset: filters.offset };
    addClassFilters(where, params, "c", filters);
    if (filters.search) { where.push("(g.group_name LIKE :search OR g.topic LIKE :search OR c.class_code LIKE :search)"); params.search = `%${filters.search}%`; }
    const [rows] = await db.execute(
      `SELECT g.id, g.group_code, g.group_name, g.topic, c.class_code,
              COUNT(DISTINCT CASE WHEN ma.status = 'active' THEN ma.mentor_id END) AS active_mentors,
              COUNT(DISTINCT CASE WHEN ms.status = 'completed' THEN ms.id END) AS sessions_completed,
              MAX(ms.scheduled_start_at) AS last_session,
              COUNT(DISTINCT mf.id) AS feedback_count
       FROM \`groups\` g
       JOIN classes c ON c.id = g.class_id
       LEFT JOIN mentor_assignments ma ON ma.group_id = g.id AND ma.deleted_at IS NULL
       LEFT JOIN mentoring_sessions ms ON ms.group_id = g.id AND ms.deleted_at IS NULL
       LEFT JOIN mentoring_feedbacks mf ON mf.session_id = ms.id
       WHERE ${where.join(" AND ")}
       GROUP BY g.id ORDER BY active_mentors ASC, sessions_completed ASC, g.group_name ASC ${pageSql(filters.limit, filters.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM \`groups\` g JOIN classes c ON c.id = g.class_id WHERE ${where.join(" AND ")}`, params);
    return { rows: rows.map((row) => ({ ...row, mentor_assigned: num(row.active_mentors) > 0, feedback_status: num(row.feedback_count) ? "has_feedback" : "missing_feedback", support_status: num(row.active_mentors) === 0 ? "no_mentor" : num(row.sessions_completed) === 0 ? "no_session" : num(row.feedback_count) === 0 ? "needs_attention" : "on_track" })), total: num(totalRows[0]?.total) };
  };

  const getEcosystem = async () => {
    const [[byOrganization], [byType], [byStatus], [retainedRows]] = await Promise.all([
      db.execute("SELECT COALESCE(NULLIF(organization, ''), 'Unknown') AS organization, COUNT(*) AS total FROM mentor_profiles WHERE deleted_at IS NULL GROUP BY COALESCE(NULLIF(organization, ''), 'Unknown') ORDER BY total DESC LIMIT 15"),
      db.execute("SELECT mentor_type, COUNT(*) AS total FROM mentor_profiles WHERE deleted_at IS NULL GROUP BY mentor_type"),
      db.execute("SELECT status, COUNT(*) AS total FROM mentor_profiles WHERE deleted_at IS NULL GROUP BY status"),
      db.execute("SELECT COUNT(*) AS retained_mentors FROM (SELECT mentor_id FROM mentor_assignments WHERE deleted_at IS NULL GROUP BY mentor_id HAVING COUNT(DISTINCT semester_id) > 1) x"),
    ]);
    return { mentors_by_organization: byOrganization, mentors_by_type: byType, mentors_by_status: byStatus, retained_mentors: num(retainedRows[0]?.retained_mentors) };
  };

  const getMentorDashboard = async (mentorUserId) => {
    const [mentorRows] = await db.execute("SELECT * FROM mentor_profiles WHERE user_id = :userId AND deleted_at IS NULL LIMIT 1", { userId: Number(mentorUserId) });
    const mentor = mentorRows[0] || null;
    if (!mentor) return null;
    const [assignments] = await db.execute(
      `SELECT ma.*, g.group_name, g.topic, c.class_code FROM mentor_assignments ma JOIN \`groups\` g ON g.id = ma.group_id JOIN classes c ON c.id = ma.class_id WHERE ma.mentor_id = :mentorId AND ma.deleted_at IS NULL ORDER BY ma.created_at DESC LIMIT 10`,
      { mentorId: Number(mentor.id) },
    );
    const [sessionRows] = await db.execute(
      `SELECT COUNT(*) AS total_sessions,
              SUM(ms.status = 'completed') AS completed_sessions,
              SUM(ms.status = 'scheduled') AS upcoming_sessions,
              COALESCE(SUM(CASE WHEN ms.status = 'completed' THEN ms.duration_minutes ELSE 0 END), 0) AS total_minutes
       FROM mentoring_sessions ms WHERE ms.mentor_id = :mentorId AND ms.deleted_at IS NULL`,
      { mentorId: Number(mentor.id) },
    );
    const [feedbackRows] = await db.execute("SELECT AVG(rating) AS average_rating, COUNT(*) AS feedback_count FROM mentoring_feedbacks WHERE target_type = 'mentor' AND target_id = :mentorId AND rating IS NOT NULL", { mentorId: Number(mentor.id) });
    const [actionItems] = await db.execute(
      `SELECT ai.*, g.group_name, ms.title AS session_title FROM mentoring_action_items ai JOIN mentoring_sessions ms ON ms.id = ai.session_id JOIN \`groups\` g ON g.id = ai.group_id WHERE ms.mentor_id = :mentorId AND ai.status IN ('open','in_progress') ORDER BY ai.due_date ASC, ai.created_at DESC LIMIT 10`,
      { mentorId: Number(mentor.id) },
    );
    return { mentor, assignments, metrics: { ...sessionRows[0], total_hours: Number((num(sessionRows[0]?.total_minutes) / 60).toFixed(2)), ...feedbackRows[0] }, action_items: actionItems };
  };

  return { getOverview, listWorkload, listEffectiveness, getMatchingAnalytics, getExpertiseHeatmap, listGroupSupport, getEcosystem, getMentorDashboard };
};
