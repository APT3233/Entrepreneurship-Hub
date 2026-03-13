import { cloneElement, isValidElement } from "react";
import { LogOut } from "lucide-react";

/**
 * ConfirmModal — Modal xác nhận dùng chung
 *
 * Props:
 * - isOpen   : boolean
 * - title    : string         — Tiêu đề (vd: "Đăng xuất tài khoản")
 * - subtitle : string         — Mô tả chi tiết
 * - icon     : ReactNode      — Icon hiển thị (mặc định: LogOut)
 * - color    : string         — Màu chủ đạo (Tailwind color name: "orange", "red", "blue", "green", "indigo")
 * - yesIcon  : ReactNode      — Icon nút xác nhận (tự gán size={16} strokeWidth={2} nếu là element)
 * - yesLabel : string         — Nhãn nút xác nhận (mặc định: "Xác nhận")
 * - noLabel  : string         — Nhãn nút huỷ (mặc định: "Huỷ")
 * - onYes    : () => void     — Callback nút xác nhận
 * - onNo     : () => void     — Callback nút huỷ
 * - onClose  : () => void     — Callback đóng (click backdrop / nút huỷ)
 */

const COLOR_MAP = {
  orange: {
    iconBg:  "bg-orange-100",
    iconText:"text-orange-500",
    btn:     "bg-orange-500 hover:bg-orange-600 shadow-orange-200",
  },
  red: {
    iconBg:  "bg-red-100",
    iconText:"text-red-500",
    btn:     "bg-red-500 hover:bg-red-600 shadow-red-200",
  },
  blue: {
    iconBg:  "bg-blue-100",
    iconText:"text-blue-500",
    btn:     "bg-blue-500 hover:bg-blue-600 shadow-blue-200",
  },
  green: {
    iconBg:  "bg-green-100",
    iconText:"text-green-500",
    btn:     "bg-green-500 hover:bg-green-600 shadow-green-200",
  },
  indigo: {
    iconBg:  "bg-indigo-100",
    iconText:"text-indigo-500",
    btn:     "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
  },
};

export default function ConfirmModal({
  isOpen   = false,
  title    = "Bạn có chắc chắn?",
  subtitle = "Hành động này không thể hoàn tác.",
  icon,
  color    = "blue",
  yesIcon,
  yesLabel = "Xác nhận",
  noLabel  = "Huỷ",
  onYes,
  onNo,
  onClose,
}) {
  if (!isOpen) return null;

  const c = COLOR_MAP[color] ?? COLOR_MAP.orange;
  const handleClose = () => { onNo?.(); onClose?.(); };

  const buttonIcon = isValidElement(yesIcon)
    ? cloneElement(yesIcon, { size: 16, strokeWidth: 2 })
    : <LogOut size={16} strokeWidth={2} />;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-7 py-8 flex flex-col items-center text-center gap-5">

        {/* Icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${c.iconBg}`}>
          <span className={c.iconText}>
            {icon ?? <LogOut size={30} strokeWidth={1.8} />}
          </span>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{subtitle}</p>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-2.5 mt-1">
          <button
            onClick={onYes}
            className={`
              w-full py-3.5 rounded-2xl text-white text-sm font-semibold
              flex items-center justify-center gap-2 cursor-pointer
              shadow-md transition-all duration-150 active:scale-[0.98]
              ${c.btn}
            `}
          >
            {yesLabel}
            {buttonIcon}
          </button>

          <button
            onClick={handleClose}
            className="w-full py-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-semibold transition-colors duration-150 cursor-pointer"
          >
            {noLabel}
          </button>
        </div>

      </div>
    </div>
  );
}