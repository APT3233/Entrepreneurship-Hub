/**
 * Icons dùng cho UI chung: thông báo lỗi, trạng thái, feedback
 */

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-green-100 text-green-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
];

export const AlertCircleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-3.5 h-3.5 flex-shrink-0"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export function LastNameAvatar({ name, avatar, index = 0 }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-100 shadow-sm"
      />
    );
  }

  const initial = name?.trim()?.split(" ").pop()?.charAt(0)?.toUpperCase() ?? "?";
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border border-white/50 shadow-sm ${color}`}>
      {initial}
    </div>
  );
}