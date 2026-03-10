/**
 * Remove sensitive fields from an object (e.g., user profile)
 * @param {Object} data - The object to sanitize
 * @param {string[]} extraFields - Additional fields to remove
 * @returns {Object} The sanitized object
 */
export const sanitize = (data, extraFields = []) => {
  if (!data || typeof data !== "object") return data;

  const sensitiveFields = [
    "password",
    "refresh_token",
    "secret",
    ...extraFields,
  ];
  const sanitized = { ...data };

  sensitiveFields.forEach((field) => {
    delete sanitized[field];
  });

  return sanitized;
};
