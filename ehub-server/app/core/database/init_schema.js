import bcrypt from "bcryptjs";

/**
 * Seed default accounts for each role (idempotent — skips existing usernames)
 * teacher: tea1, tea2 | student: stu1, stu2 | password: 123123
 */
const seedDefaultAccounts = async (connection) => {
  const hashedPassword = await bcrypt.hash("123123", 12);

  const accounts = [
    { username: "tea1", email: "tea1@ehub.com", full_name: "Teacher 1", role_code: "teacher" },
    { username: "tea2", email: "tea2@ehub.com", full_name: "Teacher 2", role_code: "teacher" },
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
