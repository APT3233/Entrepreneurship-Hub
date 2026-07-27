import { appConfig } from "app/config/app.js";

const frontend = () => (appConfig.google.frontendUrl || "").replace(/\/$/, "");

const wrap = (lines, ctaLabel, ctaUrl) => {
  const text = [...lines, "", ctaLabel ? `${ctaLabel}: ${ctaUrl}` : ""].filter(Boolean).join("\n");
  const html = `
      ${lines.map((line) => `<p>${line}</p>`).join("")}
      ${ctaUrl ? `<p><a href="${ctaUrl}">${ctaLabel}</a></p>` : ""}
    `;
  return { text, html };
};

/** Mentor được phân công cho một nhóm và cần phản hồi nhận/từ chối. */
export const buildMentorAssignmentMailParts = ({ mentorName, groupName, className, topic, assignmentId }) => ({
  subject: `[E-HUB] Bạn được mời hướng dẫn nhóm ${groupName}`,
  ...wrap([
    `Chào ${mentorName},`,
    `Bạn vừa được phân công hướng dẫn nhóm <strong>${groupName}</strong> (lớp ${className}).`,
    topic ? `Đề tài: ${topic}` : "",
    "Vui lòng vào cổng mentor để xem chi tiết và xác nhận nhận nhóm.",
  ].filter(Boolean), "Xem phân công", `${frontend()}/mentor/assignments/${assignmentId}`),
});

/** Giảng viên/người phân công biết mentor đã nhận hay từ chối. */
export const buildMentorAssignmentResponseMailParts = ({ mentorName, groupName, accepted, reason, assignmentId }) => ({
  subject: `[E-HUB] Mentor ${accepted ? "đã nhận" : "đã từ chối"} nhóm ${groupName}`,
  ...wrap([
    `Mentor <strong>${mentorName}</strong> ${accepted ? "đã nhận hướng dẫn" : "đã từ chối hướng dẫn"} nhóm <strong>${groupName}</strong>.`,
    !accepted && reason ? `Lý do: ${reason}` : "",
  ].filter(Boolean), "Xem phân công", `${frontend()}/admin/mentor-assignments/${assignmentId}`),
});

/** Nhóm sinh viên và giảng viên biết lịch mentoring mới, đổi giờ hoặc bị hủy. */
export const buildMentoringSessionMailParts = ({ action, groupName, mentorName, title, scheduledAt, location, reason, sessionId }) => {
  const label = { created: "Lịch mentoring mới", rescheduled: "Buổi mentoring đổi giờ", cancelled: "Buổi mentoring bị hủy" }[action];
  return {
    subject: `[E-HUB] ${label}: ${title}`,
    ...wrap([
      `${label} cho nhóm <strong>${groupName}</strong>.`,
      `Buổi: ${title}`,
      `Mentor: ${mentorName}`,
      scheduledAt ? `Thời gian: ${scheduledAt}` : "",
      location ? `Địa điểm / link: ${location}` : "",
      action === "cancelled" && reason ? `Lý do hủy: ${reason}` : "",
    ].filter(Boolean), "Xem buổi mentoring", `${frontend()}/mentoring/sessions/${sessionId}`),
  };
};

/** Mentor biết hồ sơ đã được duyệt hay bị từ chối. */
export const buildMentorProfileStatusMailParts = ({ mentorName, status }) => {
  const approved = status === "active";
  return {
    subject: `[E-HUB] Hồ sơ mentor ${approved ? "đã được duyệt" : "chưa được duyệt"}`,
    ...wrap([
      `Chào ${mentorName},`,
      approved
        ? "Hồ sơ mentor của bạn đã được duyệt. Bạn có thể đăng nhập và bắt đầu nhận nhóm hướng dẫn."
        : "Hồ sơ mentor của bạn hiện chưa được kích hoạt. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.",
    ], approved ? "Vào cổng mentor" : null, `${frontend()}/mentor/dashboard`),
  };
};
