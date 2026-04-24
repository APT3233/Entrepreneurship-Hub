import { logger } from "app/core/logger/index.js";

/**
 * Enterprise Audit Logging Service
 * Records security-sensitive and high-value domain events for compliance.
 */
export const createAuditService = ({ db, auditRepository }) => {
  /**
   * Log an audit event to database
   * @param {Object} params - Audit parameters
   */
  const log = async ({
    userId,
    action, // 'create','update','delete','restore','export','import','login','logout'
    tableName,
    recordId = null,
    title = null,
    oldValues = null,
    newValues = null,
    ipAddress = null,
    userAgent = null,
  }) => {
    try {
      const sql = `
        INSERT INTO audit_logs (
          user_id, action, table_name, record_id, title,
          old_values, new_values, ip_address, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      await db.execute(sql, [
        userId || null,
        action,
        tableName,
        recordId || null,
        title || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress || null,
        userAgent || null,
      ]);

      logger.info(`[AUDIT] ${action} on ${tableName} (${title}) by user ${userId}`);
    } catch (err) {
      logger.error(`[AUDIT] Failed to write audit log: ${err.message}`, { 
        userId, action, tableName 
      });
    }
  };

  /**
   * Lấy danh sách hoạt động gần đây của user
   */
  const getActivities = async (userId, { page = 1, limit = 10 } = {}) => {
    const offset = (page - 1) * limit;
    const items = await auditRepository.findLatestByUserId(userId, limit, offset);
    const total = await auditRepository.countByUserId(userId);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  };

  /**
   * Shorthand for common actions
   */
  const security = (params) => log({ ...params, tableName: "users" });

  return { log, security, getActivities };
};
