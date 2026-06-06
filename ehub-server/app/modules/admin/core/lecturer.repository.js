const parseCsv = (value) => (value ? String(value).split(",").filter(Boolean) : []);

const submittedStatuses = "'submitted','resubmitted','graded'";
const pendingStatuses = "'submitted','resubmitted'";

const pendingGradingExpr = (lecturerAlias = "u") => `
  (
    SELECT COUNT(*)
    FROM checkpoint_submissions cs
    JOIN checkpoints cp ON cp.id = cs.checkpoint_id
    JOIN classes c ON c.id = cp.class_id
    WHERE c.lecturer_id = ${lecturerAlias}.id
      AND cp.deleted_at IS NULL
      AND cs.status IN (${pendingStatuses})
      AND cs.score IS NULL
  ) + (
    SELECT COUNT(*)
    FROM assignment_submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN classes c ON c.id = a.class_id
    WHERE c.lecturer_id = ${lecturerAlias}.id
      AND a.deleted_at IS NULL
      AND s.status IN (${pendingStatuses})
      AND s.score IS NULL
  )
`;

const gradedSubmissionExpr = (lecturerAlias = "u") => `
  (
    SELECT COUNT(*)
    FROM checkpoint_submissions cs
    WHERE cs.graded_by = ${lecturerAlias}.id AND cs.score IS NOT NULL
  ) + (
    SELECT COUNT(*)
    FROM assignment_submissions s
    WHERE s.graded_by = ${lecturerAlias}.id AND s.score IS NOT NULL
  )
`;

export const createAdminLecturerRepository = ({ db }) => {
  const countOne = async (sql, params = {}) => {
    const [rows] = await db.execute(sql, params);
    return Number(rows[0]?.total || 0);
  };

  const lecturerWhere = (query = {}) => {
    const params = {};
    const where = ["u.deleted_at IS NULL", "r.role_code = 'lecturer'"];
    if (query.search) {
      where.push("(u.full_name LIKE :search OR u.email LIKE :search OR u.username LIKE :search OR u.phone LIKE :search)");
      params.search = `%${query.search}%`;
    }
    if (query.status) {
      where.push("u.status = :status");
      params.status = query.status;
    }
    if (query.authProvider) {
      where.push("u.auth_provider = :authProvider");
      params.authProvider = query.authProvider;
    }
    if (query.semesterId) {
      where.push(`
        EXISTS (
          SELECT 1 FROM classes cf
          WHERE cf.lecturer_id = u.id
            AND cf.semester_id = :semesterId
            AND cf.deleted_at IS NULL
        )
      `);
      params.semesterId = Number(query.semesterId);
    }
    if (query.subjectId) {
      where.push(`
        EXISTS (
          SELECT 1 FROM classes cf
          WHERE cf.lecturer_id = u.id
            AND cf.subject_id = :subjectId
            AND cf.deleted_at IS NULL
        )
      `);
      params.subjectId = Number(query.subjectId);
    }
    if (query.hasActiveClass === "yes") {
      where.push("EXISTS (SELECT 1 FROM classes ca WHERE ca.lecturer_id = u.id AND ca.status = 'active' AND ca.deleted_at IS NULL)");
    } else if (query.hasActiveClass === "no") {
      where.push("NOT EXISTS (SELECT 1 FROM classes ca WHERE ca.lecturer_id = u.id AND ca.status = 'active' AND ca.deleted_at IS NULL)");
    }
    if (query.hasPendingGrading === "yes") {
      where.push(`(${pendingGradingExpr("u")}) > 0`);
    } else if (query.hasPendingGrading === "no") {
      where.push(`(${pendingGradingExpr("u")}) = 0`);
    }
    return { whereSql: where.join(" AND "), params };
  };

  const listLecturers = async ({ search, status, authProvider, semesterId, subjectId, hasActiveClass, hasPendingGrading, limit, offset }) => {
    const { whereSql, params } = lecturerWhere({
      search,
      status,
      authProvider,
      semesterId,
      subjectId,
      hasActiveClass,
      hasPendingGrading,
    });
    const [rows] = await db.execute(
      `
        SELECT DISTINCT
          u.id, u.username, u.email, u.full_name, u.phone, u.avatar_url,
          u.auth_provider, u.status, u.last_login_at, u.created_at, u.updated_at,
          up.display_name, lp.department, lp.academic_title, lp.specialization,
          (SELECT COUNT(*) FROM classes c WHERE c.lecturer_id = u.id AND c.deleted_at IS NULL) AS total_classes,
          (SELECT COUNT(*) FROM classes c WHERE c.lecturer_id = u.id AND c.status = 'active' AND c.deleted_at IS NULL) AS active_classes,
          (
            SELECT COUNT(DISTINCT g.id)
            FROM classes c
            JOIN \`groups\` g ON g.class_id = c.id AND g.deleted_at IS NULL
            WHERE c.lecturer_id = u.id AND c.deleted_at IS NULL
          ) AS total_groups_managed,
          (${pendingGradingExpr("u")}) AS pending_grading_count,
          (${gradedSubmissionExpr("u")}) AS graded_submissions
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        LEFT JOIN users_profile up ON up.user_id = u.id
        LEFT JOIN lecturer_profiles lp ON lp.user_id = u.id
        WHERE ${whereSql}
        ORDER BY u.created_at DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(
      `
        SELECT COUNT(DISTINCT u.id) AS total
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const listLecturerWorkload = async ({ semesterId, subjectId, status, hasPendingGrading, limit, offset }) => {
    const result = await listLecturers({
      semesterId,
      subjectId,
      status,
      hasPendingGrading,
      limit,
      offset,
    });
    const ids = result.rows.map((row) => Number(row.id)).filter(Boolean);
    if (!ids.length) return result;
    const placeholders = ids.map((_, idx) => `:id${idx}`).join(", ");
    const params = {};
    ids.forEach((id, idx) => {
      params[`id${idx}`] = id;
    });
    const [extras] = await db.execute(
      `
        SELECT
          u.id,
          (
            SELECT COUNT(*)
            FROM class_students cs
            JOIN classes c ON c.id = cs.class_id
            WHERE c.lecturer_id = u.id AND cs.status = 'enrolled' AND c.deleted_at IS NULL
          ) AS total_students,
          (SELECT COUNT(*) FROM checkpoints cp JOIN classes c ON c.id = cp.class_id WHERE c.lecturer_id = u.id AND cp.deleted_at IS NULL) AS total_checkpoints,
          (SELECT COUNT(*) FROM assignments a JOIN classes c ON c.id = a.class_id WHERE c.lecturer_id = u.id AND a.deleted_at IS NULL) AS total_assignments,
          (
            SELECT ROUND(AVG(TIMESTAMPDIFF(HOUR, cs.submitted_at, cs.graded_at)), 1)
            FROM checkpoint_submissions cs
            WHERE cs.graded_by = u.id AND cs.submitted_at IS NOT NULL AND cs.graded_at IS NOT NULL
          ) AS checkpoint_delay_hours,
          (
            SELECT ROUND(AVG(TIMESTAMPDIFF(HOUR, s.submitted_at, s.graded_at)), 1)
            FROM assignment_submissions s
            WHERE s.graded_by = u.id AND s.submitted_at IS NOT NULL AND s.graded_at IS NOT NULL
          ) AS assignment_delay_hours,
          GREATEST(
            COALESCE((SELECT MAX(cs.graded_at) FROM checkpoint_submissions cs WHERE cs.graded_by = u.id), '1970-01-01'),
            COALESCE((SELECT MAX(s.graded_at) FROM assignment_submissions s WHERE s.graded_by = u.id), '1970-01-01')
          ) AS last_graded_at
        FROM users u
        WHERE u.id IN (${placeholders})
      `,
      params,
    );
    const extraById = new Map(extras.map((row) => [Number(row.id), row]));
    return {
      ...result,
      rows: result.rows.map((row) => {
        const extra = extraById.get(Number(row.id)) || {};
        const delays = [extra.checkpoint_delay_hours, extra.assignment_delay_hours]
          .map(Number)
          .filter((value) => !Number.isNaN(value) && value > 0);
        return {
          ...row,
          ...extra,
          average_grading_delay: delays.length
            ? Math.round((delays.reduce((sum, value) => sum + value, 0) / delays.length) * 10) / 10
            : null,
          last_graded_at: extra.last_graded_at === "1970-01-01" ? null : extra.last_graded_at,
        };
      }),
    };
  };

  const findLecturerById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT
          u.id, u.username, u.email, u.full_name, u.phone, u.campus, u.avatar_url,
          u.auth_provider, u.status, u.last_login_at, u.created_at, u.updated_at,
          up.display_name, up.bio, up.locale, up.timezone,
          lp.department, lp.academic_title, lp.specialization, lp.office_location, lp.contact_note,
          GROUP_CONCAT(DISTINCT r.role_code ORDER BY r.role_code) AS role_codes,
          GROUP_CONCAT(DISTINCT p.permission_code ORDER BY p.permission_code) AS permission_codes,
          (SELECT COUNT(*) FROM classes c WHERE c.lecturer_id = u.id AND c.deleted_at IS NULL) AS total_classes,
          (SELECT COUNT(*) FROM classes c WHERE c.lecturer_id = u.id AND c.status = 'active' AND c.deleted_at IS NULL) AS total_active_classes,
          (${pendingGradingExpr("u")}) AS total_pending_grading,
          (${gradedSubmissionExpr("u")}) AS total_evaluated_submissions
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        LEFT JOIN role_permissions rp ON rp.role_id = r.id
        LEFT JOIN permissions p ON p.id = rp.permission_id
        LEFT JOIN users_profile up ON up.user_id = u.id
        LEFT JOIN lecturer_profiles lp ON lp.user_id = u.id
        WHERE u.id = :id AND u.deleted_at IS NULL
        GROUP BY u.id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    const lecturer = rows[0] || null;
    if (!lecturer || !parseCsv(lecturer.role_codes).includes("lecturer")) return null;
    return {
      ...lecturer,
      roles: parseCsv(lecturer.role_codes),
      permissions: parseCsv(lecturer.permission_codes),
    };
  };

  const findUserByEmail = async (email, excludeId = null) => {
    const params = { email };
    let sql = "SELECT id FROM users WHERE email = :email AND deleted_at IS NULL";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    const [rows] = await db.execute(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  };

  const findUserByUsername = async (username, excludeId = null) => {
    const params = { username };
    let sql = "SELECT id FROM users WHERE username = :username AND deleted_at IS NULL";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    const [rows] = await db.execute(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  };

  const findRoleByCode = async (roleCode) => {
    const [rows] = await db.execute("SELECT id, role_code FROM roles WHERE role_code = :roleCode LIMIT 1", { roleCode });
    return rows[0] || null;
  };

  const createUser = async (data, conn = db) => {
    const [result] = await conn.execute(
      `
        INSERT INTO users
          (username, email, password, full_name, phone, avatar_url, auth_provider, status)
        VALUES
          (:username, :email, :password, :full_name, :phone, :avatar_url, :auth_provider, :status)
      `,
      data,
    );
    return result.insertId;
  };

  const releaseDeletedUserIdentities = async ({ username, email }, conn = db) => {
    await conn.execute(
      `
        UPDATE users
        SET username = CONCAT('deleted_', id, '_', LEFT(username, 20)),
            email = CONCAT('deleted+', id, '+', LEFT(email, 120)),
            google_id = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE deleted_at IS NOT NULL
          AND (username = :username OR email = :email)
      `,
      { username, email },
    );
  };

  const updateUser = async (id, data, conn = db) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await conn.execute(`UPDATE users SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`, {
      ...data,
      id: Number(id),
    });
  };

  const countAssignedClasses = (lecturerId) =>
    countOne(
      "SELECT COUNT(*) AS total FROM classes WHERE lecturer_id = :lecturerId AND deleted_at IS NULL",
      { lecturerId: Number(lecturerId) },
    );

  const softDeleteLecturer = async (lecturerId) => {
    await db.execute(
      `
        UPDATE users
        SET status = 'inactive',
            username = CONCAT('deleted_', id, '_', LEFT(username, 20)),
            email = CONCAT('deleted+', id, '+', LEFT(email, 120)),
            google_id = NULL,
            deleted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :lecturerId AND deleted_at IS NULL
      `,
      { lecturerId: Number(lecturerId) },
    );
  };

  const assignLecturerRole = async (userId, assignedBy, conn = db) => {
    const role = await findRoleByCode("lecturer");
    if (!role) return false;
    await conn.execute(
      `
        INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by)
        VALUES (:userId, :roleId, :assignedBy)
      `,
      { userId: Number(userId), roleId: role.id, assignedBy: assignedBy || null },
    );
    return true;
  };

  const upsertUsersProfile = async (userId, data, conn = db) => {
    await conn.execute(
      `
        INSERT INTO users_profile (user_id, display_name, bio, locale, timezone)
        VALUES (:userId, :display_name, :bio, :locale, :timezone)
        ON DUPLICATE KEY UPDATE
          display_name = VALUES(display_name),
          bio = VALUES(bio),
          locale = VALUES(locale),
          timezone = VALUES(timezone),
          updated_at = CURRENT_TIMESTAMP
      `,
      { userId: Number(userId), ...data },
    );
  };

  const upsertLecturerProfile = async (userId, data, conn = db) => {
    await conn.execute(
      `
        INSERT INTO lecturer_profiles
          (user_id, department, academic_title, specialization, office_location, contact_note)
        VALUES
          (:userId, :department, :academic_title, :specialization, :office_location, :contact_note)
        ON DUPLICATE KEY UPDATE
          department = VALUES(department),
          academic_title = VALUES(academic_title),
          specialization = VALUES(specialization),
          office_location = VALUES(office_location),
          contact_note = VALUES(contact_note),
          updated_at = CURRENT_TIMESTAMP
      `,
      { userId: Number(userId), ...data },
    );
  };

  const getLecturerOverview = async (id) => {
    const params = { id: Number(id) };
    const [[statsRows], [recentClasses], [recentGrading], [recentActivity]] = await Promise.all([
      db.execute(
        `
          SELECT
            (SELECT COUNT(*) FROM classes c WHERE c.lecturer_id = :id AND c.deleted_at IS NULL) AS total_classes,
            (SELECT COUNT(*) FROM classes c WHERE c.lecturer_id = :id AND c.status = 'active' AND c.deleted_at IS NULL) AS active_classes,
            (SELECT COUNT(*) FROM classes c WHERE c.lecturer_id = :id AND c.status = 'completed' AND c.deleted_at IS NULL) AS completed_classes,
            (
              SELECT COUNT(*)
              FROM class_students cs
              JOIN classes c ON c.id = cs.class_id
              WHERE c.lecturer_id = :id AND cs.status = 'enrolled' AND c.deleted_at IS NULL
            ) AS total_students,
            (
              SELECT COUNT(DISTINCT g.id)
              FROM \`groups\` g
              JOIN classes c ON c.id = g.class_id
              WHERE c.lecturer_id = :id AND g.deleted_at IS NULL AND c.deleted_at IS NULL
            ) AS total_groups,
            (${pendingGradingExpr("u")}) AS pending_grading,
            (${gradedSubmissionExpr("u")}) AS graded_submissions,
            (
              SELECT ROUND(AVG(delay_hours), 1)
              FROM (
                SELECT TIMESTAMPDIFF(HOUR, cs.submitted_at, cs.graded_at) AS delay_hours
                FROM checkpoint_submissions cs
                WHERE cs.graded_by = :id AND cs.submitted_at IS NOT NULL AND cs.graded_at IS NOT NULL
                UNION ALL
                SELECT TIMESTAMPDIFF(HOUR, s.submitted_at, s.graded_at) AS delay_hours
                FROM assignment_submissions s
                WHERE s.graded_by = :id AND s.submitted_at IS NOT NULL AND s.graded_at IS NOT NULL
              ) delays
            ) AS average_grading_delay,
            GREATEST(
              COALESCE((SELECT MAX(al.created_at) FROM audit_logs al WHERE al.user_id = :id), '1970-01-01'),
              COALESCE((SELECT MAX(api.timestamp) FROM api_access_logs api WHERE api.user_id = :id), '1970-01-01')
            ) AS last_activity
          FROM users u
          WHERE u.id = :id
        `,
        params,
      ),
      db.execute(
        `
          SELECT
            c.id, c.class_code, c.class_name, c.status,
            s.subject_code, s.subject_name,
            sem.semester_code, sem.semester_name,
            (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id AND cs.status = 'enrolled') AS enrolled_count,
            (SELECT COUNT(*) FROM \`groups\` g WHERE g.class_id = c.id AND g.deleted_at IS NULL) AS group_count
          FROM classes c
          JOIN subjects s ON s.id = c.subject_id
          JOIN semesters sem ON sem.id = c.semester_id
          WHERE c.lecturer_id = :id AND c.deleted_at IS NULL
          ORDER BY c.created_at DESC
          LIMIT 5
        `,
        params,
      ),
      db.execute(
        `
          SELECT * FROM (
            SELECT
              'checkpoint' AS target_type,
              cp.title AS target_title,
              c.class_code,
              g.group_code,
              g.group_name,
              cs.score,
              cs.graded_at
            FROM checkpoint_submissions cs
            JOIN checkpoints cp ON cp.id = cs.checkpoint_id
            JOIN classes c ON c.id = cp.class_id
            JOIN \`groups\` g ON g.id = cs.group_id
            WHERE cs.graded_by = :id AND cs.score IS NOT NULL
            UNION ALL
            SELECT
              'assignment' AS target_type,
              a.title AS target_title,
              c.class_code,
              g.group_code,
              g.group_name,
              s.score,
              s.graded_at
            FROM assignment_submissions s
            JOIN assignments a ON a.id = s.assignment_id
            JOIN classes c ON c.id = a.class_id
            JOIN \`groups\` g ON g.id = s.group_id
            WHERE s.graded_by = :id AND s.score IS NOT NULL
          ) recent
          ORDER BY graded_at DESC
          LIMIT 5
        `,
        params,
      ),
      db.execute(
        `
          SELECT action, table_name, record_id, created_at
          FROM audit_logs
          WHERE user_id = :id
          ORDER BY created_at DESC
          LIMIT 8
        `,
        params,
      ),
    ]);
    const stats = statsRows[0] || {};
    return {
      stats: {
        ...stats,
        last_activity: stats.last_activity === "1970-01-01" ? null : stats.last_activity,
      },
      recent_classes: recentClasses,
      recent_grading: recentGrading,
      recent_activity: recentActivity,
    };
  };

  const listLecturerClasses = async ({ lecturerId, semesterId, subjectId, status, limit, offset }) => {
    const params = { lecturerId: Number(lecturerId) };
    const where = ["c.lecturer_id = :lecturerId", "c.deleted_at IS NULL"];
    if (semesterId) {
      where.push("c.semester_id = :semesterId");
      params.semesterId = Number(semesterId);
    }
    if (subjectId) {
      where.push("c.subject_id = :subjectId");
      params.subjectId = Number(subjectId);
    }
    if (status) {
      where.push("c.status = :status");
      params.status = status;
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          c.id, c.class_code, c.class_name, c.status, c.created_at,
          s.subject_code, s.subject_name,
          sem.semester_code, sem.semester_name,
          (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id AND cs.status = 'enrolled') AS enrolled_count,
          (SELECT COUNT(*) FROM \`groups\` g WHERE g.class_id = c.id AND g.deleted_at IS NULL) AS group_count,
          (SELECT COUNT(*) FROM checkpoints cp WHERE cp.class_id = c.id AND cp.deleted_at IS NULL) AS checkpoint_count,
          (SELECT COUNT(*) FROM assignments a WHERE a.class_id = c.id AND a.deleted_at IS NULL) AS assignment_count,
          (
            SELECT COUNT(*)
            FROM checkpoint_submissions cs
            JOIN checkpoints cp ON cp.id = cs.checkpoint_id
            WHERE cp.class_id = c.id AND cs.status IN (${pendingStatuses}) AND cs.score IS NULL
          ) + (
            SELECT COUNT(*)
            FROM assignment_submissions sub
            JOIN assignments a ON a.id = sub.assignment_id
            WHERE a.class_id = c.id AND sub.status IN (${pendingStatuses}) AND sub.score IS NULL
          ) AS pending_grading_count
        FROM classes c
        JOIN subjects s ON s.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        WHERE ${whereSql}
        ORDER BY c.created_at DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `,
      params,
    );
    const total = await countOne(
      `
        SELECT COUNT(*) AS total
        FROM classes c
        WHERE ${whereSql}
      `,
      params,
    );
    return { rows, total };
  };

  const findClassForAssignment = async (classId) => {
    const [rows] = await db.execute(
      `
        SELECT c.id, c.class_code, c.lecturer_id, c.status, u.full_name AS lecturer_name
        FROM classes c
        LEFT JOIN users u ON u.id = c.lecturer_id
        WHERE c.id = :classId AND c.deleted_at IS NULL
        LIMIT 1
      `,
      { classId: Number(classId) },
    );
    return rows[0] || null;
  };

  const setClassLecturer = async (classId, lecturerId, conn = db) => {
    await conn.execute(
      "UPDATE classes SET lecturer_id = :lecturerId, updated_at = CURRENT_TIMESTAMP WHERE id = :classId",
      { classId: Number(classId), lecturerId: lecturerId ? Number(lecturerId) : null },
    );
  };

  const listAvailableClasses = async ({ search, semesterId, subjectId, status, lecturerId, limit, offset }) => {
    const params = {};
    const where = ["c.deleted_at IS NULL"];
    if (search) {
      where.push("(c.class_code LIKE :search OR c.class_name LIKE :search)");
      params.search = `%${search}%`;
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
      where.push("c.status = :status");
      params.status = status;
    }
    if (lecturerId === "unassigned") {
      where.push("c.lecturer_id IS NULL");
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          c.id, c.class_code, c.class_name, c.status, c.lecturer_id,
          s.subject_code, s.subject_name,
          sem.semester_code, sem.semester_name,
          u.full_name AS lecturer_name
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
    const total = await countOne(`SELECT COUNT(*) AS total FROM classes c WHERE ${whereSql}`, params);
    return { rows, total };
  };

  const getLecturerGrading = async ({ lecturerId, semesterId, classId, targetType, status, fromDate, toDate }) => {
    const params = { lecturerId: Number(lecturerId) };
    const checkpointWhere = ["c.lecturer_id = :lecturerId", "cp.deleted_at IS NULL"];
    const assignmentWhere = ["c.lecturer_id = :lecturerId", "a.deleted_at IS NULL"];
    if (semesterId) {
      checkpointWhere.push("c.semester_id = :semesterId");
      assignmentWhere.push("c.semester_id = :semesterId");
      params.semesterId = Number(semesterId);
    }
    if (classId) {
      checkpointWhere.push("c.id = :classId");
      assignmentWhere.push("c.id = :classId");
      params.classId = Number(classId);
    }
    if (status) {
      checkpointWhere.push("cp.status = :status");
      assignmentWhere.push("a.status = :status");
      params.status = status;
    }
    if (fromDate) {
      checkpointWhere.push("DATE(cp.deadline) >= :fromDate");
      assignmentWhere.push("DATE(a.deadline) >= :fromDate");
      params.fromDate = fromDate;
    }
    if (toDate) {
      checkpointWhere.push("DATE(cp.deadline) <= :toDate");
      assignmentWhere.push("DATE(a.deadline) <= :toDate");
      params.toDate = toDate;
    }
    const progressSql = [];
    if (!targetType || targetType === "checkpoint") {
      progressSql.push(`
        SELECT
          'checkpoint' AS target_type,
          cp.id AS target_id,
          cp.title AS target_title,
          c.id AS class_id,
          c.class_code,
          s.subject_code,
          sem.semester_code,
          (SELECT COUNT(*) FROM \`groups\` g WHERE g.class_id = c.id AND g.deleted_at IS NULL) AS total_submissions,
          (SELECT COUNT(*) FROM checkpoint_submissions sub WHERE sub.checkpoint_id = cp.id AND sub.status IN (${pendingStatuses}) AND sub.score IS NULL) AS pending_grading,
          (SELECT COUNT(DISTINCT es.id) FROM evaluation_sessions es JOIN checkpoint_submissions sub ON sub.id = es.target_id WHERE es.target_type = 'checkpoint_submission' AND sub.checkpoint_id = cp.id AND es.status = 'draft') AS draft_evaluations,
          (SELECT COUNT(*) FROM checkpoint_submissions sub WHERE sub.checkpoint_id = cp.id AND sub.status = 'graded') AS graded_count,
          (SELECT COUNT(DISTINCT es.id) FROM evaluation_sessions es JOIN checkpoint_submissions sub ON sub.id = es.target_id WHERE es.target_type = 'checkpoint_submission' AND sub.checkpoint_id = cp.id AND es.status = 'confirmed') AS confirmed_count,
          (SELECT COUNT(*) FROM checkpoint_submissions sub WHERE sub.checkpoint_id = cp.id AND sub.is_late = 1) AS late_submissions,
          (SELECT MAX(sub.graded_at) FROM checkpoint_submissions sub WHERE sub.checkpoint_id = cp.id) AS last_graded_at
        FROM checkpoints cp
        JOIN classes c ON c.id = cp.class_id
        JOIN subjects s ON s.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        WHERE ${checkpointWhere.join(" AND ")}
      `);
    }
    if (!targetType || targetType === "assignment") {
      progressSql.push(`
        SELECT
          'assignment' AS target_type,
          a.id AS target_id,
          a.title AS target_title,
          c.id AS class_id,
          c.class_code,
          s.subject_code,
          sem.semester_code,
          (SELECT COUNT(*) FROM \`groups\` g WHERE g.class_id = c.id AND g.deleted_at IS NULL) AS total_submissions,
          (SELECT COUNT(*) FROM assignment_submissions sub WHERE sub.assignment_id = a.id AND sub.status IN (${pendingStatuses}) AND sub.score IS NULL) AS pending_grading,
          (SELECT COUNT(DISTINCT es.id) FROM evaluation_sessions es JOIN assignment_submissions sub ON sub.id = es.target_id WHERE es.target_type = 'assignment_submission' AND sub.assignment_id = a.id AND es.status = 'draft') AS draft_evaluations,
          (SELECT COUNT(*) FROM assignment_submissions sub WHERE sub.assignment_id = a.id AND sub.status = 'graded') AS graded_count,
          (SELECT COUNT(DISTINCT es.id) FROM evaluation_sessions es JOIN assignment_submissions sub ON sub.id = es.target_id WHERE es.target_type = 'assignment_submission' AND sub.assignment_id = a.id AND es.status = 'confirmed') AS confirmed_count,
          (SELECT COUNT(*) FROM assignment_submissions sub WHERE sub.assignment_id = a.id AND sub.is_late = 1) AS late_submissions,
          (SELECT MAX(sub.graded_at) FROM assignment_submissions sub WHERE sub.assignment_id = a.id) AS last_graded_at
        FROM assignments a
        JOIN classes c ON c.id = a.class_id
        JOIN subjects s ON s.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        WHERE ${assignmentWhere.join(" AND ")}
      `);
    }
    const [progressRows] = await db.execute(`${progressSql.join(" UNION ALL ")} ORDER BY last_graded_at DESC`, params);
    const [sessionRows] = await db.execute(
      `
        SELECT
          es.id, es.target_type, es.target_id, es.total_score, es.status, es.evaluated_at, es.updated_at,
          g.group_code, g.group_name,
          rb.name AS rubric_name
        FROM evaluation_sessions es
        JOIN \`groups\` g ON g.id = es.group_id
        JOIN rubrics rb ON rb.id = es.rubric_id
        WHERE es.evaluator_id = :lecturerId
        ORDER BY es.updated_at DESC
        LIMIT 20
      `,
      params,
    );
    return {
      progress: progressRows.map((row) => ({
        ...row,
        completion_rate: Number(row.total_submissions)
          ? Math.round((Number(row.graded_count || 0) / Number(row.total_submissions)) * 100)
          : 0,
      })),
      sessions: sessionRows,
    };
  };

  const getCreatedContent = async (lecturerId) => {
    const params = { lecturerId: Number(lecturerId) };
    const [[checkpoints], [assignments], [rubrics]] = await Promise.all([
      db.execute(
        `
          SELECT cp.id, cp.title, cp.deadline, cp.status, cp.max_score, cp.weight, cp.created_at, c.class_code
          FROM checkpoints cp
          JOIN classes c ON c.id = cp.class_id
          WHERE cp.created_by = :lecturerId AND cp.deleted_at IS NULL
          ORDER BY cp.created_at DESC
          LIMIT 50
        `,
        params,
      ),
      db.execute(
        `
          SELECT a.id, a.title, a.deadline, a.status, a.max_score, a.created_at, c.class_code
          FROM assignments a
          JOIN classes c ON c.id = a.class_id
          WHERE a.created_by = :lecturerId AND a.deleted_at IS NULL
          ORDER BY a.created_at DESC
          LIMIT 50
        `,
        params,
      ),
      db.execute(
        `
          SELECT r.id, r.name, r.version, r.status, r.total_score, r.created_at, s.subject_code, s.subject_name
          FROM rubrics r
          LEFT JOIN subjects s ON s.id = r.subject_id
          WHERE r.created_by = :lecturerId AND r.deleted_at IS NULL
          ORDER BY r.created_at DESC
          LIMIT 50
        `,
        params,
      ),
    ]);
    return { checkpoints, assignments, rubrics };
  };

  const getLecturerActivity = async ({ lecturerId, action, tableName, statusCode, fromDate, toDate, limit, offset }) => {
    const auditParams = { lecturerId: Number(lecturerId) };
    const auditWhere = ["al.user_id = :lecturerId"];
    if (action) {
      auditWhere.push("al.action = :action");
      auditParams.action = action;
    }
    if (tableName) {
      auditWhere.push("al.table_name = :tableName");
      auditParams.tableName = tableName;
    }
    if (fromDate) {
      auditWhere.push("DATE(al.created_at) >= :fromDate");
      auditParams.fromDate = fromDate;
    }
    if (toDate) {
      auditWhere.push("DATE(al.created_at) <= :toDate");
      auditParams.toDate = toDate;
    }
    const auditWhereSql = auditWhere.join(" AND ");
    const [auditLogs] = await db.execute(
      `
        SELECT id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at
        FROM audit_logs al
        WHERE ${auditWhereSql}
        ORDER BY al.created_at DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `,
      auditParams,
    );
    const auditTotal = await countOne(`SELECT COUNT(*) AS total FROM audit_logs al WHERE ${auditWhereSql}`, auditParams);

    const apiParams = { lecturerId: Number(lecturerId) };
    const apiWhere = ["api.user_id = :lecturerId"];
    if (statusCode) {
      apiWhere.push("api.status_code = :statusCode");
      apiParams.statusCode = Number(statusCode);
    }
    if (fromDate) {
      apiWhere.push("DATE(api.timestamp) >= :fromDate");
      apiParams.fromDate = fromDate;
    }
    if (toDate) {
      apiWhere.push("DATE(api.timestamp) <= :toDate");
      apiParams.toDate = toDate;
    }
    const [apiLogs] = await db.execute(
      `
        SELECT id, method, path, status_code, response_time, ip_address, user_agent, timestamp
        FROM api_access_logs api
        WHERE ${apiWhere.join(" AND ")}
        ORDER BY api.timestamp DESC
        LIMIT 20
      `,
      apiParams,
    );
    return { audit_logs: auditLogs, api_access_logs: apiLogs, total: auditTotal };
  };

  const getLecturerPermissions = async (lecturerId) => {
    const [roles] = await db.execute(
      `
        SELECT r.id, r.role_code, r.role_name, r.description, r.is_system
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :lecturerId
        ORDER BY r.role_code ASC
      `,
      { lecturerId: Number(lecturerId) },
    );
    const [permissions] = await db.execute(
      `
        SELECT DISTINCT p.id, p.permission_code, p.permission_name, p.module, p.description
        FROM user_roles ur
        JOIN role_permissions rp ON rp.role_id = ur.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = :lecturerId
        ORDER BY p.module ASC, p.permission_code ASC
      `,
      { lecturerId: Number(lecturerId) },
    );
    return { roles, permissions };
  };

  const getLookups = async () => {
    const [[subjects], [semesters], [classes]] = await Promise.all([
      db.execute("SELECT id, subject_code, subject_name FROM subjects WHERE deleted_at IS NULL ORDER BY subject_code ASC"),
      db.execute("SELECT id, semester_code, semester_name, year, status FROM semesters WHERE deleted_at IS NULL ORDER BY year DESC, start_date DESC"),
      db.execute(
        `
          SELECT c.id, c.class_code, c.class_name, c.status, c.lecturer_id, s.subject_code, sem.semester_code
          FROM classes c
          JOIN subjects s ON s.id = c.subject_id
          JOIN semesters sem ON sem.id = c.semester_id
          WHERE c.deleted_at IS NULL
          ORDER BY c.created_at DESC
        `,
      ),
    ]);
    return { subjects, semesters, classes };
  };

  return {
    listLecturers,
    listLecturerWorkload,
    findLecturerById,
    findUserByEmail,
    findUserByUsername,
    findRoleByCode,
    createUser,
    releaseDeletedUserIdentities,
    updateUser,
    countAssignedClasses,
    softDeleteLecturer,
    assignLecturerRole,
    upsertUsersProfile,
    upsertLecturerProfile,
    getLecturerOverview,
    listLecturerClasses,
    findClassForAssignment,
    setClassLecturer,
    listAvailableClasses,
    getLecturerGrading,
    getCreatedContent,
    getLecturerActivity,
    getLecturerPermissions,
    getLookups,
  };
};
