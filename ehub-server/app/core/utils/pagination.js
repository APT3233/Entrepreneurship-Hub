const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse & sanitize pagination params từ query string
 * parsePagination({ page: '2', limit: '50' }) → { page: 2, limit: 50, offset: 50 }
 */
export const parsePagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT),
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Parse sort param: "created_at:desc,name:asc"
 * → [{ column: 'created_at', order: 'desc' }, { column: 'name', order: 'asc' }]
 */
export const parseSort = (sortStr, allowedColumns = []) => {
  if (!sortStr) return [{ column: "created_at", order: "desc" }];

  const allowedSet = new Set(allowedColumns);

  return sortStr
    .split(",")
    .map((part) => {
      const [column, order = "asc"] = part.trim().split(":");
      return { column, order: order.toLowerCase() === "desc" ? "desc" : "asc" };
    })
    .filter(
      ({ column }) => allowedColumns.length === 0 || allowedSet.has(column),
    );
};
