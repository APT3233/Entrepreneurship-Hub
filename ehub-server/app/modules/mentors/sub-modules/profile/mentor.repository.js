const parseCsv = (value) => (value ? String(value).split(",").filter(Boolean) : []);

const pageSql = (limit, offset) => `LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

const mentorSelect = `
  mp.id, mp.user_id, mp.full_name, mp.email, mp.phone, mp.avatar_url,
  mp.mentor_type, mp.organization, mp.position_title, mp.bio,
  mp.years_of_experience, mp.linkedin_url, mp.portfolio_url, mp.cv_file_url,
  mp.status, mp.visibility, mp.created_by, mp.reviewed_by, mp.reviewed_at,
  mp.created_at, mp.updated_at, mp.deleted_at,
  u.username AS user_username,
  creator.full_name AS created_by_name,
  reviewer.full_name AS reviewed_by_name,
  (
    SELECT COUNT(*)
    FROM mentor_expertise_map mem
    WHERE mem.mentor_id = mp.id
  ) AS total_expertise,
  (
    SELECT GROUP_CONCAT(DISTINCT ea.name ORDER BY ea.name SEPARATOR ',')
    FROM mentor_expertise_map mem
    JOIN mentor_expertise_areas ea ON ea.id = mem.expertise_id
    WHERE mem.mentor_id = mp.id
  ) AS expertise_names,
  (
    SELECT COUNT(*)
    FROM mentor_availability ma
    WHERE ma.mentor_id = mp.id AND ma.status = 'active'
  ) AS active_availability_slots,
  (
    SELECT COUNT(*)
    FROM mentor_documents md
    WHERE md.mentor_id = mp.id AND md.deleted_at IS NULL
  ) AS total_documents
`;

export const createMentorRepository = ({ db }) => {
  const normalizeMentorRow = (row) => row ? ({
    ...row,
    expertise_names: parseCsv(row.expertise_names),
    total_expertise: Number(row.total_expertise || 0),
    active_availability_slots: Number(row.active_availability_slots || 0),
    total_documents: Number(row.total_documents || 0),
  }) : null;

  const mentorWhere = (query = {}) => {
    const params = {};
    const where = ["mp.deleted_at IS NULL"];
    if (query.search) {
      where.push("(mp.full_name LIKE :search OR mp.email LIKE :search OR mp.organization LIKE :search OR mp.position_title LIKE :search)");
      params.search = `%${query.search}%`;
    }
    if (query.mentorType) {
      where.push("mp.mentor_type = :mentorType");
      params.mentorType = query.mentorType;
    }
    if (query.status) {
      where.push("mp.status = :status");
      params.status = query.status;
    }
    if (query.visibility) {
      where.push("mp.visibility = :visibility");
      params.visibility = query.visibility;
    }
    if (query.expertiseId) {
      where.push(`
        EXISTS (
          SELECT 1 FROM mentor_expertise_map mem
          WHERE mem.mentor_id = mp.id AND mem.expertise_id = :expertiseId
        )
      `);
      params.expertiseId = Number(query.expertiseId);
    }
    if (query.minYears !== null && query.minYears !== undefined) {
      where.push("COALESCE(mp.years_of_experience, 0) >= :minYears");
      params.minYears = Number(query.minYears);
    }
    if (query.maxYears !== null && query.maxYears !== undefined) {
      where.push("COALESCE(mp.years_of_experience, 0) <= :maxYears");
      params.maxYears = Number(query.maxYears);
    }
    return { whereSql: where.join(" AND "), params };
  };

  const listMentors = async ({ search, mentorType, status, visibility, expertiseId, minYears, maxYears, limit, offset }) => {
    const { whereSql, params } = mentorWhere({ search, mentorType, status, visibility, expertiseId, minYears, maxYears });
    const [rows] = await db.execute(
      `
        SELECT ${mentorSelect}
        FROM mentor_profiles mp
        LEFT JOIN users u ON u.id = mp.user_id
        LEFT JOIN users creator ON creator.id = mp.created_by
        LEFT JOIN users reviewer ON reviewer.id = mp.reviewed_by
        WHERE ${whereSql}
        ORDER BY mp.created_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM mentor_profiles mp WHERE ${whereSql}`,
      params,
    );
    return { rows: rows.map(normalizeMentorRow), total: Number(totalRows[0]?.total || 0) };
  };

  const findMentorById = async (id, includeDeleted = false) => {
    const [rows] = await db.execute(
      `
        SELECT ${mentorSelect}
        FROM mentor_profiles mp
        LEFT JOIN users u ON u.id = mp.user_id
        LEFT JOIN users creator ON creator.id = mp.created_by
        LEFT JOIN users reviewer ON reviewer.id = mp.reviewed_by
        WHERE mp.id = :id ${includeDeleted ? "" : "AND mp.deleted_at IS NULL"}
        LIMIT 1
      `,
      { id: Number(id) },
    );
    return normalizeMentorRow(rows[0]);
  };

  const findMentorByUserId = async (userId) => {
    const [rows] = await db.execute(
      `
        SELECT ${mentorSelect}
        FROM mentor_profiles mp
        LEFT JOIN users u ON u.id = mp.user_id
        LEFT JOIN users creator ON creator.id = mp.created_by
        LEFT JOIN users reviewer ON reviewer.id = mp.reviewed_by
        WHERE mp.user_id = :userId AND mp.deleted_at IS NULL
        LIMIT 1
      `,
      { userId: Number(userId) },
    );
    return normalizeMentorRow(rows[0]);
  };

  const findActiveMentorByEmail = async (email, excludeId = null) => {
    const params = { email: String(email || "").trim().toLowerCase() };
    let sql = "SELECT id FROM mentor_profiles WHERE LOWER(TRIM(email)) = :email AND status = 'active' AND deleted_at IS NULL";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    const [rows] = await db.execute(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  };

  const findActiveMentorByUserId = async (userId, excludeId = null) => {
    const params = { userId: Number(userId) };
    let sql = "SELECT id FROM mentor_profiles WHERE user_id = :userId AND deleted_at IS NULL";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    const [rows] = await db.execute(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  };

  const findUserById = async (id) => {
    const [rows] = await db.execute("SELECT id, email, full_name FROM users WHERE id = :id AND deleted_at IS NULL LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const findUserByEmail = async (email) => {
    const [rows] = await db.execute("SELECT id FROM users WHERE email = :email AND deleted_at IS NULL LIMIT 1", { email });
    return rows[0] || null;
  };

  const findUserByUsername = async (username, conn) => {
    const executor = conn ?? db;
    const [rows] = await executor.execute(
      "SELECT id FROM users WHERE LOWER(TRIM(username)) = LOWER(TRIM(:username)) AND deleted_at IS NULL LIMIT 1",
      { username },
    );
    return rows[0] || null;
  };

  const createUser = async (data, conn) => {
    const executor = conn ?? db;
    const [result] = await executor.execute(
      `INSERT INTO users (username, email, password, full_name, phone, avatar_url, auth_provider, status)
       VALUES (:username, :email, :password, :full_name, :phone, :avatar_url, 'local', 'active')`,
      data,
    );
    return result.insertId;
  };

  const findRoleByCode = async (roleCode) => {
    const [rows] = await db.execute("SELECT id, role_code FROM roles WHERE role_code = :roleCode LIMIT 1", { roleCode });
    return rows[0] || null;
  };

  const assignUserRole = async (userId, roleCode, assignedBy, conn) => {
    const executor = conn ?? db;
    const [roles] = await executor.execute("SELECT id FROM roles WHERE role_code = :roleCode LIMIT 1", { roleCode });
    const role = roles[0];
    if (!role) return;
    await executor.execute(
      "INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by, assigned_at) VALUES (:userId, :roleId, :assignedBy, NOW())",
      { userId: Number(userId), roleId: role.id, assignedBy: assignedBy || null },
    );
  };

  const revokeUserRole = async (userId, roleCode, conn) => {
    const executor = conn ?? db;
    await executor.execute(
      "DELETE ur FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = :userId AND r.role_code = :roleCode",
      { userId: Number(userId), roleCode },
    );
  };

  const createMentor = async (data, conn) => {
    const executor = conn ?? db;
    const [result] = await executor.execute(
      `
        INSERT INTO mentor_profiles
          (user_id, full_name, email, phone, avatar_url, mentor_type, organization, position_title, bio,
           years_of_experience, linkedin_url, portfolio_url, cv_file_url, status, visibility,
           created_by, reviewed_by, reviewed_at)
        VALUES
          (:user_id, :full_name, :email, :phone, :avatar_url, :mentor_type, :organization, :position_title, :bio,
           :years_of_experience, :linkedin_url, :portfolio_url, :cv_file_url, :status, :visibility,
           :created_by, :reviewed_by, :reviewed_at)
      `,
      data,
    );
    return result.insertId;
  };

  const updateMentor = async (id, data, conn) => {
    const executor = conn ?? db;
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await executor.execute(
      `UPDATE mentor_profiles SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`,
      { ...data, id: Number(id) },
    );
  };

  const softDeleteMentor = async (id) => {
    await db.execute("UPDATE mentor_profiles SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL", { id: Number(id) });
  };

  const countActiveAssignmentsForMentor = async (mentorId) => {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS total FROM mentor_assignments
       WHERE mentor_id = :mentorId AND deleted_at IS NULL AND status IN ('proposed','pending_mentor','active')`,
      { mentorId: Number(mentorId) },
    );
    return Number(rows[0]?.total || 0);
  };

  const getMentorActivity = async (mentorId) => {
    const [rows] = await db.execute(
      `
        SELECT al.id, al.action, al.table_name, al.record_id, al.title, al.old_values, al.new_values,
               al.created_at, u.full_name AS user_name, u.email AS user_email
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        WHERE al.record_id = :mentorId
          AND al.table_name IN ('mentor_profiles','mentor_expertise_map','mentor_availability','mentor_documents')
        ORDER BY al.created_at DESC
        LIMIT 30
      `,
      { mentorId: Number(mentorId) },
    );
    return rows;
  };

  const expertiseWhere = (query = {}) => {
    const params = {};
    const where = ["1 = 1"];
    if (query.search) {
      where.push("(code LIKE :search OR name LIKE :search OR description LIKE :search)");
      params.search = `%${query.search}%`;
    }
    if (query.category) {
      where.push("category = :category");
      params.category = query.category;
    }
    if (query.status) {
      where.push("status = :status");
      params.status = query.status;
    }
    return { whereSql: where.join(" AND "), params };
  };

  const listExpertiseAreas = async ({ search, category, status, limit, offset }) => {
    const { whereSql, params } = expertiseWhere({ search, category, status });
    const [rows] = await db.execute(
      `
        SELECT ea.*,
          (SELECT COUNT(*) FROM mentor_expertise_map mem WHERE mem.expertise_id = ea.id) AS mentor_usage_count
        FROM mentor_expertise_areas ea
        WHERE ${whereSql}
        ORDER BY ea.category ASC, ea.name ASC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM mentor_expertise_areas WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const findExpertiseAreaById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM mentor_expertise_areas WHERE id = :id LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const findExpertiseAreaByCode = async (code, excludeId = null) => {
    const params = { code };
    let sql = "SELECT id FROM mentor_expertise_areas WHERE code = :code";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    const [rows] = await db.execute(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  };

  const createExpertiseArea = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO mentor_expertise_areas (code, name, description, category, status)
       VALUES (:code, :name, :description, :category, :status)`,
      data,
    );
    return result.insertId;
  };

  const updateExpertiseArea = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE mentor_expertise_areas SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`,
      { ...data, id: Number(id) },
    );
  };

  const countExpertiseUsage = async (id) => {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM mentor_expertise_map WHERE expertise_id = :id", { id: Number(id) });
    return Number(rows[0]?.total || 0);
  };

  const deleteExpertiseArea = async (id) => {
    await db.execute("DELETE FROM mentor_expertise_areas WHERE id = :id", { id: Number(id) });
  };

  const listExpertiseByIds = async (ids) => {
    if (!ids.length) return [];
    const params = {};
    const placeholders = ids.map((id, index) => {
      params[`id${index}`] = Number(id);
      return `:id${index}`;
    }).join(", ");
    const [rows] = await db.execute(`SELECT * FROM mentor_expertise_areas WHERE id IN (${placeholders})`, params);
    return rows;
  };

  const listExpertiseForMentor = async (mentorId) => {
    const [rows] = await db.execute(
      `
        SELECT mem.id, mem.mentor_id, mem.expertise_id, mem.level, mem.years_experience, mem.note,
               mem.created_at, mem.updated_at,
               ea.code, ea.name, ea.description, ea.category, ea.status AS expertise_status
        FROM mentor_expertise_map mem
        JOIN mentor_expertise_areas ea ON ea.id = mem.expertise_id
        WHERE mem.mentor_id = :mentorId
        ORDER BY ea.category ASC, ea.name ASC
      `,
      { mentorId: Number(mentorId) },
    );
    return rows;
  };

  const replaceExpertiseForMentor = async (mentorId, items, conn = db) => {
    await conn.execute("DELETE FROM mentor_expertise_map WHERE mentor_id = :mentorId", { mentorId: Number(mentorId) });
    for (const item of items) {
      await conn.execute(
        `
          INSERT INTO mentor_expertise_map (mentor_id, expertise_id, level, years_experience, note)
          VALUES (:mentorId, :expertise_id, :level, :years_experience, :note)
        `,
        { mentorId: Number(mentorId), ...item },
      );
    }
  };

  const listAvailabilityForMentor = async (mentorId) => {
    const [rows] = await db.execute(
      `
        SELECT id, mentor_id, day_of_week,
               TIME_FORMAT(start_time, '%H:%i') AS start_time,
               TIME_FORMAT(end_time, '%H:%i') AS end_time,
               timezone, available_from, available_to, max_sessions_per_week, note, status,
               created_at, updated_at
        FROM mentor_availability
        WHERE mentor_id = :mentorId
        ORDER BY COALESCE(day_of_week, 99), start_time, id
      `,
      { mentorId: Number(mentorId) },
    );
    return rows;
  };

  const replaceAvailabilityForMentor = async (mentorId, items, conn = db) => {
    await conn.execute("DELETE FROM mentor_availability WHERE mentor_id = :mentorId", { mentorId: Number(mentorId) });
    for (const item of items) {
      await conn.execute(
        `
          INSERT INTO mentor_availability
            (mentor_id, day_of_week, start_time, end_time, timezone, available_from, available_to, max_sessions_per_week, note, status)
          VALUES
            (:mentorId, :day_of_week, :start_time, :end_time, :timezone, :available_from, :available_to, :max_sessions_per_week, :note, :status)
        `,
        { mentorId: Number(mentorId), ...item },
      );
    }
  };

  const documentSelect = `
    md.id, md.mentor_id, md.document_type, md.file_name, md.file_url,
    md.mime_type, md.file_size, md.uploaded_by, md.created_at, md.deleted_at,
    mp.full_name AS mentor_name, mp.email AS mentor_email,
    uploader.full_name AS uploaded_by_name
  `;

  const listDocumentsForMentor = async (mentorId) => {
    const [rows] = await db.execute(
      `
        SELECT ${documentSelect}
        FROM mentor_documents md
        JOIN mentor_profiles mp ON mp.id = md.mentor_id
        LEFT JOIN users uploader ON uploader.id = md.uploaded_by
        WHERE md.mentor_id = :mentorId AND md.deleted_at IS NULL
        ORDER BY md.created_at DESC
      `,
      { mentorId: Number(mentorId) },
    );
    return rows;
  };

  const listAllDocuments = async ({ search, mentorId, documentType, limit, offset }) => {
    const params = {};
    const where = ["md.deleted_at IS NULL", "mp.deleted_at IS NULL"];
    if (search) {
      where.push("(md.file_name LIKE :search OR mp.full_name LIKE :search OR mp.email LIKE :search)");
      params.search = `%${search}%`;
    }
    if (mentorId) {
      where.push("md.mentor_id = :mentorId");
      params.mentorId = Number(mentorId);
    }
    if (documentType) {
      where.push("md.document_type = :documentType");
      params.documentType = documentType;
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT ${documentSelect}
        FROM mentor_documents md
        JOIN mentor_profiles mp ON mp.id = md.mentor_id
        LEFT JOIN users uploader ON uploader.id = md.uploaded_by
        WHERE ${whereSql}
        ORDER BY md.created_at DESC
        ${pageSql(limit, offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM mentor_documents md JOIN mentor_profiles mp ON mp.id = md.mentor_id WHERE ${whereSql}`,
      params,
    );
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const createDocument = async (data, conn = db) => {
    const [result] = await conn.execute(
      `
        INSERT INTO mentor_documents
          (mentor_id, document_type, file_name, file_url, file_path, mime_type, file_size, uploaded_by)
        VALUES
          (:mentor_id, :document_type, :file_name, :file_url, :file_path, :mime_type, :file_size, :uploaded_by)
      `,
      data,
    );
    return result.insertId;
  };

  const findDocumentById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT md.*, mp.user_id AS mentor_user_id, mp.full_name AS mentor_name, mp.email AS mentor_email
        FROM mentor_documents md
        JOIN mentor_profiles mp ON mp.id = md.mentor_id
        WHERE md.id = :id AND md.deleted_at IS NULL AND mp.deleted_at IS NULL
        LIMIT 1
      `,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const softDeleteDocument = async (id) => {
    await db.execute("UPDATE mentor_documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL", { id: Number(id) });
  };

  const findMentorDocumentsByPath = async (filePath) => {
    const [rows] = await db.execute(
      `
        SELECT md.id AS document_id, md.mentor_id, md.file_path, mp.user_id AS mentor_user_id
        FROM mentor_documents md
        JOIN mentor_profiles mp ON mp.id = md.mentor_id
        WHERE md.file_path = :filePath
          AND md.deleted_at IS NULL
          AND mp.deleted_at IS NULL
      `,
      { filePath },
    );
    return rows;
  };

  const userHasPermission = async (userId, permissionCode) => {
    const [rows] = await db.execute(
      `
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON rp.role_id = ur.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = :userId AND p.permission_code = :permissionCode
        LIMIT 1
      `,
      { userId: Number(userId), permissionCode },
    );
    return rows.length > 0;
  };

  return {
    listMentors,
    findMentorById,
    findMentorByUserId,
    findActiveMentorByEmail,
    findActiveMentorByUserId,
    findUserById,
    findUserByEmail,
    findUserByUsername,
    createUser,
    findRoleByCode,
    assignUserRole,
    revokeUserRole,
    createMentor,
    updateMentor,
    softDeleteMentor,
    countActiveAssignmentsForMentor,
    getMentorActivity,
    listExpertiseAreas,
    findExpertiseAreaById,
    findExpertiseAreaByCode,
    createExpertiseArea,
    updateExpertiseArea,
    countExpertiseUsage,
    deleteExpertiseArea,
    listExpertiseByIds,
    listExpertiseForMentor,
    replaceExpertiseForMentor,
    listAvailabilityForMentor,
    replaceAvailabilityForMentor,
    listDocumentsForMentor,
    listAllDocuments,
    createDocument,
    findDocumentById,
    softDeleteDocument,
    findMentorDocumentsByPath,
    userHasPermission,
  };
};
