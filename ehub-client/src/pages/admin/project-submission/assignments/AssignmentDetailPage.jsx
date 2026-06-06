import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, FileDown, SquarePen } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { assignmentService, assignmentSubmissionService } from "@/api/adminProjectSubmission";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import DetailGrid from "@/pages/admin/academic/components/DetailGrid";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import GradeModal from "@/pages/admin/project-submission/components/GradeModal";
import SubmissionDetailModal from "@/pages/admin/project-submission/components/SubmissionDetailModal";
import { formatDate } from "@/pages/admin/project-submission/shared";
import GradingSummaryPanel from "@/pages/admin/components/GradingSummaryPanel";
import { downloadCsv } from "@/utils/exportCsv";
import useDocumentTitle from "@/hooks/useDocumentTitle";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "submissions", label: "Submissions" },
  { key: "grading", label: "Grading Summary" },
];

export default function AdminAssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gradeTarget, setGradeTarget] = useState(null);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [assignmentRes, submissionsRes] = await Promise.all([
        assignmentService.get(id),
        assignmentSubmissionService.list({ assignment_id: id, limit: 100 }),
      ]);
      setAssignment(assignmentRes?.data || null);
      setSubmissions(submissionsRes?.data || []);
    } catch (err) {
      setError(err.message || "Không tải được assignment.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const title = useMemo(() => assignment?.title || "Assignment detail", [assignment]);
  useDocumentTitle(assignment?.title || null, 1);

  const exportScores = () => {
    if (!submissions.length) {
      toast.error("Không có dữ liệu để export.");
      return;
    }
    downloadCsv({
      filename: `assignment-${assignment?.id || id}-scores.csv`,
      headers: ["group_code", "group_name", "status", "submitted_at", "is_late", "score", "feedback", "graded_by_name", "graded_at"],
      rows: submissions.map((row) => ({
        group_code: row.group_code,
        group_name: row.group_name,
        status: row.status,
        submitted_at: row.submitted_at,
        is_late: row.is_late,
        score: row.score ?? "",
        feedback: row.feedback ?? "",
        graded_by_name: row.graded_by_name || row.graded_by || "",
        graded_at: row.graded_at ?? "",
      })),
    });
    toast.success("Đã tải file CSV.");
  };

  const openSubmission = async (row) => {
    if (!row.submission_id) {
      toast.error("Nhóm chưa có bài nộp.");
      return;
    }
    try {
      const res = await assignmentSubmissionService.get(row.submission_id);
      setDetail(res?.data || null);
    } catch (err) {
      toast.error(err.message || "Không tải được submission.");
    }
  };

  const grade = async (payload) => {
    if (!gradeTarget?.submission_id) return;
    setSaving(true);
    try {
      await assignmentSubmissionService.grade(gradeTarget.submission_id, payload);
      toast.success("Đã chấm điểm assignment");
      setGradeTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Không chấm được bài.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">Đang tải assignment...</div>;
  if (error) return <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm font-medium text-red-600">{error}</div>;
  if (!assignment) return <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">Không tìm thấy assignment.</div>;

  const columns = [
    { key: "group_name", label: "Group", render: (row) => <span className="font-semibold text-gray-900">{row.group_name || "—"}</span> },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "submitted_by", label: "Submitted by", render: (row) => row.submitted_by_name || row.submitted_by || "—" },
    { key: "submitted_at", label: "Submitted", render: (row) => formatDate(row.submitted_at) },
    { key: "is_late", label: "Late", render: (row) => Number(row.is_late || 0) ? <StatusBadge value="late" /> : "—" },
    { key: "note", label: "Note", render: (row) => <span className="line-clamp-2">{row.note || "—"}</span> },
    { key: "score", label: "Score", render: (row) => row.score ?? "—" },
    { key: "feedback", label: "Feedback", render: (row) => <span className="line-clamp-2">{row.feedback || "—"}</span> },
    { key: "graded_by", label: "Graded by", render: (row) => row.graded_by_name || row.graded_by || "—" },
    { key: "graded_at", label: "Graded at", render: (row) => formatDate(row.graded_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => openSubmission(row)} title="View"><Eye size={16} /></ActionButton>
          {row.submission_id ? <ActionButton onClick={() => setGradeTarget(row)} title="Grade" tone="indigo"><SquarePen size={16} /></ActionButton> : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <button type="button" onClick={() => navigate("/admin/assignments")} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600">
            <ArrowLeft size={16} /> Assignments
          </button>
          <h2 className="truncate text-xl font-black text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{assignment.class_code} · {assignment.subject_code} · {assignment.semester_code}</p>
        </div>
        <StatusBadge value={assignment.status} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`h-10 rounded-xl px-4 text-sm font-bold transition-colors ${activeTab === tab.key ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-black text-gray-900">Assignment Overview</h3>
            <DetailGrid items={[
              ["Title", assignment.title],
              ["Class", assignment.class_code],
              ["Subject", `${assignment.subject_code} - ${assignment.subject_name}`],
              ["Semester", assignment.semester_code],
              ["Deadline", formatDate(assignment.deadline)],
              ["Max score", Number(assignment.max_score || 0)],
              ["File rule", `${assignment.required_file_types || "any"} · ${assignment.max_files} files · ${assignment.max_file_size_mb}MB`],
              ["Created by", assignment.created_by_name || assignment.created_by || "—"],
              ["Description", assignment.description || "—"],
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Total groups", assignment.total_groups],
              ["Submitted", assignment.submitted_groups],
              ["Need grade", assignment.pending_grading],
              ["Graded", assignment.graded_groups],
              ["Late", assignment.late_submissions],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
                <p className="mt-2 text-3xl font-black text-gray-900">{Number(value || 0)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "submissions" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" onClick={exportScores} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              <FileDown size={16} /> Export CSV
            </button>
          </div>
          <AdminTable columns={columns} rows={submissions} loading={false} meta={{ page: 1, totalPages: 1, total: submissions.length }} emptyText="Chưa có assignment submission." />
        </div>
      ) : null}
      {activeTab === "grading" ? (
        <GradingSummaryPanel submissions={submissions} maxScore={assignment.max_score} />
      ) : null}

      <GradeModal open={!!gradeTarget} submission={gradeTarget} maxScore={assignment.max_score} onClose={() => setGradeTarget(null)} onSubmit={grade} saving={saving} />
      <SubmissionDetailModal open={!!detail} submission={detail} title="Assignment submission detail" onClose={() => setDetail(null)} />
    </div>
  );
}
