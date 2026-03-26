import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createAssignmentRepository = ({ db }) => {
  const base = createBaseRepository(db, "assignments");

  const findClassesByIdsAndLecturer = async (classIds, lecturerId) => {
    if (!Array.isArray(classIds) || !classIds.length) return [];
    const params = { lecturerId };
    const placeholders = classIds.map((_, idx) => `:class${idx}`).join(", ");
    classIds.forEach((id, idx) => {
      params[`class${idx}`] = Number(id);
    });
    const sql = `
      SELECT c.id, c.class_code
      FROM classes c
      WHERE c.deleted_at IS NULL
        AND c.id IN (${placeholders})
        AND c.lecturer_id = :lecturerId
    `;
    const [rows] = await db.execute(sql, params);
    return rows;
  };

  const insertMany = async (rows, conn) => {
    if (!rows.length) return [];
    const sql = `
      INSERT INTO assignments (class_id, title, description, deadline, max_score, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const insertedIds = [];
    for (const row of rows) {
      const [result] = await conn.execute(sql, [
        row.class_id,
        row.title,
        row.description,
        row.deadline,
        row.max_score,
        row.status,
        row.created_by,
      ]);
      insertedIds.push(result.insertId);
    }
    return insertedIds;
  };

  const findManyWithStats = async ({ filters, pagination, sort }) => {
    const params = {};
    const clauses = ["a.deleted_at IS NULL", "c.deleted_at IS NULL"];
    if (filters?.lecturer_id) {
      clauses.push("c.lecturer_id = :lecturer_id");
      params.lecturer_id = Number(filters.lecturer_id);
    }
    if (filters?.class_id) {
      clauses.push("a.class_id = :class_id");
      params.class_id = Number(filters.class_id);
    }
    if (filters?.status) {
      clauses.push("a.status = :status");
      params.status = filters.status;
    }
    if (filters?.semester_id) {
      clauses.push("c.semester_id = :semester_id");
      params.semester_id = Number(filters.semester_id);
    }
    if (filters?.year) {
      clauses.push("sem.year = :year");
      params.year = Number(filters.year);
    }

    let sql = `
      SELECT a.id, a.title, a.description, a.deadline, a.max_score, a.status, a.class_id, c.class_code,
             COUNT(DISTINCT g.id) AS total_groups,
             COUNT(DISTINCT CASE WHEN s.id IS NOT NULL AND s.status IN ('submitted', 'graded', 'resubmitted') THEN g.id END) AS submitted_groups
      FROM assignments a
      JOIN classes c ON c.id = a.class_id
      JOIN semesters sem ON sem.id = c.semester_id
      LEFT JOIN \`groups\` g ON g.class_id = a.class_id AND g.deleted_at IS NULL
      LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.group_id = g.id
      WHERE ${clauses.join(" AND ")}
      GROUP BY a.id, c.class_code
    `;
    if (sort?.length) {
      const orderParts = sort.map(({ column, order }) => `a.\`${column}\` ${order.toUpperCase() === "DESC" ? "DESC" : "ASC"}`);
      sql += ` ORDER BY ${orderParts.join(", ")}`;
    } else sql += " ORDER BY a.created_at DESC";
    if (pagination) sql += ` LIMIT ${pagination.limit} OFFSET ${pagination.offset}`;
    const [rows] = await db.execute(sql, params);
    return rows;
  };

  const countManyWithStats = async (filters) => {
    const params = {};
    const clauses = ["a.deleted_at IS NULL", "c.deleted_at IS NULL"];
    if (filters?.lecturer_id) {
      clauses.push("c.lecturer_id = :lecturer_id");
      params.lecturer_id = Number(filters.lecturer_id);
    }
    if (filters?.class_id) {
      clauses.push("a.class_id = :class_id");
      params.class_id = Number(filters.class_id);
    }
    if (filters?.status) {
      clauses.push("a.status = :status");
      params.status = filters.status;
    }
    if (filters?.semester_id) {
      clauses.push("c.semester_id = :semester_id");
      params.semester_id = Number(filters.semester_id);
    }
    if (filters?.year) {
      clauses.push("sem.year = :year");
      params.year = Number(filters.year);
    }
    const sql = `
      SELECT COUNT(a.id) AS total
      FROM assignments a
      JOIN classes c ON c.id = a.class_id
      JOIN semesters sem ON sem.id = c.semester_id
      WHERE ${clauses.join(" AND ")}
    `;
    const [rows] = await db.execute(sql, params);
    return Number(rows[0]?.total || 0);
  };

  const findDetailById = async (id) => {
    const sql = `
      SELECT a.id, a.title, a.description, a.deadline, a.max_score, a.status, a.class_id, c.class_code, c.class_name,
             COUNT(DISTINCT g.id) AS total_groups,
             COUNT(DISTINCT CASE WHEN s.id IS NOT NULL AND s.status IN ('submitted', 'graded', 'resubmitted') THEN g.id END) AS submitted_groups
      FROM assignments a
      JOIN classes c ON c.id = a.class_id
      LEFT JOIN \`groups\` g ON g.class_id = a.class_id AND g.deleted_at IS NULL
      LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.group_id = g.id
      WHERE a.id = :id
        AND a.deleted_at IS NULL
        AND c.deleted_at IS NULL
      GROUP BY a.id, c.class_code, c.class_name
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { id: Number(id) });
    return rows[0] || null;
  };

  const findByIdWithClass = async (id) => {
    const sql = `
      SELECT a.id, a.class_id, c.lecturer_id
      FROM assignments a
      JOIN classes c ON c.id = a.class_id
      WHERE a.id = :id
        AND a.deleted_at IS NULL
        AND c.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { id: Number(id) });
    return rows[0] || null;
  };

  return {
    ...base,
    findClassesByIdsAndLecturer,
    insertMany,
    findManyWithStats,
    countManyWithStats,
    findDetailById,
    findByIdWithClass,
  };
};
