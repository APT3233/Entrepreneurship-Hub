import { logger } from "app/core/logger/index.js";

/**
 * Enterprise Audit Logging Service
 * Records security-sensitive and high-value domain events for compliance.
 */
export const createAuditService = ({ db, auditRepository }) => {
  let supportsTitleColumn = null;

  const hasTitleColumn = async () => {
    if (supportsTitleColumn !== null) return supportsTitleColumn;
    try {
      const [rows] = await db.execute("SHOW COLUMNS FROM audit_logs LIKE 'title'");
      supportsTitleColumn = rows.length > 0;
    } catch {
      supportsTitleColumn = false;
    }
    return supportsTitleColumn;
  };

  const insertAuditLog = async ({ userId, action, tableName, recordId, title, oldValues, newValues, ipAddress, userAgent }) => {
    const commonValues = [
      userId || null,
      action,
      tableName,
      recordId || null,
    ];
    const detailValues = [
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress || null,
      userAgent || null,
    ];

    if (await hasTitleColumn()) {
      await db.execute(
        `
          INSERT INTO audit_logs (
            user_id, action, table_name, record_id, title,
            old_values, new_values, ip_address, user_agent, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [...commonValues, title || null, ...detailValues],
      );
      return;
    }

    await db.execute(
      `
        INSERT INTO audit_logs (
          user_id, action, table_name, record_id,
          old_values, new_values, ip_address, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [...commonValues, ...detailValues],
    );
  };

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
      await insertAuditLog({ userId, action, tableName, recordId, title, oldValues, newValues, ipAddress, userAgent });

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
