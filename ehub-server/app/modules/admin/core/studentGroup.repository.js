const countOne = async (db, sql, params = {}) => {
  const [rows] = await db.execute(sql, params);
  return Number(rows[0]?.total || 0);
};

const pageSql = (limit, offset) => `LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

export const createAdminStudentGroupRepository = ({ db }) => {
  const listStudents = async ({ search, status, major, campus, limit, offset }) => {
    const params = {};
    const where = ["s.deleted_at IS NULL"];
    if (search) {
      where.push("(s.student_code LIKE :search OR s.full_name LIKE :search OR s.email LIKE :search)");
      params.search = `%${search}%`;
    }
    if (status) {
      where.push("s.status = :status");
      params.status = status;
    }
    if (major) {
      where.push("s.major = :major");
      params.major = major;
    }
    if (campus) {
      where.push("s.campus = :campus");
      params.campus = campus;
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          s.id, s.user_id, s.student_code, s.full_name, s.email, s.phone, s.major, s.campus,
          s.status, s.created_at, s.updated_at, s.deleted_at,
          u.username AS linked_username,
          COUNT(DISTINCT cs.id) AS total_classes,
          COUNT(DISTINCT CASE WHEN gm.status = 'active' AND g.deleted_at IS NULL THEN gm.group_id END) AS active_groups
        FROM students s
        LEFT JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL
        LEFT JOIN class_students cs ON cs.student_id = s.id
        LEFT JOIN group_members gm ON gm.student_id = s.id
        LEFT JOIN \`groups\` g ON g.id = gm.group_id
        WHERE ${whereSql}
        GROUP BY s.id
        ORDER BY s.created_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM students s WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const findStudentById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT s.*, u.username AS linked_username, u.email AS linked_email
        FROM students s
        LEFT JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL
        WHERE s.id = :id AND s.deleted_at IS NULL
        LIMIT 1
      `,
      { id: Number(id) },
    );
    const student = rows[0] || null;
    if (!student) return null;
    const [classes] = await db.execute(
      `
        SELECT
          cs.id AS enrollment_id, cs.status AS enrollment_status, cs.enrolled_at, cs.dropped_at,
          c.id AS class_id, c.class_code, c.class_name,
          sub.subject_code, sub.subject_name,
          sem.semester_code, sem.semester_name, sem.year,
          g.id AS group_id, g.group_code, g.group_name
        FROM class_students cs
        JOIN classes c ON c.id = cs.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN group_members gm ON gm.student_id = cs.student_id AND gm.status = 'active'
        LEFT JOIN \`groups\` g ON g.id = gm.group_id AND g.class_id = c.id AND g.deleted_at IS NULL
        WHERE cs.student_id = :id
        ORDER BY sem.year DESC, sem.start_date DESC, c.class_code ASC
      `,
      { id: Number(id) },
    );
    return { ...student, classes };
  };

  const findStudentByCode = async (studentCode, excludeId = null) => {
    const params = { studentCode };
    let sql = "SELECT id FROM students WHERE student_code = :studentCode AND deleted_at IS NULL";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    sql += " LIMIT 1";
    const [rows] = await db.execute(sql, params);
    return rows[0] || null;
  };

  const findStudentByEmail = async (email, excludeId = null) => {
    const params = { email };
    let sql = "SELECT id FROM students WHERE email = :email AND deleted_at IS NULL";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    sql += " LIMIT 1";
    const [rows] = await db.execute(sql, params);
    return rows[0] || null;
  };

  const createStudent = async (data) => {
    const [result] = await db.execute(
      `
        INSERT INTO students (user_id, student_code, full_name, email, phone, major, campus, status)
        VALUES (:user_id, :student_code, :full_name, :email, :phone, :major, :campus, :status)
      `,
      data,
    );
    return result.insertId;
  };

  const updateStudent = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE students SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`,
      { ...data, id: Number(id) },
    );
  };

  const getStudentDependencyCounts = async (studentId) => {
    const params = { studentId: Number(studentId) };
    const [enrollments, groups] = await Promise.all([
      countOne(db, "SELECT COUNT(*) AS total FROM class_students WHERE student_id = :studentId", params),
      countOne(
        db,
        `
          SELECT COUNT(*) AS total
          FROM group_members gm
          JOIN \`groups\` g ON g.id = gm.group_id AND g.deleted_at IS NULL
          WHERE gm.student_id = :studentId AND gm.status = 'active'
        `,
        params,
      ),
    ]);
    return { enrollments, groups };
  };

  const listEnrollments = async ({ search, classId, semesterId, subjectId, status, limit, offset }) => {
    const params = {};
    const where = ["c.deleted_at IS NULL", "s.deleted_at IS NULL"];
    if (search) {
      where.push("(s.student_code LIKE :search OR s.full_name LIKE :search OR s.email LIKE :search OR c.class_code LIKE :search)");
      params.search = `%${search}%`;
    }
    if (classId) {
      where.push("cs.class_id = :classId");
      params.classId = Number(classId);
    }
    if (semesterId) {
      where.push("c.semester_id = :semesterId");
      params.semesterId = Number(semesterId);
    }
    if (subjectId) {
      where.push("c.subject_id = :subjectId");
      params.subjectId = Number(subjectId);
    }
    if (status) {
      where.push("cs.status = :status");
      params.status = status;
    }
    const whereSql = where.join(" AND ");
    const sql = `
      SELECT
        cs.id, cs.class_id, cs.student_id, cs.status, cs.enrolled_at, cs.dropped_at,
        c.class_code, c.class_name,
        sub.subject_code, sub.subject_name,
        sem.semester_code, sem.semester_name, sem.year,
        s.student_code, s.full_name AS student_name, s.email, s.major, s.user_id,
        g.id AS group_id, g.group_code, g.group_name
      FROM class_students cs
      JOIN classes c ON c.id = cs.class_id
      JOIN subjects sub ON sub.id = c.subject_id
      JOIN semesters sem ON sem.id = c.semester_id
      JOIN students s ON s.id = cs.student_id
      LEFT JOIN group_members gm ON gm.student_id = s.id AND gm.status = 'active'
      LEFT JOIN \`groups\` g ON g.id = gm.group_id AND g.class_id = c.id AND g.deleted_at IS NULL
      WHERE ${whereSql}
      ORDER BY cs.enrolled_at DESC
      ${pageSql(limit, offset)}
    `;
    const [rows] = await db.execute(sql, params);
    const [totalRows] = await db.execute(
      `
        SELECT COUNT(*) AS total
        FROM class_students cs
        JOIN classes c ON c.id = cs.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        JOIN students s ON s.id = cs.student_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const findEnrollmentById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT cs.*, c.class_code, c.class_name, c.subject_id, c.semester_id, c.status AS class_status,
               s.student_code, s.full_name, s.email, s.user_id
        FROM class_students cs
        JOIN classes c ON c.id = cs.class_id AND c.deleted_at IS NULL
        JOIN students s ON s.id = cs.student_id AND s.deleted_at IS NULL
        WHERE cs.id = :id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const findEnrollmentByClassStudent = async (classId, studentId) => {
    const [rows] = await db.execute(
      "SELECT * FROM class_students WHERE class_id = :classId AND student_id = :studentId LIMIT 1",
      { classId: Number(classId), studentId: Number(studentId) },
    );
    return rows[0] || null;
  };

  const findAnyEnrollmentByStudent = async (studentId) => {
    const [rows] = await db.execute(
      `
        SELECT cs.*, COALESCE(c.class_code, CONCAT('ID ', cs.class_id)) AS class_code
        FROM class_students cs
        LEFT JOIN classes c ON c.id = cs.class_id
        WHERE cs.student_id = :studentId
        LIMIT 1
      `,
      { studentId: Number(studentId) },
    );
    return rows[0] || null;
  };

  const findClassForEnrollment = async (classId) => {
    const [rows] = await db.execute(
      `
        SELECT c.*, sub.subject_code, sub.subject_name, sem.semester_code, sem.semester_name
        FROM classes c
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        WHERE c.id = :classId AND c.deleted_at IS NULL
        LIMIT 1
      `,
      { classId: Number(classId) },
    );
    return rows[0] || null;
  };

  const findSameSubjectSemesterEnrollment = async (classId, studentId, subjectId, semesterId) => {
    const [rows] = await db.execute(
      `
        SELECT c.class_code
        FROM class_students cs
        JOIN classes c ON c.id = cs.class_id AND c.deleted_at IS NULL
        WHERE cs.student_id = :studentId
          AND c.subject_id = :subjectId
          AND c.semester_id = :semesterId
          AND c.id <> :classId
          AND cs.status = 'enrolled'
        LIMIT 1
      `,
      {
        classId: Number(classId),
        studentId: Number(studentId),
        subjectId: Number(subjectId),
        semesterId: Number(semesterId),
      },
    );
    return rows[0] || null;
  };

  const createEnrollment = async ({ classId, studentId, status = "enrolled" }) => {
    const [result] = await db.execute(
      `
        INSERT INTO class_students (class_id, student_id, status)
        VALUES (:classId, :studentId, :status)
      `,
      { classId: Number(classId), studentId: Number(studentId), status },
    );
    return result.insertId;
  };

  const updateEnrollment = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE class_students SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`,
      { ...data, id: Number(id) },
    );
  };

  const findActiveGroupForStudentInClass = async (studentId, classId) => {
    const [rows] = await db.execute(
      `
        SELECT gm.*, g.group_code, g.group_name
        FROM group_members gm
        JOIN \`groups\` g ON g.id = gm.group_id AND g.deleted_at IS NULL
        WHERE gm.student_id = :studentId AND g.class_id = :classId AND gm.status = 'active'
        LIMIT 1
      `,
      { studentId: Number(studentId), classId: Number(classId) },
    );
    return rows[0] || null;
  };

  const listStudentsWithoutGroup = async (classId) => {
    const [rows] = await db.execute(
      `
        SELECT
          s.id, s.student_code, s.full_name, s.email, s.major,
          cs.status AS enrollment_status, cs.enrolled_at
        FROM class_students cs
        JOIN students s ON s.id = cs.student_id AND s.deleted_at IS NULL
        WHERE cs.class_id = :classId
          AND cs.status = 'enrolled'
          AND NOT EXISTS (
            SELECT 1
            FROM group_members gm
            JOIN \`groups\` g ON g.id = gm.group_id AND g.deleted_at IS NULL
            WHERE gm.student_id = s.id
              AND g.class_id = cs.class_id
              AND gm.status = 'active'
          )
        ORDER BY s.student_code ASC
      `,
      { classId: Number(classId) },
    );
    return rows;
  };

  const listGroups = async ({ search, classId, semesterId, category, status, limit, offset }) => {
    const params = {};
    const where = ["g.deleted_at IS NULL", "c.deleted_at IS NULL"];
    if (search) {
      where.push("(g.group_code LIKE :search OR g.group_name LIKE :search OR g.topic LIKE :search)");
      params.search = `%${search}%`;
    }
    if (classId) {
      where.push("g.class_id = :classId");
      params.classId = Number(classId);
    }
    if (semesterId) {
      where.push("c.semester_id = :semesterId");
      params.semesterId = Number(semesterId);
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
          g.id, g.class_id, g.group_code, g.group_name, g.topic, g.category,
          g.mentor_name, g.max_members, g.status, g.created_at, g.updated_at,
          c.class_code, sub.subject_code, sub.subject_name,
          sem.semester_code, sem.semester_name, sem.year,
          COUNT(DISTINCT CASE WHEN gm.status = 'active' THEN gm.id END) AS member_count,
          MAX(CASE WHEN gm.role = 'leader' AND gm.status = 'active' THEN s.full_name END) AS leader_name
        FROM \`groups\` g
        JOIN classes c ON c.id = g.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN group_members gm ON gm.group_id = g.id
        LEFT JOIN students s ON s.id = gm.student_id
        WHERE ${whereSql}
        GROUP BY g.id
        ORDER BY g.created_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(
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
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const findGroupById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT
          g.*, c.class_code, c.class_name, c.min_group_members, c.max_group_members,
          sub.subject_code, sub.subject_name,
          sem.semester_code, sem.semester_name, sem.year,
          COUNT(DISTINCT CASE WHEN gm.status = 'active' THEN gm.id END) AS member_count,
          MAX(CASE WHEN gm.role = 'leader' AND gm.status = 'active' THEN s.full_name END) AS leader_name
        FROM \`groups\` g
        JOIN classes c ON c.id = g.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN group_members gm ON gm.group_id = g.id
        LEFT JOIN students s ON s.id = gm.student_id
        WHERE g.id = :id AND g.deleted_at IS NULL
        GROUP BY g.id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const findGroupByCode = async (groupCode, classId, excludeId = null) => {
    const params = { groupCode, classId: Number(classId) };
    let sql = "SELECT id FROM `groups` WHERE group_code = :groupCode AND class_id = :classId AND deleted_at IS NULL";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    sql += " LIMIT 1";
    const [rows] = await db.execute(sql, params);
    return rows[0] || null;
  };

  const createGroup = async (data) => {
    const [result] = await db.execute(
      `
        INSERT INTO \`groups\`
          (class_id, group_code, group_name, description, category, topic, topic_desc,
           zalo_link, mentor_name, mentor_dept, max_members, status, created_by)
        VALUES
          (:class_id, :group_code, :group_name, :description, :category, :topic, :topic_desc,
           :zalo_link, :mentor_name, :mentor_dept, :max_members, :status, :created_by)
      `,
      data,
    );
    return result.insertId;
  };

  const updateGroup = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE \`groups\` SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`,
      { ...data, id: Number(id) },
    );
  };

  const listGroupMembers = async (groupId) => {
    const [rows] = await db.execute(
      `
        SELECT gm.*, s.student_code, s.full_name, s.email, s.major
        FROM group_members gm
        JOIN students s ON s.id = gm.student_id AND s.deleted_at IS NULL
        WHERE gm.group_id = :groupId
        ORDER BY gm.status ASC, gm.role DESC, s.student_code ASC
      `,
      { groupId: Number(groupId) },
    );
    return rows;
  };

  const findGroupMember = async (groupId, studentId) => {
    const [rows] = await db.execute(
      "SELECT * FROM group_members WHERE group_id = :groupId AND student_id = :studentId LIMIT 1",
      { groupId: Number(groupId), studentId: Number(studentId) },
    );
    return rows[0] || null;
  };

  const createGroupMember = async ({ groupId, studentId, role = "member" }) => {
    const [result] = await db.execute(
      `
        INSERT INTO group_members (group_id, student_id, role, status)
        VALUES (:groupId, :studentId, :role, 'active')
      `,
      { groupId: Number(groupId), studentId: Number(studentId), role },
    );
    return result.insertId;
  };

  const updateGroupMember = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(`UPDATE group_members SET ${setSql} WHERE id = :id`, { ...data, id: Number(id) });
  };

  const demoteGroupLeaders = async (groupId, exceptStudentId = null) => {
    const params = { groupId: Number(groupId) };
    let sql = "UPDATE group_members SET role = 'member' WHERE group_id = :groupId AND status = 'active' AND role = 'leader'";
    if (exceptStudentId) {
      sql += " AND student_id <> :exceptStudentId";
      params.exceptStudentId = Number(exceptStudentId);
    }
    await db.execute(sql, params);
  };

  const countActiveGroupMembers = async (groupId) =>
    countOne(db, "SELECT COUNT(*) AS total FROM group_members WHERE group_id = :groupId AND status = 'active'", {
      groupId: Number(groupId),
    });

  const listGroupInvites = async ({ search, groupId, status, limit, offset }) => {
    const params = {};
    const where = ["g.deleted_at IS NULL"];
    if (search) {
      where.push("(g.group_code LIKE :search OR g.group_name LIKE :search OR s.student_code LIKE :search OR s.full_name LIKE :search)");
      params.search = `%${search}%`;
    }
    if (groupId) {
      where.push("gi.group_id = :groupId");
      params.groupId = Number(groupId);
    }
    if (status) {
      where.push("gi.status = :status");
      params.status = status;
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          gi.id, gi.group_id, gi.student_id, gi.intended_role, gi.status,
          gi.email_delivery_status, gi.email_last_error, gi.expires_at, gi.invited_by, gi.created_at,
          g.group_code, g.group_name,
          s.student_code, s.full_name AS student_name, s.email,
          u.full_name AS invited_by_name
        FROM group_invites gi
        JOIN \`groups\` g ON g.id = gi.group_id
        JOIN students s ON s.id = gi.student_id
        LEFT JOIN users u ON u.id = gi.invited_by
        WHERE ${whereSql}
        ORDER BY gi.created_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(
      `
        SELECT COUNT(*) AS total
        FROM group_invites gi
        JOIN \`groups\` g ON g.id = gi.group_id
        JOIN students s ON s.id = gi.student_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const updateGroupInvite = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(`UPDATE group_invites SET ${setSql} WHERE id = :id`, { ...data, id: Number(id) });
  };

  const listGroupReports = async ({ search, groupId, issueType, limit, offset }) => {
    const params = {};
    const where = ["1 = 1"];
    if (search) {
      where.push("(g.group_code LIKE :search OR g.group_name LIKE :search OR s.student_code LIKE :search OR s.full_name LIKE :search)");
      params.search = `%${search}%`;
    }
    if (groupId) {
      where.push("gir.group_id = :groupId");
      params.groupId = Number(groupId);
    }
    if (issueType) {
      where.push("gir.issue_type = :issueType");
      params.issueType = issueType;
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          gir.id, gir.group_invite_id, gir.group_id, gir.student_id, gir.issue_type,
          gir.description, gir.created_at,
          g.group_code, g.group_name,
          s.student_code, s.full_name AS student_name, s.email
        FROM group_invite_reports gir
        JOIN \`groups\` g ON g.id = gir.group_id
        JOIN students s ON s.id = gir.student_id
        WHERE ${whereSql}
        ORDER BY gir.created_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(
      `
        SELECT COUNT(*) AS total
        FROM group_invite_reports gir
        JOIN \`groups\` g ON g.id = gir.group_id
        JOIN students s ON s.id = gir.student_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const findGroupReportById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT gir.*, g.group_code, g.group_name, s.student_code, s.full_name AS student_name, s.email
        FROM group_invite_reports gir
        JOIN \`groups\` g ON g.id = gir.group_id
        JOIN students s ON s.id = gir.student_id
        WHERE gir.id = :id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const getLookups = async () => {
    const [classes, subjects, semesters, students, majors, campuses, categories] = await Promise.all([
      db.execute(
        `
          SELECT c.id, c.class_code, c.class_name, c.status, c.subject_id, c.semester_id,
                 sub.subject_code, sub.subject_name, sem.semester_code, sem.semester_name
          FROM classes c
          JOIN subjects sub ON sub.id = c.subject_id
          JOIN semesters sem ON sem.id = c.semester_id
          WHERE c.deleted_at IS NULL
          ORDER BY sem.year DESC, sem.start_date DESC, c.class_code ASC
        `,
      ),
      db.execute("SELECT id, subject_code, subject_name FROM subjects WHERE deleted_at IS NULL ORDER BY subject_code ASC"),
      db.execute("SELECT id, semester_code, semester_name, year FROM semesters WHERE deleted_at IS NULL ORDER BY year DESC, start_date DESC"),
      db.execute(`
        SELECT s.id, s.student_code, s.full_name, s.email
        FROM students s
        WHERE s.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM class_students cs
            WHERE cs.student_id = s.id
          )
        ORDER BY s.student_code ASC
        LIMIT 500
      `),
      db.execute("SELECT DISTINCT major FROM students WHERE deleted_at IS NULL AND major IS NOT NULL AND major <> '' ORDER BY major ASC"),
      db.execute("SELECT DISTINCT campus FROM students WHERE deleted_at IS NULL AND campus IS NOT NULL AND campus <> '' ORDER BY campus ASC"),
      db.execute("SELECT DISTINCT category FROM `groups` WHERE deleted_at IS NULL AND category IS NOT NULL AND category <> '' ORDER BY category ASC"),
    ]);
    return {
      classes: classes[0],
      subjects: subjects[0],
      semesters: semesters[0],
      students: students[0],
      majors: majors[0].map((row) => row.major),
      campuses: campuses[0].map((row) => row.campus),
      categories: categories[0].map((row) => row.category),
    };
  };

  return {
    listStudents,
    findStudentById,
    findStudentByCode,
    findStudentByEmail,
    createStudent,
    updateStudent,
    getStudentDependencyCounts,
    listEnrollments,
    findEnrollmentById,
    findEnrollmentByClassStudent,
    findAnyEnrollmentByStudent,
    findClassForEnrollment,
    findSameSubjectSemesterEnrollment,
    createEnrollment,
    updateEnrollment,
    findActiveGroupForStudentInClass,
    listStudentsWithoutGroup,
    listGroups,
    findGroupById,
    findGroupByCode,
    createGroup,
    updateGroup,
    listGroupMembers,
    findGroupMember,
    createGroupMember,
    updateGroupMember,
    demoteGroupLeaders,
    countActiveGroupMembers,
    listGroupInvites,
    updateGroupInvite,
    listGroupReports,
    findGroupReportById,
    getLookups,
  };
};
