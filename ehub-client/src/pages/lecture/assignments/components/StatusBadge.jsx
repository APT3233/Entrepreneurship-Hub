export default function StatusBadge({ status }) {
  const isOpen = status === "open";
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
        ${isOpen
          ? "bg-white text-gray-600 border-gray-200"
          : "bg-white text-gray-500 border-gray-200"}
      `}
    >
      {isOpen ? "Đang mở" : "Đã đóng"}
    </span>
  );
}
