import { logger } from "app/core/logger/index.js";

/**
 * Transaction Manager for MySQL2
 * Ensures database integrity by managing transaction life cycle (Begin, Commit, Rollback)
 */
export const createTransactionManager = (db) => {
  /**
   * Execute a set of operations within a single transaction
   * @param {Function} work - Callback function(connection) containing DB operations
   * @returns {Promise<any>} Result of the work callback
   */
  const run = async (work) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    // logger.debug("[Transaction] Transaction started");

    try {
      // Pass the dedicated connection to the work callback
      const result = await work(connection);

      await connection.commit();
      // logger.debug("[Transaction] Transaction committed");
      return result;
    } catch (err) {
      await connection.rollback();
      logger.error("[Transaction] Transaction rolled back due to error", {
        err,
      });
      throw err;
    } finally {
      connection.release();
    }
  };

  return { run };
};
