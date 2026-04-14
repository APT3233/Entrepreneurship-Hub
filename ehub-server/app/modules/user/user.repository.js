import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createUserRepository = ({ db }) => {
  const base = createBaseRepository(db, "users");

  const findByEmail = async (email) => {
    return base.findOne({ email });
  };

  /** Profile đầy đủ (roles) cho GET /auth/me — không dùng password trong response. */
  const findProfileById = async (id) => {
    const sql = `
      SELECT
        u.*,
        GROUP_CONCAT(DISTINCT r.role_code ORDER BY r.role_code) AS roles,
        MAX(s.major) AS major
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN students s ON s.user_id = u.id AND s.deleted_at IS NULL
      WHERE u.id = :id AND u.deleted_at IS NULL
      GROUP BY u.id
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { id });
    const user = rows[0] || null;
    if (user && user.roles) {
      user.roles = user.roles.split(",");
    } else if (user) {
      user.roles = [];
    }
    return user;
  };

  const findByUsername = async (username) => {
    const sql = `
      SELECT
        u.*,
        GROUP_CONCAT(DISTINCT r.role_code ORDER BY r.role_code) AS roles,
        MAX(s.major) AS major
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN students s ON s.user_id = u.id AND s.deleted_at IS NULL
      WHERE LOWER(TRIM(u.username)) = LOWER(TRIM(:username))
      GROUP BY u.id
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { username });
    const user = rows[0] || null;
    
    if (user && user.roles) {
      user.roles = user.roles.split(',');
    } else if (user) {
      user.roles = [];
    }
    
    return user;
  };

  const findByGoogleId = async (googleId) => {
    const sql = `
      SELECT
        u.*,
        GROUP_CONCAT(DISTINCT r.role_code ORDER BY r.role_code) AS roles,
        MAX(s.major) AS major
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN students s ON s.user_id = u.id AND s.deleted_at IS NULL
      WHERE u.google_id = :googleId
      GROUP BY u.id
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { googleId });
    const user = rows[0] || null;
    if (user && user.roles) {
      user.roles = user.roles.split(',');
    } else if (user) {
      user.roles = [];
    }
    return user;
  };

  const assignRole = async (userId, roleCode) => {
    const [[role]] = await db.execute(
      "SELECT id FROM roles WHERE role_code = ? LIMIT 1",
      [roleCode]
    );
    if (!role) return;
    await db.execute(
      "INSERT IGNORE INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, ?)",
      [userId, role.id, new Date()]
    );
  };

  return {
    ...base,
    findByEmail,
    findProfileById,
    findByUsername,
    findByGoogleId,
    assignRole,
  };
};
