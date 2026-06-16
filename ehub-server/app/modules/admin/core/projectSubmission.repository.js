import { v7 as uuidv7 } from "uuid";

const pageSql = (limit, offset) => `LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
const newUuid = () => uuidv7().replace(/-/g, "");
const asUuid = (id) => String(id);

const countRows = async (db, sql, params = {}) => {
  const [rows] = await db.execute(sql, params);
  return Number(rows[0]?.total || 0);
};

const buildSearch = (where, params, fields, search) => {
  if (!search) return;
  where.push(`(${fields.map((field) => `${field} LIKE :search`).join(" OR ")})`);
  params.search = `%${search}%`;
};

export const createAdminProjectSubmissionRepository = ({ db }) => {
  const listProjects = async ({ search, semesterId, classId, category, status, limit, offset }) => {
    const params = {};
    const where = ["g.deleted_at IS NULL", "c.deleted_at IS NULL"];
    buildSearch(where, params, ["g.topic", "g.group_name", "g.group_code", "g.category"], search);
    if (semesterId) {
      where.push("c.semester_id = :semesterId");
      params.semesterId = Number(semesterId);
    }
    if (classId) {
      where.push("g.class_id = :classId");
      params.classId = Number(classId);
    }
    if (category) {
      where.push("g.category = :category");
      params.category = category;
    }
    if (status) {
      where.push("g.status = :status");
      params.status = status;
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          g.id, g.group_code, g.group_name, g.class_id, g.topic, g.topic_desc, g.category,
          g.zalo_link, g.mentor_name, g.mentor_dept, g.status, g.updated_at,
          c.class_code, c.class_name,
          sub.subject_code, sub.subject_name,
          sem.semester_code, sem.semester_name, sem.year,
          COUNT(DISTINCT CASE WHEN gm.status = 'active' THEN gm.id END) AS member_count
        FROM \`groups\` g
        JOIN classes c ON c.id = g.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN group_members gm ON gm.group_id = g.id
        WHERE ${whereSql}
        GROUP BY g.id
        ORDER BY g.updated_at DESC, g.created_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(
      db,
      `
        SELECT COUNT(*) AS total
        FROM \`groups\` g
        JOIN classes c ON c.id = g.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total };
  };

  const findProjectById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT
          g.*, c.class_code, c.class_name, sub.subject_code, sub.subject_name,
          sem.semester_code, sem.semester_name, sem.year,
          COUNT(DISTINCT CASE WHEN gm.status = 'active' THEN gm.id END) AS member_count
        FROM \`groups\` g
        JOIN classes c ON c.id = g.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN group_members gm ON gm.group_id = g.id
        WHERE g.id = :id AND g.deleted_at IS NULL
        GROUP BY g.id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    const project = rows[0] || null;
    if (!project) return null;
    const [checkpointSubmissions, assignmentSubmissions] = await Promise.all([
      db.execute(
        `
          SELECT cs.*, cp.title AS checkpoint_title, cp.max_score, cp.deadline
          FROM checkpoint_submissions cs
          JOIN checkpoints cp ON cp.id = cs.checkpoint_id AND cp.deleted_at IS NULL
          WHERE cs.group_id = :id
          ORDER BY cp.deadline DESC
        `,
        { id: Number(id) },
      ),
      db.execute(
        `
          SELECT s.*, a.title AS assignment_title, a.max_score, a.deadline
          FROM assignment_submissions s
          JOIN assignments a ON a.id = s.assignment_id AND a.deleted_at IS NULL
          WHERE s.group_id = :id
          ORDER BY a.deadline DESC
        `,
        { id: Number(id) },
      ),
    ]);
    return {
      ...project,
      checkpoint_submissions: checkpointSubmissions[0],
      assignment_submissions: assignmentSubmissions[0],
    };
  };

  const updateProject = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE \`groups\` SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`,
      { ...data, id: Number(id) },
    );
  };

  const listCheckpoints = async ({ search, classId, semesterId, status, deadline, limit, offset }) => {
    const params = {};
    const where = ["cp.deleted_at IS NULL", "c.deleted_at IS NULL"];
    buildSearch(where, params, ["cp.title", "c.class_code"], search);
    if (classId) {
      where.push("cp.class_id = :classId");
      params.classId = Number(classId);
    }
    if (semesterId) {
      where.push("c.semester_id = :semesterId");
      params.semesterId = Number(semesterId);
    }
    if (status) {
      where.push("cp.status = :status");
      params.status = status;
    }
    if (deadline === "overdue") where.push("cp.deadline < NOW()");
    if (deadline === "upcoming") where.push("cp.deadline >= NOW()");
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          cp.*, c.class_code, c.class_name,
          sub.subject_code, sub.subject_name,
          sem.semester_code, sem.semester_name, sem.year,
          u.full_name AS created_by_name,
          COUNT(DISTINCT g.id) AS total_groups,
          COUNT(DISTINCT CASE WHEN cs.status IN ('submitted','resubmitted','graded') THEN cs.group_id END) AS submitted_groups,
          COUNT(DISTINCT CASE WHEN cs.status IN ('submitted','resubmitted') AND cs.score IS NULL THEN cs.id END) AS pending_grading
        FROM checkpoints cp
        JOIN classes c ON c.id = cp.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN users u ON u.id = cp.created_by
        LEFT JOIN \`groups\` g ON g.class_id = cp.class_id AND g.deleted_at IS NULL
        LEFT JOIN checkpoint_submissions cs ON cs.checkpoint_id = cp.id AND cs.group_id = g.id
        WHERE ${whereSql}
        GROUP BY cp.id
        ORDER BY cp.deadline DESC, cp.order_index ASC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(
      db,
      `
        SELECT COUNT(*) AS total
        FROM checkpoints cp
        JOIN classes c ON c.id = cp.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total };
  };

  const findCheckpointById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT
          cp.*, c.class_code, c.class_name,
          sub.subject_code, sub.subject_name,
          sem.semester_code, sem.semester_name, sem.year,
          u.full_name AS created_by_name,
          COUNT(DISTINCT g.id) AS total_groups,
          COUNT(DISTINCT CASE WHEN vcs.submission_status IN ('submitted','resubmitted','graded') THEN vcs.group_id END) AS submitted_groups,
          COUNT(DISTINCT CASE WHEN vcs.submission_status = 'not_submitted' THEN vcs.group_id END) AS not_submitted_groups,
          COUNT(DISTINCT CASE WHEN vcs.display_status = 'pending_grading' THEN vcs.group_id END) AS pending_grading,
          COUNT(DISTINCT CASE WHEN vcs.display_status = 'graded' THEN vcs.group_id END) AS graded_groups,
          COUNT(DISTINCT CASE WHEN vcs.is_late = 1 THEN vcs.group_id END) AS late_submissions
        FROM checkpoints cp
        JOIN classes c ON c.id = cp.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN users u ON u.id = cp.created_by
        LEFT JOIN \`groups\` g ON g.class_id = cp.class_id AND g.deleted_at IS NULL
        LEFT JOIN v_checkpoint_status vcs ON vcs.checkpoint_id = cp.id AND vcs.group_id = g.id
        WHERE cp.id = :id AND cp.deleted_at IS NULL AND c.deleted_at IS NULL
        GROUP BY cp.id
        LIMIT 1
      `,
      { id: asUuid(id) },
    );
    return rows[0] || null;
  };

  const createCheckpoint = async (data) => {
    const id = newUuid();
    await db.execute(
      `
        INSERT INTO checkpoints
          (id, class_id, title, description, order_index, deadline, open_at, max_score, weight,
           required_file_types, max_file_size_mb, max_files, attachment_url, status, created_by)
        VALUES
          (:id, :class_id, :title, :description, :order_index, :deadline, :open_at, :max_score, :weight,
           :required_file_types, :max_file_size_mb, :max_files, :attachment_url, :status, :created_by)
      `,
      { ...data, id },
    );
    return id;
  };

  const updateCheckpoint = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE checkpoints SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`,
      { ...data, id: asUuid(id) },
    );
  };

  const findCheckpointOrder = async (classId, orderIndex, excludeId = null) => {
    const params = { classId: Number(classId), orderIndex: Number(orderIndex) };
    let sql = "SELECT id FROM checkpoints WHERE class_id = :classId AND order_index = :orderIndex AND deleted_at IS NULL";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = asUuid(excludeId);
    }
    sql += " LIMIT 1";
    const [rows] = await db.execute(sql, params);
    return rows[0] || null;
  };

  const getNextCheckpointOrder = async (classId) => {
    const [rows] = await db.execute(
      "SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order FROM checkpoints WHERE class_id = :classId AND deleted_at IS NULL",
      { classId: Number(classId) },
    );
    return Number(rows[0]?.next_order || 1);
  };

  const countCheckpointGraded = async (checkpointId) =>
    countRows(db, "SELECT COUNT(*) AS total FROM checkpoint_submissions WHERE checkpoint_id = :checkpointId AND score IS NOT NULL", {
      checkpointId: asUuid(checkpointId),
    });

  const listCheckpointSubmissions = async ({ search, semesterId, classId, groupId, checkpointId, status, isLate, gradedBy, limit, offset }) => {
    const params = {};
    const where = ["cp.deleted_at IS NULL", "c.deleted_at IS NULL"];
    buildSearch(where, params, ["vcs.checkpoint_title", "vcs.group_code", "vcs.group_name", "c.class_code"], search);
    if (semesterId) {
      where.push("c.semester_id = :semesterId");
      params.semesterId = Number(semesterId);
    }
    if (classId) {
      where.push("cp.class_id = :classId");
      params.classId = Number(classId);
    }
    if (groupId) {
      where.push("vcs.group_id = :groupId");
      params.groupId = Number(groupId);
    }
    if (checkpointId) {
      where.push("vcs.checkpoint_id = :checkpointId");
      params.checkpointId = asUuid(checkpointId);
    }
    if (status) {
      where.push(status === "pending_grading" ? "vcs.display_status = :status" : "vcs.submission_status = :status");
      params.status = status;
    }
    if (isLate !== null && isLate !== undefined && isLate !== "") {
      where.push("COALESCE(vcs.is_late, 0) = :isLate");
      params.isLate = Number(isLate);
    }
    if (gradedBy) {
      where.push("cs_sub.graded_by = :gradedBy");
      params.gradedBy = Number(gradedBy);
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          CONCAT('checkpoint:', vcs.checkpoint_id, ':', vcs.group_id) AS id,
          vcs.*, cp.status AS checkpoint_status, c.class_code, sub.subject_code, sub.subject_name,
          sem.semester_code, sem.semester_name, sem.year,
          grader.full_name AS graded_by_name
        FROM v_checkpoint_status vcs
        JOIN checkpoints cp ON cp.id = vcs.checkpoint_id
        JOIN classes c ON c.id = cp.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN checkpoint_submissions cs_sub
          ON cs_sub.checkpoint_id = vcs.checkpoint_id AND cs_sub.group_id = vcs.group_id
        LEFT JOIN users grader ON grader.id = cs_sub.graded_by
        WHERE ${whereSql}
        ORDER BY cp.deadline DESC, c.class_code ASC, vcs.group_code ASC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(
      db,
      `
        SELECT COUNT(*) AS total
        FROM v_checkpoint_status vcs
        JOIN checkpoints cp ON cp.id = vcs.checkpoint_id
        JOIN classes c ON c.id = cp.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN checkpoint_submissions cs_sub
          ON cs_sub.checkpoint_id = vcs.checkpoint_id AND cs_sub.group_id = vcs.group_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total };
  };

  const findCheckpointSubmissionById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT cs.*, cp.title AS checkpoint_title, cp.max_score, cp.deadline,
               g.group_code, g.group_name, c.class_code,
               submitter.full_name AS submitted_by_name, grader.full_name AS graded_by_name
        FROM checkpoint_submissions cs
        JOIN checkpoints cp ON cp.id = cs.checkpoint_id AND cp.deleted_at IS NULL
        JOIN \`groups\` g ON g.id = cs.group_id AND g.deleted_at IS NULL
        JOIN classes c ON c.id = cp.class_id
        LEFT JOIN users submitter ON submitter.id = cs.submitted_by
        LEFT JOIN users grader ON grader.id = cs.graded_by
        WHERE cs.id = :id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    const submission = rows[0] || null;
    if (!submission) return null;
    const [files] = await db.execute(
      "SELECT * FROM checkpoint_submission_files WHERE submission_id = :id ORDER BY uploaded_at DESC",
      { id: Number(id) },
    );
    return { ...submission, files };
  };

  const gradeCheckpointSubmission = async (id, data) => {
    await db.execute(
      `
        UPDATE checkpoint_submissions
        SET score = :score, feedback = :feedback, graded_by = :graded_by, graded_at = CURRENT_TIMESTAMP, status = 'graded'
        WHERE id = :id
      `,
      { ...data, id: Number(id) },
    );
  };

  const listAssignments = async ({ search, classId, semesterId, status, deadline, limit, offset }) => {
    const params = {};
    const where = ["a.deleted_at IS NULL", "c.deleted_at IS NULL"];
    buildSearch(where, params, ["a.title", "c.class_code"], search);
    if (classId) {
      where.push("a.class_id = :classId");
      params.classId = Number(classId);
    }
    if (semesterId) {
      where.push("c.semester_id = :semesterId");
      params.semesterId = Number(semesterId);
    }
    if (status) {
      where.push("a.status = :status");
      params.status = status;
    }
    if (deadline === "overdue") where.push("a.deadline < NOW()");
    if (deadline === "upcoming") where.push("a.deadline >= NOW()");
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          a.*, c.class_code, c.class_name,
          sub.subject_code, sub.subject_name,
          sem.semester_code, sem.semester_name, sem.year,
          u.full_name AS created_by_name,
          COUNT(DISTINCT g.id) AS total_groups,
          COUNT(DISTINCT CASE WHEN s.status IN ('submitted','resubmitted','graded') THEN s.group_id END) AS submitted_groups,
          COUNT(DISTINCT CASE WHEN s.status IN ('submitted','resubmitted') AND s.score IS NULL THEN s.id END) AS pending_grading
        FROM assignments a
        JOIN classes c ON c.id = a.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN users u ON u.id = a.created_by
        LEFT JOIN \`groups\` g ON g.class_id = a.class_id AND g.deleted_at IS NULL
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.group_id = g.id
        WHERE ${whereSql}
        GROUP BY a.id
        ORDER BY a.deadline DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(
      db,
      `
        SELECT COUNT(*) AS total
        FROM assignments a
        JOIN classes c ON c.id = a.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total };
  };

  const findAssignmentById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT
          a.*, c.class_code, c.class_name,
          sub.subject_code, sub.subject_name,
          sem.semester_code, sem.semester_name, sem.year,
          u.full_name AS created_by_name,
          COUNT(DISTINCT g.id) AS total_groups,
          COUNT(DISTINCT CASE WHEN s.status IN ('submitted','resubmitted','graded') THEN s.group_id END) AS submitted_groups,
          COUNT(DISTINCT CASE WHEN s.status IN ('submitted','resubmitted') AND s.score IS NULL THEN s.id END) AS pending_grading,
          COUNT(DISTINCT CASE WHEN s.status = 'graded' THEN s.group_id END) AS graded_groups,
          COUNT(DISTINCT CASE WHEN s.is_late = 1 THEN s.group_id END) AS late_submissions
        FROM assignments a
        JOIN classes c ON c.id = a.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN users u ON u.id = a.created_by
        LEFT JOIN \`groups\` g ON g.class_id = a.class_id AND g.deleted_at IS NULL
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.group_id = g.id
        WHERE a.id = :id AND a.deleted_at IS NULL AND c.deleted_at IS NULL
        GROUP BY a.id
        LIMIT 1
      `,
      { id: asUuid(id) },
    );
    return rows[0] || null;
  };

  const createAssignment = async (data) => {
    const id = newUuid();
    await db.execute(
      `
        INSERT INTO assignments
          (id, class_id, title, description, deadline, max_score, status,
           required_file_types, max_file_size_mb, max_files, attachment_url, created_by)
        VALUES
          (:id, :class_id, :title, :description, :deadline, :max_score, :status,
           :required_file_types, :max_file_size_mb, :max_files, :attachment_url, :created_by)
      `,
      { ...data, id },
    );
    return id;
  };

  const updateAssignment = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE assignments SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`,
      { ...data, id: asUuid(id) },
    );
  };

  const softDeleteCheckpoint = async (id) => {
    const [result] = await db.execute(
      `UPDATE checkpoints SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`,
      { id: asUuid(id) },
    );
    return result.affectedRows > 0;
  };

  const softDeleteAssignment = async (id) => {
    const [result] = await db.execute(
      `UPDATE assignments SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`,
      { id: asUuid(id) },
    );
    return result.affectedRows > 0;
  };

  const countAssignmentGraded = async (assignmentId) =>
    countRows(db, "SELECT COUNT(*) AS total FROM assignment_submissions WHERE assignment_id = :assignmentId AND score IS NOT NULL", {
      assignmentId: asUuid(assignmentId),
    });

  const listAssignmentSubmissions = async ({ search, semesterId, classId, groupId, assignmentId, status, isLate, gradedBy, limit, offset }) => {
    const params = {};
    const where = ["a.deleted_at IS NULL", "c.deleted_at IS NULL"];
    buildSearch(where, params, ["a.title", "g.group_code", "g.group_name", "c.class_code"], search);
    if (semesterId) {
      where.push("c.semester_id = :semesterId");
      params.semesterId = Number(semesterId);
    }
    if (classId) {
      where.push("a.class_id = :classId");
      params.classId = Number(classId);
    }
    if (groupId) {
      where.push("g.id = :groupId");
      params.groupId = Number(groupId);
    }
    if (assignmentId) {
      where.push("a.id = :assignmentId");
      params.assignmentId = asUuid(assignmentId);
    }
    if (status) {
      where.push("COALESCE(s.status, 'not_submitted') = :status");
      params.status = status;
    }
    if (isLate !== null && isLate !== undefined && isLate !== "") {
      where.push("COALESCE(s.is_late, 0) = :isLate");
      params.isLate = Number(isLate);
    }
    if (gradedBy) {
      where.push("s.graded_by = :gradedBy");
      params.gradedBy = Number(gradedBy);
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          CONCAT('assignment:', a.id, ':', g.id) AS id,
          s.id AS submission_id, s.assignment_id, s.group_id,
          COALESCE(s.status, 'not_submitted') AS status,
          s.submitted_by, s.submitted_at, s.is_late, s.note, s.score, s.feedback, s.graded_by, s.graded_at,
          a.title AS assignment_title, a.max_score, a.deadline,
          c.class_code, sub.subject_code, sub.subject_name, sem.semester_code, sem.semester_name, sem.year,
          g.group_code, g.group_name,
          submitter.full_name AS submitted_by_name,
          grader.full_name AS graded_by_name,
          COUNT(DISTINCT f.id) AS file_count
        FROM assignments a
        JOIN classes c ON c.id = a.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        JOIN \`groups\` g ON g.class_id = a.class_id AND g.deleted_at IS NULL
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.group_id = g.id
        LEFT JOIN assignment_submission_files f ON f.submission_id = s.id AND f.is_deleted = 0
        LEFT JOIN users submitter ON submitter.id = s.submitted_by
        LEFT JOIN users grader ON grader.id = s.graded_by
        WHERE ${whereSql}
        GROUP BY a.id, g.id, s.id
        ORDER BY a.deadline DESC, c.class_code ASC, g.group_code ASC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const total = await countRows(
      db,
      `
        SELECT COUNT(*) AS total
        FROM assignments a
        JOIN classes c ON c.id = a.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        JOIN \`groups\` g ON g.class_id = a.class_id AND g.deleted_at IS NULL
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.group_id = g.id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total };
  };

  const findAssignmentSubmissionById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT s.*, a.title AS assignment_title, a.max_score, a.deadline,
               g.group_code, g.group_name, c.class_code,
               submitter.full_name AS submitted_by_name, grader.full_name AS graded_by_name
        FROM assignment_submissions s
        JOIN assignments a ON a.id = s.assignment_id AND a.deleted_at IS NULL
        JOIN \`groups\` g ON g.id = s.group_id AND g.deleted_at IS NULL
        JOIN classes c ON c.id = a.class_id
        LEFT JOIN users submitter ON submitter.id = s.submitted_by
        LEFT JOIN users grader ON grader.id = s.graded_by
        WHERE s.id = :id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    const submission = rows[0] || null;
    if (!submission) return null;
    const [files] = await db.execute(
      "SELECT * FROM assignment_submission_files WHERE submission_id = :id ORDER BY uploaded_at DESC",
      { id: Number(id) },
    );
    return { ...submission, files };
  };

  const gradeAssignmentSubmission = async (id, data) => {
    await db.execute(
      `
        UPDATE assignment_submissions
        SET score = :score, feedback = :feedback, graded_by = :graded_by, graded_at = CURRENT_TIMESTAMP, status = 'graded'
        WHERE id = :id
      `,
      { ...data, id: Number(id) },
    );
  };

  const listSubmissionFiles = async ({ search, source, checkpointId, assignmentId, isDeleted, limit, offset }) => {
    const params = {};
    const rowsSql = [];
    const countSql = [];
    const includeCheckpoint = !source || source === "checkpoint";
    const includeAssignment = !source || source === "assignment";

    if (includeCheckpoint) {
      const cpWhere = ["1 = 1"];
      if (search) {
        cpWhere.push("(f.file_name LIKE :search OR g.group_code LIKE :search OR g.group_name LIKE :search OR cp.title LIKE :search)");
        params.search = `%${search}%`;
      }
      if (isDeleted !== null && isDeleted !== undefined && isDeleted !== "") {
        cpWhere.push("f.is_deleted = :isDeleted");
        params.isDeleted = Number(isDeleted);
      }
      if (checkpointId) {
        cpWhere.push("cs.checkpoint_id = :checkpointId");
        params.checkpointId = asUuid(checkpointId);
      }
      const whereSql = cpWhere.join(" AND ");
      rowsSql.push(`
        SELECT
          'checkpoint' AS source, f.id, f.submission_id, f.file_name, f.file_path, f.file_url, f.file_type,
          f.mime_type, f.file_size, f.uploaded_by, f.uploaded_at, f.is_deleted, f.deleted_at,
          cs.checkpoint_id AS parent_id, cp.title AS parent_title, g.id AS group_id, g.group_code, g.group_name,
          u.full_name AS uploaded_by_name
        FROM checkpoint_submission_files f
        JOIN checkpoint_submissions cs ON cs.id = f.submission_id
        JOIN checkpoints cp ON cp.id = cs.checkpoint_id
        JOIN \`groups\` g ON g.id = cs.group_id
        LEFT JOIN users u ON u.id = f.uploaded_by
        WHERE ${whereSql}
      `);
      countSql.push(`
        SELECT COUNT(*) AS total
        FROM checkpoint_submission_files f
        JOIN checkpoint_submissions cs ON cs.id = f.submission_id
        JOIN checkpoints cp ON cp.id = cs.checkpoint_id
        JOIN \`groups\` g ON g.id = cs.group_id
        WHERE ${whereSql}
      `);
    }

    if (includeAssignment) {
      const asWhere = ["1 = 1"];
      if (search) {
        asWhere.push("(f.file_name LIKE :search OR g.group_code LIKE :search OR g.group_name LIKE :search OR a.title LIKE :search)");
        params.search = `%${search}%`;
      }
      if (isDeleted !== null && isDeleted !== undefined && isDeleted !== "") {
        asWhere.push("f.is_deleted = :isDeleted");
        params.isDeleted = Number(isDeleted);
      }
      if (assignmentId) {
        asWhere.push("s.assignment_id = :assignmentId");
        params.assignmentId = asUuid(assignmentId);
      }
      const whereSql = asWhere.join(" AND ");
      rowsSql.push(`
        SELECT
          'assignment' AS source, f.id, f.submission_id, f.file_name, f.file_path, f.file_url, f.file_type,
          f.mime_type, f.file_size, f.uploaded_by, f.uploaded_at, f.is_deleted, f.deleted_at,
          s.assignment_id AS parent_id, a.title AS parent_title, g.id AS group_id, g.group_code, g.group_name,
          u.full_name AS uploaded_by_name
        FROM assignment_submission_files f
        JOIN assignment_submissions s ON s.id = f.submission_id
        JOIN assignments a ON a.id = s.assignment_id
        JOIN \`groups\` g ON g.id = s.group_id
        LEFT JOIN users u ON u.id = f.uploaded_by
        WHERE ${whereSql}
      `);
      countSql.push(`
        SELECT COUNT(*) AS total
        FROM assignment_submission_files f
        JOIN assignment_submissions s ON s.id = f.submission_id
        JOIN assignments a ON a.id = s.assignment_id
        JOIN \`groups\` g ON g.id = s.group_id
        WHERE ${whereSql}
      `);
    }

    const [rows] = await db.execute(
      `
        SELECT * FROM (${rowsSql.join(" UNION ALL ")}) files
        ORDER BY uploaded_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    let total = 0;
    for (const sql of countSql) {
      total += await countRows(db, sql, params);
    }
    return { rows, total };
  };

  const updateSubmissionFileDeleted = async (source, id, deleted) => {
    const table = source === "assignment" ? "assignment_submission_files" : "checkpoint_submission_files";
    await db.execute(
      `UPDATE ${table} SET is_deleted = :isDeleted, deleted_at = :deletedAt WHERE id = :id`,
      { isDeleted: deleted ? 1 : 0, deletedAt: deleted ? new Date() : null, id: Number(id) },
    );
  };

  const getLookups = async () => {
    const [classes, semesters, categories, checkpoints, assignments, graders] = await Promise.all([
      db.execute(
        `
          SELECT c.id, c.class_code, c.class_name, c.status, c.semester_id,
                 sub.subject_code, sub.subject_name, sem.semester_code, sem.semester_name
          FROM classes c
          JOIN subjects sub ON sub.id = c.subject_id
          JOIN semesters sem ON sem.id = c.semester_id
          WHERE c.deleted_at IS NULL
          ORDER BY sem.year DESC, sem.start_date DESC, c.class_code ASC
        `,
      ),
      db.execute("SELECT id, semester_code, semester_name, year, status FROM semesters WHERE deleted_at IS NULL ORDER BY year DESC, start_date DESC"),
      db.execute("SELECT DISTINCT category FROM `groups` WHERE deleted_at IS NULL AND category IS NOT NULL AND category <> '' ORDER BY category ASC"),
      db.execute("SELECT id, title, class_id FROM checkpoints WHERE deleted_at IS NULL ORDER BY deadline DESC LIMIT 500"),
      db.execute("SELECT id, title, class_id FROM assignments WHERE deleted_at IS NULL ORDER BY deadline DESC LIMIT 500"),
      db.execute(
        `
          SELECT DISTINCT u.id, u.full_name, u.email
          FROM users u
          WHERE u.deleted_at IS NULL
          ORDER BY u.full_name ASC, u.email ASC
          LIMIT 500
        `,
      ),
    ]);
    return {
      classes: classes[0],
      semesters: semesters[0],
      categories: categories[0].map((row) => row.category),
      checkpoints: checkpoints[0],
      assignments: assignments[0],
      graders: graders[0],
    };
  };

  return {
    listProjects,
    findProjectById,
    updateProject,
    listCheckpoints,
    findCheckpointById,
    createCheckpoint,
    updateCheckpoint,
    softDeleteCheckpoint,
    findCheckpointOrder,
    getNextCheckpointOrder,
    countCheckpointGraded,
    listCheckpointSubmissions,
    findCheckpointSubmissionById,
    gradeCheckpointSubmission,
    listAssignments,
    findAssignmentById,
    createAssignment,
    updateAssignment,
    softDeleteAssignment,
    countAssignmentGraded,
    listAssignmentSubmissions,
    findAssignmentSubmissionById,
    gradeAssignmentSubmission,
    listSubmissionFiles,
    updateSubmissionFileDeleted,
    getLookups,
  };
};
