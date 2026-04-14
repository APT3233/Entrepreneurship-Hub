import { ShieldOff } from "lucide-react";

/**
 * Google OAuth: tài khoản không được phép (AUTH_004).
 */
export default function GoogleAccessDeniedModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-access-denied-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-6 py-7 sm:px-8 sm:py-8">
        <div className="flex gap-4 items-start">
          <div
            className="shrink-0 w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center"
            aria-hidden
          >
            <ShieldOff className="w-6 h-6 text-amber-600" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h2
              id="google-access-denied-title"
              className="text-base sm:text-lg font-bold text-slate-800"
            >
              Không thể đăng nhập
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Tài khoản của bạn không có trong danh sách được phép truy cập. Vui lòng liên hệ quản trị viên.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
