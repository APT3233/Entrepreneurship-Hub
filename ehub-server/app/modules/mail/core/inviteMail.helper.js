import { appConfig } from "app/config/app.js";

/** Build public activation URL for invite emails. */
export const buildInviteActivationUrl = (token) => {
  const base = (appConfig.google.frontendUrl || "").replace(/\/$/, "");
  return `${base}/activate?token=${encodeURIComponent(token)}`;
};

/** Subject + text + html for class invite SMTP payload. */
export const buildClassInviteMailParts = ({ classCode, activationUrl }) => {
  const subject = `[E-HUB] Mời tham gia lớp ${classCode}`;
  const text = [
    `Bạn đã được thêm vào lớp ${classCode} trên E-HUB.`,
    "",
    "Nhấp vào liên kết sau để kích hoạt tài khoản và đặt mật khẩu:",
    activationUrl,
    "",
    "Liên kết có thời hạn. Nếu bạn không đăng ký lớp này, vui lòng bỏ qua email.",
  ].join("\n");
  const html = `
      <p>Bạn đã được thêm vào lớp <strong>${classCode}</strong> trên E-HUB.</p>
      <p><a href="${activationUrl}">Kích hoạt tài khoản</a></p>
      <p style="color:#666;font-size:12px;">Liên kết có thời hạn. Nếu bạn không đăng ký lớp này, vui lòng bỏ qua email.</p>
    `;
  return { subject, text, html };
};
