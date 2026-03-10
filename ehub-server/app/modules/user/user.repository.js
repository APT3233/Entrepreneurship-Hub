import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createUserRepository = ({ db }) => {
  const base = createBaseRepository(db, "users");

  const findByEmail = async (email) => {
    return base.findOne({ email });
  };

  const findByUsername = async (username) => {
    const sql = `
      SELECT 
        u.*,
        GROUP_CONCAT(r.role_code) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.username = :username
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
        GROUP_CONCAT(r.role_code) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
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
    findByUsername,
    findByGoogleId,
    assignRole,
  };
};
