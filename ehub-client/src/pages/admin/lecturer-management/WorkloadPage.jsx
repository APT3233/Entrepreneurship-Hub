import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLecturerApi from "@/api/adminLecturer";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { CountBadge, LecturerAvatar } from "./components";
import { formatDate } from "@/utils/dateTimeDisplay";
import { useTranslation } from "@/context/TranslationContext";

const toOptions = (t, items, getLabel) => [
  { value: "", label: t("filters.all") },
  ...(items || []).map((item) => ({ value: String(item.id), label: getLabel(item) })),
];

export default function LecturerWorkloadPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [lookups, setLookups] = useState({ subjects: [], semesters: [] });
  const [query, setQuery] = useState({ page: 1, limit: 10, semester_id: "", subject_id: "", status: "", has_pending_grading: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [workloadRes, lookupsRes] = await Promise.all([
        AdminLecturerApi.getWorkload(query),
        AdminLecturerApi.getLookups(),
      ]);
      setRows(workloadRes?.data || []);
      setMeta(workloadRes?.meta || null);
      setLookups(lookupsRes?.data || { subjects: [], semesters: [] });
    } catch (err) {
      setError(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => {
    load();
  }, [load]);

  const subjectOptions = useMemo(() => toOptions(t, lookups.subjects, (item) => `${item.subject_code} - ${item.subject_name}`), [lookups.subjects, t]);
  const semesterOptions = useMemo(() => toOptions(t, lookups.semesters, (item) => `${item.semester_code} - ${item.semester_name}`), [lookups.semesters, t]);

  const exportCsv = () => {
    const headers = ["full_name", "active_classes", "total_students", "total_groups_managed", "total_checkpoints", "total_assignments", "pending_grading_count", "graded_submissions", "average_grading_delay"];
    const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? "").replaceAll("\"", "\"\"")}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lecturer-workload.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <FilterBar
        right={(
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Download size={16} /> {t("common.export")}
          </button>
        )}
      >
        <FilterSelect label={t("admin.fields.semester")} value={query.semester_id} onChange={(semester_id) => setQuery((prev) => ({ ...prev, page: 1, semester_id }))} options={semesterOptions} />
        <FilterSelect label={t("admin.fields.subjectCode")} value={query.subject_id} onChange={(subject_id) => setQuery((prev) => ({ ...prev, page: 1, subject_id }))} options={subjectOptions} />
        <FilterSelect label={t("admin.fields.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={[
          { value: "", label: t("filters.all") },
          { value: "active", label: t("status.active") },
          { value: "inactive", label: t("status.inactive") },
          { value: "locked", label: t("status.locked") },
        ]} />
        <FilterSelect label={t("admin.fields.pendingGrading")} value={query.has_pending_grading} onChange={(has_pending_grading) => setQuery((prev) => ({ ...prev, page: 1, has_pending_grading }))} options={[
          { value: "", label: t("filters.all") },
          { value: "yes", label: t("filters.yes") },
          { value: "no", label: t("filters.no") },
        ]} />
      </FilterBar>

      <AdminTable
        columns={[
          { key: "avatar", label: "", render: (row) => <LecturerAvatar lecturer={row} /> },
          { key: "full_name", label: t("nav.lecturers"), render: (row) => <span className="font-bold text-slate-900">{row.full_name}</span> },
          { key: "active_classes", label: t("admin.fields.activeClassesCount"), render: (row) => <CountBadge value={row.active_classes} tone="blue" /> },
          { key: "total_students", label: t("admin.fields.enrolledCount"), render: (row) => <CountBadge value={row.total_students} /> },
          { key: "total_groups_managed", label: t("admin.fields.groupCount"), render: (row) => <CountBadge value={row.total_groups_managed} /> },
          { key: "total_checkpoints", label: t("nav.checkpoints") },
          { key: "total_assignments", label: t("nav.assignments") },
          { key: "pending_grading_count", label: t("admin.fields.pendingGradingCount"), render: (row) => <CountBadge value={row.pending_grading_count} tone={Number(row.pending_grading_count) ? "amber" : "slate"} /> },
          { key: "graded_submissions", label: t("admin.fields.gradedSubmissionsCount"), render: (row) => <CountBadge value={row.graded_submissions} tone="emerald" /> },
          { key: "average_grading_delay", label: t("admin.fields.averageGradingDelay"), render: (row) => row.average_grading_delay ? `${row.average_grading_delay}h` : "—" },
          { key: "last_login_at", label: t("admin.fields.lastLogin"), render: (row) => formatDate(row.last_login_at) },
          { key: "last_graded_at", label: t("admin.fields.lastGradedAt"), render: (row) => formatDate(row.last_graded_at) },
          { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
          { key: "actions", label: "", render: (row) => <button type="button" onClick={() => navigate(`/admin/lecturers/${row.id}`)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Eye size={16} /></button> },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        meta={meta}
        emptyText={t("admin.empty.workloads")}
        onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))}
      />
    </>
  );
}
