import { useMemo, useState } from "react";
import { X } from "lucide-react";

const ISSUE_OPTIONS = [
  { value: "group_name", label: "Tên nhóm" },
  { value: "member", label: "Thành viên" },
  { value: "category", label: "Categories" },
  { value: "other", label: "Khác" },
  { value: "topic", label: "Topic" },
];

export default function GroupInviteReportModal({ isOpen, submitting = false, onClose, onSubmit }) {
  const [issueType, setIssueType] = useState("group_name");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const groupedOptions = useMemo(() => [ISSUE_OPTIONS.slice(0, 3), ISSUE_OPTIONS.slice(3)], []);
  const resetForm = () => {
    setIssueType("group_name");
    setDescription("");
    setError("");
  };
  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose?.();
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Vui lòng nhập nội dung báo lỗi.");
      return;
    }
    setError("");
    await onSubmit?.({ issue_type: issueType, description: description.trim() });
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Báo sai thông tin nhóm</h2>
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
              Vui lòng cho biết thông tin nào đang bị sai để giảng viên kiểm tra và điều chỉnh.
            </p>
          </div>
          <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-800">
            Thông tin cần báo lỗi: <span className="text-red-500">*</span>
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {groupedOptions.map((col, idx) => (
              <div key={idx} className="space-y-2">
                {col.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <input type="radio" name="issueType" value={opt.value} checked={issueType === opt.value} onChange={(e) => setIssueType(e.target.value)} className="h-4 w-4 accent-slate-700" />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label className="text-sm font-semibold text-slate-800">Nội dung:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết lỗi..."
            rows={5}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 resize-none"
          />
          {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={handleClose} disabled={submitting} className="rounded-xl bg-slate-100 px-4 py-2.5 text-slate-700 text-sm font-semibold hover:bg-slate-200 disabled:opacity-60">
            Hủy
          </button>
          <button type="submit" disabled={submitting} className="rounded-xl bg-violet-600 px-4 py-2.5 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-60">
            {submitting ? "Đang gửi..." : "Gửi báo lỗi"}
          </button>
        </div>
      </form>
    </div>
  );
}
