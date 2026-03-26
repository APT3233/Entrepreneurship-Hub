import mysql from "mysql2/promise";
import { dbConfig } from "app/config/database.js";
import { logger } from "app/core/logger/index.js";

let poolInstance = null;

export const getPool = () => {
  if (!poolInstance) poolInstance = mysql.createPool(dbConfig);
  return poolInstance;
};

export const loadDatabase = async () => {
  const pool = getPool();

  try {
    const connection = await pool.getConnection();
    await connection.ping(); // Health check

    const { setupDatabaseSchema } = await import("app/core/database/init_schema.js");
    await setupDatabaseSchema(connection);

    connection.release();
    logger.info("[Bootstrap] MySQL2 Pool OKE");
  } catch (err) {
    logger.error("❌ MySQL2 Pool connection failed", { err });
    throw err;
  }

  return pool;
};

export const destroyDatabase = async () => {
  if (poolInstance) {
    await poolInstance.end();
  }
};
