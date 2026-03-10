import { ValidationError } from "../errors/errorFactory.js";

/**
 * Validate request dùng Joi schema
 * Sử dụng: validateRequest(schema) — schema = { body, params, query }
 */
export const validateRequest = (schema) => (req, _res, next) => {
  const errors = [];

  for (const segment of ["params", "query", "body"]) {
    if (!schema[segment]) continue;

    const { error, value } = schema[segment].validate(req[segment], {
      abortEarly: false,
      stripUnknown: true,
      errors: { wrap: { label: false } },
    });

    if (error) {
      const details = error.details.map(({ message, path, type }) => ({
        field: path.join("."),
        message,
        type,
      }));
      errors.push(...details);
    } else {
      if (segment === "body") {
        req[segment] = value;
      } else {
        // Xóa các key cũ và assign key mới từ value đã sanitize
        Object.keys(req[segment]).forEach((key) => delete req[segment][key]);
        Object.assign(req[segment], value);
      }
    }
  }

  if (errors.length) return next(ValidationError(errors));
  next();
};
