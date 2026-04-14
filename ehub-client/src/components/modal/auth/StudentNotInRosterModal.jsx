import { AlertTriangle } from "lucide-react";

/**
 * MSSV đúng format nhưng chưa có trong hệ thống (chưa được GV import).
 */
export default function StudentNotInRosterModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-not-in-roster-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-6 py-7 sm:px-8 sm:py-8">
        <div className="flex gap-4 items-start">
          <div
            className="shrink-0 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center"
            aria-hidden
          >
            <AlertTriangle className="w-6 h-6 text-red-600" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h2
              id="student-not-in-roster-title"
              className="text-base sm:text-lg font-bold text-red-600"
            >
              Không thể đăng nhập
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600 leading-relaxed">
              <p>MSSV của bạn chưa được giảng viên thêm vào hệ thống.</p>
              <p>Vui lòng liên hệ giảng viên để được cấp quyền.</p>
            </div>
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
