const deletedWhere = (alias, deleted) => {
  if (deleted === "all") return "1 = 1";
  if (deleted === "only") return `${alias}.deleted_at IS NOT NULL`;
  return `${alias}.deleted_at IS NULL`;
};

export const createAdminAcademicRepository = ({ db }) => {
  const countOne = async (sql, params = {}) => {
    const [rows] = await db.execute(sql, params);
    return Number(rows[0]?.total || 0);
  };

  const listSubjects = async ({ search, status, deleted, limit, offset }) => {
    const params = {};
    const where = [deletedWhere("s", deleted)];
    if (search) {
      where.push("(s.subject_code LIKE :search OR s.subject_name LIKE :search OR s.subject_name_en LIKE :search)");
      params.search = `%${search}%`;
    }
    if (status) {
      where.push("s.status = :status");
      params.status = status;
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          s.id, s.subject_code, s.subject_name, s.subject_name_en, s.description,
          s.credits, s.status, s.created_by, creator.full_name AS created_by_name,
          s.created_at, s.updated_at, s.deleted_at,
          COUNT(DISTINCT c.id) AS total_classes
        FROM subjects s
        LEFT JOIN users creator ON creator.id = s.created_by
        LEFT JOIN classes c ON c.subject_id = s.id AND c.deleted_at IS NULL
        WHERE ${whereSql}
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM subjects s WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const findSubjectById = async (id, { includeDeleted = false } = {}) => {
    const [rows] = await db.execute(
      `
        SELECT
          s.*, creator.full_name AS created_by_name,
          COUNT(DISTINCT c.id) AS total_classes
        FROM subjects s
        LEFT JOIN users creator ON creator.id = s.created_by
        LEFT JOIN classes c ON c.subject_id = s.id AND c.deleted_at IS NULL
        WHERE s.id = :id ${includeDeleted ? "" : "AND s.deleted_at IS NULL"}
        GROUP BY s.id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    const subject = rows[0] || null;
    if (!subject) return null;
    const [classes] = await db.execute(
      `
        SELECT
          c.id, c.class_code, c.class_name, c.status, c.created_at,
          sem.semester_code, sem.semester_name, sem.year,
          u.full_name AS lecturer_name,
          (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id AND cs.status = 'enrolled') AS enrolled_count,
          (SELECT COUNT(*) FROM \`groups\` g WHERE g.class_id = c.id AND g.deleted_at IS NULL) AS group_count
        FROM classes c
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN users u ON u.id = c.lecturer_id
        WHERE c.subject_id = :id AND c.deleted_at IS NULL
        ORDER BY sem.year DESC, sem.start_date DESC, c.class_code ASC
      `,
      { id: Number(id) },
    );
    return { ...subject, classes };
  };

  const findSubjectByCode = async (subjectCode, excludeId = null, includeDeleted = true) => {
    const params = { subjectCode };
    let sql = "SELECT id, deleted_at FROM subjects WHERE subject_code = :subjectCode";
    if (!includeDeleted) sql += " AND deleted_at IS NULL";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    sql += " LIMIT 1";
    const [rows] = await db.execute(sql, params);
    return rows[0] || null;
  };

  const createSubject = async (data) => {
    const [result] = await db.execute(
      `
        INSERT INTO subjects
          (subject_code, subject_name, subject_name_en, description, credits, status, created_by)
        VALUES
          (:subject_code, :subject_name, :subject_name_en, :description, :credits, :status, :created_by)
      `,
      data,
    );
    return result.insertId;
  };

  const updateSubject = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE subjects SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`,
      { ...data, id: Number(id) },
    );
  };

  const countSubjectClasses = (subjectId) =>
    countOne("SELECT COUNT(*) AS total FROM classes WHERE subject_id = :subjectId AND deleted_at IS NULL", {
      subjectId: Number(subjectId),
    });

  const listSemesters = async ({ search, year, status, deleted, limit, offset }) => {
    const params = {};
    const where = [deletedWhere("sem", deleted)];
    if (search) {
      where.push("(sem.semester_code LIKE :search OR sem.semester_name LIKE :search)");
      params.search = `%${search}%`;
    }
    if (year) {
      where.push("sem.year = :year");
      params.year = Number(year);
    }
    if (status) {
      where.push("sem.status = :status");
      params.status = status;
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          sem.id, sem.semester_code, sem.semester_name, sem.year,
          sem.start_date, sem.end_date, sem.status, sem.created_by,
          creator.full_name AS created_by_name,
          sem.created_at, sem.updated_at, sem.deleted_at,
          COUNT(DISTINCT c.id) AS total_classes
        FROM semesters sem
        LEFT JOIN users creator ON creator.id = sem.created_by
        LEFT JOIN classes c ON c.semester_id = sem.id AND c.deleted_at IS NULL
        WHERE ${whereSql}
        GROUP BY sem.id
        ORDER BY sem.year DESC, sem.start_date DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM semesters sem WHERE ${whereSql}`, params);
    const currentId = await getCurrentSemesterId();
    return {
      rows: rows.map((row) => withSemesterIsCurrent(row, currentId)),
      total: Number(totalRows[0]?.total || 0),
    };
  };

  const getCurrentSemesterId = async () => {
    const [rows] = await db.execute(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'current_semester_id' LIMIT 1",
    );
    const id = Number(rows[0]?.setting_value);
    return Number.isFinite(id) && id > 0 ? id : null;
  };

  const withSemesterIsCurrent = (semester, currentId) => ({
    ...semester,
    is_current: currentId != null && Number(semester.id) === currentId,
  });

  const findSemesterById = async (id, { includeDeleted = false } = {}) => {
    const [rows] = await db.execute(
      `
        SELECT
          sem.*, creator.full_name AS created_by_name,
          COUNT(DISTINCT c.id) AS total_classes
        FROM semesters sem
        LEFT JOIN users creator ON creator.id = sem.created_by
        LEFT JOIN classes c ON c.semester_id = sem.id AND c.deleted_at IS NULL
        WHERE sem.id = :id ${includeDeleted ? "" : "AND sem.deleted_at IS NULL"}
        GROUP BY sem.id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    const semester = rows[0] || null;
    if (!semester) return null;
    const [classes] = await db.execute(
      `
        SELECT
          c.id, c.class_code, c.class_name, c.status, c.created_at,
          s.subject_code, s.subject_name,
          u.full_name AS lecturer_name,
          (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id AND cs.status = 'enrolled') AS enrolled_count,
          (SELECT COUNT(*) FROM \`groups\` g WHERE g.class_id = c.id AND g.deleted_at IS NULL) AS group_count
        FROM classes c
        JOIN subjects s ON s.id = c.subject_id
        LEFT JOIN users u ON u.id = c.lecturer_id
        WHERE c.semester_id = :id AND c.deleted_at IS NULL
        ORDER BY c.class_code ASC
      `,
      { id: Number(id) },
    );
    const currentId = await getCurrentSemesterId();
    return withSemesterIsCurrent({ ...semester, classes }, currentId);
  };

  const findSemesterByCode = async (semesterCode, excludeId = null, includeDeleted = true) => {
    const params = { semesterCode };
    let sql = "SELECT id, deleted_at FROM semesters WHERE semester_code = :semesterCode";
    if (!includeDeleted) sql += " AND deleted_at IS NULL";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    sql += " LIMIT 1";
    const [rows] = await db.execute(sql, params);
    return rows[0] || null;
  };

  const createSemester = async (data) => {
    const [result] = await db.execute(
      `
        INSERT INTO semesters
          (semester_code, semester_name, year, start_date, end_date, status, created_by)
        VALUES
          (:semester_code, :semester_name, :year, :start_date, :end_date, :status, :created_by)
      `,
      data,
    );
    return result.insertId;
  };

  const updateSemester = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE semesters SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`,
      { ...data, id: Number(id) },
    );
  };

  const listClasses = async ({ search, subjectId, semesterId, lecturerId, status, deleted, limit, offset }) => {
    const params = {};
    const where = [deletedWhere("c", deleted)];
    if (search) {
      where.push("(c.class_code LIKE :search OR c.class_name LIKE :search OR u.full_name LIKE :search)");
      params.search = `%${search}%`;
    }
    if (subjectId) {
      where.push("c.subject_id = :subjectId");
      params.subjectId = Number(subjectId);
    }
    if (semesterId) {
      where.push("c.semester_id = :semesterId");
      params.semesterId = Number(semesterId);
    }
    if (lecturerId) {
      where.push("c.lecturer_id = :lecturerId");
      params.lecturerId = Number(lecturerId);
    }
    if (status) {
      where.push("c.status = :status");
      params.status = status;
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          c.id, c.subject_id, c.semester_id, c.class_code, c.class_name,
          c.lecturer_id, c.max_students, c.min_group_members, c.max_group_members,
          c.status, c.created_by, c.created_at, c.updated_at, c.deleted_at,
          s.subject_code, s.subject_name,
          sem.semester_code, sem.semester_name, sem.year,
          u.full_name AS lecturer_name,
          (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id AND cs.status = 'enrolled') AS enrolled_count,
          (SELECT COUNT(*) FROM \`groups\` g WHERE g.class_id = c.id AND g.deleted_at IS NULL) AS group_count
        FROM classes c
        JOIN subjects s ON s.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN users u ON u.id = c.lecturer_id
        WHERE ${whereSql}
        ORDER BY c.created_at DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(
      `
        SELECT COUNT(*) AS total
        FROM classes c
        JOIN subjects s ON s.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN users u ON u.id = c.lecturer_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const findClassById = async (id, { includeDeleted = false } = {}) => {
    const [rows] = await db.execute(
      `
        SELECT
          c.*, creator.full_name AS created_by_name,
          s.subject_code, s.subject_name, s.subject_name_en, s.credits,
          sem.semester_code, sem.semester_name, sem.year, sem.start_date, sem.end_date, sem.status AS semester_status,
          u.full_name AS lecturer_name, u.email AS lecturer_email,
          (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id AND cs.status = 'enrolled') AS enrolled_count,
          (SELECT COUNT(*) FROM \`groups\` g WHERE g.class_id = c.id AND g.deleted_at IS NULL) AS group_count
        FROM classes c
        JOIN subjects s ON s.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN users u ON u.id = c.lecturer_id
        LEFT JOIN users creator ON creator.id = c.created_by
        WHERE c.id = :id ${includeDeleted ? "" : "AND c.deleted_at IS NULL"}
        LIMIT 1
      `,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const findClassByCodeSemester = async (classCode, semesterId, excludeId = null, includeDeleted = true) => {
    const params = { classCode, semesterId: Number(semesterId) };
    let sql = "SELECT id, deleted_at FROM classes WHERE class_code = :classCode AND semester_id = :semesterId";
    if (!includeDeleted) sql += " AND deleted_at IS NULL";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    sql += " LIMIT 1";
    const [rows] = await db.execute(sql, params);
    return rows[0] || null;
  };

  const createClass = async (data) => {
    const [result] = await db.execute(
      `
        INSERT INTO classes
          (subject_id, semester_id, class_code, class_name, lecturer_id, max_students,
           min_group_members, max_group_members, status, created_by)
        VALUES
          (:subject_id, :semester_id, :class_code, :class_name, :lecturer_id, :max_students,
           :min_group_members, :max_group_members, :status, :created_by)
      `,
      data,
    );
    return result.insertId;
  };

  const updateClass = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE classes SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`,
      { ...data, id: Number(id) },
    );
  };

  const getClassDependencies = async (classId) => {
    const params = { classId: Number(classId) };
    const [enrollments, groups, checkpointSubmissions, assignmentSubmissions] = await Promise.all([
      countOne("SELECT COUNT(*) AS total FROM class_students WHERE class_id = :classId", params),
      countOne("SELECT COUNT(*) AS total FROM `groups` WHERE class_id = :classId AND deleted_at IS NULL", params),
      countOne(
        `
          SELECT COUNT(*) AS total
          FROM checkpoint_submissions cs
          JOIN checkpoints cp ON cp.id = cs.checkpoint_id
          WHERE cp.class_id = :classId
        `,
        params,
      ),
      countOne(
        `
          SELECT COUNT(*) AS total
          FROM assignment_submissions s
          JOIN assignments a ON a.id = s.assignment_id
          WHERE a.class_id = :classId
        `,
        params,
      ),
    ]);
    return {
      enrollments,
      groups,
      submissions: checkpointSubmissions + assignmentSubmissions,
    };
  };

  const findLookupSubject = async (id) => {
    const [rows] = await db.execute(
      "SELECT id, subject_code, subject_name, status FROM subjects WHERE id = :id AND deleted_at IS NULL LIMIT 1",
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const findLookupSemester = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT id, semester_code, semester_name, status
        FROM semesters
        WHERE id = :id AND deleted_at IS NULL
        LIMIT 1
      `,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const findLecturerUser = async (id) => {
    if (!id) return null;
    const [rows] = await db.execute(
      `
        SELECT u.id, u.full_name, u.email
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.id = :id
          AND u.deleted_at IS NULL
          AND u.status = 'active'
          AND r.role_code = 'lecturer'
        LIMIT 1
      `,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const getLookups = async () => {
    const [subjects, semesters, lecturers, years] = await Promise.all([
      db.execute(
        `
          SELECT id, subject_code, subject_name, status
          FROM subjects
          WHERE deleted_at IS NULL
          ORDER BY subject_code ASC
        `,
      ),
      db.execute(
        `
          SELECT id, semester_code, semester_name, year, status, start_date, end_date
          FROM semesters
          WHERE deleted_at IS NULL
          ORDER BY year DESC, start_date DESC
        `,
      ),
      db.execute(
        `
          SELECT DISTINCT u.id, u.full_name, u.email
          FROM users u
          JOIN user_roles ur ON ur.user_id = u.id
          JOIN roles r ON r.id = ur.role_id
          WHERE u.deleted_at IS NULL
            AND u.status = 'active'
            AND r.role_code = 'lecturer'
          ORDER BY u.full_name ASC
        `,
      ),
      db.execute(
        `
          SELECT DISTINCT year
          FROM semesters
          WHERE deleted_at IS NULL
          ORDER BY year DESC
        `,
      ),
    ]);
    return {
      subjects: subjects[0],
      semesters: semesters[0],
      lecturers: lecturers[0],
      years: years[0].map((row) => row.year),
    };
  };

  return {
    listSubjects,
    findSubjectById,
    findSubjectByCode,
    createSubject,
    updateSubject,
    countSubjectClasses,
    listSemesters,
    findSemesterById,
    findSemesterByCode,
    createSemester,
    updateSemester,
    listClasses,
    findClassById,
    findClassByCodeSemester,
    createClass,
    updateClass,
    getClassDependencies,
    findLookupSubject,
    findLookupSemester,
    findLecturerUser,
    getLookups,
  };
};
