const pageSql = (limit, offset) => `LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

const parseJson = (value, fallback = null) => {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  try { return JSON.parse(value || "null") ?? fallback; } catch { return fallback; }
};

const parseExpertiseBlob = (blob) => String(blob || "")
  .split(";;")
  .map((part) => {
    const [id, code, name, category, level] = part.split("|");
    if (!id) return null;
    return { id: Number(id), code, name, category, level };
  })
  .filter(Boolean);

const requestSelect = `
  mmr.*,
  g.group_code, g.group_name, g.topic, g.category, g.topic_desc,
  c.class_code, c.class_name, c.lecturer_id, c.subject_id,
  sem.semester_code, sem.semester_name,
  requester.full_name AS requested_by_name,
  (SELECT COUNT(*) FROM mentor_matching_suggestions s WHERE s.request_id = mmr.id) AS suggestion_count,
  (SELECT MAX(s.score) FROM mentor_matching_suggestions s WHERE s.request_id = mmr.id) AS top_score
`;

const requestFrom = `
  FROM mentor_matching_requests mmr
  JOIN \`groups\` g ON g.id = mmr.group_id
  JOIN classes c ON c.id = mmr.class_id
  JOIN semesters sem ON sem.id = mmr.semester_id
  LEFT JOIN users requester ON requester.id = mmr.requested_by
`;

export const createMentorMatchingRepository = ({ db }) => {
  const requestWhere = (query = {}) => {
    const where = ["1=1"];
    const params = {};
    if (query.groupId) { where.push("mmr.group_id = :groupId"); params.groupId = Number(query.groupId); }
    if (query.classId) { where.push("mmr.class_id = :classId"); params.classId = Number(query.classId); }
    if (query.semesterId) { where.push("mmr.semester_id = :semesterId"); params.semesterId = Number(query.semesterId); }
    if (query.status) { where.push("mmr.status = :status"); params.status = query.status; }
    if (query.priority) { where.push("mmr.priority = :priority"); params.priority = query.priority; }
    if (query.lecturerId) { where.push("c.lecturer_id = :lecturerId"); params.lecturerId = Number(query.lecturerId); }
    if (query.search) {
      where.push("(g.group_name LIKE :search OR g.topic LIKE :search OR c.class_code LIKE :search OR mmr.support_needed LIKE :search)");
      params.search = `%${query.search}%`;
    }
    return { whereSql: where.join(" AND "), params };
  };

  const findGroupContext = async (groupId) => {
    const [rows] = await db.execute(
      `SELECT g.*, c.id AS class_id, c.lecturer_id, c.semester_id, c.subject_id, c.class_code,
              sem.semester_code, sem.semester_name, sub.subject_code, sub.subject_name
       FROM \`groups\` g
       JOIN classes c ON c.id = g.class_id AND c.deleted_at IS NULL
       JOIN semesters sem ON sem.id = c.semester_id
       JOIN subjects sub ON sub.id = c.subject_id
       WHERE g.id = :groupId AND g.deleted_at IS NULL LIMIT 1`,
      { groupId: Number(groupId) },
    );
    return rows[0] || null;
  };

  const userOwnsClass = async (userId, classId) => {
    const [rows] = await db.execute(
      "SELECT 1 FROM classes WHERE id = :classId AND lecturer_id = :userId AND deleted_at IS NULL LIMIT 1",
      { userId: Number(userId), classId: Number(classId) },
    );
    return rows.length > 0;
  };

  const createRequest = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO mentor_matching_requests
       (group_id, class_id, semester_id, requested_by, source_assignment_request_id, support_needed, preferred_mentor_type, required_expertise, priority, status)
       VALUES (:group_id, :class_id, :semester_id, :requested_by, :source_assignment_request_id, :support_needed, :preferred_mentor_type, :required_expertise, :priority, :status)`,
      { ...data, required_expertise: data.required_expertise ? JSON.stringify(data.required_expertise) : null },
    );
    return result.insertId;
  };

  const listRequests = async (query) => {
    const { whereSql, params } = requestWhere(query);
    const [rows] = await db.execute(
      `SELECT ${requestSelect} ${requestFrom} WHERE ${whereSql} ORDER BY mmr.created_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total ${requestFrom} WHERE ${whereSql}`, params);
    return { rows: rows.map((row) => ({ ...row, required_expertise: parseJson(row.required_expertise, []) })), total: Number(totalRows[0]?.total || 0) };
  };

  const findRequestById = async (id) => {
    const [rows] = await db.execute(
      `SELECT ${requestSelect} ${requestFrom} WHERE mmr.id = :id LIMIT 1`,
      { id: Number(id) },
    );
    const row = rows[0] || null;
    return row ? { ...row, required_expertise: parseJson(row.required_expertise, []) } : null;
  };

  const updateRequestStatus = async (id, status) => {
    await db.execute("UPDATE mentor_matching_requests SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id", { id: Number(id), status });
  };

  const listRequiredExpertise = async (ids = []) => {
    if (!ids.length) return [];
    const placeholders = ids.map((_, index) => `:id${index}`).join(", ");
    const params = Object.fromEntries(ids.map((id, index) => [`id${index}`, Number(id)]));
    const [rows] = await db.execute(
      `SELECT id, code, name, category FROM mentor_expertise_areas WHERE id IN (${placeholders}) AND status = 'active'`,
      params,
    );
    return rows;
  };

  const listCandidateMentors = async () => {
    const [rows] = await db.execute(
      `SELECT mp.id, mp.full_name, mp.email, mp.mentor_type, mp.organization, mp.position_title,
              mp.bio, mp.years_of_experience,
              COUNT(DISTINCT ma.id) AS active_assignment_count,
              COUNT(DISTINCT CASE WHEN ms.status = 'scheduled' THEN ms.id END) AS scheduled_session_count,
              COUNT(DISTINCT CASE WHEN ms.status = 'completed' THEN ms.id END) AS completed_session_count,
              COALESCE(SUM(CASE WHEN ms.status = 'completed' THEN ms.duration_minutes ELSE 0 END), 0) AS total_minutes,
              AVG(mf.rating) AS average_rating,
              COUNT(DISTINCT av.id) AS active_availability_count,
              MAX(av.max_sessions_per_week) AS max_sessions_per_week,
              GROUP_CONCAT(DISTINCT CONCAT_WS('|', ea.id, ea.code, ea.name, ea.category, mem.level) SEPARATOR ';;') AS expertise_blob
       FROM mentor_profiles mp
       LEFT JOIN mentor_expertise_map mem ON mem.mentor_id = mp.id
       LEFT JOIN mentor_expertise_areas ea ON ea.id = mem.expertise_id AND ea.status = 'active'
       LEFT JOIN mentor_assignments ma ON ma.mentor_id = mp.id AND ma.status = 'active' AND ma.deleted_at IS NULL
       LEFT JOIN mentoring_sessions ms ON ms.mentor_id = mp.id AND ms.deleted_at IS NULL
       LEFT JOIN mentoring_feedbacks mf ON mf.target_type = 'mentor' AND mf.target_id = mp.id AND mf.rating IS NOT NULL
       LEFT JOIN mentor_availability av ON av.mentor_id = mp.id AND av.status = 'active'
       WHERE mp.status = 'active' AND mp.deleted_at IS NULL
       GROUP BY mp.id
       ORDER BY mp.full_name ASC`,
    );
    return rows.map((row) => ({
      ...row,
      expertise: parseExpertiseBlob(row.expertise_blob),
      active_assignment_count: Number(row.active_assignment_count || 0),
      scheduled_session_count: Number(row.scheduled_session_count || 0),
      completed_session_count: Number(row.completed_session_count || 0),
      total_minutes: Number(row.total_minutes || 0),
      average_rating: row.average_rating == null ? null : Number(row.average_rating),
      active_availability_count: Number(row.active_availability_count || 0),
      max_sessions_per_week: row.max_sessions_per_week == null ? null : Number(row.max_sessions_per_week),
    }));
  };

  const countOpenAssignmentForPair = async (mentorId, groupId) => {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM mentor_assignments WHERE mentor_id = :mentorId AND group_id = :groupId AND deleted_at IS NULL AND status IN ('proposed','pending_mentor','active')",
      { mentorId: Number(mentorId), groupId: Number(groupId) },
    );
    return Number(rows[0]?.total || 0);
  };

  const deleteSuggestionsForRequest = async (requestId) => {
    await db.execute("DELETE FROM mentor_matching_suggestions WHERE request_id = :requestId", { requestId: Number(requestId) });
  };

  const createSuggestion = async (data, breakdown = []) => {
    const [result] = await db.execute(
      `INSERT INTO mentor_matching_suggestions
       (request_id, mentor_id, score, match_level, reason, strengths, risks, matching_method, recommended_assignment_type, model_name, provider_key)
       VALUES (:request_id, :mentor_id, :score, :match_level, :reason, :strengths, :risks, :matching_method, :recommended_assignment_type, :model_name, :provider_key)`,
      {
        ...data,
        strengths: JSON.stringify(data.strengths || []),
        risks: JSON.stringify(data.risks || []),
      },
    );
    const suggestionId = result.insertId;
    for (const item of breakdown) {
      await db.execute(
        `INSERT INTO mentor_matching_score_breakdown (suggestion_id, factor_code, factor_name, score, weight, reason)
         VALUES (:suggestion_id, :factor_code, :factor_name, :score, :weight, :reason)`,
        { suggestion_id: suggestionId, ...item },
      );
    }
    return suggestionId;
  };

  const listSuggestions = async (requestId) => {
    const [rows] = await db.execute(
      `SELECT s.*, mp.full_name AS mentor_name, mp.email AS mentor_email, mp.mentor_type,
              mp.organization, mp.position_title, mp.avatar_url,
              COUNT(DISTINCT ma.id) AS active_assignment_count,
              AVG(mf.rating) AS average_rating,
              GROUP_CONCAT(DISTINCT ea.name ORDER BY ea.name SEPARATOR ', ') AS expertise_names,
              (SELECT a.action FROM mentor_matching_actions a WHERE a.suggestion_id = s.id ORDER BY a.created_at DESC, a.id DESC LIMIT 1) AS latest_action
       FROM mentor_matching_suggestions s
       JOIN mentor_profiles mp ON mp.id = s.mentor_id
       LEFT JOIN mentor_expertise_map mem ON mem.mentor_id = mp.id
       LEFT JOIN mentor_expertise_areas ea ON ea.id = mem.expertise_id
       LEFT JOIN mentor_assignments ma ON ma.mentor_id = mp.id AND ma.status = 'active' AND ma.deleted_at IS NULL
       LEFT JOIN mentoring_feedbacks mf ON mf.target_type = 'mentor' AND mf.target_id = mp.id AND mf.rating IS NOT NULL
       WHERE s.request_id = :requestId
       GROUP BY s.id
       ORDER BY s.score DESC, s.id ASC`,
      { requestId: Number(requestId) },
    );
    const ids = rows.map((row) => Number(row.id));
    const breakdownBySuggestion = new Map(ids.map((id) => [id, []]));
    if (ids.length) {
      const placeholders = ids.map((_, index) => `:id${index}`).join(", ");
      const params = Object.fromEntries(ids.map((id, index) => [`id${index}`, id]));
      const [breakdowns] = await db.execute(
        `SELECT * FROM mentor_matching_score_breakdown WHERE suggestion_id IN (${placeholders}) ORDER BY suggestion_id ASC, id ASC`,
        params,
      );
      breakdowns.forEach((item) => breakdownBySuggestion.get(Number(item.suggestion_id))?.push(item));
    }
    return rows.map((row) => ({
      ...row,
      score: Number(row.score || 0),
      strengths: parseJson(row.strengths, []),
      risks: parseJson(row.risks, []),
      active_assignment_count: Number(row.active_assignment_count || 0),
      average_rating: row.average_rating == null ? null : Number(row.average_rating),
      breakdown: breakdownBySuggestion.get(Number(row.id)) || [],
    }));
  };

  const findSuggestionById = async (id) => {
    const [rows] = await db.execute(
      `SELECT s.*, mmr.group_id, mmr.class_id, mmr.semester_id, mmr.status AS request_status
       FROM mentor_matching_suggestions s
       JOIN mentor_matching_requests mmr ON mmr.id = s.request_id
       WHERE s.id = :id LIMIT 1`,
      { id: Number(id) },
    );
    return rows[0] ? { ...rows[0], strengths: parseJson(rows[0].strengths, []), risks: parseJson(rows[0].risks, []) } : null;
  };

  const createAction = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO mentor_matching_actions (suggestion_id, user_id, action, note)
       VALUES (:suggestion_id, :user_id, :action, :note)`,
      data,
    );
    return result.insertId;
  };

  return {
    findGroupContext,
    userOwnsClass,
    createRequest,
    listRequests,
    findRequestById,
    updateRequestStatus,
    listRequiredExpertise,
    listCandidateMentors,
    countOpenAssignmentForPair,
    deleteSuggestionsForRequest,
    createSuggestion,
    listSuggestions,
    findSuggestionById,
    createAction,
  };
};
