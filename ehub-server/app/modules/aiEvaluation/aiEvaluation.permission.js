import { Forbidden } from "app/core/errors/errorFactory.js";

export const userRoles = (user) => (user?.roles || []).map((role) => String(role).toLowerCase());
export const hasRole = (user, ...roles) => userRoles(user).some((role) => roles.includes(role));
export const isAdminOrDept = (user) => hasRole(user, "admin", "department_head");
export const isLecturer = (user) => hasRole(user, "lecturer");

export const assertCanAccessAiSuggestion = (context, user) => {
  if (isAdminOrDept(user)) return;
  if (isLecturer(user) && Number(context?.lecturer_id) === Number(user?.id)) return;
  throw Forbidden("Bạn không có quyền truy cập gợi ý AI của bài nộp này.");
};

export const assertCanConfigureAi = (user) => {
  if (isAdminOrDept(user)) return;
  throw Forbidden("Bạn không có quyền cấu hình AI.");
};
