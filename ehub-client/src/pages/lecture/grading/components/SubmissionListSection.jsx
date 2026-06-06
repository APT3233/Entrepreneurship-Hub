import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, FileText, PencilLine, RotateCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AssignmentApi from "@/api/assignment";
import CheckpointApi from "@/api/checkpoint";
import ClassApi from "@/api/class";
import gradingService from "@/api/grading";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import DateTimeCell from "@/components/ui/DateTimeCell";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import { statusOptions } from "@/utils/i18nOptions";
import SubmissionStatusBadge from "./SubmissionStatusBadge";
import EvaluationStatusBadge from "./EvaluationStatusBadge";

const pageLimit = 10;

const toOptions = (rows, getValue, getLabel, allLabel) => [
  { label: allLabel, value: "" },
  ...(rows || []).map((row) => ({ label: getLabel(row), value: String(getValue(row)) })),
];

export default function SubmissionListSection({ fixedFilters = {}, title, showSourceFilter = true }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const listTitle = title || t("lecturer.gradingPage.submissionListTitle");

  const sourceOptions = useMemo(() => [
    { label: t("lecturer.gradingPage.filters.allSourceTypes"), value: "" },
    { label: t("status.checkpoint"), value: "checkpoint" },
    { label: t("status.assignment"), value: "assignment" },
  ], [t]);

  const submissionStatusOptions = useMemo(() => statusOptions(t, ["", "submitted", "resubmitted", "graded"]), [t]);
  const lateOptions = useMemo(() => [
    { label: t("lecturer.gradingPage.filters.allLate"), value: "" },
    { label: t("lecturer.gradingPage.filters.lateOnly"), value: "1" },
    { label: t("lecturer.gradingPage.filters.onTime"), value: "0" },
  ], [t]);
  const evaluationFilterOptions = useMemo(() => statusOptions(t, ["", "not_started", "draft", "submitted", "confirmed"]), [t]);
  const [query, setQuery] = useState({
    page: 1,
    limit: pageLimit,
    search: "",
    source_type: "",
    class_id: "",
    checkpoint_id: "",
    assignment_id: "",
    status: "",
    is_late: "",
    evaluation_status: "",
    ...Object.fromEntries(Object.entries(fixedFilters).map(([key, value]) => [key, value ? String(value) : ""])),
  });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lookups, setLookups] = useState({ classes: [], checkpoints: [], assignments: [] });

  const fixedFiltersString = JSON.stringify(fixedFilters);

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      ...Object.fromEntries(Object.entries(fixedFilters || {}).map(([key, value]) => [key, value ? String(value) : ""])),
    }));
  }, [fixedFiltersString]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      ClassApi.getList({ lecturerScope: "mine", page: 1, limit: 100 }),
      CheckpointApi.getList({ lecturerScope: "mine" }),
      AssignmentApi.getList({ lecturerScope: "mine", page: 1, limit: 100 }),
    ])
      .then(([classRes, checkpointRes, assignmentRes]) => {
        if (!mounted) return;
        setLookups({
          classes: Array.isArray(classRes?.data) ? classRes.data : [],
          checkpoints: Array.isArray(checkpointRes?.data) ? checkpointRes.data : [],
          assignments: Array.isArray(assignmentRes?.data) ? assignmentRes.data : [],
        });
      })
      .catch(() => setLookups({ classes: [], checkpoints: [], assignments: [] }));
    return () => {
      mounted = false;
    };
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await gradingService.submissions(query);
      setRows((res?.data || []).map((row) => ({ ...row, row_id: `${row.source_type}-${row.submission_id}` })));
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("lecturer.gradingPage.loadListError"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [query, t]);

  useEffect(() => {
    load(false);
  }, [load]);

  const classOptions = useMemo(
    () => toOptions(lookups.classes, (item) => item.id, (item) => item.class_code, t("lookupAll.classes")),
    [lookups.classes, t],
  );
  const checkpointOptions = useMemo(
    () => toOptions(lookups.checkpoints, (item) => item.id, (item) => item.title, t("lookupAll.checkpoints")),
    [lookups.checkpoints, t],
  );
  const assignmentOptions = useMemo(
    () => toOptions(lookups.assignments, (item) => item.id, (item) => item.title, t("lookupAll.assignments")),
    [lookups.assignments, t],
  );

  const setFilter = (key, value) => {
    if (fixedFilters[key] !== undefined) return;
    setQuery((prev) => ({ ...prev, page: 1, [key]: value }));
  };

  const openGrading = (row) => {
    const base = row.source_type === "checkpoint" ? "checkpoint-submissions" : "assignment-submissions";
    navigate(`/lecturer/grading/${base}/${row.submission_id}`, {
      state: { from: window.location.pathname + window.location.search },
    });
  };

  const columns = useMemo(() => [
    { key: "source", label: t("admin.columns.item"), width: 230, render: (row) => (
      <div className="min-w-0">
        <p className="truncate font-semibold text-gray-900">{row.source_title}</p>
        <p className="mt-1 text-xs text-gray-400">{row.source_type === "checkpoint" ? t("status.checkpoint") : t("status.assignment")} · {row.class_code}</p>
      </div>
    ) },
    { key: "group_name", label: t("filterLabels.group"), width: 200, render: (row) => <span className="font-semibold text-gray-900">{row.group_name || "—"}</span> },
    { key: "topic", label: t("admin.columns.projectTopic"), width: 200, render: (row) => row.topic || "—" },
    { key: "submission_status", label: t("lecturer.gradingPage.filters.submission"), width: 130, render: (row) => <SubmissionStatusBadge value={row.submission_status} /> },
    { key: "submitted_at", label: t("admin.columns.submitted"), width: 140, render: (row) => <DateTimeCell value={row.submitted_at} /> },
    { key: "is_late", label: t("filterLabels.late"), width: 90, render: (row) => Number(row.is_late || 0) ? <span className="text-sm font-semibold text-red-600">{t("status.late")}</span> : "—" },
    { key: "file_count", label: t("admin.columns.files"), width: 80, render: (row) => Number(row.file_count || 0) },
    { key: "current_score", label: t("admin.fields.score"), width: 90, render: (row) => row.current_score ?? "—" },
    { key: "evaluation_status", label: t("admin.columns.evaluations"), width: 130, render: (row) => <EvaluationStatusBadge value={row.evaluation_status} /> },
    { key: "graded_by", label: t("admin.columns.gradedBy"), width: 140, render: (row) => row.graded_by_name || row.evaluator_name || "—" },
    { key: "graded_at", label: t("admin.columns.gradedAt"), width: 140, render: (row) => <DateTimeCell value={row.graded_at || row.evaluated_at} /> },
    { key: "actions", label: "", width: 140, render: (row) => (
      <div className="flex justify-end gap-1">
        <button type="button" onClick={() => openGrading(row)} title={t("lecturer.gradingPage.actions.viewSubmission")} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800">
          <Eye size={16} />
        </button>
        <button type="button" onClick={() => openGrading(row)} title={t("lecturer.gradingPage.actions.openGrading")} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50">
          <PencilLine size={16} />
        </button>
      </div>
    ) },
  ], [t]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{listTitle}</h2>
          <p className="mt-1 text-sm text-gray-500">{t("lecturer.gradingPage.submissionListSubtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => load(true).then(() => toast.success(t("lecturer.gradingPage.refreshSuccess")))}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RotateCw size={16} />
          {t("lecturer.gradingPage.refresh")}
        </button>
      </div>

      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("lecturer.gradingPage.searchPlaceholder")} />
        {showSourceFilter ? <FilterSelect label={t("filterLabels.type")} value={query.source_type} onChange={(value) => setFilter("source_type", value)} options={sourceOptions} /> : null}
        <FilterSelect label={t("filterLabels.class")} value={query.class_id} onChange={(value) => setFilter("class_id", value)} options={classOptions} />
        {query.source_type !== "assignment" ? <FilterSelect label={t("filterLabels.checkpoint")} value={query.checkpoint_id} onChange={(value) => setFilter("checkpoint_id", value)} options={checkpointOptions} /> : null}
        {query.source_type !== "checkpoint" ? <FilterSelect label={t("filterLabels.assignment")} value={query.assignment_id} onChange={(value) => setFilter("assignment_id", value)} options={assignmentOptions} /> : null}
        <FilterSelect label={t("lecturer.gradingPage.filters.submission")} value={query.status} onChange={(value) => setFilter("status", value)} options={submissionStatusOptions} />
        <FilterSelect label={t("filterLabels.late")} value={query.is_late} onChange={(value) => setFilter("is_late", value)} options={lateOptions} />
        <FilterSelect label={t("admin.columns.evaluations")} value={query.evaluation_status} onChange={(value) => setFilter("evaluation_status", value)} options={evaluationFilterOptions} />
      </FilterBar>

      <AdminTable
        columns={columns}
        rows={rows}
        rowKey="row_id"
        loading={loading}
        error={error}
        meta={meta}
        onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))}
        emptyText={t("lecturer.gradingPage.emptySubmissions")}
      />

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <FileText size={14} />
        {t("lecturer.gradingPage.filesHint")}
      </div>
    </section>
  );
}
