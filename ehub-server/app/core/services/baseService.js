import { NotFound, AlreadyExists } from "app/core/errors/errorFactory.js";
import { parsePagination, parseSort } from "app/core/utils/pagination.js";
import { logger } from "app/core/logger/index.js";

/**
 * Base service factory — compose với bất kỳ repository nào
 */
export const createBaseService = (repository, resourceName = "Resource") => {
  const getById = async (id, columns) => {
    const row = await repository.findById(id, columns);
    if (!row) throw NotFound(resourceName);
    return row;
  };

  const getOne = async (conditions, columns) => {
    const row = await repository.findOne(conditions, columns);
    if (!row) throw NotFound(resourceName);
    return row;
  };

  const getList = async (
    query,
    { allowedSortColumns = [], filters = {} } = {},
  ) => {
    const pagination = parsePagination(query);
    const sort = parseSort(query.sort, allowedSortColumns);

    const [data, total] = await Promise.all([
      repository.findMany({ conditions: filters, pagination, sort }),
      repository.count(filters),
    ]);

    return { data, ...pagination, total };
  };

  const create = async (data, uniqueField = null) => {
    if (uniqueField && data[uniqueField]) {
      const existing = await repository.findOne({
        [uniqueField]: data[uniqueField],
      });
      if (existing) throw AlreadyExists(resourceName);
    }
    return repository.create(data);
  };

  const update = async (id, data) => {
    await getById(id); // ensure exists
    return repository.update(id, data);
  };

  const remove = async (id, soft = true) => {
    await getById(id);
    return soft ? repository.softDelete(id) : repository.hardDelete(id);
  };
  const service = {
    getById,
    getOne,
    getList,
    create,
    update,
    remove,
    // expose repo cho module extend
    repository,
  };

  return withLogging(service, resourceName + "Service");
};



/**
 * Higher-order function to wrap an object with logging proxy
 */
export const withLogging = (target, name) => {
  return new Proxy(target, {
    get(obj, prop) {
      const original = obj[prop];
      if (typeof original !== "function") return original;

      return async (...args) => {
        const start = Date.now();
        // Hide sensitive args if needed, but for now log basic info
        logger.debug(`[Service] ${name}.${String(prop)} - Start`, { args });

        try {
          const result = await original.apply(obj, args);
          const duration = Date.now() - start;
          logger.debug(
            `[Service] ${name}.${String(prop)} - Success (${duration}ms)`,
          );
          return result;
        } catch (error) {
          const logFn = error?.statusCode >= 500 || !error?.isOperational ? "error" : "warn";
          logger[logFn](`[Service] ${name}.${String(prop)} - Failed`, { error });
          throw error;
        }
      };
    },
  });
};
