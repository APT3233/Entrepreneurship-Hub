import { useEffect, useState } from "react";
import {
  X,
  Calendar,
  Check,
  Download,
  FileText,
  Users,
  Award,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import AssignmentApi from "@/api/assignment";
import { rubricService } from "@/api/adminEvaluationOps";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/utils/dateTimeDisplay";

/** Cột chấm điểm: điểm + nhận xét diện tích lớn */
function GradingColumn({ assignmentId, maxScore, group, onSaved, rubric }) {
  const toast = useToast();
  const [score, setScore] = useState(
    () => (group.score != null && group.score !== "" ? String(group.score) : "")
  );
  const [feedback, setFeedback] = useState(() => group.feedback || "");
  const [saving, setSaving] = useState(false);
  const [showRubricInfo, setShowRubricInfo] = useState(false);

  useEffect(() => {
    setScore(group.score != null && group.score !== "" ? String(group.score) : "");
    setFeedback(group.feedback || "");
  }, [group.submissionId, group.score, group.feedback, group.status]);

  const save = async () => {
    const n = parseFloat(String(score).replace(",", "."));
    if (Number.isNaN(n) || n < 0 || n > maxScore) {
      toast.error(`Điểm hợp lệ: 0 – ${maxScore}`);
      return;
    }
    setSaving(true);
    try {
      await AssignmentApi.gradeGroupSubmission(assignmentId, group.groupId, {
        score: n,
        feedback: feedback.trim() ? feedback.trim() : null,
      });
      toast.success("Đã lưu. Sinh viên sẽ thấy điểm và nhận xét ở bài tập.");
      await onSaved?.();
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

      {group.score != null && group.status === "graded" && (
        <p className="text-sm text-emerald-800 font-semibold mb-3 pb-3 border-b border-indigo-100/80">
          Đã lưu: <span className="text-lg tabular-nums">{Number(group.score)}</span>
          <span className="text-gray-500 font-normal"> / {maxScore}</span>
          {group.graderName && group.gradedAt && (
            <span className="block text-xs text-gray-500 font-normal mt-1">
              {group.graderName} · {formatDate(group.gradedAt)}
            </span>
          )}
        </p>
      )}

      {rubric && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowRubricInfo(!showRubricInfo)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 px-3 py-2 rounded-xl transition-all"
          >
            <Layers size={13} />
            {showRubricInfo ? "Ẩn tiêu chí chấm điểm" : "Xem tiêu chí chấm điểm (Rubric)"}
          </button>
          
          {showRubricInfo && (
            <div className="mt-2.5 p-3 rounded-xl border border-indigo-100 bg-white/90 space-y-2 max-h-[220px] overflow-y-auto pr-1 animate-in slide-in-from-top-1 duration-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Tiêu chí chi tiết</p>
              {rubric.criteria?.map((c) => (
                <div key={c.id} className="text-xs pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex justify-between font-semibold text-gray-800">
                    <span>{c.name}</span>
                    <span className="font-mono text-indigo-600">{c.max_score}đ {Number(c.weight) !== 1 && `(x${c.weight})`}</span>
                  </div>
                  {c.description && <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{c.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
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
            Nội dung này hiển thị với cả nhóm (thẻ bài tập + chi tiết khi sinh viên mở).
          </span>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Góp ý chi tiết, điểm mạnh / cần cải thiện, hướng bổ sung…"
            className="w-full flex-1 min-h-[200px] sm:min-h-[280px] lg:min-h-[320px] max-h-[50vh] border border-gray-200 rounded-2xl px-4 py-3 text-sm leading-relaxed text-gray-800 bg-white shadow-inner resize-y focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
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

/** Cột bên trái: thông tin nộp bài */
function SubmissionInfoColumn({ group, maxScore }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/90 p-4 sm:p-5 min-h-0 flex flex-col">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
        <FileText size={16} className="text-indigo-500" />
        Bài nộp
      </h4>

      {Array.isArray(group.members) && group.members.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1.5">Thành viên</p>
          <ul className="space-y-1.5 text-sm text-gray-800">
            {group.members.map((m) => (
              <li key={m.studentId ?? `${m.studentCode}-${m.fullName}`} className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-mono text-xs text-indigo-600">{m.studentCode}</span>
                <span>{m.fullName}</span>
                {m.role === "leader" && (
                  <span className="text-amber-600 text-xs font-medium">· Nhóm trưởng</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {group.submittedByName && (
        <p className="text-sm text-gray-700 mb-1">
          <span className="text-gray-500">Tài khoản nộp: </span>
          <span className="font-medium">{group.submittedByName}</span>
        </p>
      )}
      {group.submittedAt && (
        <p className="text-xs text-gray-500 mb-4">
          Nộp lúc: {formatDate(group.submittedAt)}
          {group.isLate ? " · Trễ hạn" : ""}
        </p>
      )}

      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2">Tệp tin đã nộp</p>
      {group.files?.length > 0 ? (
        <ul className="space-y-2 flex-1 overflow-y-auto max-h-[40vh] pr-1">
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

      <p className="text-[10px] text-gray-400 mt-3">Điểm tối đa bài: {maxScore}</p>
    </div>
  );
}

// ── AssignmentDetailForm ─────────────────────────────────────────────────────
/**
 * Props:
 *  - assignment: Assignment | null
 *  - onClose, onConfirm, onAfterGrade
 */
export default function AssignmentDetailForm({ assignment, onClose, onConfirm, onAfterGrade }) {
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [rubric, setRubric] = useState(null);
  const [loadingRubric, setLoadingRubric] = useState(false);

  useEffect(() => {
    if (!assignment || !assignment.rubricId) {
      setRubric(null);
      return;
    }
    const fetchRubric = async () => {
      setLoadingRubric(true);
      try {
        const res = await rubricService.get(assignment.rubricId);
        setRubric(res?.data || null);
      } catch (err) {
        console.error("Failed to fetch rubric:", err);
      } finally {
        setLoadingRubric(false);
      }
    };
    fetchRubric();
  }, [assignment?.rubricId]);

  useEffect(() => {
    if (!assignment) return;
    const onKey = (e) => {
      if (e.key === "Escape" && selectedGroupId != null) {
        e.stopPropagation();
        setSelectedGroupId(null);
        return;
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assignment, onClose, selectedGroupId]);

  if (!assignment) return null;

  const {
    id: aId,
    title,
    description,
    deadline,
    classCode,
    maxScore,
    totalGroups,
    submittedGroups,
    status,
    groupSubmissions = [],
  } = assignment;

  const notSubmitted = totalGroups - submittedGroups;
  const max = Number(maxScore) || 10;
  const selectedGroup = selectedGroupId != null
    ? groupSubmissions.find((g) => Number(g.groupId) === Number(selectedGroupId))
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        if (selectedGroupId != null) setSelectedGroupId(null);
        else onClose();
      }}
    >
      <div
        className={`
          relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200
          max-h-[94vh] flex flex-col
          ${selectedGroupId != null ? "max-w-6xl" : "max-w-2xl"}
        `}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 z-20"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        {selectedGroupId != null && selectedGroup && (
          /* —— Màn chấm: 2 cột —— */
          <>
            <div className="px-4 sm:px-6 pt-5 pb-2 border-b border-gray-100 flex items-center gap-2 pr-14 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedGroupId(null)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 py-1.5 rounded-lg hover:bg-indigo-50 -ml-1 px-2"
              >
                <ChevronLeft size={20} />
                Danh sách nhóm
              </button>
            </div>
            <div className="px-4 sm:px-6 py-1 pb-2 shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 pr-8 line-clamp-2">{title}</h2>
              <p className="text-sm font-semibold text-indigo-700 mt-1 flex items-center gap-2 flex-wrap">
                <Users size={16} className="shrink-0" />
                {selectedGroup.groupName}
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:items-stretch max-w-[1100px] mx-auto">
                <SubmissionInfoColumn group={selectedGroup} maxScore={max} />
                <div className="min-h-0">
                  <GradingColumn
                    assignmentId={aId}
                    maxScore={max}
                    group={selectedGroup}
                    onSaved={() => onAfterGrade?.(aId)}
                    rubric={rubric}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedGroupId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Quay lại
              </button>
            </div>
          </>
        )}

        {selectedGroupId != null && !selectedGroup && (
          <div className="p-8 text-center text-sm text-gray-500">
            Không tìm thấy dữ liệu nhóm.
            <button type="button" className="ml-2 text-indigo-600 font-semibold" onClick={() => setSelectedGroupId(null)}>Quay lại</button>
          </div>
        )}

        {!(selectedGroupId != null) && (
          /* —— Danh sách nhóm (thẻ bấm) —— */
          <>
            <div className="px-6 sm:px-8 pt-7 pb-2 overflow-y-auto flex-1 min-h-0 text-left">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 pr-8">{title}</h2>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed line-clamp-3">{description}</p>

              <div className="mt-4 space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-gray-400" />
                  Hạn: {deadline}
                </div>
                <div>
                  Lớp <span className="font-medium">{classCode}</span>
                  <span className="mx-1.5 text-gray-300">·</span>
                  Điểm tối đa <span className="font-medium">{maxScore}</span>
                </div>
              </div>

              {/* Rubric display */}
              {loadingRubric ? (
                <div className="mt-5 p-4 rounded-2xl border border-indigo-50 bg-indigo-50/10 animate-pulse flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-xs text-gray-400">Đang tải rubric...</span>
                </div>
              ) : rubric ? (
                <div className="mt-5 p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/20 to-violet-50/20 shadow-sm text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="text-indigo-500 shrink-0" size={16} />
                      <span className="text-xs font-bold text-indigo-800 uppercase tracking-widest">Rubric đánh giá</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/50">
                      v{rubric.version || 1}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-gray-900">{rubric.name}</h4>
                  {rubric.description && (
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">{rubric.description}</p>
                  )}
                  
                  {/* Criteria List */}
                  {Array.isArray(rubric.criteria) && rubric.criteria.length > 0 && (
                    <div className="mt-4 space-y-2.5">
                      {rubric.criteria.map((c) => (
                        <div key={c.id} className="flex items-start justify-between gap-3 text-xs bg-white/80 border border-gray-100 p-3 rounded-xl hover:shadow-sm transition-all">
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 flex items-center gap-1.5">
                              {c.name}
                              {c.is_required_feedback ? (
                                <span className="text-[9px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-100/60">Bắt buộc feedback</span>
                              ) : null}
                            </p>
                            {c.description && <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{c.description}</p>}
                          </div>
                          <div className="shrink-0 text-right font-mono font-bold text-indigo-600 whitespace-nowrap bg-indigo-50/50 px-2.5 py-1 rounded-lg border border-indigo-50">
                            {c.max_score}đ {Number(c.weight) !== 1 && `(x${c.weight})`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="my-5 border-t border-gray-100" />

              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-800">Tổng quan: {totalGroups} nhóm</p>
                <p className="text-emerald-600">Đã nộp: {submittedGroups}</p>
                <p className="text-rose-600">Chưa nộp: {notSubmitted}</p>
              </div>

              {Array.isArray(groupSubmissions) && groupSubmissions.length > 0 ? (
                <div className="mt-6">
                  <p className="text-sm font-bold text-gray-800 mb-3">Chọn nhóm để xem bài nộp & chấm điểm</p>
                  <ul className="space-y-3 max-h-[min(50vh,420px)] overflow-y-auto pr-1">
                    {groupSubmissions.map((g) => {
                      const nMembers = g.members?.length ?? 0;
                      const nFiles = g.files?.length ?? 0;
                      const isGradedRow = g.status === "graded" && g.score != null;
                      return (
                        <li key={g.groupId}>
                          <button
                            type="button"
                            onClick={() => setSelectedGroupId(g.groupId)}
                            className="w-full text-left rounded-2xl border-2 border-gray-100 bg-gradient-to-b from-white to-gray-50/80 p-4 sm:p-5 transition-all duration-200 hover:border-indigo-200 hover:shadow-md hover:ring-1 hover:ring-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-base font-bold text-gray-900 truncate">
                                  {g.groupName}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {nMembers} thành viên · {nFiles} tệp
                                  {g.submittedAt && (
                                    <span>
                                      {" "}
                                      · Nộp {formatDate(g.submittedAt)}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                {isGradedRow ? (
                                  <span className="inline-flex items-center rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 border border-emerald-100">
                                    Đã chấm: {Number(g.score)}/{max}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-lg bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-1 border border-amber-100">
                                    Chờ chấm
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-indigo-600 font-semibold mt-3 flex items-center justify-end gap-0.5">
                              Xem bài & chấm điểm
                              <ChevronRight size={14} className="shrink-0" />
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className="mt-6 text-sm text-gray-500">Chưa có nhóm nào nộp bài.</p>
              )}

              <div className="mt-6 flex items-center gap-2 text-sm text-gray-700">
                <span className="font-medium">Trạng thái bài tập:</span>
                <StatusBadge status={status} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => onConfirm(assignment)}
                className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold shadow-sm"
              >
                Đóng bài
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
              >
                Hủy
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isOpen = status === "open";
  const isArchived = status === "archived";
  let label = "Đã đóng";
  let cls = "bg-slate-100 text-slate-700 border border-slate-200";
  if (isOpen) {
    label = "Đang mở";
    cls = "bg-emerald-50 text-emerald-700 border border-emerald-200";
  } else if (isArchived) {
    label = "Lưu trữ";
    cls = "bg-violet-50 text-violet-700 border border-violet-200";
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
