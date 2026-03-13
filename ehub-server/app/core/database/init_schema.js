import bcrypt from "bcryptjs";

/**
 * Seed default accounts for each role (idempotent — skips existing usernames)
 * lecture: lec1, lec2 | student: stu1, stu2 | password: 123123
 */
const seedDefaultAccounts = async (connection) => {
  const hashedPassword = await bcrypt.hash("123123", 12);

  const accounts = [
    { username: "lec1", email: "lec1@ehub.com", full_name: "Lecturer 1", role_code: "lecturer" },
    { username: "lec2", email: "lec2@ehub.com", full_name: "Lecturer 2", role_code: "lecturer" },
    { username: "stu1", email: "stu1@ehub.com", full_name: "Student 1", role_code: "student" },
    { username: "stu2", email: "stu2@ehub.com", full_name: "Student 2", role_code: "student" },
  ];

  for (const acc of accounts) {
    const [[existing]] = await connection.execute(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [acc.username]
    );
    if (existing) continue;

    const [[role]] = await connection.execute(
      "SELECT id FROM roles WHERE role_code = ? LIMIT 1",
      [acc.role_code]
    );
    if (!role) continue;

    const now = new Date();
    const [result] = await connection.execute(
      "INSERT INTO users (username, email, full_name, password, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)",
      [acc.username, acc.email, acc.full_name, hashedPassword, now, now]
    );
    const userId = result.insertId;

    await connection.execute(
      "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, ?)",
      [userId, role.id, now]
    );
  }
};

export const setupDatabaseSchema = async (connection) => {
  await seedDefaultAccounts(connection);
};
