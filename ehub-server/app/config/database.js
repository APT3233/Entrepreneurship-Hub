import { optional, toInt } from "./validate.js";

export const dbConfig = {
  host: optional("MYSQL_HOST", "localhost"),
  port: toInt(optional("MYSQL_PORT", "3306"), 3306),
  database: optional("MYSQL_DB", "eprofile"),
  user: optional("MYSQL_USER", "eprofile"),
  password: optional("MYSQL_PASSWORD", "secret"),
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: toInt(optional("MYSQL_POOL_MAX", "10"), 10),
  maxIdle: toInt(optional("MYSQL_POOL_MAX", "10"), 10), // max idle connections
  idleTimeout: 30000, // idle connections timeout
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  namedPlaceholders: true, // Quan trọng: Cho phép binding query bằng Object { id: 1 } thay vì Array [1]
};
