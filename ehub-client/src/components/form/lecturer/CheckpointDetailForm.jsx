import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Download,
  FileText,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Target,
  Info,
} from "lucide-react";
import CheckpointApi from "@/api/checkpoint";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/utils/dateTimeDisplay";

function StatusBadge({ status }) {
  const map = {
    graded: { label: "Đã chấm", cls: "text-green-600 bg-green-50 border-green-100", Icon: CheckCircle2 },
    submitted: { label: "Chưa chấm", cls: "text-amber-600 bg-amber-50 border-amber-100", Icon: Clock },
    resubmitted: { label: "Chưa chấm", cls: "text-amber-600 bg-amber-50 border-amber-100", Icon: Clock },
    not_submitted: { label: "Chưa nộp", cls: "text-red-500 bg-red-50 border-red-100", Icon: AlertCircle },
  };
  const { label, cls, Icon } = map[status] ?? map.not_submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cls}`}>
      <Icon size={13} /> {label}
    </span>
  );
}

function SubmissionInfoColumn({ group, maxScore }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/90 p-4 sm:p-5 min-h-0 flex flex-col h-full">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
        <FileText size={16} className="text-indigo-500" />
        Bài nộp
      </h4>

      {Array.isArray(group?.members) && group.members.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1.5">Thành viên</p>
          <ul className="space-y-1.5 text-sm text-gray-800">
            {group.members.map((m) => (
              <li
                key={m.studentId ?? `${m.studentCode}-${m.fullName}`}
                className="flex flex-wrap items-baseline gap-x-1.5"
              >
                <span className="font-mono text-xs text-indigo-600">{m.studentCode}</span>
                <span>{m.fullName}</span>
                {m.role === "leader" && <span className="text-amber-600 text-xs font-medium">· Nhóm trưởng</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {group?.submittedByName && (
        <p className="text-sm text-gray-700 mb-1">
          <span className="text-gray-500">Tài khoản nộp: </span>
          <span className="font-medium">{group.submittedByName}</span>
        </p>
      )}
      {group?.submittedAt && (
        <p className="text-xs text-gray-500 mb-2">
          Nộp lúc: {formatDate(group.submittedAt)}
          {group.isLate ? " · Trễ hạn" : ""}
        </p>
      )}

      {group?.note && String(group.note).trim() && (
        <div className="mb-4 p-3 rounded-xl bg-white border border-indigo-100/80 text-sm text-gray-700">
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Ghi chú nhóm</p>
          <p className="whitespace-pre-wrap">{group.note}</p>
        </div>
      )}

      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2">Tệp tin đã nộp</p>
      {group?.files?.length > 0 ? (
        <ul className="space-y-2 flex-1 overflow-y-auto max-h-[min(42vh,360px)] pr-1">
          {group.files.map((f) => (
            <li
              key={f.id ?? f.fileUrl}
              className="flex items-center justify-between gap-2 rounded-xl bg-white border border-gray-200/80 px-3 py-2.5 shadow-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-indigo-500 shrink-0" />
                <span className="text-sm text-gray-800 truncate" title={f.fileName}>
                  {f.fileName}
                </span>
                {f.fileSize != null && (
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {f.fileSize >= 1024 * 1024
                      ? `${(f.fileSize / 1024 / 1024).toFixed(1)} MB`
                      : `${Math.round(f.fileSize / 1024)} KB`}
                  </span>
                )}
              </div>
              {f.fileUrl && (
                <a
                  href={f.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  aria-label="Tải file"
                >
                  <Download size={16} />
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">Chưa có tệp đính kèm.</p>
      )}

      <p className="text-[10px] text-gray-400 mt-3">Điểm tối đa: {maxScore}</p>
    </div>
  );
}

function GradingColumn({ checkpointId, maxScore, detail, onSaved }) {
  const toast = useToast();
  const [score, setScore] = useState(
    () => (detail?.score != null && detail?.score !== "" ? String(detail.score) : "")
  );
  const [feedback, setFeedback] = useState(() => detail?.feedback || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setScore(detail?.score != null && detail?.score !== "" ? String(detail.score) : "");
    setFeedback(detail?.feedback || "");
  }, [detail?.submissionId, detail?.score, detail?.feedback, detail?.status]);

  const group = { groupId: detail?.groupId };

  const save = async () => {
    if (!group.groupId) return;
    const n = parseFloat(String(score).replace(",", "."));
    if (Number.isNaN(n) || n < 0 || n > maxScore) {
      toast.error(`Điểm hợp lệ: 0 – ${maxScore}`);
      return;
    }
    setSaving(true);
    try {
      const res = await CheckpointApi.updateGrade(checkpointId, group.groupId, {
        score: n,
        feedback: feedback.trim() ? feedback.trim() : null,
      });
      toast.success("Đã lưu. Sinh viên sẽ thấy điểm và nhận xét ở checkpoint.");
      const updated = res?.data;
      if (updated) await onSaved?.(updated);
    } catch (e) {
      toast.error(e?.message || "Không lưu được điểm");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl border border-indigo-100/80 bg-indigo-50/30 p-4 sm:p-5 shadow-sm">
      <p className="text-xs font-bold text-indigo-800 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Award className="text-indigo-500 shrink-0" size={18} />
        Chấm điểm & nhận xét
      </p>

      {detail?.score != null && detail?.status === "graded" && (
        <p className="text-sm text-emerald-800 font-semibold mb-3 pb-3 border-b border-indigo-100/80">
          Đã lưu: <span className="text-lg tabular-nums">{Number(detail.score)}</span>
          <span className="text-gray-500 font-normal"> / {maxScore}</span>
          {detail.graderName && detail.gradedAt && (
            <span className="block text-xs text-gray-500 font-normal mt-1">
              {detail.graderName} · {formatDate(detail.gradedAt)}
            </span>
          )}
        </p>
      )}

      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <label className="block shrink-0">
          <span className="text-xs font-semibold text-gray-600 mr-2">Điểm (0 – {maxScore})</span>
          <input
            type="number"
            step="0.25"
            min={0}
            max={maxScore}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="mt-1.5 w-full max-w-[9rem] border border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold text-gray-900 tabular-nums shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none"
          />
        </label>

        <label className="flex flex-col flex-1 min-h-0">
          <span className="text-xs font-semibold text-gray-600 mb-1.5">Nhận xét của giảng viên</span>
          <span className="text-[11px] text-gray-400 mb-2">
            Nội dung này sinh viên xem ở trang checkpoint / nhóm.
          </span>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Góp ý chi tiết, điểm mạnh / cần cải thiện, hướng bổ sung…"
            className="w-full flex-1 min-h-[200px] sm:min-h-[240px] lg:min-h-[280px] max-h-[50vh] border border-gray-200 rounded-2xl px-4 py-3 text-sm leading-relaxed text-gray-800 bg-white shadow-inner resize-y focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
          />
        </label>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full sm:w-auto shrink-0 self-end px-8 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Đang lưu…" : "Lưu điểm & nhận xét"}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Form ───────────────────────────── */
/**
 * Xem bài nộp checkpoint: danh sách nhóm (trái) + chi tiết 2 cột (giống bài tập)
 */
export default function CheckpointDetailForm({ checkpoint, isOpen, onClose, onSaveGrade, groupId = null }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(groupId);
  const [detail, setDetail] = useState(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);
  const [notSubmitted, setNotSubmitted] = useState(false);
  const [mouseDownTarget, setMouseDownTarget] = useState(null);
  const toast = useToast();

  const maxScore = Number(checkpoint?.max_score) || 10;

  // Fetch group submissions list
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (isOpen && checkpoint && !groupId) {
        setIsLoadingGroups(true);
        try {
          const res = await CheckpointApi.getSubmissions(checkpoint.id);
          const list = res?.data;
          const raw = Array.isArray(list) ? list : [];
          const mappedGroups = raw.map((g) => ({
            id: g.groupId,
            name: g.groupName,
            code: g.groupCode,
            status: g.status,
            score: g.score != null ? Number(g.score) : null,
            memberCount: g.memberCount ?? 0,
            fileCount: g.fileCount ?? 0,
            submittedAt: g.submittedAt,
          }));
          setGroups(mappedGroups);
          if (mappedGroups.length > 0) {
            setSelectedGroupId((prev) => (prev && mappedGroups.some((x) => x.id === prev) ? prev : mappedGroups[0].id));
          } else {
            setSelectedGroupId(null);
          }
        } catch {
          toast.error("Không thể tải danh sách bài nộp");
        } finally {
          setIsLoadingGroups(false);
        }
      }
    };
    fetchSubmissions();
  }, [isOpen, checkpoint?.id, groupId]);

  // Sync selectedGroupId with prop groupId
  useEffect(() => {
    if (groupId) setSelectedGroupId(groupId);
  }, [groupId]);

  // Load submission detail when group selection changes
  useEffect(() => {
    const fetchDetail = async () => {
      if (!selectedGroupId || !checkpoint) return;
      setIsLoadingSubmission(true);
      setNotSubmitted(false);
      setDetail(null);
      try {
        const res = await CheckpointApi.getSubmissionDetail(checkpoint.id, selectedGroupId);
        const data = res?.data;
        if (data) {
          setDetail(data);
        } else {
          setNotSubmitted(true);
        }
      } catch {
        setNotSubmitted(true);
      } finally {
        setIsLoadingSubmission(false);
      }
    };
    fetchDetail();
  }, [selectedGroupId, checkpoint?.id]);

  if (!isOpen || !checkpoint) return null;

  const onGraded = async (updated) => {
    onSaveGrade?.({ groupId: selectedGroupId });
    if (updated) {
      setDetail(updated);
      setNotSubmitted(false);
    }
    if (selectedGroupId && updated) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroupId
            ? {
                ...g,
                status: updated.status,
                score: updated.score != null ? Number(updated.score) : null,
              }
            : g
        )
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      onMouseDown={(e) => setMouseDownTarget(e.target)}
      onMouseUp={(e) => {
        if (mouseDownTarget === e.currentTarget && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`bg-white rounded-[32px] shadow-2xl w-full h-[90vh] flex overflow-hidden animate-in zoom-in-95 duration-200 ${
          groupId ? "max-w-5xl" : "max-w-7xl"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {!groupId && (
          <div className="w-[17rem] sm:w-80 border-r border-gray-100 flex flex-col bg-gray-50/30 shrink-0 min-w-0">
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-white">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-widest">Danh sách nhóm</h3>
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">
                Tổng số: {groups.length} nhóm
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1">
              {isLoadingGroups ? (
                <div className="py-10 text-center">
                  <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Đang tải...</p>
                </div>
              ) : (
                groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl transition-all border ${
                      selectedGroupId === group.id
                        ? "bg-white border-indigo-100 shadow-sm ring-1 ring-indigo-50"
                        : "border-transparent hover:bg-white hover:border-gray-100"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1.5 mb-1">
                      <span className="text-xs font-bold text-gray-800 truncate pr-1 min-w-0">{group.name}</span>
                      <div className="shrink-0">
                        <StatusBadge status={group.status} />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium leading-snug">
                      {group.memberCount} thành viên · {group.fileCount} tệp
                      {group.submittedAt && (
                        <span className="block text-[9px] text-gray-400 mt-0.5 line-clamp-1" title={formatDate(group.submittedAt)}>
                          {formatDate(group.submittedAt)}
                        </span>
                      )}
                    </p>
                    {group.score != null && (
                      <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">
                        Điểm: {group.score}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col bg-white min-w-0">
          <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-50 shrink-0">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 truncate">{checkpoint.title}</h2>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Calendar size={12} />
                Hạn: {formatDate(checkpoint.deadline)} · Tối đa {maxScore} điểm
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 min-h-0">
            <div className="mb-6 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} className="text-indigo-500" />
                <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Yêu cầu checkpoint</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {checkpoint.description || "Không có hướng dẫn chi tiết."}
              </p>
            </div>

            {!selectedGroupId ? (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <Target size={28} className="text-gray-300" />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest">Chọn một nhóm để xem bài nộp</p>
              </div>
            ) : isLoadingSubmission ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest">Đang tải bài nộp...</p>
              </div>
            ) : notSubmitted || !detail ? (
              <div className="py-12 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-rose-50 text-rose-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Nhóm chưa nộp bài</h4>
                <p className="text-sm text-gray-500">Nhóm này chưa tải tài liệu lên cho checkpoint này.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:items-stretch max-w-[1100px] mx-auto">
                <div className="min-h-0">
                  <SubmissionInfoColumn
                    group={{
                      members: detail.members,
                      submittedByName: detail.submittedByName,
                      submittedAt: detail.submittedAt,
                      isLate: detail.isLate,
                      note: detail.note,
                      files: detail.files,
                    }}
                    maxScore={maxScore}
                  />
                </div>
                <div className="min-h-0">
                  <GradingColumn
                    checkpointId={checkpoint.id}
                    maxScore={maxScore}
                    detail={detail}
                    onSaved={onGraded}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
