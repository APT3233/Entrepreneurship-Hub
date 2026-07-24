import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, FileText, PencilLine, RotateCw, SlidersHorizontal, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AssignmentApi from "@/api/assignment";
import CheckpointApi from "@/api/checkpoint";
import ClassApi from "@/api/class";
import gradingService from "@/api/grading";
import SemesterApi from "@/api/semester";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import Dropdown from "@/components/ui/filter/DropDown";
import DateTimeCell from "@/components/ui/DateTimeCell";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import { formatSemesterLabel } from "@/hooks/useLectureFilterOptions";
import { statusOptions } from "@/utils/i18nOptions";
import SubmissionStatusBadge from "./SubmissionStatusBadge";
import EvaluationStatusBadge from "./EvaluationStatusBadge";

const pageLimit = 10;

const toOptions = (rows, getValue, getLabel, allLabel) => [
  { label: allLabel, value: "" },
  ...(rows || []).map((row) => ({ label: getLabel(row), value: String(getValue(row)) })),
];

export default function SubmissionListSection({ title, showSourceFilter = true, onPeriodChange }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const listTitle = title || t("lecturer.gradingPage.submissionListTitle");

  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize query state from URL search params on mount
  const [query, setQuery] = useState(() => {
    const params = Object.fromEntries(searchParams.entries());
    return {
      page: Number(params.page) || 1,
      limit: Number(params.limit) || pageLimit,
      search: params.search || "",
      source_type: params.source_type || "",
      class_id: params.class_id || "",
      checkpoint_id: params.checkpoint_id || "",
      assignment_id: params.assignment_id || "",
      status: params.status || "",
      is_late: params.is_late || "",
      evaluation_status: params.evaluation_status || "",
      year: params.year || "",
      semester_id: params.semester_id || "",
    };
  });

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lookups, setLookups] = useState({ classes: [], checkpoints: [], assignments: [] });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [semesterList, setSemesterList] = useState([]);

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

  // Fetch Semesters on Mount
  useEffect(() => {
    let mounted = true;
    SemesterApi.getList()
      .then((list) => {
        if (!mounted) return;
        const safeList = Array.isArray(list) ? list : [];
        setSemesterList(safeList);
        
        // If year and semester are not in URL, set default (ongoing semester)
        setQuery((prev) => {
          if (prev.year || prev.semester_id) return prev; // Keep URL values if they exist
          
          const ongoing = safeList.find((s) => s.status === "ongoing");
          if (ongoing) {
            return {
              ...prev,
              year: String(ongoing.year),
              semester_id: String(ongoing.id),
            };
          } else {
            const years = [...new Set(safeList.map((s) => s.year))].sort((a, b) => b - a);
            const currentYear = new Date().getFullYear();
            const selectedYear = years.includes(currentYear) ? currentYear : years[0];
            if (!selectedYear) return prev;
            
            const inYear = safeList.filter((s) => s.year === selectedYear);
            return {
              ...prev,
              year: String(selectedYear),
              semester_id: inYear[0]?.id ? String(inYear[0].id) : "",
            };
          }
        });
      })
      .catch((err) => console.error("Failed to fetch semesters:", err));
    return () => {
      mounted = false;
    };
  }, []);

  const yearOptions = useMemo(() => {
    const years = [...new Set(semesterList.map((s) => s.year))].sort((a, b) => b - a);
    return [
      { value: "", label: t("lookupAll.years") },
      ...years.map((y) => ({ value: String(y), label: String(y) }))
    ];
  }, [semesterList, t]);

  const semesterOptions = useMemo(() => {
    if (!query.year) return [{ value: "", label: t("lookupAll.semesters") }];
    const mapped = semesterList
      .filter((s) => s.year === Number(query.year))
      .map((s) => ({ value: String(s.id), label: formatSemesterLabel(s, t) }));
    return [
      { value: "", label: t("lookupAll.semesters") },
      ...mapped
    ];
  }, [semesterList, query.year, t]);

  // Synchronize query state to searchParams in URL
  useEffect(() => {
    const newParams = new URLSearchParams();
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        newParams.set(key, String(val));
      }
    });
    setSearchParams(newParams, { replace: true });
  }, [query, setSearchParams]);

  // Notify parent component of period change to update dashboard stats
  useEffect(() => {
    if (onPeriodChange) {
      onPeriodChange({ year: query.year, semester_id: query.semester_id });
    }
  }, [query.year, query.semester_id, onPeriodChange]);

  const activeAdvancedCount = useMemo(() => {
    const keys = ["source_type", "checkpoint_id", "assignment_id", "status", "is_late", "evaluation_status"];
    return keys.filter((key) => query[key] !== "").length;
  }, [query]);

  const resetAdvancedFilters = () => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      source_type: "",
      checkpoint_id: "",
      assignment_id: "",
      status: "",
      is_late: "",
      evaluation_status: "",
    }));
  };

  // Fetch Lookups (Classes, Checkpoints, Assignments) based on active year/semester
  useEffect(() => {
    let mounted = true;
    const lookupParams = {};
    if (query.year) lookupParams.year = query.year;
    if (query.semester_id) lookupParams.semester_id = query.semester_id;

    Promise.all([
      ClassApi.getList({ lecturerScope: "mine", page: 1, limit: 100, ...lookupParams }),
      CheckpointApi.getList({ lecturerScope: "mine", ...lookupParams }),
      AssignmentApi.getList({ lecturerScope: "mine", page: 1, limit: 100, ...lookupParams }),
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
  }, [query.year, query.semester_id]);

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
        <span className="font-medium text-text-primary line-clamp-1 hover:underline cursor-pointer" onClick={() => openGrading(row)}>
          {row.source_title}
        </span>
        <span className="text-label text-text-muted">{t(`status.${row.source_type}`)}</span>
      </div>
    ) },
    { key: "group", label: t("admin.columns.group"), width: 120, render: (row) => (
      <span className="font-medium text-text-primary line-clamp-1" title={row.group_name || undefined}>{row.group_name || "—"}</span>
    ) },
    { key: "class", label: t("admin.columns.class"), width: 140, render: (row) => (
      <span className="font-medium text-text-secondary">{row.class_code || "—"}</span>
    ) },
    { key: "submission_status", label: t("lecturer.gradingPage.filters.submission"), width: 130, render: (row) => <SubmissionStatusBadge value={row.submission_status} /> },
    { key: "submitted_at", label: t("admin.columns.submitted"), width: 140, render: (row) => <DateTimeCell value={row.submitted_at} /> },
    { key: "is_late", label: t("filterLabels.late"), width: 90, render: (row) => Number(row.is_late || 0) ? <span className="text-sm font-medium text-danger-text">{t("status.late")}</span> : "—" },
    { key: "file_count", label: t("admin.columns.files"), width: 80, render: (row) => Number(row.file_count || 0) },
    { key: "current_score", label: t("admin.fields.score"), width: 90, render: (row) => row.current_score ?? "—" },
    { key: "evaluation_status", label: t("admin.columns.evaluations"), width: 130, render: (row) => <EvaluationStatusBadge value={row.evaluation_status} /> },
    { key: "graded_by", label: t("admin.columns.gradedBy"), width: 140, render: (row) => row.graded_by_name || row.evaluator_name || "—" },
    { key: "graded_at", label: t("admin.columns.gradedAt"), width: 140, render: (row) => <DateTimeCell value={row.graded_at || row.evaluated_at} /> },
    { key: "actions", label: "", width: 96, stickyRight: true, render: (row) => (
      <div className="flex justify-end gap-1">
        <button type="button" onClick={() => openGrading(row)} title={t("lecturer.gradingPage.actions.viewSubmission")} className="rounded-control p-2 text-text-muted hover:bg-subtle hover:text-text-primary">
          <Eye size={16} />
        </button>
        <button type="button" onClick={() => openGrading(row)} title={t("lecturer.gradingPage.actions.openGrading")} className="rounded-control p-2 text-accent hover:bg-accent-bg">
          <PencilLine size={16} />
        </button>
      </div>
    ) },
  ], [t]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-text-primary">{listTitle}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t("lecturer.gradingPage.submissionListSubtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => load(true).then(() => toast.success(t("lecturer.gradingPage.refreshSuccess")))}
          className="inline-flex items-center justify-center gap-2 h-9 rounded-control border border-border bg-surface px-3 text-sm font-medium text-text-secondary hover:bg-subtle cursor-pointer"
        >
          <RotateCw size={16} />
          {t("lecturer.gradingPage.refresh")}
        </button>
      </div>

      <FilterBar
        right={
          <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`inline-flex items-center justify-center gap-2 h-9 px-4 rounded-control text-sm font-medium transition-colors border cursor-pointer w-full sm:w-auto ${
                showAdvanced || activeAdvancedCount > 0
                  ? "border-accent bg-accent-bg text-accent"
                  : "border-border bg-surface text-text-secondary hover:bg-subtle"
              }`}
            >
              <SlidersHorizontal size={16} />
              <span>{t("lecturer.gradingPage.filters.advanced") || "Bộ lọc nâng cao"}</span>
              {activeAdvancedCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-accent rounded-full">
                  {activeAdvancedCount}
                </span>
              )}
            </button>
            {activeAdvancedCount > 0 && (
              <button
                type="button"
                onClick={resetAdvancedFilters}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-control text-sm font-medium text-text-secondary hover:text-danger-text transition-colors cursor-pointer w-full sm:w-auto"
              >
                <X size={16} />
                <span>{t("lecturer.gradingPage.filters.clear") || "Xóa bộ lọc"}</span>
              </button>
            )}
          </div>
        }
      >
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("lecturer.gradingPage.searchPlaceholder")} />
        <FilterSelect
          label={t("lecturer.filterYear") || "Năm học"}
          value={query.year || ""}
          onChange={(value) => {
            setQuery((prev) => ({
              ...prev,
              page: 1,
              year: value,
              semester_id: "",
              class_id: "",
              checkpoint_id: "",
              assignment_id: "",
            }));
          }}
          options={yearOptions || []}
        />
        <FilterSelect
          label={t("lecturer.filterSemester") || "Học kỳ"}
          value={query.semester_id || ""}
          onChange={(value) => {
            setQuery((prev) => ({
              ...prev,
              page: 1,
              semester_id: value,
              class_id: "",
              checkpoint_id: "",
              assignment_id: "",
            }));
          }}
          options={semesterOptions || []}
          disabled={!query.year}
        />
        {query.semester_id ? (
          <FilterSelect label={t("filterLabels.class")} value={query.class_id} onChange={(value) => setFilter("class_id", value)} options={classOptions} />
        ) : null}
      </FilterBar>

      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6 rounded-card border border-border bg-subtle">
          <div className="flex flex-col gap-1.5">
            <span className="text-label text-text-secondary">{t("filterLabels.type")}</span>
            <FilterSelectBare
              value={query.source_type}
              onChange={(value) => setFilter("source_type", value)}
              options={sourceOptions}
            />
          </div>

          {query.source_type !== "assignment" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-label text-text-secondary">{t("filterLabels.checkpoint")}</span>
              <FilterSelectBare
                value={query.checkpoint_id}
                onChange={(value) => setFilter("checkpoint_id", value)}
                options={checkpointOptions}
              />
            </div>
          )}

          {query.source_type !== "checkpoint" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-label text-text-secondary">{t("filterLabels.assignment")}</span>
              <FilterSelectBare
                value={query.assignment_id}
                onChange={(value) => setFilter("assignment_id", value)}
                options={assignmentOptions}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-label text-text-secondary">{t("lecturer.gradingPage.filters.submission")}</span>
            <FilterSelectBare
              value={query.status}
              onChange={(value) => setFilter("status", value)}
              options={submissionStatusOptions}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-label text-text-secondary">{t("filterLabels.late")}</span>
            <FilterSelectBare
              value={query.is_late}
              onChange={(value) => setFilter("is_late", value)}
              options={lateOptions}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-label text-text-secondary">{t("admin.columns.evaluations")}</span>
            <FilterSelectBare
              value={query.evaluation_status}
              onChange={(value) => setFilter("evaluation_status", value)}
              options={evaluationFilterOptions}
            />
          </div>
        </div>
      )}

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

      <div className="flex items-center gap-2 text-xs text-text-muted">
        <FileText size={14} />
        {t("lecturer.gradingPage.filesHint")}
      </div>
    </section>
  );
}

function FilterSelectBare({ value, onChange, options = [] }) {
  const normalizedValue = value !== null && value !== undefined ? String(value) : "";
  const normalizedOptions = options.map((opt) => ({ ...opt, value: String(opt.value) }));

  return (
    <Dropdown
      value={normalizedValue}
      onChange={onChange}
      options={normalizedOptions}
      className="w-full relative"
    />
  );
}
