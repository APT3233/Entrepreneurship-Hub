import bcrypt from "bcryptjs";

/**
 * Seed current semester by date: Jan–Apr → Spring, May–Aug → Summer, Sep–Dec → Fall.
 * Idempotent — skips if semester_code already exists.
 */
const seedCurrentSemester = async (connection) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1–12
  let code, name, startDate, endDate;
  if (month >= 1 && month <= 4) {
    code = `SP${year}`;
    name = `Spring ${year}`;
    startDate = `${year}-01-01`;
    endDate = `${year}-05-31`;
  } else if (month >= 5 && month <= 8) {
    code = `SU${year}`;
    name = `Summer ${year}`;
    startDate = `${year}-05-01`;
    endDate = `${year}-08-31`;
  } else {
    code = `FA${year}`;
    name = `Fall ${year}`;
    startDate = `${year}-09-01`;
    endDate = `${year}-12-31`;
  }
  const [[existing]] = await connection.execute(
    "SELECT id FROM semesters WHERE semester_code = ? LIMIT 1",
    [code]
  );
  if (existing) return;
  await connection.execute(
    "INSERT INTO semesters (semester_code, semester_name, year, start_date, end_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'ongoing', NOW(), NOW())",
    [code, name, year, startDate, endDate]
  );
};

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
  await seedCurrentSemester(connection);
};
