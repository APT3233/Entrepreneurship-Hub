import { logger } from "app/core/logger/index.js";

/**
 * Enterprise Audit Logging Service
 * Records security-sensitive and high-value domain events for compliance.
 */
export const createAuditService = () => {
  /**
   * Log an audit event
   * @param {Object} params - Audit parameters
   * @param {string|number} params.userId - Who performed the action
   * @param {string} params.action - What was done (e.g., 'USER_LOGIN', 'DATA_EXPORT')
   * @param {string} params.resource - Target resource (e.g., 'User', 'Project')
   * @param {string} params.status - Result (e.g., 'SUCCESS', 'FAILURE')
   * @param {Object} [params.meta] - Extra identifying info (e.g., IP, UserAgent)
   * @param {Object} [params.payload] - Data related to the action (masked if sensitive)
   */
  const log = ({
    userId,
    action,
    resource,
    status,
    meta = {},
    payload = {},
  }) => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resource,
      status,
      ...meta,
      payload,
    };

    // Use a specialized prefix to make these easy to extract from general logs
    logger.info(
      `[AUDIT] ${action} on ${resource} by user ${userId} | ${status}`,
      auditEntry,
    );

    // In a more advanced setup, this could also write to a dedicated MySQL 'audit_logs' table
    // return db.execute('INSERT INTO audit_logs ...', auditEntry);
  };

  /**
   * Shorthand for security events
   */
  const security = (params) => log({ ...params, resource: "Security" });

  return { log, security };
};
