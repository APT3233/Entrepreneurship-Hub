import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createSubjectRepository = ({ db }) => {
  const base = createBaseRepository(db, "subjects");

  const findByCode = async (code) => {
    const sql = `SELECT * FROM \`subjects\` WHERE subject_code = :code AND deleted_at IS NULL LIMIT 1`;
    const [rows] = await db.execute(sql, { code });
    return rows[0] || null;
  };

  // Override findOne to exclude soft-deleted (for unique check in create)
  const findOne = async (conditions, columns = ["*"]) => {
    const cols = columns.map((c) => (c === "*" ? "*" : `\`${c}\``)).join(", ");
    const keys = Object.keys(conditions);
    let sql = `SELECT ${cols} FROM \`subjects\``;
    if (keys.length > 0) {
      const whereClause = keys.map((k) => `\`${k}\` = :${k}`).join(" AND ");
      sql += ` WHERE ${whereClause} AND deleted_at IS NULL`;
    } else {
      sql += " WHERE deleted_at IS NULL";
    }
    sql += " LIMIT 1";
    const [rows] = await db.execute(sql, conditions);
    return rows[0] || null;
  };

  const findActive = async (pagination, sort) => {
    const sql = `SELECT * FROM \`subjects\` WHERE deleted_at IS NULL ORDER BY created_at DESC`;
    const [rows] = await db.execute(sql);
    return rows;
  };

  // Override findById to exclude soft-deleted
  const findById = async (id, columns = ["*"]) => {
    const cols = columns.map((c) => (c === "*" ? "*" : `\`${c}\``)).join(", ");
    const sql = `SELECT ${cols} FROM \`subjects\` WHERE id = :id AND deleted_at IS NULL LIMIT 1`;
    const [rows] = await db.execute(sql, { id });
    return rows[0] || null;
  };

  // Custom findMany with deleted_at filter + search (subject_code, subject_name)
  const findMany = async ({ conditions = {}, columns = ["*"], pagination, sort } = {}) => {
    const cols = columns.map((c) => (c === "*" ? "*" : `\`${c}\``)).join(", ");
    const params = {};
    const clauses = ["deleted_at IS NULL"];
    if (conditions.status) {
      clauses.push("`status` = :status");
      params.status = conditions.status;
    }
    if (conditions.search) {
      clauses.push("(`subject_code` LIKE :search OR `subject_name` LIKE :search OR `subject_name_en` LIKE :search)");
      params.search = `%${conditions.search}%`;
    }
    let sql = `SELECT ${cols} FROM \`subjects\` WHERE ${clauses.join(" AND ")}`;
    if (sort?.length > 0) {
      const orderParams = sort.map(({ column, order }) => {
        const dir = order.toUpperCase() === "DESC" ? "DESC" : "ASC";
        return `\`${column}\` ${dir}`;
      });
      sql += ` ORDER BY ${orderParams.join(", ")}`;
    } else {
      sql += " ORDER BY created_at DESC";
    }
    if (pagination) sql += ` LIMIT ${Number(pagination.limit)} OFFSET ${Number(pagination.offset)}`;
    const [rows] = await db.execute(sql, params);
    return rows;
  };

  const count = async (conditions = {}) => {
    const params = {};
    const clauses = ["deleted_at IS NULL"];
    if (conditions.status) {
      clauses.push("`status` = :status");
      params.status = conditions.status;
    }
    if (conditions.search) {
      clauses.push("(`subject_code` LIKE :search OR `subject_name` LIKE :search OR `subject_name_en` LIKE :search)");
      params.search = `%${conditions.search}%`;
    }
    const sql = `SELECT COUNT(id) as total FROM \`subjects\` WHERE ${clauses.join(" AND ")}`;
    const [rows] = await db.execute(sql, params);
    return Number(rows[0].total);
  };

  return {
    ...base,
    findById,
    findOne,
    findMany,
    count,
    findByCode,
    findActive,
  };
};
