import { createBaseRepository } from "app/core/database/baseRepository.js";
import { logger } from "app/core/logger/index.js";

export const createAuditRepository = ({ db }) => {
  const base = createBaseRepository(db, "audit_logs");

  const findLatestByUserId = async (userId, limit = 10, offset = 0) => {
    const sql = `
      SELECT * FROM audit_logs 
      WHERE user_id = ?
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const uId = Number(userId);
    const lmt = Number(limit);
    const offs = Number(offset);
    
    if (isNaN(uId)) {
      logger.warn("[AuditRepository] Invalid userId", { user_id: userId });
      return [];
    }

    const [rows] = await db.query(sql, [uId, lmt, offs]);
    return rows;
  };

  const countByUserId = async (userId) => {
    const sql = "SELECT COUNT(*) as total FROM audit_logs WHERE user_id = ?";
    const [rows] = await db.query(sql, [userId]);
    return rows[0].total;
  };

  return {
    ...base,
    findLatestByUserId,
    countByUserId,
  };
};
