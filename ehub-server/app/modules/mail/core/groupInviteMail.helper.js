import { appConfig } from "app/config/app.js";

const frontendBase = () => (appConfig.google.frontendUrl || "").replace(/\/$/, "");

/** Link student mở dashboard để xử lý lời mời (TH2 hoặc sau kích hoạt). */
export const buildGroupInviteDashboardUrl = (token) => {
  const base = frontendBase();
  const q = new URLSearchParams({ group_invite: token });
  return `${base}/student/dashboard?${q.toString()}`;
};

/**
 * TH2: đã có tài khoản — mail ngắn + link dashboard.
 */
export const buildGroupInviteMailPartsActiveUser = ({ groupName, classCode, dashboardUrl }) => {
  const subject = `[E-HUB] Lời mời tham gia nhóm${groupName ? ` «${groupName}»` : ""}`;
  const text = [
    `Bạn được mời tham gia nhóm${groupName ? ` "${groupName}"` : ""}${classCode ? ` (lớp ${classCode})` : ""} trên E-HUB.`,
    "",
    "Đăng nhập và xác nhận hoặc từ chối tại:",
    dashboardUrl,
    "",
    "Nếu bạn không mong đợi email này, có thể bỏ qua.",
  ].join("\n");
  const html = `
      <p>Bạn được mời tham gia nhóm <strong>${groupName || "mới"}</strong>${classCode ? ` (lớp <strong>${classCode}</strong>)` : ""} trên E-HUB.</p>
      <p><a href="${dashboardUrl}">Mở E-HUB để xác nhận hoặc từ chối</a></p>
      <p style="color:#666;font-size:12px;">Nếu bạn không mong đợi email này, có thể bỏ qua.</p>
    `;
  return { subject, text, html };
};

/**
 * TH1: chưa kích hoạt — kích hoạt tài khoản + hướng dẫn xác nhận nhóm sau khi đăng nhập.
 * activationUrl: link /activate?token=... (class invite token)
 */
export const buildGroupInviteMailPartsPendingUser = ({
  groupName,
  classCode,
  activationUrl,
}) => {
  const subject = `[E-HUB] Kích hoạt tài khoản và lời mời nhóm${groupName ? ` «${groupName}»` : ""}`;
  const text = [
    `Bạn được thêm vào lớp${classCode ? ` ${classCode}` : ""} và được mời tham gia nhóm${groupName ? ` "${groupName}"` : ""} trên E-HUB.`,
    "",
    "Bước 1 — Kích hoạt tài khoản (đặt mật khẩu):",
    activationUrl,
    "",
    "Sau khi kích hoạt, đăng nhập vào E-HUB. Hệ thống sẽ hỏi bạn xác nhận hoặc từ chối tham gia nhóm.",
    "",
    "Liên kết kích hoạt có thời hạn.",
  ].join("\n");
  const html = `
      <p>Bạn được mời tham gia nhóm <strong>${groupName || "mới"}</strong>${classCode ? ` trong lớp <strong>${classCode}</strong>` : ""} trên E-HUB.</p>
      <p><strong>Bước 1 — Kích hoạt tài khoản:</strong> <a href="${activationUrl}">Đặt mật khẩu</a></p>
      <p>Sau khi kích hoạt, hãy đăng nhập; bạn sẽ được nhắc <strong>xác nhận hoặc từ chối</strong> tham gia nhóm.</p>
      <p style="color:#666;font-size:12px;">Liên kết có thời hạn.</p>
    `;
  return { subject, text, html };
};
