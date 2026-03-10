import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createAccessLogRepository = ({ db }) => {
  const base = createBaseRepository(db, "api_access_logs");

  /**
   * Log an access action using the existing api_access_logs table
   */
  const logAction = async (logData) => {
    try {
      let path = "/api/v1/auth/";
      if (logData.action === "LOGIN") path += "login";
      else if (logData.action === "REGISTER") path += "register";
      else if (logData.action === "REFRESH") path += "refresh";
      else if (logData.action === "LOGOUT") path += "logout";

      const sql = `
        INSERT INTO api_access_logs 
        (request_id, method, path, ip_address, user_agent, user_id, status_code, response_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.execute(sql, [
        logData.requestId || null,
        "POST",
        path,
        logData.ipAddress?.substring(0, 45) || null,
        logData.userAgent || null,
        logData.userId || null,
        logData.status === "SUCCESS" ? 200 : 401,
        logData.responseTime || 0,
      ]);
    } catch (error) {
      console.error("[AccessLog] Failed to write audit log:", error.message);
    }
  };

  /**
   * Get recent logs of a user
   */
  const getUserLogs = async (userId, limit = 50) => {
    return base.find(
      { user_id: userId },
      { sort: "timestamp", order: "desc", limit },
    );
  };

  return {
    ...base,
    logAction,
    getUserLogs,
  };
};
