import { v7 as uuidv7 } from "uuid";
import { loggerContext } from "app/core/logger/index.js";

/**
 * Attach requestId + startTime vào mỗi request và wrap trong AsyncLocalStorage context
 */
export const requestContext = (req, res, next) => {
  const requestId = req.headers["x-request-id"] ?? uuidv7();
  req.requestId = requestId;
  req.startTime = Date.now();
  res.setHeader("x-request-id", requestId);

  // Chạy các middleware/handlers tiếp theo trong context của logger
  loggerContext.run({ trace_id: requestId, session_id: null }, () => {
    next();
  });
};
