import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createAssignmentRepository = ({ db }) => {
  const base = createBaseRepository(db, "assignments");

  const findClassesByIdsAndLecturer = async (classIds, lecturerId) => {
    if (!Array.isArray(classIds) || !classIds.length) return [];
    const params = { lecturerId };
    const placeholders = classIds.map((_, idx) => `:class${idx}`).join(", ");
    classIds.forEach((id, idx) => {
      params[`class${idx}`] = Number(id);
    });
    const sql = `
      SELECT c.id, c.class_code
      FROM classes c
      WHERE c.deleted_at IS NULL
        AND c.id IN (${placeholders})
        AND c.lecturer_id = :lecturerId
    `;
    const [rows] = await db.execute(sql, params);
    return rows;
  };

  const insertMany = async (rows, conn) => {
    if (!rows.length) return [];
    const sql = `
      INSERT INTO assignments (class_id, title, description, deadline, max_score, status, required_file_types, max_file_size_mb, max_files, attachment_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertedIds = [];
    for (const row of rows) {
      const [result] = await conn.execute(sql, [
        row.class_id,
        row.title,
        row.description,
        row.deadline,
        row.max_score,
        row.status,
        row.required_file_types,
        row.max_file_size_mb,
        row.max_files,
        row.attachment_url,
        row.created_by,
      ]);
      insertedIds.push(result.insertId);
    }
    return insertedIds;
  };

  const findManyWithStats = async ({ filters, pagination, sort }) => {
    const params = {};
    const clauses = ["a.deleted_at IS NULL", "c.deleted_at IS NULL"];
    if (filters?.lecturer_id) {
      clauses.push("c.lecturer_id = :lecturer_id");
      params.lecturer_id = Number(filters.lecturer_id);
    }
    if (filters?.class_id) {
      clauses.push("a.class_id = :class_id");
      params.class_id = Number(filters.class_id);
    }
    if (filters?.status) {
      clauses.push("a.status = :status");
      params.status = filters.status;
    }
    if (filters?.semester_id) {
      clauses.push("c.semester_id = :semester_id");
      params.semester_id = Number(filters.semester_id);
    }
    if (filters?.year) {
      clauses.push("sem.year = :year");
      params.year = Number(filters.year);
    }

    let sql = `
      SELECT a.id, a.title, a.description, a.deadline, a.max_score, a.status, a.class_id, c.class_code,
             a.required_file_types, a.max_file_size_mb, a.max_files, a.attachment_url,
             COUNT(DISTINCT g.id) AS total_groups,
             COUNT(DISTINCT CASE WHEN s.id IS NOT NULL AND s.status IN ('submitted', 'graded', 'resubmitted') THEN g.id END) AS submitted_groups
      FROM assignments a
      JOIN classes c ON c.id = a.class_id
      JOIN semesters sem ON sem.id = c.semester_id
      LEFT JOIN \`groups\` g ON g.class_id = a.class_id AND g.deleted_at IS NULL
      LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.group_id = g.id
      WHERE ${clauses.join(" AND ")}
      GROUP BY a.id, c.class_code
    `;
    if (sort?.length) {
      const orderParts = sort.map(({ column, order }) => `a.\`${column}\` ${order.toUpperCase() === "DESC" ? "DESC" : "ASC"}`);
      sql += ` ORDER BY ${orderParts.join(", ")}`;
    } else sql += " ORDER BY a.created_at DESC";
    if (pagination) sql += ` LIMIT ${pagination.limit} OFFSET ${pagination.offset}`;
    const [rows] = await db.execute(sql, params);
    return rows;
  };

  const countManyWithStats = async (filters) => {
    const params = {};
    const clauses = ["a.deleted_at IS NULL", "c.deleted_at IS NULL"];
    if (filters?.lecturer_id) {
      clauses.push("c.lecturer_id = :lecturer_id");
      params.lecturer_id = Number(filters.lecturer_id);
    }
    if (filters?.class_id) {
      clauses.push("a.class_id = :class_id");
      params.class_id = Number(filters.class_id);
    }
    if (filters?.status) {
      clauses.push("a.status = :status");
      params.status = filters.status;
    }
    if (filters?.semester_id) {
      clauses.push("c.semester_id = :semester_id");
      params.semester_id = Number(filters.semester_id);
    }
    if (filters?.year) {
      clauses.push("sem.year = :year");
      params.year = Number(filters.year);
    }
    const sql = `
      SELECT COUNT(a.id) AS total
      FROM assignments a
      JOIN classes c ON c.id = a.class_id
      JOIN semesters sem ON sem.id = c.semester_id
      WHERE ${clauses.join(" AND ")}
    `;
    const [rows] = await db.execute(sql, params);
    return Number(rows[0]?.total || 0);
  };

  const findDetailById = async (id) => {
    const sql = `
      SELECT a.id, a.title, a.description, a.deadline, a.max_score, a.status, a.class_id, c.class_code, c.class_name,
             a.required_file_types, a.max_file_size_mb, a.max_files, a.attachment_url,
             COUNT(DISTINCT g.id) AS total_groups,
             COUNT(DISTINCT CASE WHEN s.id IS NOT NULL AND s.status IN ('submitted', 'graded', 'resubmitted') THEN g.id END) AS submitted_groups
      FROM assignments a
      JOIN classes c ON c.id = a.class_id
      LEFT JOIN \`groups\` g ON g.class_id = a.class_id AND g.deleted_at IS NULL
      LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.group_id = g.id
      WHERE a.id = :id
        AND a.deleted_at IS NULL
        AND c.deleted_at IS NULL
      GROUP BY a.id, c.class_code, c.class_name
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { id: Number(id) });
    return rows[0] || null;
  };

  const findByIdWithClass = async (id) => {
    const sql = `
      SELECT a.id, a.class_id, c.lecturer_id
      FROM assignments a
      JOIN classes c ON c.id = a.class_id
      WHERE a.id = :id
        AND a.deleted_at IS NULL
        AND c.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { id: Number(id) });
    return rows[0] || null;
  };

  const findByStudent = async (userId, filters = {}) => {
    const params = { userId };
    const clauses = [
      "a.deleted_at IS NULL",
      "c.deleted_at IS NULL",
      "cs.status = 'enrolled'"
    ];

    if (filters.class_id) {
      clauses.push("a.class_id = :class_id");
      params.class_id = Number(filters.class_id);
    }
    if (filters.status) {
      clauses.push("a.status = :status");
      params.status = filters.status;
    }
    if (filters.semester_id) {
      clauses.push("c.semester_id = :semester_id");
      params.semester_id = Number(filters.semester_id);
    }
    if (filters.year) {
      clauses.push("sem.year = :year");
      params.year = Number(filters.year);
    }

    const sql = `
      SELECT a.*, c.class_code,
             s.status as submission_status, s.score, s.feedback AS submission_feedback,
             s.submitted_at, s.id as submission_id
      FROM assignments a
      JOIN classes c ON c.id = a.class_id
      JOIN semesters sem ON sem.id = c.semester_id
      JOIN class_students cs ON cs.class_id = c.id
      JOIN students std ON std.id = cs.student_id
      LEFT JOIN group_members gm ON gm.student_id = std.id AND gm.status = 'active'
      LEFT JOIN \`groups\` g ON g.id = gm.group_id AND g.class_id = c.id
      LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.group_id = g.id
      WHERE std.user_id = :userId AND ${clauses.join(" AND ")}
      ORDER BY sem.year DESC, sem.semester_code DESC, a.deadline ASC
    `;
    const [rows] = await db.execute(sql, params);
    return rows;
  };

  const findStudentGroupByClass = async (userId, classId) => {
    const sql = `
      SELECT g.*
      FROM \`groups\` g
      JOIN group_members gm ON gm.group_id = g.id
      JOIN students s ON s.id = gm.student_id
      WHERE s.user_id = :userId
        AND g.class_id = :classId
        AND g.deleted_at IS NULL
        AND gm.status = 'active'
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { userId, classId });
    return rows[0] || null;
  };

  const findByIdForStudent = async (assignmentId, userId) => {
    const sql = `
      SELECT a.*, c.class_code, sem.semester_code,
             s.id as submission_id, s.status as submission_status, s.score,
             s.feedback AS submission_feedback, s.submitted_at
      FROM assignments a
      JOIN classes c ON c.id = a.class_id
      JOIN semesters sem ON sem.id = c.semester_id
      JOIN class_students cs ON cs.class_id = c.id AND cs.status = 'enrolled'
      JOIN students std ON std.id = cs.student_id AND std.user_id = :userId
      LEFT JOIN \`groups\` g
        ON g.class_id = a.class_id
        AND g.deleted_at IS NULL
        AND g.id = (
          SELECT g2.id
          FROM \`groups\` g2
          JOIN group_members gm2 ON gm2.group_id = g2.id AND gm2.status = 'active'
          JOIN students s2 ON s2.id = gm2.student_id AND s2.user_id = :userId2
          WHERE g2.class_id = a.class_id AND g2.deleted_at IS NULL
          ORDER BY g2.id
          LIMIT 1
        )
      LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.group_id = g.id
      WHERE a.id = :assignmentId
        AND a.deleted_at IS NULL
        AND c.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, {
      assignmentId: Number(assignmentId),
      userId,
      userId2: userId,
    });
    return rows[0] || null;
  };

  const getOrCreateAssignmentSubmission = async ({ assignmentId, groupId }, conn) => {
    const q = conn || db;
    const [existing] = await q.execute(
      "SELECT id, status FROM assignment_submissions WHERE assignment_id = :aid AND group_id = :gid",
      { aid: Number(assignmentId), gid: Number(groupId) }
    );
    if (existing.length) {
      const { id, status: previousStatus } = existing[0];
      await q.execute("DELETE FROM assignment_submission_files WHERE submission_id = :sid", { sid: id });
      return { id, previousStatus };
    }
    const [ins] = await q.execute(
      `INSERT INTO assignment_submissions (assignment_id, group_id, submitted_by, status)
       VALUES (:aid, :gid, NULL, 'not_submitted')`,
      { aid: Number(assignmentId), gid: Number(groupId) }
    );
    return { id: ins.insertId, previousStatus: "not_submitted" };
  };

  const addAssignmentSubmissionFiles = async (submissionId, files, conn) => {
    const q = conn || db;
    if (!files?.length) return;
    const sql = `
      INSERT INTO assignment_submission_files
      (submission_id, file_name, file_path, file_url, file_type, mime_type, file_size, uploaded_by)
      VALUES (:submission_id, :file_name, :file_path, :file_url, :file_type, :mime_type, :file_size, :uploaded_by)
    `;
    for (const file of files) {
      await q.execute(sql, {
        submission_id: submissionId,
        file_name: file.file_name,
        file_path: file.file_path,
        file_url: file.file_url,
        file_type: file.file_type,
        mime_type: file.mime_type,
        file_size: file.file_size,
        uploaded_by: file.uploaded_by,
      });
    }
  };

  const finalizeAssignmentSubmission = async (
    { submissionId, submittedBy, isLate, status },
    conn
  ) => {
    const q = conn || db;
    const now = new Date();
    const st = status || "submitted";
    // Nộp lại sau khi đã chấm — xoá điểm cũ để GV chấm lại
    if (st === "resubmitted") {
      await q.execute(
        `UPDATE assignment_submissions
         SET submitted_by = :submittedBy,
             submitted_at = :submittedAt,
             is_late = :isLate,
             status = :status,
             score = NULL,
             feedback = NULL,
             graded_by = NULL,
             graded_at = NULL
         WHERE id = :id`,
        {
          submittedBy,
          submittedAt: now,
          isLate: isLate ? 1 : 0,
          status: st,
          id: submissionId,
        }
      );
    } else {
      await q.execute(
        `UPDATE assignment_submissions
         SET submitted_by = :submittedBy,
             submitted_at = :submittedAt,
             is_late = :isLate,
             status = :status
         WHERE id = :id`,
        {
          submittedBy,
          submittedAt: now,
          isLate: isLate ? 1 : 0,
          status: st,
          id: submissionId,
        }
      );
    }
  };

  const findFilesByAssignmentSubmission = async (submissionId) => {
    const [rows] = await db.execute(
      `SELECT * FROM assignment_submission_files
       WHERE submission_id = :sid AND is_deleted = 0`,
      { sid: Number(submissionId) }
    );
    return rows;
  };

  const listSubmissionsByAssignmentForLecturer = async (assignmentId) => {
    const sql = `
      SELECT
        s.id,
        s.assignment_id,
        s.group_id,
        s.submitted_by,
        s.submitted_at,
        s.is_late,
        s.note,
        s.score,
        s.feedback,
        s.graded_by,
        s.graded_at,
        s.status,
        s.created_at,
        s.updated_at,
        g.group_name,
        g.group_code,
        u.full_name AS submitter_name,
        gr.full_name AS grader_name
      FROM assignment_submissions s
      JOIN \`groups\` g ON g.id = s.group_id AND g.deleted_at IS NULL
      LEFT JOIN users u ON u.id = s.submitted_by AND u.deleted_at IS NULL
      LEFT JOIN users gr ON gr.id = s.graded_by AND gr.deleted_at IS NULL
      WHERE s.assignment_id = :aid
        AND s.status IN ('submitted', 'graded', 'resubmitted')
      ORDER BY g.group_name ASC, g.group_code ASC
    `;
    const [rows] = await db.execute(sql, { aid: Number(assignmentId) });
    return rows;
  };

  /** Tất cả sinh viên đang active trong từng nhóm (cho GV xem danh sách cùng lúc) */
  const findGroupMembersByGroupIds = async (groupIds) => {
    if (!groupIds?.length) return {};
    const uniq = [...new Set(groupIds.map(Number))].filter(Boolean);
    if (!uniq.length) return {};
    const ph = uniq.map(() => "?").join(",");
    const sql = `
      SELECT gm.group_id, s.id AS student_id, s.student_code, s.full_name, gm.role
      FROM group_members gm
      INNER JOIN students s ON s.id = gm.student_id
      WHERE gm.group_id IN (${ph})
        AND gm.status = 'active'
      ORDER BY gm.group_id, gm.role DESC, s.full_name
    `;
    const [rows] = await db.execute(sql, uniq);
    const byGroup = {};
    for (const r of rows) {
      const gid = Number(r.group_id);
      if (!byGroup[gid]) byGroup[gid] = [];
      byGroup[gid].push({
        studentId: r.student_id,
        studentCode: r.student_code,
        fullName: r.full_name,
        role: r.role,
      });
    }
    return byGroup;
  };

  /** Chấm điểm / nhận xét bài nộp theo nhóm (GV) */
  const updateSubmissionGrade = async ({ assignmentId, groupId, score, feedback, gradedBy }) => {
    const [rows] = await db.execute(
      `SELECT id, status FROM assignment_submissions
       WHERE assignment_id = :aid AND group_id = :gid`,
      { aid: Number(assignmentId), gid: Number(groupId) }
    );
    if (!rows.length) return null;
    const st = String(rows[0].status || "");
    if (!["submitted", "graded", "resubmitted"].includes(st)) {
      return null;
    }
    await db.execute(
      `UPDATE assignment_submissions
       SET score = :score,
           feedback = :feedback,
           graded_by = :gradedBy,
           graded_at = CURRENT_TIMESTAMP,
           status = 'graded'
       WHERE id = :id`,
      {
        score,
        feedback,
        gradedBy,
        id: rows[0].id,
      }
    );
    return { id: rows[0].id };
  };

  /**
   * Count assignments that need grading
   */
  const countNeedGradingByLecturer = async (lecturerId, semesterId = null, semesterIds = null) => {
    const params = { lecturerId };
    let whereClause = "c.lecturer_id = :lecturerId AND a.deleted_at IS NULL AND c.deleted_at IS NULL AND g.deleted_at IS NULL AND s.status IN ('submitted', 'resubmitted') AND s.score IS NULL";
    
    if (Array.isArray(semesterIds) && semesterIds.length > 0) {
      const placeholders = semesterIds.map((_, idx) => `:sem${idx}`).join(", ");
      whereClause += ` AND c.semester_id IN (${placeholders})`;
      semesterIds.forEach((id, idx) => { params[`sem${idx}`] = id; });
    } else if (semesterId != null) {
      whereClause += " AND c.semester_id = :semesterId";
      params.semesterId = semesterId;
    }

    const sql = `
      SELECT COUNT(*) as count
      FROM assignment_submissions s
      JOIN assignments a ON a.id = s.assignment_id
      JOIN classes c ON c.id = a.class_id
      JOIN \`groups\` g ON g.id = s.group_id
      WHERE ${whereClause}
    `;
    const [rows] = await db.execute(sql, params);
    return Number(rows[0]?.count || 0);
  };

  /**
   * Get stats for a specific student across all their assignments
   */
  const getStudentStats = async (userId) => {
    const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN s.status IN ('submitted', 'resubmitted', 'graded') THEN 1 END) as submitted,
        COUNT(CASE WHEN (s.status IS NULL OR s.status = 'not_submitted') AND a.deadline < NOW() THEN 1 END) as late,
        COUNT(CASE WHEN (s.status IS NULL OR s.status = 'not_submitted') AND a.deadline >= NOW() THEN 1 END) as pending,
        SUM(s.score) as sum_score,
        COUNT(s.score) as scored_count
      FROM assignments a
      JOIN classes c ON c.id = a.class_id
      JOIN class_students cs ON cs.class_id = c.id
      JOIN students std ON std.id = cs.student_id
      LEFT JOIN group_members gm ON gm.student_id = std.id AND gm.status = 'active'
      LEFT JOIN \`groups\` g ON g.id = gm.group_id AND g.class_id = c.id
      LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.group_id = g.id
      WHERE std.user_id = :userId 
        AND a.deleted_at IS NULL 
        AND a.status != 'draft' 
        AND c.deleted_at IS NULL 
        AND cs.status = 'enrolled'
    `;
    const [rows] = await db.execute(sql, { userId });
    const row = rows[0];
    return {
      total: Number(row?.total || 0),
      submitted: Number(row?.submitted || 0),
      late: Number(row?.late || 0),
      pending: Number(row?.pending || 0),
      sumScore: Number(row?.sum_score || 0),
      scoredCount: Number(row?.scored_count || 0)
    };
  };

  return {
    ...base,
    findClassesByIdsAndLecturer,
    insertMany,
    findManyWithStats,
    countManyWithStats,
    findDetailById,
    findByIdWithClass,
    findByStudent,
    findStudentGroupByClass,
    findByIdForStudent,
    getOrCreateAssignmentSubmission,
    addAssignmentSubmissionFiles,
    finalizeAssignmentSubmission,
    findFilesByAssignmentSubmission,
    listSubmissionsByAssignmentForLecturer,
    findGroupMembersByGroupIds,
    updateSubmissionGrade,
    countNeedGradingByLecturer,
    getStudentStats,
  };
};
