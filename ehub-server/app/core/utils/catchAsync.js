/**
 * Wrap async route handler → tự catch vào error middleware
 */
export const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)