import { useEffect, useMemo, useState } from "react";
import { Eye, SquarePen, FileDown } from "lucide-react";
import {
  checkpointSubmissionService,
  projectSubmissionLookupService,
} from "@/api/adminProjectSubmission";
import { useToast } from "@/components/ui/Toast";
import { useCheckpointSubmissions } from "@/hooks/admin/useCheckpointSubmissions";
import { useAdminListSemesterFilters } from "@/hooks/admin/useAdminListSemesterFilters";
import { useAdminUrlQuerySync } from "@/hooks/admin/useAdminUrlQuerySync";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { AdminSemesterFilterGroup, FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import GradeModal from "@/pages/admin/project-submission/components/GradeModal";
import SubmissionDetailModal from "@/pages/admin/project-submission/components/SubmissionDetailModal";
import { useTranslation } from "@/context/TranslationContext";
import { countActiveAdminFilters } from "@/pages/admin/shared/filterUtils";
import {
  buildClassLabel,
  fetchAllAdminRows,
  formatDate,
  getBooleanOptions,
  getSubmissionStatusOptions,
  pageLimit,
  toSelectOptions,
} from "@/pages/admin/project-submission/shared";
import { downloadCsv } from "@/utils/exportCsv";

export default function AdminCheckpointSubmissions() {
  const { t } = useTranslation();
  const toast = useToast();
  const submissionStatusOptions = useMemo(() => getSubmissionStatusOptions(t), [t]);
  const booleanOptions = useMemo(() => getBooleanOptions(t), [t]);
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", semester_id: "", class_id: "", checkpoint_id: "", status: "", is_late: "", graded_by: "" });
  useAdminUrlQuerySync({
    query,
    setQuery,
    keys: ["page", "search", "semester_id", "class_id", "checkpoint_id", "status", "is_late", "graded_by"],
  });
  const [lookups, setLookups] = useState({ classes: [], semesters: [], checkpoints: [], graders: [] });
  const { semesterFilter, classOptions, listEnabled } = useAdminListSemesterFilters({
    semesters: lookups.semesters,
    classes: lookups.classes,
    buildClassLabel,
    setQuery,
    querySemesterId: query.semester_id,
  });
  const { rows, meta, loading, error, refetch } = useCheckpointSubmissions(query, { enabled: listEnabled });
  const [detail, setDetail] = useState(null);
  const [gradeTarget, setGradeTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    projectSubmissionLookupService.getAll()
      .then((res) => setLookups(res?.data || { classes: [], semesters: [], checkpoints: [], graders: [] }))
      .catch(() => setLookups({ classes: [], semesters: [], checkpoints: [], graders: [] }));
  }, []);

  const checkpointOptions = useMemo(() => toSelectOptions(lookups.checkpoints, (item) => item.id, (item) => item.title, t("lookupAll.checkpoints")), [lookups.checkpoints, t]);
  const graderOptions = useMemo(() => toSelectOptions(lookups.graders, (item) => item.id, (item) => item.full_name || item.email, t("lookupAll.graders")), [lookups.graders, t]);

  const openDetail = async (row) => {
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
      await refetch();
    } catch (err) {
      toast.error(err.message || "Không chấm được bài.");
    } finally {
      setSaving(false);
    }
  };

  const exportAll = async () => {
    try {
      const all = await fetchAllAdminRows(checkpointSubmissionService.list, query);
      if (!all.length) {
        toast.error("Không có dữ liệu để export.");
        return;
      }
      downloadCsv({
        filename: `admin-checkpoint-submissions-${new Date().toISOString().slice(0, 10)}.csv`,
        headers: ["checkpoint_id", "checkpoint_title", "class_code", "group_code", "group_name", "submission_id", "display_status", "is_late", "submitted_at", "graded_at", "graded_by_name", "score"],
        rows: all.map((r) => ({
          checkpoint_id: r.checkpoint_id || "",
          checkpoint_title: r.checkpoint_title || "",
          class_code: r.class_code || "",
          group_code: r.group_code || "",
          group_name: r.group_name || "",
          submission_id: r.submission_id || "",
          display_status: r.display_status || "",
          is_late: r.is_late,
          submitted_at: r.submitted_at || "",
          graded_at: r.graded_at || "",
          graded_by_name: r.graded_by_name || r.graded_by || "",
          score: r.score,
        })),
      });
    } catch (err) {
      toast.error(err.message || "Không export được dữ liệu.");
    }
  };

  const columns = [
    { key: "checkpoint_title", label: "Checkpoint", render: (row) => <span className="font-semibold text-gray-900">{row.checkpoint_title}</span> },
    { key: "class_code", label: "Class" },
    { key: "group", label: "Group", render: (row) => row.group_name || "—" },
    { key: "display_status", label: "Status", render: (row) => <StatusBadge value={row.display_status} /> },
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
          <ActionButton onClick={() => openDetail(row)} title="View"><Eye size={16} /></ActionButton>
          {row.submission_id ? <ActionButton onClick={() => setGradeTarget(row)} title="Grade" tone="indigo"><SquarePen size={16} /></ActionButton> : null}
        </div>
      ),
    },
  ];

  const activeFilterCount = countActiveAdminFilters(query);

  const clearFilters = () => {
    semesterFilter.reset();
    setQuery((prev) => ({
      ...prev,
      page: 1,
      search: "",
      class_id: "",
      checkpoint_id: "",
      status: "",
      is_late: "",
      graded_by: "",
    }));
  };

  return (
    <>
      <FilterBar
        search={(
          <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("searchPlaceholders.checkpointSubmissions")} />
        )}
        activeFilterCount={activeFilterCount}
        onClear={clearFilters}
        right={(
          <button type="button" onClick={exportAll} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <FileDown size={16} /> Export CSV
          </button>
        )}
      >
        <AdminSemesterFilterGroup
          filterYear={semesterFilter.filterYear}
          semesterId={semesterFilter.semesterId}
          yearOptions={semesterFilter.yearOptions}
          semesterOptions={semesterFilter.semesterOptions}
          onYearChange={semesterFilter.onYearChange}
          onSemesterChange={semesterFilter.onSemesterIdChange}
        />
        <FilterSelect label={t("filterLabels.class")} value={query.class_id} onChange={(class_id) => setQuery((prev) => ({ ...prev, page: 1, class_id }))} options={classOptions} />
        <FilterSelect label={t("filterLabels.checkpoint")} value={query.checkpoint_id} onChange={(checkpoint_id) => setQuery((prev) => ({ ...prev, page: 1, checkpoint_id }))} options={checkpointOptions} />
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={submissionStatusOptions} />
        <FilterSelect label={t("filterLabels.late")} value={query.is_late} onChange={(is_late) => setQuery((prev) => ({ ...prev, page: 1, is_late }))} options={booleanOptions} />
        <FilterSelect label={t("filterLabels.grader")} value={query.graded_by} onChange={(graded_by) => setQuery((prev) => ({ ...prev, page: 1, graded_by }))} options={graderOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("admin.empty.checkpointSubmissions")} />

      <GradeModal open={!!gradeTarget} submission={gradeTarget} maxScore={gradeTarget?.max_score} onClose={() => setGradeTarget(null)} onSubmit={grade} saving={saving} />
      <SubmissionDetailModal open={!!detail} submission={detail} title="Checkpoint submission detail" onClose={() => setDetail(null)} />
    </>
  );
}
