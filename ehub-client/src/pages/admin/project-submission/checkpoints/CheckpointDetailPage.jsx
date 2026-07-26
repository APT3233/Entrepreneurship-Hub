import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Eye, FileDown, SquarePen, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  checkpointService,
  checkpointSubmissionService,
  fileService,
} from "@/api/adminProjectSubmission";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import DetailGrid from "@/pages/admin/academic/components/DetailGrid";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import GradeModal from "@/pages/admin/project-submission/components/GradeModal";
import SubmissionDetailModal from "@/pages/admin/project-submission/components/SubmissionDetailModal";
import {
  formatBytes,
  formatDate,
  pageLimit,
  resolveCheckpointOpenAt,
} from "@/pages/admin/project-submission/shared";
import GradingSummaryPanel from "@/pages/admin/components/GradingSummaryPanel";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import { useTranslation } from "@/context/TranslationContext";
import { downloadCsv } from "@/utils/exportCsv";
import useDocumentTitle from "@/hooks/useDocumentTitle";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "submissions", label: "Submissions" },
  { key: "files", label: "Files" },
  { key: "grading", label: "Grading Summary" },
];

export default function AdminCheckpointDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [checkpoint, setCheckpoint] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gradeTarget, setGradeTarget] = useState(null);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [checkpointRes, submissionsRes, filesRes] = await Promise.all([
        checkpointService.get(id),
        checkpointSubmissionService.list({ checkpoint_id: id, limit: 100 }),
        fileService.list({ source: "checkpoint", checkpoint_id: id, limit: 100 }),
      ]);
      setCheckpoint(checkpointRes?.data || null);
      setSubmissions(submissionsRes?.data || []);
      setFiles(filesRes?.data || []);
    } catch (err) {
      setError(err.message || "Không tải được checkpoint.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const title = useMemo(() => checkpoint?.title || "Checkpoint detail", [checkpoint]);
  useDocumentTitle(checkpoint?.title || null, 1);

  const exportSubmissions = () => {
    if (!submissions.length) {
      toast.error("Không có dữ liệu để export.");
      return;
    }
    downloadCsv({
      filename: `checkpoint-${checkpoint?.id || id}-submissions.csv`,
      headers: ["group_code", "group_name", "display_status", "submission_status", "submitted_at", "is_late", "score", "feedback", "graded_by_name", "graded_at"],
      rows: submissions.map((row) => ({
        group_code: row.group_code,
        group_name: row.group_name,
        display_status: row.display_status,
        submission_status: row.submission_status,
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
      const res = await checkpointSubmissionService.get(row.submission_id);
      setDetail(res?.data || null);
    } catch (err) {
      toast.error(err.message || "Không tải được submission.");
    }
  };

  const grade = async (payload) => {
    if (!gradeTarget?.submission_id) return;
    setSaving(true);
    try {
      await checkpointSubmissionService.grade(gradeTarget.submission_id, payload);
      toast.success("Đã chấm điểm checkpoint");
      setGradeTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Không chấm được bài.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCheckpoint = async () => {
    try {
      await checkpointService.remove(id);
      toast.success("Đã xóa checkpoint");
      setConfirmDelete(false);
      navigate("/admin/checkpoints");
    } catch (err) {
      toast.error(err.message || "Không xóa được checkpoint.");
    }
  };

  if (loading) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-gray-400">Đang tải checkpoint...</div>;
  if (error) return <div className="rounded-card border border-red-100 bg-red-50 p-8 text-center text-sm font-medium text-red-600">{error}</div>;
  if (!checkpoint) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-gray-400">Không tìm thấy checkpoint.</div>;

  const submissionColumns = [
    { key: "group_name", label: "Group", render: (row) => <span className="font-semibold text-gray-900">{row.group_name || "—"}</span> },
    { key: "display_status", label: "Display", render: (row) => <StatusBadge value={row.display_status} /> },
    { key: "submission_status", label: "Submission", render: (row) => <StatusBadge value={row.submission_status} /> },
    { key: "submitted_at", label: "Submitted", render: (row) => formatDate(row.submitted_at) },
    { key: "is_late", label: "Late", render: (row) => Number(row.is_late || 0) ? <StatusBadge value="late" /> : "—" },
    { key: "score", label: "Score", render: (row) => row.score ?? "—" },
    { key: "feedback", label: "Feedback", render: (row) => <span className="line-clamp-2">{row.feedback || "—"}</span> },
    { key: "graded_by", label: "Graded by", render: (row) => row.graded_by_name || row.graded_by || "—" },
    { key: "graded_at", label: "Graded at", render: (row) => formatDate(row.graded_at) },
    { key: "file_count", label: "Files", render: (row) => Number(row.file_count || 0) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => openSubmission(row)} title="View submission"><Eye size={16} /></ActionButton>
          {row.submission_id ? <ActionButton onClick={() => setGradeTarget(row)} title="Grade" tone="indigo"><SquarePen size={16} /></ActionButton> : null}
        </div>
      ),
    },
  ];

  const fileColumns = [
    { key: "file_name", label: "File", render: (row) => <span className="font-semibold text-gray-900">{row.file_name}</span> },
    { key: "file_type", label: "Type", render: (row) => row.file_type || "—" },
    { key: "mime_type", label: "MIME", render: (row) => row.mime_type || "—" },
    { key: "file_size", label: "Size", render: (row) => formatBytes(row.file_size) },
    { key: "group", label: "Group", render: (row) => row.group_name || "—" },
    { key: "uploaded_by", label: "Uploaded by", render: (row) => row.uploaded_by_name || row.uploaded_by || "—" },
    { key: "uploaded_at", label: "Uploaded", render: (row) => formatDate(row.uploaded_at) },
    { key: "is_deleted", label: "Deleted", render: (row) => Number(row.is_deleted || 0) ? <StatusBadge value="deleted" /> : "—" },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => window.open(row.file_url || row.file_path, "_blank", "noreferrer")} title="Preview/download"><Download size={16} /></ActionButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <button type="button" onClick={() => navigate("/admin/checkpoints")} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-accent">
            <ArrowLeft size={16} /> Checkpoints
          </button>
          <h2 className="truncate text-xl font-black text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{checkpoint.class_code} · {checkpoint.subject_code} · {checkpoint.semester_code}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={checkpoint.status} />
          {checkpoint.status === "archived" ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              <Trash2 size={16} />
              {t("common.confirm") === "Xác nhận" ? "Xóa checkpoint" : "Delete checkpoint"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface p-2">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`h-10 rounded-xl px-4 text-sm font-bold transition-colors ${activeTab === tab.key ? "bg-accent-bg text-accent" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-card border border-border bg-surface p-5">
            <h3 className="mb-4 text-base font-black text-gray-900">Checkpoint Overview</h3>
            <DetailGrid items={[
              ["Title", checkpoint.title],
              ["Class", checkpoint.class_code],
              ["Subject", `${checkpoint.subject_code} - ${checkpoint.subject_name}`],
              ["Semester", checkpoint.semester_code],
              ["Order", Number(checkpoint.order_index || 0)],
              ["Deadline", formatDate(checkpoint.deadline)],
              ["Open at", formatDate(resolveCheckpointOpenAt(checkpoint) || checkpoint.open_at)],
              ["Max score", Number(checkpoint.max_score || 0)],
              ["Weight", Number(checkpoint.weight || 0)],
              ["File rule", `${checkpoint.required_file_types || "any"} · ${checkpoint.max_files} files · ${checkpoint.max_file_size_mb}MB`],
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Total groups", checkpoint.total_groups],
              ["Not submitted", checkpoint.not_submitted_groups],
              ["Submitted", checkpoint.submitted_groups],
              ["Need grade", checkpoint.pending_grading],
              ["Graded", checkpoint.graded_groups],
              ["Late", checkpoint.late_submissions],
            ].map(([label, value]) => (
              <div key={label} className="rounded-card border border-border bg-surface p-5">
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
            <button type="button" onClick={exportSubmissions} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              <FileDown size={16} /> Export CSV
            </button>
          </div>
          <AdminTable columns={submissionColumns} rows={submissions} loading={false} meta={{ page: 1, totalPages: 1, total: submissions.length }} emptyText="Chưa có submission." />
        </div>
      ) : null}
      {activeTab === "files" ? (
        <AdminTable
          columns={fileColumns}
          rows={files.map((file) => ({ ...file, row_key: `${file.source}:${file.id}` }))}
          rowKey="row_key"
          loading={false}
          meta={{ page: 1, totalPages: 1, total: files.length }}
          emptyText="Chưa có file."
        />
      ) : null}
      {activeTab === "grading" ? (
        <GradingSummaryPanel submissions={submissions} maxScore={checkpoint.max_score} />
      ) : null}

      <GradeModal
        open={!!gradeTarget}
        submission={gradeTarget}
        maxScore={checkpoint.max_score}
        onClose={() => setGradeTarget(null)}
        onSubmit={grade}
        saving={saving}
      />
      <SubmissionDetailModal open={!!detail} submission={detail} title="Checkpoint submission detail" onClose={() => setDetail(null)} />
      <ConfirmDialog
        isOpen={confirmDelete}
        title={t("lecturer.assignmentsPage.deleteCheckpointTitle")}
        subtitle={`${checkpoint.title} — ${t("lecturer.assignmentsPage.deleteSubtitle")}`}
        variant="delete"
        color="red"
        yesLabel={t("common.confirm") === "Xác nhận" ? "Xóa" : "Delete"}
        onYes={deleteCheckpoint}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
