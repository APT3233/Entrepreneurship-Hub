const pageSql = (limit, offset) => `LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

const assignmentSelect = `
  ma.*,
  mp.full_name AS mentor_name, mp.email AS mentor_email, mp.mentor_type, mp.organization,
  g.group_code, g.group_name, g.topic, g.category, g.topic_desc,
  c.class_code, c.class_name, c.lecturer_id,
  sem.semester_code, sem.semester_name,
  sub.subject_code, sub.subject_name,
  assigned.full_name AS assigned_by_name,
  approved.full_name AS approved_by_name,
  (SELECT COUNT(*) FROM mentoring_sessions ms WHERE ms.assignment_id = ma.id AND ms.deleted_at IS NULL) AS total_sessions,
  (SELECT COUNT(*) FROM mentoring_sessions ms WHERE ms.assignment_id = ma.id AND ms.status = 'completed' AND ms.deleted_at IS NULL) AS completed_sessions,
  (SELECT COALESCE(SUM(ms.duration_minutes), 0) FROM mentoring_sessions ms WHERE ms.assignment_id = ma.id AND ms.status = 'completed' AND ms.deleted_at IS NULL) AS total_minutes
`;

const assignmentFrom = `
  FROM mentor_assignments ma
  JOIN mentor_profiles mp ON mp.id = ma.mentor_id
  JOIN \`groups\` g ON g.id = ma.group_id
  JOIN classes c ON c.id = ma.class_id
  JOIN semesters sem ON sem.id = ma.semester_id
  JOIN subjects sub ON sub.id = ma.subject_id
  LEFT JOIN users assigned ON assigned.id = ma.assigned_by
  LEFT JOIN users approved ON approved.id = ma.approved_by
`;

const sessionSelect = `
  ms.*,
  ma.assignment_type,
  mp.full_name AS mentor_name, mp.email AS mentor_email, mp.mentor_type,
  g.group_code, g.group_name, g.topic, g.category,
  c.class_code, c.class_name, c.lecturer_id,
  sem.semester_code, sem.semester_name,
  creator.full_name AS created_by_name,
  canceller.full_name AS cancelled_by_name,
  (SELECT COUNT(*) FROM mentoring_feedbacks mf WHERE mf.session_id = ms.id) AS feedback_count,
  (SELECT COUNT(*) FROM mentoring_action_items mai WHERE mai.session_id = ms.id) AS action_item_count
`;

const sessionFrom = `
  FROM mentoring_sessions ms
  JOIN mentor_assignments ma ON ma.id = ms.assignment_id
  JOIN mentor_profiles mp ON mp.id = ms.mentor_id
  JOIN \`groups\` g ON g.id = ms.group_id
  JOIN classes c ON c.id = ms.class_id
  JOIN semesters sem ON sem.id = ms.semester_id
  LEFT JOIN users creator ON creator.id = ms.created_by
  LEFT JOIN users canceller ON canceller.id = ms.cancelled_by
`;

const cleanJson = (value) => {
  if (!value) return value;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
};

export const createMentorWorkflowRepository = ({ db }) => {
  const assignmentWhere = (query = {}) => {
    const params = {};
    const where = ["ma.deleted_at IS NULL"];
    if (query.semesterId) { where.push("ma.semester_id = :semesterId"); params.semesterId = Number(query.semesterId); }
    if (query.subjectId) { where.push("ma.subject_id = :subjectId"); params.subjectId = Number(query.subjectId); }
    if (query.classId) { where.push("ma.class_id = :classId"); params.classId = Number(query.classId); }
    if (query.groupId) { where.push("ma.group_id = :groupId"); params.groupId = Number(query.groupId); }
    if (query.mentorId) { where.push("ma.mentor_id = :mentorId"); params.mentorId = Number(query.mentorId); }
    if (query.assignmentType) { where.push("ma.assignment_type = :assignmentType"); params.assignmentType = query.assignmentType; }
    if (query.status) { where.push("ma.status = :status"); params.status = query.status; }
    if (query.lecturerId) { where.push("c.lecturer_id = :lecturerId"); params.lecturerId = Number(query.lecturerId); }
    if (query.search) {
      where.push("(mp.full_name LIKE :search OR mp.email LIKE :search OR g.group_name LIKE :search OR g.topic LIKE :search OR c.class_code LIKE :search)");
      params.search = `%${query.search}%`;
    }
    return { whereSql: where.join(" AND "), params };
  };

  const listAssignments = async (query) => {
    const { whereSql, params } = assignmentWhere(query);
    const [rows] = await db.execute(
      `SELECT ${assignmentSelect} ${assignmentFrom} WHERE ${whereSql} ORDER BY ma.created_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total ${assignmentFrom} WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const findAssignmentById = async (id) => {
    const [rows] = await db.execute(
      `SELECT ${assignmentSelect} ${assignmentFrom} WHERE ma.id = :id AND ma.deleted_at IS NULL LIMIT 1`,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const findGroupContext = async (groupId) => {
    const [rows] = await db.execute(
      `
        SELECT g.*, c.id AS class_id, c.lecturer_id, c.semester_id, c.subject_id, c.class_code,
               sem.semester_code, sem.semester_name, sub.subject_code, sub.subject_name
        FROM \`groups\` g
        JOIN classes c ON c.id = g.class_id
        JOIN semesters sem ON sem.id = c.semester_id
        JOIN subjects sub ON sub.id = c.subject_id
        WHERE g.id = :groupId AND g.deleted_at IS NULL AND c.deleted_at IS NULL
        LIMIT 1
      `,
      { groupId: Number(groupId) },
    );
    return rows[0] || null;
  };

  const findActiveMentor = async (mentorId) => {
    const [rows] = await db.execute("SELECT * FROM mentor_profiles WHERE id = :mentorId AND status = 'active' AND deleted_at IS NULL LIMIT 1", { mentorId: Number(mentorId) });
    return rows[0] || null;
  };

  const findMentorByUserId = async (userId) => {
    const [rows] = await db.execute("SELECT * FROM mentor_profiles WHERE user_id = :userId AND deleted_at IS NULL LIMIT 1", { userId: Number(userId) });
    return rows[0] || null;
  };

  const listMentorExpertise = async (mentorId) => {
    const [rows] = await db.execute(
      `SELECT ea.id, ea.code, ea.name, ea.category, mem.level, mem.years_experience
       FROM mentor_expertise_map mem JOIN mentor_expertise_areas ea ON ea.id = mem.expertise_id
       WHERE mem.mentor_id = :mentorId ORDER BY ea.category, ea.name`,
      { mentorId: Number(mentorId) },
    );
    return rows;
  };

  const listActiveAssignmentsForGroup = async (groupId) => {
    const [rows] = await db.execute(
      `SELECT ${assignmentSelect} ${assignmentFrom} WHERE ma.group_id = :groupId AND ma.deleted_at IS NULL AND ma.status IN ('proposed','pending_mentor','active') ORDER BY ma.created_at DESC`,
      { groupId: Number(groupId) },
    );
    return rows;
  };

  const countOpenAssignmentForPair = async (mentorId, groupId, excludeId = null) => {
    const params = { mentorId: Number(mentorId), groupId: Number(groupId) };
    let sql = "SELECT COUNT(*) AS total FROM mentor_assignments WHERE mentor_id = :mentorId AND group_id = :groupId AND deleted_at IS NULL AND status IN ('proposed','pending_mentor','active')";
    if (excludeId) { sql += " AND id <> :excludeId"; params.excludeId = Number(excludeId); }
    const [rows] = await db.execute(sql, params);
    return Number(rows[0]?.total || 0);
  };

  const countActivePrimaryForGroup = async (groupId, excludeId = null) => {
    const params = { groupId: Number(groupId) };
    let sql = "SELECT COUNT(*) AS total FROM mentor_assignments WHERE group_id = :groupId AND assignment_type = 'primary' AND status = 'active' AND deleted_at IS NULL";
    if (excludeId) { sql += " AND id <> :excludeId"; params.excludeId = Number(excludeId); }
    const [rows] = await db.execute(sql, params);
    return Number(rows[0]?.total || 0);
  };

  const countMentorActiveAssignments = async (mentorId) => {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM mentor_assignments WHERE mentor_id = :mentorId AND status = 'active' AND deleted_at IS NULL", { mentorId: Number(mentorId) });
    return Number(rows[0]?.total || 0);
  };

  const createAssignment = async (data, conn = db) => {
    const [result] = await conn.execute(
      `INSERT INTO mentor_assignments
       (mentor_id, group_id, class_id, semester_id, subject_id, assigned_by, approved_by, assignment_type, status, start_date, end_date, expected_sessions, note, rejection_reason)
       VALUES (:mentor_id, :group_id, :class_id, :semester_id, :subject_id, :assigned_by, :approved_by, :assignment_type, :status, :start_date, :end_date, :expected_sessions, :note, :rejection_reason)`,
      data,
    );
    return result.insertId;
  };

  const updateAssignment = async (id, data, conn = db) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await conn.execute(`UPDATE mentor_assignments SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`, { ...data, id: Number(id) });
  };

  const softDeleteAssignment = async (id) => {
    await db.execute("UPDATE mentor_assignments SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL", { id: Number(id) });
  };

  const insertAssignmentHistory = async (data, conn = db) => {
    await conn.execute(
      `INSERT INTO mentor_assignment_history (assignment_id, action, old_values, new_values, actor_id, note)
       VALUES (:assignment_id, :action, :old_values, :new_values, :actor_id, :note)`,
      {
        assignment_id: Number(data.assignment_id),
        action: data.action,
        old_values: data.old_values ? JSON.stringify(data.old_values) : null,
        new_values: data.new_values ? JSON.stringify(data.new_values) : null,
        actor_id: data.actor_id || null,
        note: data.note || null,
      },
    );
  };

  const listAssignmentHistory = async (assignmentId) => {
    const [rows] = await db.execute(
      `SELECT mah.*, u.full_name AS actor_name, u.email AS actor_email
       FROM mentor_assignment_history mah LEFT JOIN users u ON u.id = mah.actor_id
       WHERE mah.assignment_id = :assignmentId ORDER BY mah.created_at DESC`,
      { assignmentId: Number(assignmentId) },
    );
    return rows.map((row) => ({ ...row, old_values: cleanJson(row.old_values), new_values: cleanJson(row.new_values) }));
  };

  const createAssignmentRequest = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO mentor_assignment_requests (group_id, requested_by, requested_role, requested_expertise, problem_statement, support_needed, priority)
       VALUES (:group_id, :requested_by, :requested_role, :requested_expertise, :problem_statement, :support_needed, :priority)`,
      { ...data, requested_expertise: data.requested_expertise ? JSON.stringify(data.requested_expertise) : null },
    );
    return result.insertId;
  };

  const listOpenRequestsForGroup = async (groupId) => {
    const [rows] = await db.execute("SELECT * FROM mentor_assignment_requests WHERE group_id = :groupId AND status = 'open' ORDER BY priority DESC, created_at DESC", { groupId: Number(groupId) });
    return rows.map((row) => ({ ...row, requested_expertise: cleanJson(row.requested_expertise) }));
  };

  const userOwnsClass = async (userId, classId) => {
    const [rows] = await db.execute("SELECT 1 FROM classes WHERE id = :classId AND lecturer_id = :userId AND deleted_at IS NULL LIMIT 1", { userId: Number(userId), classId: Number(classId) });
    return rows.length > 0;
  };

  const userInGroup = async (userId, groupId) => {
    const [rows] = await db.execute(
      `SELECT 1 FROM group_members gm JOIN students s ON s.id = gm.student_id
       WHERE gm.group_id = :groupId AND s.user_id = :userId AND gm.status = 'active' LIMIT 1`,
      { userId: Number(userId), groupId: Number(groupId) },
    );
    return rows.length > 0;
  };

  const sessionWhere = (query = {}) => {
    const params = {};
    const where = ["ms.deleted_at IS NULL"];
    if (query.assignmentId) { where.push("ms.assignment_id = :assignmentId"); params.assignmentId = Number(query.assignmentId); }
    if (query.mentorId) { where.push("ms.mentor_id = :mentorId"); params.mentorId = Number(query.mentorId); }
    if (query.groupId) { where.push("ms.group_id = :groupId"); params.groupId = Number(query.groupId); }
    if (query.classId) { where.push("ms.class_id = :classId"); params.classId = Number(query.classId); }
    if (query.semesterId) { where.push("ms.semester_id = :semesterId"); params.semesterId = Number(query.semesterId); }
    if (query.status) { where.push("ms.status = :status"); params.status = query.status; }
    if (query.lecturerId) { where.push("c.lecturer_id = :lecturerId"); params.lecturerId = Number(query.lecturerId); }
    if (query.search) { where.push("(ms.title LIKE :search OR g.group_name LIKE :search OR g.topic LIKE :search OR c.class_code LIKE :search)"); params.search = `%${query.search}%`; }
    return { whereSql: where.join(" AND "), params };
  };

  const listSessions = async (query) => {
    const { whereSql, params } = sessionWhere(query);
    const [rows] = await db.execute(`SELECT ${sessionSelect} ${sessionFrom} WHERE ${whereSql} ORDER BY ms.scheduled_start_at DESC ${pageSql(query.limit, query.offset)}`, params);
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total ${sessionFrom} WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const findSessionById = async (id) => {
    const [rows] = await db.execute(`SELECT ${sessionSelect} ${sessionFrom} WHERE ms.id = :id AND ms.deleted_at IS NULL LIMIT 1`, { id: Number(id) });
    return rows[0] || null;
  };

  const createSession = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO mentoring_sessions
       (assignment_id, mentor_id, group_id, class_id, semester_id, title, description, session_type, meeting_link, location, scheduled_start_at, scheduled_end_at, actual_start_at, actual_end_at, duration_minutes, status, created_by)
       VALUES (:assignment_id, :mentor_id, :group_id, :class_id, :semester_id, :title, :description, :session_type, :meeting_link, :location, :scheduled_start_at, :scheduled_end_at, :actual_start_at, :actual_end_at, :duration_minutes, :status, :created_by)`,
      data,
    );
    return result.insertId;
  };

  const updateSession = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(`UPDATE mentoring_sessions SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`, { ...data, id: Number(id) });
  };

  const listNotes = async (sessionId) => {
    const [rows] = await db.execute(
      `SELECT msn.*, u.full_name AS author_name, u.email AS author_email
       FROM mentoring_session_notes msn LEFT JOIN users u ON u.id = msn.author_id
       WHERE msn.session_id = :sessionId AND msn.deleted_at IS NULL ORDER BY msn.created_at DESC`,
      { sessionId: Number(sessionId) },
    );
    return rows;
  };

  const createNote = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO mentoring_session_notes (session_id, author_id, note_type, content, visibility)
       VALUES (:session_id, :author_id, :note_type, :content, :visibility)`, data,
    );
    return result.insertId;
  };

  const listFeedback = async (sessionId) => {
    const [rows] = await db.execute(
      `SELECT mf.*, u.full_name AS from_user_name, u.email AS from_user_email
       FROM mentoring_feedbacks mf LEFT JOIN users u ON u.id = mf.from_user_id
       WHERE mf.session_id = :sessionId ORDER BY mf.created_at DESC`,
      { sessionId: Number(sessionId) },
    );
    return rows;
  };

  const createFeedback = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO mentoring_feedbacks (session_id, assignment_id, from_user_id, from_role, target_type, target_id, rating, feedback, strengths, improvements)
       VALUES (:session_id, :assignment_id, :from_user_id, :from_role, :target_type, :target_id, :rating, :feedback, :strengths, :improvements)`, data,
    );
    return result.insertId;
  };

  const listActionItems = async (sessionId) => {
    const [rows] = await db.execute(
      `SELECT mai.*, assignee.full_name AS assigned_to_name, creator.full_name AS created_by_name
       FROM mentoring_action_items mai
       LEFT JOIN users assignee ON assignee.id = mai.assigned_to_user_id
       LEFT JOIN users creator ON creator.id = mai.created_by
       WHERE mai.session_id = :sessionId ORDER BY mai.created_at DESC`,
      { sessionId: Number(sessionId) },
    );
    return rows;
  };

  const listAllFeedback = async (query) => {
    const { whereSql, params } = sessionWhere(query);
    const [rows] = await db.execute(
      `SELECT mf.*, ms.title AS session_title, g.group_name, g.topic, mp.full_name AS mentor_name, u.full_name AS from_user_name
       FROM mentoring_feedbacks mf
       JOIN mentoring_sessions ms ON ms.id = mf.session_id
       JOIN mentor_profiles mp ON mp.id = ms.mentor_id
       JOIN \`groups\` g ON g.id = ms.group_id
       JOIN classes c ON c.id = ms.class_id
       LEFT JOIN users u ON u.id = mf.from_user_id
       WHERE ${whereSql.replaceAll('ms.', 'ms.')} ORDER BY mf.created_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM mentoring_feedbacks mf JOIN mentoring_sessions ms ON ms.id = mf.session_id JOIN \`groups\` g ON g.id = ms.group_id JOIN classes c ON c.id = ms.class_id WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const listAllActionItems = async (query) => {
    const { whereSql, params } = sessionWhere(query);
    const itemWhere = [whereSql];
    const itemParams = { ...params };
    if (query.itemStatus) {
      itemWhere.push("mai.status = :itemStatus");
      itemParams.itemStatus = query.itemStatus;
    }
    const [rows] = await db.execute(
      `SELECT mai.*, ms.title AS session_title, g.group_name, g.topic, assignee.full_name AS assigned_to_name, creator.full_name AS created_by_name
       FROM mentoring_action_items mai
       JOIN mentoring_sessions ms ON ms.id = mai.session_id
       JOIN \`groups\` g ON g.id = mai.group_id
       JOIN classes c ON c.id = ms.class_id
       LEFT JOIN users assignee ON assignee.id = mai.assigned_to_user_id
       LEFT JOIN users creator ON creator.id = mai.created_by
       WHERE ${itemWhere.join(" AND ")} ORDER BY mai.created_at DESC ${pageSql(query.limit, query.offset)}`,
      itemParams,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM mentoring_action_items mai JOIN mentoring_sessions ms ON ms.id = mai.session_id JOIN \`groups\` g ON g.id = mai.group_id JOIN classes c ON c.id = ms.class_id WHERE ${itemWhere.join(" AND ")}`, itemParams);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const createActionItem = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO mentoring_action_items (session_id, group_id, assigned_to_user_id, title, description, due_date, created_by)
       VALUES (:session_id, :group_id, :assigned_to_user_id, :title, :description, :due_date, :created_by)`, data,
    );
    return result.insertId;
  };

  const findActionItemById = async (id) => {
    const [rows] = await db.execute(
      `SELECT mai.*, ms.class_id, ms.mentor_id, ms.group_id AS session_group_id, c.lecturer_id
       FROM mentoring_action_items mai JOIN mentoring_sessions ms ON ms.id = mai.session_id JOIN classes c ON c.id = ms.class_id
       WHERE mai.id = :id LIMIT 1`,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const updateActionItemStatus = async (id, status) => {
    await db.execute("UPDATE mentoring_action_items SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id", { id: Number(id), status });
  };

  const getSessionStats = async (query = {}) => {
    const { whereSql, params } = sessionWhere(query);
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS total_sessions,
              SUM(CASE WHEN ms.status = 'completed' THEN 1 ELSE 0 END) AS completed_sessions,
              SUM(CASE WHEN ms.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_sessions,
              COALESCE(SUM(CASE WHEN ms.status = 'completed' THEN ms.duration_minutes ELSE 0 END), 0) AS mentoring_minutes,
              SUM(CASE WHEN (SELECT COUNT(*) FROM mentoring_feedbacks mf WHERE mf.session_id = ms.id) = 0 THEN 1 ELSE 0 END) AS sessions_missing_feedback
       ${sessionFrom} WHERE ${whereSql}`,
      params,
    );
    const [noSessionRows] = await db.execute(
      `SELECT COUNT(*) AS groups_without_sessions
       FROM mentor_assignments ma
       WHERE ma.status = 'active' AND ma.deleted_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM mentoring_sessions ms WHERE ms.assignment_id = ma.id AND ms.deleted_at IS NULL)`,
    );
    const [workloadRows] = await db.execute(
      `SELECT COUNT(*) AS mentors_with_high_workload
       FROM (SELECT mentor_id, COUNT(*) AS total FROM mentor_assignments WHERE status = 'active' AND deleted_at IS NULL GROUP BY mentor_id HAVING total >= 5) x`,
    );
    return { ...(rows[0] || {}), ...(noSessionRows[0] || {}), ...(workloadRows[0] || {}) };
  };

  return {
    listAssignments,
    findAssignmentById,
    findGroupContext,
    findActiveMentor,
    findMentorByUserId,
    listMentorExpertise,
    listActiveAssignmentsForGroup,
    countOpenAssignmentForPair,
    countActivePrimaryForGroup,
    countMentorActiveAssignments,
    createAssignment,
    updateAssignment,
    softDeleteAssignment,
    insertAssignmentHistory,
    listAssignmentHistory,
    createAssignmentRequest,
    listOpenRequestsForGroup,
    userOwnsClass,
    userInGroup,
    listSessions,
    findSessionById,
    createSession,
    updateSession,
    listNotes,
    createNote,
    listFeedback,
    createFeedback,
    listActionItems,
    listAllFeedback,
    listAllActionItems,
    createActionItem,
    findActionItemById,
    updateActionItemStatus,
    getSessionStats,
  };
};
