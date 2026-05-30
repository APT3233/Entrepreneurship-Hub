import { AccountLocked, Forbidden } from "app/core/errors/errorFactory.js";

/** Chặn đăng nhập / dùng API khi tài khoản bị khóa hoặc vô hiệu hóa. */
export const assertUserCanAuthenticate = (user) => {
  const status = String(user?.status || "active").toLowerCase();
  if (status === "locked") throw AccountLocked();
  if (status === "inactive") {
    throw Forbidden("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
  }
};
