import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileDown } from "lucide-react";
import { Link } from "react-router-dom";
import { evaluationLookupService } from "@/api/adminEvaluationOps";
import { useEvaluationResults } from "@/hooks/admin/useEvaluationResults";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import ExportScoreModal from "@/pages/admin/evaluation-ops/components/ExportScoreModal";
import { useTranslation } from "@/context/TranslationContext";
import {
  buildClassLabel,
  formatDate,
  formatScore,
  getResultStatusOptions,
  getSourceTypeOptions,
  pageLimit,
  toSelectOptions,
} from "@/pages/admin/evaluation-ops/shared";

const smallInputClass = "h-10 w-24 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

export default function AdminEvaluationResults() {
  const { t } = useTranslation();
  const sourceTypeOptions = useMemo(() => getSourceTypeOptions(t), [t]);
  const resultStatusOptions = useMemo(() => getResultStatusOptions(t), [t]);
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", semester_id: "", subject_id: "", class_id: "", group_id: "", graded_by: "", status: "", source_type: "", score_min: "", score_max: "" });
  const { rows, meta, loading, error } = useEvaluationResults(query);
  const [lookups, setLookups] = useState({ subjects: [], semesters: [], classes: [], groups: [], graders: [] });
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    evaluationLookupService.getAll()
      .then((res) => setLookups(res?.data || { subjects: [], semesters: [], classes: [], groups: [], graders: [] }))
      .catch(() => setLookups({ subjects: [], semesters: [], classes: [], groups: [], graders: [] }));
  }, []);

  const options = useMemo(() => ({
    subjects: toSelectOptions(lookups.subjects, (item) => item.id, (item) => `${item.subject_code} - ${item.subject_name}`, t("lookupAll.subjects")),
    semesters: toSelectOptions(lookups.semesters, (item) => item.id, (item) => item.semester_code, t("lookupAll.semesters")),
    classes: toSelectOptions(lookups.classes, (item) => item.id, buildClassLabel, t("lookupAll.classes")),
    groups: toSelectOptions(lookups.groups, (item) => item.id, (item) => `${item.group_code || ""} ${item.group_name}`.trim(), t("lookupAll.groups")),
    graders: toSelectOptions(lookups.graders, (item) => item.id, (item) => item.full_name || item.email, t("lookupAll.graders")),
  }), [lookups, t]);

  const columns = [
    { key: "group", label: "Group", render: (row) => <span className="font-semibold text-gray-900">{row.group_code} - {row.group_name}</span> },
    { key: "topic", label: "Project/topic", render: (row) => row.topic || "—" },
    { key: "class", label: "Class", render: (row) => row.class_code },
    { key: "semester", label: "Semester", render: (row) => row.semester_code },
    { key: "item", label: "Checkpoint/Assignment", render: (row) => <div><StatusBadge value={row.source_type} /><p className="mt-1 font-medium text-gray-700">{row.item_title}</p></div> },
    { key: "score", label: "Score", render: (row) => formatScore(row.score, row.max_score) },
    { key: "percentage", label: "%", render: (row) => row.percentage === null || row.percentage === undefined ? "—" : formatPercent(row.percentage) },
    { key: "feedback", label: "Feedback", render: (row) => <span className="line-clamp-2 max-w-[260px]">{row.feedback || "—"}</span> },
    { key: "graded_by", label: "Graded by", render: (row) => row.graded_by_name || "—" },
    { key: "graded_at", label: "Graded at", render: (row) => formatDate(row.graded_at) },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Link to={row.source_type === "checkpoint" ? `/admin/checkpoints/${row.item_id}` : `/admin/assignments/${row.item_id}`}>
            <ActionButton title="Submission"><ExternalLink size={16} /></ActionButton>
          </Link>
          <Link to={`/admin/groups/${row.group_id}`}>
            <ActionButton title="Group" tone="blue"><ExternalLink size={16} /></ActionButton>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <FilterBar
        right={(
          <button type="button" onClick={() => setExportOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <FileDown size={16} /> Export results
          </button>
        )}
      >
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Group, topic, item..." />
        <FilterSelect label={t("filterLabels.semester")} value={query.semester_id} onChange={(semester_id) => setQuery((prev) => ({ ...prev, page: 1, semester_id }))} options={options.semesters} />
        <FilterSelect label={t("filterLabels.subject")} value={query.subject_id} onChange={(subject_id) => setQuery((prev) => ({ ...prev, page: 1, subject_id }))} options={options.subjects} />
        <FilterSelect label={t("filterLabels.class")} value={query.class_id} onChange={(class_id) => setQuery((prev) => ({ ...prev, page: 1, class_id }))} options={options.classes} />
        <FilterSelect label={t("filterLabels.group")} value={query.group_id} onChange={(group_id) => setQuery((prev) => ({ ...prev, page: 1, group_id }))} options={options.groups} />
        <FilterSelect label={t("filterLabels.grader")} value={query.graded_by} onChange={(graded_by) => setQuery((prev) => ({ ...prev, page: 1, graded_by }))} options={options.graders} />
        <FilterSelect label={t("filterLabels.type")} value={query.source_type} onChange={(source_type) => setQuery((prev) => ({ ...prev, page: 1, source_type }))} options={sourceTypeOptions} />
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={resultStatusOptions} />
        <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
          Score
          <input type="number" min="0" className={smallInputClass} value={query.score_min} onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, score_min: e.target.value }))} placeholder="Min" />
          <input type="number" min="0" className={smallInputClass} value={query.score_max} onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, score_max: e.target.value }))} placeholder="Max" />
        </label>
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText="Chưa có kết quả chấm." />
      <ExportScoreModal open={exportOpen} onClose={() => setExportOpen(false)} filters={query} defaultType="results" />
    </>
  );
}
