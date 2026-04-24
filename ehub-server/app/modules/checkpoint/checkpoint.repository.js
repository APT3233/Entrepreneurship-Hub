import { createBaseRepository } from "app/core/database/baseRepository.js";

/**
 * Checkpoint Repository
 * Handles database operations for the 'checkpoints' table
 */
export const createCheckpointRepository = ({ db }) => {
  const base = createBaseRepository(db, "checkpoints");

  /**
   * Find all checkpoints for a specific class
   * @param {number} classId 
   * @returns {Promise<Array>}
   */
  const findByClass = async (classId) => {
    const sql = `
      SELECT cp.*, c.class_code, c.class_name,
        (SELECT COUNT(*) FROM checkpoint_submissions cs WHERE cs.checkpoint_id = cp.id AND cs.score IS NOT NULL) as graded_count,
        (SELECT COUNT(*) FROM checkpoint_submissions cs WHERE cs.checkpoint_id = cp.id AND cs.status IN ('submitted', 'resubmitted', 'graded')) as submitted_groups,
        (SELECT COUNT(*) FROM \`groups\` g WHERE g.class_id = cp.class_id AND g.deleted_at IS NULL) as total_groups
      FROM checkpoints cp
      JOIN classes c ON c.id = cp.class_id
      WHERE cp.class_id = :classId 
        AND cp.deleted_at IS NULL
      ORDER BY cp.order_index ASC, cp.created_at ASC
    `;
    const [rows] = await db.execute(sql, { classId: Number(classId) });
    return rows;
  };

  /**
   * Find checkpoints with dynamic filters (for lecturers)
   */
  const findWithFilters = async (filters) => {
    const params = {};
    const clauses = ["cp.deleted_at IS NULL", "c.deleted_at IS NULL"];
    
    if (filters.class_id) {
      clauses.push("cp.class_id = :class_id");
      params.class_id = Number(filters.class_id);
    }
    if (filters.lecturer_id) {
      clauses.push("c.lecturer_id = :lecturer_id");
      params.lecturer_id = Number(filters.lecturer_id);
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
      SELECT cp.*, c.class_code, c.class_name,
        (SELECT COUNT(*) FROM checkpoint_submissions cs WHERE cs.checkpoint_id = cp.id AND cs.score IS NOT NULL) as graded_count,
        (SELECT COUNT(*) FROM checkpoint_submissions cs WHERE cs.checkpoint_id = cp.id AND cs.status IN ('submitted', 'resubmitted', 'graded')) as submitted_groups,
        (SELECT COUNT(*) FROM \`groups\` g WHERE g.class_id = cp.class_id AND g.deleted_at IS NULL) as total_groups
      FROM checkpoints cp
      JOIN classes c ON c.id = cp.class_id
      JOIN semesters sem ON sem.id = c.semester_id
      WHERE ${clauses.join(" AND ")}
      ORDER BY c.class_code ASC, cp.order_index ASC, cp.created_at ASC
    `;
    const [rows] = await db.execute(sql, params);
    return rows;
  };

  /**
   * Find checkpoint with class information for ownership check
   * @param {number} id 
   * @returns {Promise<Object>}
   */
  const findByIdWithClass = async (id) => {
    const sql = `
      SELECT cp.*, c.lecturer_id
      FROM checkpoints cp
      JOIN classes c ON c.id = cp.class_id
      WHERE cp.id = :id
        AND cp.deleted_at IS NULL
        AND c.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { id: Number(id) });
    return rows[0] || null;
  };

  /**
   * Find class by ID and Lecturer
   * @param {number} classId 
   * @param {number} lecturerId 
   * @returns {Promise<Object>}
   */
  const findClassByIdAndLecturer = async (classId, lecturerId) => {
    const sql = `
      SELECT id, class_code
      FROM classes
      WHERE id = :classId
        AND lecturer_id = :lecturerId
        AND deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { classId: Number(classId), lecturerId: Number(lecturerId) });
    return rows[0] || null;
  };

  /**
   * Find all groups and their submission status for a checkpoint
   */
  const findSubmissionsByCheckpoint = async (checkpointId) => {
    const sql = `
      SELECT 
        g.id as group_id, 
        g.group_name,
        g.group_code,
        cs.id as submission_id,
        COALESCE(cs.status, 'not_submitted') as status,
        cs.score,
        cs.feedback,
        cs.submitted_at,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'active') as member_count,
        (SELECT COALESCE(COUNT(f.id), 0) FROM checkpoint_submission_files f
         WHERE f.submission_id = cs.id AND f.is_deleted = 0) as file_count
      FROM \`groups\` g
      JOIN checkpoints cp ON cp.class_id = g.class_id
      LEFT JOIN checkpoint_submissions cs ON cs.group_id = g.id AND cs.checkpoint_id = cp.id
      WHERE cp.id = :checkpointId
        AND g.deleted_at IS NULL
        AND cp.deleted_at IS NULL
      ORDER BY g.group_name ASC
    `;
    const [rows] = await db.execute(sql, { checkpointId: Number(checkpointId) });
    return rows;
  };

  /**
   * Find submission detail with files
   */
  const findSubmissionDetail = async (checkpointId, groupId) => {
    const sql = `
      SELECT cs.*, g.group_name, g.group_code,
        u_sub.full_name AS submitter_name,
        u_gr.full_name AS grader_name
      FROM checkpoint_submissions cs
      JOIN \`groups\` g ON g.id = cs.group_id
      LEFT JOIN users u_sub ON u_sub.id = cs.submitted_by
      LEFT JOIN users u_gr ON u_gr.id = cs.graded_by
      WHERE cs.checkpoint_id = :checkpointId AND cs.group_id = :groupId
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { checkpointId: Number(checkpointId), groupId: Number(groupId) });
    const submission = rows[0] || null;

    if (submission) {
      const fileSql = `
        SELECT * FROM checkpoint_submission_files
        WHERE submission_id = :submissionId AND is_deleted = 0
        ORDER BY id ASC
      `;
      const [files] = await db.execute(fileSql, { submissionId: submission.id });
      submission.files = files;
    }

    return submission;
  };

  /** Giống assignment: thành viên nhóm (active) */
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

  /**
   * Check if checkpoint has any graded submissions
   */
  const countGradedSubmissions = async (checkpointId) => {
    const sql = `SELECT COUNT(*) as count FROM checkpoint_submissions WHERE checkpoint_id = :checkpointId AND score IS NOT NULL`;
    const [rows] = await db.execute(sql, { checkpointId });
    return rows[0].count;
  };

  /**
   * Find files for a submission
   */
  const findFilesBySubmissionId = async (submissionId) => {
    const sql = `SELECT * FROM checkpoint_submission_files WHERE submission_id = :submissionId`;
    const [rows] = await db.execute(sql, { submissionId });
    return rows;
  };

  /**
   * Update grade for a submission
   */
  const updateSubmissionGrade = async (checkpointId, groupId, { score, feedback, gradedBy }) => {
    // Check if submission exists
    const [existing] = await db.execute(
      "SELECT id FROM checkpoint_submissions WHERE checkpoint_id = :checkpointId AND group_id = :groupId",
      { checkpointId, groupId }
    );

    const now = new Date();
    if (existing.length > 0) {
      const sql = `
        UPDATE checkpoint_submissions 
        SET score = :score, feedback = :feedback, graded_by = :gradedBy, graded_at = :gradedAt, status = 'graded'
        WHERE id = :id
      `;
      await db.execute(sql, { 
        score, 
        feedback, 
        gradedBy, 
        gradedAt: now, 
        id: existing[0].id 
      });
      return existing[0].id;
    } else {
      // If lecturer wants to grade even if not submitted (e.g. 0 score)
      const sql = `
        INSERT INTO checkpoint_submissions (checkpoint_id, group_id, score, feedback, graded_by, graded_at, status)
        VALUES (:checkpointId, :groupId, :score, :feedback, :gradedBy, :gradedAt, 'graded')
      `;
      const [result] = await db.execute(sql, {
        checkpointId,
        groupId,
        score,
        feedback,
        gradedBy,
        gradedAt: now
      });
      return result.insertId;
    }
  };

  /**
   * Find all checkpoints for a class and include a specific group's submission status
   */
  const findCheckpointsByGroup = async (groupId) => {
    const sql = `
      SELECT 
        cp.*,
        cs.status as submission_status,
        cs.score,
        cs.feedback,
        cs.submitted_at,
        cs.id as submission_id
      FROM checkpoints cp
      JOIN \`groups\` g ON g.class_id = cp.class_id
      LEFT JOIN checkpoint_submissions cs ON cs.checkpoint_id = cp.id AND cs.group_id = g.id
      WHERE g.id = :groupId
        AND cp.deleted_at IS NULL
        AND g.deleted_at IS NULL
      ORDER BY cp.order_index ASC, cp.created_at ASC
    `;
    const [rows] = await db.execute(sql, { groupId: Number(groupId) });
    return rows;
  };

  /**
   * Find all checkpoints for a student across all enrolled classes
   * Includes group info and submission status if student is in a group for that class
   */
  const findCheckpointsByStudent = async (userId, filters = {}) => {
    const params = { userId };
    let whereClause = "s.user_id = :userId AND cp.deleted_at IS NULL AND cp.status != 'draft' AND c.deleted_at IS NULL AND cl_s.status = 'enrolled'";
    
    if (filters.semester_id) {
      whereClause += " AND c.semester_id = :semesterId";
      params.semesterId = filters.semester_id;
    }
    if (filters.class_id) {
      whereClause += " AND c.id = :classId";
      params.classId = filters.class_id;
    }
    if (filters.year) {
      whereClause += " AND sem.year = :year";
      params.year = filters.year;
    }

    const sql = `
      SELECT 
        cp.*,
        c.class_code,
        c.class_name,
        g.id as group_id,
        g.group_name,
        g.category,
        g.topic,
        cs.status as submission_status,
        cs.score,
        cs.feedback,
        cs.submitted_at,
        cs.id as submission_id
      FROM checkpoints cp
      JOIN classes c ON c.id = cp.class_id
      JOIN semesters sem ON sem.id = c.semester_id
      JOIN class_students cl_s ON cl_s.class_id = c.id
      JOIN students s ON s.id = cl_s.student_id
      LEFT JOIN group_members gm ON gm.student_id = s.id AND gm.status = 'active'
      LEFT JOIN \`groups\` g ON g.id = gm.group_id AND g.class_id = c.id
      LEFT JOIN checkpoint_submissions cs ON cs.checkpoint_id = cp.id AND cs.group_id = g.id
      WHERE ${whereClause}
      ORDER BY sem.year DESC, sem.semester_code DESC, c.class_code ASC, cp.order_index ASC
    `;
    const [rows] = await db.execute(sql, params);
    return rows;
  };

  /**
   * Find student's group in a specific class
   */
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

  /**
   * Bài nộp theo checkpoint + nhóm (trạng thái, để chặn nộp lại khi đã chấm)
   */
  const findSubmissionByCheckpointAndGroup = async (checkpointId, groupId) => {
    const [rows] = await db.execute(
      `SELECT id, status, score
       FROM checkpoint_submissions
       WHERE checkpoint_id = :checkpointId AND group_id = :groupId
       LIMIT 1`,
      { checkpointId: Number(checkpointId), groupId: Number(groupId) }
    );
    return rows[0] || null;
  };

  /**
   * Create or update a submission record
   */
  const createOrUpdateSubmission = async (data) => {
    const { 
      checkpoint_id, 
      group_id, 
      submitted_by, 
      note = null, 
      is_late = 0 
    } = data;
    const now = new Date();

    // Check if exists
    const [existing] = await db.execute(
      "SELECT id FROM checkpoint_submissions WHERE checkpoint_id = :checkpoint_id AND group_id = :group_id",
      { checkpoint_id, group_id }
    );

    if (existing.length > 0) {
      const sql = `
        UPDATE checkpoint_submissions 
        SET submitted_by = :submitted_by, 
            submitted_at = :submitted_at, 
            is_late = :is_late, 
            note = :note,
            status = 'submitted'
        WHERE id = :id
          AND status IN ('not_submitted', 'submitted', 'resubmitted')
      `;
      const [result] = await db.execute(sql, {
        submitted_by,
        submitted_at: now,
        is_late,
        note,
        id: existing[0].id
      });
      if (result.affectedRows === 0) {
        const [st] = await db.execute("SELECT status FROM checkpoint_submissions WHERE id = :id", {
          id: existing[0].id
        });
        if (st[0]?.status === "graded") {
          const e = new Error("SUBMISSION_GRADED");
          e.code = "SUBMISSION_GRADED";
          throw e;
        }
      }
      return existing[0].id;
    } else {
      const sql = `
        INSERT INTO checkpoint_submissions (checkpoint_id, group_id, submitted_by, submitted_at, is_late, note, status)
        VALUES (:checkpoint_id, :group_id, :submitted_by, :submitted_at, :is_late, :note, 'submitted')
      `;
      const [result] = await db.execute(sql, {
        checkpoint_id,
        group_id,
        submitted_by,
        submitted_at: now,
        is_late,
        note
      });
      return result.insertId;
    }
  };

  /**
   * Add files to a submission
   */
  const addSubmissionFiles = async (submissionId, files) => {
    if (!files || files.length === 0) return;

    const sql = `
      INSERT INTO checkpoint_submission_files 
      (submission_id, file_name, file_path, file_url, file_type, mime_type, file_size, uploaded_by)
      VALUES (:submission_id, :file_name, :file_path, :file_url, :file_type, :mime_type, :file_size, :uploaded_by)
    `;

    for (const file of files) {
      await db.execute(sql, {
        submission_id: submissionId,
        file_name: file.file_name,
        file_path: file.file_path,
        file_url: file.file_url,
        file_type: file.file_type,
        mime_type: file.mime_type,
        file_size: file.file_size,
        uploaded_by: file.uploaded_by
      });
    }
  };

  /**
   * Delete all files for a submission (used when re-submitting)
   */
  const deleteSubmissionFiles = async (submissionId) => {
    await db.execute("DELETE FROM checkpoint_submission_files WHERE submission_id = :submissionId", { submissionId });
  };

  /**
   * Create an upload session
   */
  const createUploadSession = async ({ userId, checkpointId, groupId, fileCount, expiresAt }) => {
    const sql = `
      INSERT INTO upload_sessions (user_id, checkpoint_id, group_id, file_count, expires_at)
      VALUES (:userId, :checkpointId, :groupId, :fileCount, :expiresAt)
    `;
    const [result] = await db.execute(sql, { userId, checkpointId, groupId, fileCount, expiresAt });
    return result.insertId;
  };

  /**
   * Find upload session by ID
   */
  const findUploadSession = async (sessionId) => {
    const sql = `SELECT * FROM upload_sessions WHERE id = :sessionId`;
    const [rows] = await db.execute(sql, { sessionId });
    return rows[0] || null;
  };

  /**
   * Update upload session status
   */
  const updateUploadSessionStatus = async (sessionId, status) => {
    await db.execute("UPDATE upload_sessions SET status = :status WHERE id = :sessionId", { status, sessionId });
  };

  /**
   * Insert pending file records for presigned URL upload
   */
  const addPendingFiles = async (submissionId, sessionId, files) => {
    const sql = `
      INSERT INTO checkpoint_submission_files 
      (submission_id, file_name, file_path, file_type, mime_type, file_size, uploaded_by, upload_status, session_id)
      VALUES (:submission_id, :file_name, :file_path, :file_type, :mime_type, :file_size, :uploaded_by, 'pending', :session_id)
    `;
    for (const file of files) {
      await db.execute(sql, {
        submission_id: submissionId,
        file_name: file.file_name,
        file_path: file.file_path,
        file_type: file.file_type,
        mime_type: file.mime_type,
        file_size: file.file_size,
        uploaded_by: file.uploaded_by,
        session_id: sessionId,
      });
    }
  };

  /**
   * Find pending files by session ID
   */
  const findPendingFilesBySession = async (sessionId) => {
    const sql = `SELECT * FROM checkpoint_submission_files WHERE session_id = :sessionId`;
    const [rows] = await db.execute(sql, { sessionId });
    return rows;
  };

  /**
   * Update file upload status and etag after client confirms
   */
  const updateFileUploadStatus = async (fileId, status, etag = null) => {
    const sql = `UPDATE checkpoint_submission_files SET upload_status = :status, etag = :etag WHERE id = :fileId`;
    await db.execute(sql, { status, etag, fileId });
  };

  /**
   * Find expired upload sessions
   */
  const findExpiredUploadSessions = async () => {
    const sql = `
      SELECT * FROM upload_sessions 
      WHERE expires_at < NOW() AND status IN ('initiated', 'uploading')
    `;
    const [rows] = await db.execute(sql);
    return rows;
  };

  /**
   * Delete pending files by their IDs
   */
  const deletePendingFiles = async (fileIds) => {
    if (!fileIds || fileIds.length === 0) return;
    const placeholders = fileIds.map(() => '?').join(',');
    const sql = `DELETE FROM checkpoint_submission_files WHERE id IN (${placeholders})`;
    await db.execute(sql, fileIds);
  };

  /**
   * Find checkpoint with subject and class information
   */
  const findByIdWithSubjectAndClass = async (id) => {
    const sql = `
      SELECT cp.*, s.subject_code, c.class_code, sem.semester_code
      FROM checkpoints cp
      JOIN classes c ON c.id = cp.class_id
      JOIN subjects s ON s.id = c.subject_id
      JOIN semesters sem ON sem.id = c.semester_id
      WHERE cp.id = :id
        AND cp.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { id: Number(id) });
    return rows[0] || null;
  };

  /**
   * Get overall submission stats for a lecturer across all classes
   */
  const getSubmissionStatsByLecturer = async (lecturerId, semesterId = null, semesterIds = null) => {
    const params = { lecturerId };
    let whereClause = "c.lecturer_id = :lecturerId AND cp.deleted_at IS NULL AND c.deleted_at IS NULL AND g.deleted_at IS NULL AND cp.status != 'draft'";
    
    if (Array.isArray(semesterIds) && semesterIds.length > 0) {
      const placeholders = semesterIds.map((_, idx) => `:sem${idx}`).join(", ");
      whereClause += ` AND c.semester_id IN (${placeholders})`;
      semesterIds.forEach((id, idx) => { params[`sem${idx}`] = id; });
    } else if (semesterId != null) {
      whereClause += " AND c.semester_id = :semesterId";
      params.semesterId = semesterId;
    }

    const sql = `
      SELECT 
        COUNT(DISTINCT cp.id) as total_checkpoints,
        COUNT(*) as total_required,
        COUNT(CASE WHEN cs.status IN ('submitted', 'resubmitted', 'graded') THEN 1 END) as submitted,
        COUNT(CASE WHEN (cs.status IS NULL OR cs.status = 'not_submitted') AND cp.deadline >= NOW() THEN 1 END) as pending,
        COUNT(CASE WHEN (cs.status IN ('submitted', 'resubmitted', 'graded') AND cs.is_late = 1) 
                    OR ((cs.status IS NULL OR cs.status = 'not_submitted') AND cp.deadline < NOW()) THEN 1 END) as late
      FROM checkpoints cp
      JOIN classes c ON c.id = cp.class_id
      JOIN \`groups\` g ON g.class_id = c.id
      LEFT JOIN checkpoint_submissions cs ON cs.checkpoint_id = cp.id AND cs.group_id = g.id
      WHERE ${whereClause}
    `;
    const [rows] = await db.execute(sql, params);
    return {
      total_checkpoints: Number(rows[0]?.total_checkpoints || 0),
      submitted: Number(rows[0]?.submitted || 0),
      pending: Number(rows[0]?.pending || 0),
      late: Number(rows[0]?.late || 0),
      total_required: Number(rows[0]?.total_required || 0)
    };
  };

  /**
   * Count submissions that need grading (submitted or resubmitted but score is null)
   */
  const countNeedGradingByLecturer = async (lecturerId, semesterId = null, semesterIds = null) => {
    const params = { lecturerId };
    let whereClause = "c.lecturer_id = :lecturerId AND cp.deleted_at IS NULL AND c.deleted_at IS NULL AND g.deleted_at IS NULL AND cs.status IN ('submitted', 'resubmitted') AND cs.score IS NULL";
    
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
      FROM checkpoint_submissions cs
      JOIN checkpoints cp ON cp.id = cs.checkpoint_id
      JOIN classes c ON c.id = cp.class_id
      JOIN \`groups\` g ON g.id = cs.group_id
      WHERE ${whereClause}
    `;
    const [rows] = await db.execute(sql, params);
    return Number(rows[0]?.count || 0);
  };

  /**
   * Get stats for a specific student across all their checkpoints
   */
  const getStudentStats = async (userId) => {
    const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN cs.status IN ('submitted', 'resubmitted', 'graded') THEN 1 END) as submitted,
        COUNT(CASE WHEN (cs.status IS NULL OR cs.status = 'not_submitted') AND cp.deadline < NOW() THEN 1 END) as late,
        COUNT(CASE WHEN (cs.status IS NULL OR cs.status = 'not_submitted') AND cp.deadline >= NOW() THEN 1 END) as pending,
        SUM(cs.score) as sum_score,
        COUNT(cs.score) as scored_count
      FROM checkpoints cp
      JOIN classes c ON c.id = cp.class_id
      JOIN class_students cl_s ON cl_s.class_id = c.id
      JOIN students s ON s.id = cl_s.student_id
      LEFT JOIN group_members gm ON gm.student_id = s.id AND gm.status = 'active'
      LEFT JOIN \`groups\` g ON g.id = gm.group_id AND g.class_id = c.id
      LEFT JOIN checkpoint_submissions cs ON cs.checkpoint_id = cp.id AND cs.group_id = g.id
      WHERE s.user_id = :userId 
        AND cp.deleted_at IS NULL 
        AND cp.status != 'draft' 
        AND c.deleted_at IS NULL 
        AND cl_s.status = 'enrolled'
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

  /**
   * Đếm số bài nộp checkpoint đã thực sự submit (submitted_at IS NOT NULL)
   * thuộc các nhóm của 1 lớp. Dùng để chặn xóa lớp đã có dữ liệu nộp bài.
   */
  const countSubmittedByClass = async (classId) => {
    const sql = `
      SELECT COUNT(*) AS total
      FROM checkpoint_submissions cs
      JOIN \`groups\` g ON g.id = cs.group_id AND g.deleted_at IS NULL
      WHERE g.class_id = :classId AND cs.submitted_at IS NOT NULL
    `;
    const [rows] = await db.execute(sql, { classId: Number(classId) });
    return Number(rows[0]?.total || 0);
  };

  return {
    ...base,
    findByClass,
    findByIdWithClass,
    findClassByIdAndLecturer,
    findSubmissionDetail,
    updateSubmissionGrade,
    findCheckpointsByGroup,
    findCheckpointsByStudent,
    findWithFilters,
    findSubmissionsByCheckpoint,
    findGroupMembersByGroupIds,
    findSubmissionByCheckpointAndGroup,
    findStudentGroupByClass,
    createOrUpdateSubmission,
    addSubmissionFiles,
    deleteSubmissionFiles,
    findFilesBySubmissionId,
    countGradedSubmissions,
    createUploadSession,
    findUploadSession,
    updateUploadSessionStatus,
    addPendingFiles,
    findPendingFilesBySession,
    updateFileUploadStatus,
    findExpiredUploadSessions,
    deletePendingFiles,
    findByIdWithSubjectAndClass,
    getSubmissionStatsByLecturer,
    countNeedGradingByLecturer,
    getStudentStats,
    countSubmittedByClass,
  };
};
