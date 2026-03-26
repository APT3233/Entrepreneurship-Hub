import { useState, useEffect } from "react";
import {
  X, Calendar, Upload, Download,
  CheckCircle2, Clock, AlertCircle, Pencil,
} from "lucide-react";
import FileIcon from "@/components/icons/FileIcon";

/* ─── helpers ─────────────────────────────── */
function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function StatusBadge({ status }) {
  const map = {
    graded:        { label: "Đã chấm",   cls: "text-green-600 bg-green-50 border-green-100",  Icon: CheckCircle2 },
    submitted:     { label: "Chưa chấm", cls: "text-amber-600 bg-amber-50 border-amber-100",  Icon: Clock },
    resubmitted:   { label: "Chưa chấm", cls: "text-amber-600 bg-amber-50 border-amber-100",  Icon: Clock },
    not_submitted: { label: "Chưa nộp",  cls: "text-red-500  bg-red-50   border-red-100",     Icon: AlertCircle },
  };
  const { label, cls, Icon } = map[status] ?? map.not_submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cls}`}>
      <Icon size={13} /> {label}
    </span>
  );
}


function FileRow({ file, onDownload }) {
  const ext = file.file_type || file.type || (file.file_name || file.name || "").split(".").pop();
  const name = file.file_name || file.name || "file";
  const size = fmtSize(file.file_size || file.size);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/60 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-white transition-all group">
      <div className="flex items-center justify-center shrink-0 w-8 h-9">
        <FileIcon ext={ext} className="w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-700 truncate">{name}</p>
        {size && <p className="text-xs text-gray-400">{size}</p>}
      </div>
      <button
        onClick={() => onDownload?.(file)}
        className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100"
        title="Tải xuống"
      >
        <Download size={16} />
      </button>
    </div>
  );
}

/* ─── Main Modal ───────────────────────────── */
/**
 * CheckpointDetailModal
 *
 * Props:
 *   checkpoint : { id, title, deadline, submittedAt, status, files, score, feedback, maxScore }
 *   isOpen     : boolean
 *   onClose    : () => void
 *   onSaveGrade: ({ id, score, feedback }) => Promise<void>  — called when GV saves/edits grade
 */
export default function CheckpointDetailModal({ checkpoint, isOpen, onClose, onSaveGrade, loading = false }) {
  const [editingGrade, setEditingGrade] = useState(false);
  const [score, setScore]       = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving]     = useState(false);
  const [mouseDownTarget, setMouseDownTarget] = useState(null);

  useEffect(() => {
    if (!isOpen || !checkpoint) return;
    setScore(checkpoint.score != null ? String(checkpoint.score) : "");
    setFeedback(checkpoint.feedback ?? "");
    // For submitted/pending, start in edit mode directly
    setEditingGrade(checkpoint.status === "submitted" || checkpoint.status === "resubmitted");
  }, [isOpen, checkpoint]);

  if (!isOpen || !checkpoint) return null;

  const { title, deadline, submittedAt, status, files = [], score: savedScore, feedback: savedFeedback, maxScore = 10 } = checkpoint;
  const isGraded       = status === "graded";
  const isPending      = status === "submitted" || status === "resubmitted";
  const isNotSubmitted = !isGraded && !isPending;

  const handleSave = async () => {
    if (!score) return;
    setSaving(true);
    try {
      await onSaveGrade?.({ id: checkpoint.id, score: Number(score), feedback });
      setEditingGrade(false);
    } finally {
      setSaving(false);
    }
  };

  const fileCount = files.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      onMouseDown={(e) => setMouseDownTarget(e.target)}
      onMouseUp={(e) => { if (mouseDownTarget === e.currentTarget && e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-8 pt-7 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {!isNotSubmitted && (
              <p className="text-xs text-gray-400 mt-0.5">
                {fileCount} file{fileCount !== 1 ? "s" : ""} submitted
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* "Chỉnh sửa điểm" button — visible only when already graded */}
            {isGraded && !editingGrade && (
              <button
                onClick={() => setEditingGrade(true)}
                className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 text-xs font-semibold transition-colors"
              >
                <Pencil size={13} /> Chỉnh sửa điểm.
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Sub-header: Deadline / Submitted / Status ── */}
        <div className="px-8 pb-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar size={13} className="text-gray-300" />
            <span>Deadline: <strong className="text-gray-700">{deadline}</strong></span>
          </div>
          {submittedAt && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Upload size={13} className="text-gray-300" />
              <span>Submitted: <strong className="text-gray-700">{submittedAt}</strong></span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Trạng thái:</span>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-5">

          {/* ── CASE: not_submitted ── */}
          {isNotSubmitted && (
            <div className="border border-dashed border-gray-200 rounded-2xl py-14 text-center bg-gray-50/40">
              <AlertCircle size={28} className="text-red-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">Nhóm chưa nộp bài cho checkpoint này.</p>
              <p className="text-xs text-gray-300 mt-1">Deadline: {deadline}</p>
            </div>
          )}

          {/* ── CASE: submitted or graded — show file list ── */}
          {!isNotSubmitted && (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-widest">Danh sách file:</p>
                {files.length > 0 ? (
                  <div className="space-y-2.5">
                    {files.map((f, i) => (
                      <FileRow
                        key={f.id ?? i}
                        file={f}
                        onDownload={(file) => {
                          const url = file.file_url || file.url;
                          if (url) window.open(url, "_blank");
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Không có file đính kèm.</p>
                )}
              </div>

              {/* ── CASE: graded + not editing → read-only result ── */}
              {isGraded && !editingGrade && (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-700">Kết quả đánh giá:</p>
                  <p className="text-sm text-gray-600">
                    Điểm: <strong>{savedScore}/{maxScore}</strong>
                  </p>
                  {savedFeedback && (
                    <p className="text-sm text-gray-600">
                      Nhận xét: {savedFeedback}
                    </p>
                  )}
                </div>
              )}

              {/* ── CASE: pending (submitted) OR editing grade form ── */}
              {(isPending || editingGrade) && (
                <div className="space-y-4">
                  {/* Score input */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Chấm điểm:
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={maxScore}
                      step={0.5}
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="Nhập điểm"
                      className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none border border-transparent focus:border-indigo-300 transition-colors"
                    />
                  </div>
                  {/* Feedback textarea */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Nhận xét:
                    </label>
                    <textarea
                      rows={5}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Nhận xét..."
                      className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none border border-transparent focus:border-indigo-300 transition-colors resize-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          {/* Show Lưu only when grading form is visible */}
          {(isPending || editingGrade) && !isNotSubmitted && (
            <button
              onClick={handleSave}
              disabled={!score || saving || loading}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all
                ${score && !saving && !loading
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 active:scale-[0.98]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
