/**
 * Base Repository — factory function
 * Cung cấp CRUD operations thuần SQL cho mọi module sử dụng cơ chế mysql2 (Prepared Statements + Named Placeholders)
 */
export const createBaseRepository = (db, tableName) => {
  const findById = async (id, columns = ["*"]) => {
    const cols = columns.map((c) => (c === "*" ? "*" : `\`${c}\``)).join(", ");
    const sql = `SELECT ${cols} FROM \`${tableName}\` WHERE id = :id LIMIT 1`;
    const [rows] = await db.execute(sql, { id });
    return rows[0] || null;
  };

  const findOne = async (conditions, columns = ["*"]) => {
    const cols = columns.map((c) => (c === "*" ? "*" : `\`${c}\``)).join(", ");
    const keys = Object.keys(conditions);

    let sql = `SELECT ${cols} FROM \`${tableName}\``;
    if (keys.length > 0) {
      const whereClause = keys.map((k) => `\`${k}\` = :${k}`).join(" AND ");
      sql += ` WHERE ${whereClause}`;
    }
    sql += " LIMIT 1";

    const [rows] = await db.execute(sql, conditions);
    return rows[0] || null;
  };

  const findMany = async ({
    conditions = {},
    columns = ["*"],
    pagination,
    sort,
  } = {}) => {
    const cols = columns.map((c) => (c === "*" ? "*" : `\`${c}\``)).join(", ");
    const keys = Object.keys(conditions);

    let sql = `SELECT ${cols} FROM \`${tableName}\``;
    if (keys.length > 0) {
      const whereClause = keys.map((k) => `\`${k}\` = :${k}`).join(" AND ");
      sql += ` WHERE ${whereClause}`;
    }

    if (sort?.length > 0) {
      const orderParams = sort.map(({ column, order }) => {
        const dir = order.toUpperCase() === "DESC" ? "DESC" : "ASC";
        return `\`${column}\` ${dir}`;
      });
      sql += ` ORDER BY ${orderParams.join(", ")}`;
    }

    if (pagination) {
      sql += ` LIMIT ${Number(pagination.limit)} OFFSET ${Number(pagination.offset)}`;
    }

    const [rows] = await db.execute(sql, conditions);
    return rows;
  };

  const count = async (conditions = {}) => {
    const keys = Object.keys(conditions);
    let sql = `SELECT COUNT(id) as total FROM \`${tableName}\``;

    if (keys.length > 0) {
      const whereClause = keys.map((k) => `\`${k}\` = :${k}`).join(" AND ");
      sql += ` WHERE ${whereClause}`;
    }

    const [rows] = await db.execute(sql, conditions);
    return Number(rows[0].total);
  };

  const create = async (data) => {
    const keys = Object.keys(data);
    const placeholders = keys.map((k) => `:${k}`).join(", ");
    const cols = keys.map((k) => `\`${k}\``).join(", ");

    // Tự động cast giá trị TimeStamp
    const now = new Date();
    let insertData = { ...data };

    if (!insertData.created_at) insertData.created_at = now;
    if (!insertData.updated_at) insertData.updated_at = now;

    const actualKeys = Object.keys(insertData);
    const actualParams = actualKeys.map((k) => `:${k}`).join(", ");
    const actualCols = actualKeys.map((k) => `\`${k}\``).join(", ");

    const sql = `INSERT INTO \`${tableName}\` (${actualCols}) VALUES (${actualParams})`;

    const [result] = await db.execute(sql, insertData);

    if (result.insertId) {
      return findById(result.insertId);
    }
    return result;
  };

  const update = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return null;

    let updateData = { ...data, whereId: id };
    if (!updateData.updated_at) updateData.updated_at = new Date();

    const updateKeys = Object.keys(updateData).filter((k) => k !== "whereId");
    const setClause = updateKeys.map((k) => `\`${k}\` = :${k}`).join(", ");

    const sql = `UPDATE \`${tableName}\` SET ${setClause} WHERE id = :whereId`;

    await db.execute(sql, updateData);
    return findById(id);
  };

  const updateWhere = async (conditions, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return null;

    let updateData = { ...data };
    if (!updateData.updated_at) updateData.updated_at = new Date();

    const setKeys = Object.keys(updateData);
    const setClause = setKeys.map((k) => `\`${k}\` = :${k}`).join(", ");

    const condKeys = Object.keys(conditions);
    let whereClause = "";
    const mapping = { ...updateData };

    if (condKeys.length > 0) {
      whereClause =
        " WHERE " + condKeys.map((k) => `\`${k}\` = :cond_${k}`).join(" AND ");
      for (const ck of condKeys) {
        mapping[`cond_${ck}`] = conditions[ck];
      }
    }

    const sql = `UPDATE \`${tableName}\` SET ${setClause}${whereClause}`;
    const [result] = await db.execute(sql, mapping);
    return result.affectedRows;
  };

  const softDelete = async (id) => {
    return update(id, { deleted_at: new Date() });
  };

  const hardDelete = async (id) => {
    const sql = `DELETE FROM \`${tableName}\` WHERE id = :id`;
    const [result] = await db.execute(sql, { id });
    return result.affectedRows;
  };

  const exists = async (conditions) => {
    const keys = Object.keys(conditions);
    let sql = `SELECT 1 FROM \`${tableName}\``;

    if (keys.length > 0) {
      const whereClause = keys.map((k) => `\`${k}\` = :${k}`).join(" AND ");
      sql += ` WHERE ${whereClause}`;
    }
    sql += " LIMIT 1";

    const [rows] = await db.execute(sql, conditions);
    return rows.length > 0;
  };

  // Dành cho queries phức tạp + joins nếu cần
  const rawQuery = async (sql, params = {}) => {
    const [rows] = await db.execute(sql, params);
    return rows;
  };

  return {
    tableName,
    findById,
    findOne,
    findMany,
    count,
    create,
    update,
    updateWhere,
    softDelete,
    hardDelete,
    exists,
    rawQuery,
  };
};
