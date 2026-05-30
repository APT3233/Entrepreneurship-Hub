export const createAdminAccessControlRepository = ({ db }) => {
  const parseCsv = (value) => (value ? String(value).split(",").filter(Boolean) : []);

  const listUsers = async ({ search, status, role, limit, offset }) => {
    const params = {};
    const where = ["u.deleted_at IS NULL"];
    if (search) {
      where.push("(u.full_name LIKE :search OR u.email LIKE :search OR u.username LIKE :search)");
      params.search = `%${search}%`;
    }
    if (status) {
      where.push("u.status = :status");
      params.status = status;
    }
    if (role) {
      where.push(`
        EXISTS (
          SELECT 1
          FROM user_roles urf
          JOIN roles rf ON rf.id = urf.role_id
          WHERE urf.user_id = u.id AND rf.role_code = :role
        )
      `);
      params.role = role;
    }

    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT
          u.id, u.username, u.email, u.full_name, u.phone, u.campus, u.avatar_url,
          u.auth_provider, u.status, u.last_login_at, u.created_at, u.updated_at,
          EXISTS(SELECT 1 FROM students s WHERE s.user_id = u.id) AS is_student_goc,
          GROUP_CONCAT(DISTINCT r.role_code ORDER BY r.role_code) AS role_codes,
          GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.role_code) AS role_names
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        WHERE ${whereSql}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(
      `
        SELECT COUNT(DISTINCT u.id) AS total
        FROM users u
        WHERE ${whereSql}
      `,
      params,
    );
    return {
      rows: rows.map((row) => ({
        ...row,
        is_student_goc: row.is_student_goc === 1 || row.is_student_goc === true,
        roles: parseCsv(row.role_codes),
        roleNames: parseCsv(row.role_names),
      })),
      total: Number(totalRows[0]?.total || 0),
    };
  };

  const findUserById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT
          u.id, u.username, u.email, u.full_name, u.phone, u.campus, u.avatar_url,
          u.auth_provider, u.status, u.last_login_at, u.created_at, u.updated_at,
          EXISTS(SELECT 1 FROM students s WHERE s.user_id = u.id) AS is_student_goc,
          up.display_name, up.bio, up.date_of_birth, up.gender, up.address, up.locale, up.timezone,
          GROUP_CONCAT(DISTINCT r.role_code ORDER BY r.role_code) AS role_codes,
          GROUP_CONCAT(DISTINCT p.permission_code ORDER BY p.permission_code) AS permission_codes
        FROM users u
        LEFT JOIN users_profile up ON up.user_id = u.id
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        LEFT JOIN role_permissions rp ON rp.role_id = r.id
        LEFT JOIN permissions p ON p.id = rp.permission_id
        WHERE u.id = :id AND u.deleted_at IS NULL
        GROUP BY u.id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    const user = rows[0] || null;
    if (!user) return null;
    return {
      ...user,
      is_student_goc: user.is_student_goc === 1 || user.is_student_goc === true,
      roles: parseCsv(user.role_codes),
      permissions: parseCsv(user.permission_codes),
    };
  };

  const findUserByEmail = async (email, excludeId = null) => {
    const params = { email };
    let sql = "SELECT id FROM users WHERE email = :email AND deleted_at IS NULL";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    sql += " LIMIT 1";
    const [rows] = await db.execute(sql, params);
    return rows[0] || null;
  };

  const findUserByUsername = async (username, excludeId = null) => {
    const params = { username };
    let sql = "SELECT id FROM users WHERE username = :username AND deleted_at IS NULL";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    sql += " LIMIT 1";
    const [rows] = await db.execute(sql, params);
    return rows[0] || null;
  };

  const createUser = async (data, conn = db) => {
    const [result] = await conn.execute(
      `
        INSERT INTO users
          (username, email, password, full_name, phone, campus, avatar_url, auth_provider, status)
        VALUES
          (:username, :email, :password, :full_name, :phone, :campus, :avatar_url, :auth_provider, :status)
      `,
      data,
    );
    return result.insertId;
  };

  const updateUser = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE users SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`,
      { ...data, id: Number(id) },
    );
  };

  const replaceUserRoles = async (userId, roleCodes, assignedBy, conn = db) => {
    await conn.execute("DELETE FROM user_roles WHERE user_id = :userId", { userId: Number(userId) });
    if (!roleCodes.length) return;
    const placeholders = roleCodes.map((_, idx) => `:role${idx}`).join(", ");
    const params = {};
    roleCodes.forEach((roleCode, idx) => {
      params[`role${idx}`] = roleCode;
    });
    const [roles] = await conn.execute(
      `SELECT id, role_code FROM roles WHERE role_code IN (${placeholders})`,
      params,
    );
    for (const role of roles) {
      await conn.execute(
        "INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (:userId, :roleId, :assignedBy)",
        { userId: Number(userId), roleId: role.id, assignedBy: assignedBy || null },
      );
    }
  };

  const listRoles = async () => {
    const [rows] = await db.execute(`
      SELECT
        r.id, r.role_code, r.role_name, r.description, r.is_system, r.created_at, r.updated_at,
        COUNT(DISTINCT ur.user_id) AS total_users,
        COUNT(DISTINCT rp.permission_id) AS total_permissions
      FROM roles r
      LEFT JOIN user_roles ur ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      GROUP BY r.id
      ORDER BY r.is_system DESC, r.role_code ASC
    `);
    return rows;
  };

  const findRoleById = async (id) => {
    const [rows] = await db.execute(
      `
        SELECT
          r.*,
          GROUP_CONCAT(DISTINCT p.permission_code ORDER BY p.permission_code) AS permission_codes
        FROM roles r
        LEFT JOIN role_permissions rp ON rp.role_id = r.id
        LEFT JOIN permissions p ON p.id = rp.permission_id
        WHERE r.id = :id
        GROUP BY r.id
        LIMIT 1
      `,
      { id: Number(id) },
    );
    const role = rows[0] || null;
    if (!role) return null;
    return { ...role, permissions: parseCsv(role.permission_codes) };
  };

  const findRoleByCode = async (roleCode, excludeId = null) => {
    const params = { roleCode };
    let sql = "SELECT id FROM roles WHERE role_code = :roleCode";
    if (excludeId) {
      sql += " AND id <> :excludeId";
      params.excludeId = Number(excludeId);
    }
    sql += " LIMIT 1";
    const [rows] = await db.execute(sql, params);
    return rows[0] || null;
  };

  const createRole = async (data) => {
    const [result] = await db.execute(
      `
        INSERT INTO roles (role_code, role_name, description, is_system)
        VALUES (:role_code, :role_name, :description, :is_system)
      `,
      data,
    );
    return result.insertId;
  };

  const updateRole = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(
      `UPDATE roles SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`,
      { ...data, id: Number(id) },
    );
  };

  const replaceRolePermissions = async (roleId, permissionCodes) => {
    await db.execute("DELETE FROM role_permissions WHERE role_id = :roleId", { roleId: Number(roleId) });
    if (!permissionCodes.length) return;
    const placeholders = permissionCodes.map((_, idx) => `:perm${idx}`).join(", ");
    const params = {};
    permissionCodes.forEach((permissionCode, idx) => {
      params[`perm${idx}`] = permissionCode;
    });
    const [permissions] = await db.execute(
      `SELECT id FROM permissions WHERE permission_code IN (${placeholders})`,
      params,
    );
    for (const permission of permissions) {
      await db.execute(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permissionId)",
        { roleId: Number(roleId), permissionId: permission.id },
      );
    }
  };

  const listPermissions = async ({ search, module, limit, offset }) => {
    const params = {};
    const where = ["1 = 1"];
    if (search) {
      where.push("(permission_code LIKE :search OR permission_name LIKE :search)");
      params.search = `%${search}%`;
    }
    if (module) {
      where.push("module = :module");
      params.module = module;
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT id, permission_code, permission_name, module, description, created_at
        FROM permissions
        WHERE ${whereSql}
        ORDER BY module ASC, permission_code ASC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM permissions WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const listPermissionModules = async () => {
    const [rows] = await db.execute("SELECT DISTINCT module FROM permissions ORDER BY module ASC");
    return rows.map((row) => row.module);
  };

  const findPermissionById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM permissions WHERE id = :id LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const listSettings = async ({ search, module, limit, offset }) => {
    const params = {};
    const where = ["1 = 1"];
    if (search) {
      where.push("(setting_key LIKE :search OR description LIKE :search)");
      params.search = `%${search}%`;
    }
    if (module) {
      where.push("module = :module");
      params.module = module;
    }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `
        SELECT id, setting_key, setting_value, data_type, module, description, updated_by, updated_at
        FROM system_settings
        WHERE ${whereSql}
        ORDER BY module ASC, setting_key ASC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM system_settings WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const listSettingModules = async () => {
    const [rows] = await db.execute("SELECT DISTINCT module FROM system_settings ORDER BY module ASC");
    return rows.map((row) => row.module);
  };

  const findSettingById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM system_settings WHERE id = :id LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const updateSetting = async (id, { setting_value, updated_by }) => {
    await db.execute(
      `
        UPDATE system_settings
        SET setting_value = :setting_value, updated_by = :updated_by, updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
      `,
      { id: Number(id), setting_value, updated_by: updated_by || null },
    );
  };

  return {
    listUsers,
    findUserById,
    findUserByEmail,
    findUserByUsername,
    createUser,
    updateUser,
    replaceUserRoles,
    listRoles,
    findRoleById,
    findRoleByCode,
    createRole,
    updateRole,
    replaceRolePermissions,
    listPermissions,
    listPermissionModules,
    findPermissionById,
    listSettings,
    listSettingModules,
    findSettingById,
    updateSetting,
  };
};
