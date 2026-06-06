import { useEffect, useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { evaluationLookupService, gradeAuditService } from "@/api/adminEvaluationOps";
import { useAdminList } from "@/hooks/admin/useAdminList";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import GradeAuditViewer from "@/pages/admin/evaluation-ops/components/GradeAuditViewer";
import ExportScoreModal from "@/pages/admin/evaluation-ops/components/ExportScoreModal";
import { useTranslation } from "@/context/TranslationContext";
import { pageLimit, toSelectOptions } from "@/pages/admin/evaluation-ops/shared";

const tableOptionValues = [
  { value: "", labelKey: "admin.columns.allTables" },
  { value: "evaluation_sessions", label: "evaluation_sessions" },
  { value: "evaluation_scores", label: "evaluation_scores" },
  { value: "checkpoint_submissions", label: "checkpoint_submissions" },
  { value: "assignment_submissions", label: "assignment_submissions" },
  { value: "rubrics", label: "rubrics" },
  { value: "rubric_criteria", label: "rubric_criteria" },
  { value: "rubric_bindings", label: "rubric_bindings" },
];

export default function AdminGradeAudit() {
  const { t } = useTranslation();
  const tableOptions = useMemo(
    () => tableOptionValues.map((item) => ({ value: item.value, label: item.labelKey ? t(item.labelKey) : (item.label || item.value) })),
    [t],
  );
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", user_id: "", action: "", table_name: "", date_from: "", date_to: "" });
  const { rows, meta, loading, error } = useAdminList(gradeAuditService.list, query);
  const [lookups, setLookups] = useState({ graders: [], auditActions: [] });
  const [selected, setSelected] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    evaluationLookupService.getAll()
      .then((res) => setLookups(res?.data || { graders: [], auditActions: [] }))
      .catch(() => setLookups({ graders: [], auditActions: [] }));
  }, []);

  const options = useMemo(() => ({
    users: toSelectOptions(lookups.graders, (item) => item.id, (item) => item.full_name || item.email, t("lookupAll.graders")),
    actions: toSelectOptions(lookups.auditActions, (item) => item.action || item, (item) => item.action || item, t("filters.all")),
  }), [lookups, t]);

  const setFilter = (key, value) => setQuery((prev) => ({ ...prev, page: 1, [key]: value }));

  return (
    <>
      <FilterBar
        right={(
          <button type="button" onClick={() => setExportOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <FileDown size={16} /> {t("common.export")}
          </button>
        )}
      >
        <SearchInput value={query.search} onChange={(value) => setFilter("search", value)} placeholder={t("searchPlaceholders.gradeAudit")} />
        <FilterSelect label={t("admin.evaluationOps.gradeAudit.user")} value={query.user_id} onChange={(value) => setFilter("user_id", value)} options={options.users} />
        <FilterSelect label={t("admin.evaluationOps.gradeAudit.action")} value={query.action} onChange={(value) => setFilter("action", value)} options={options.actions} />
        <FilterSelect label={t("admin.evaluationOps.gradeAudit.table")} value={query.table_name} onChange={(value) => setFilter("table_name", value)} options={tableOptions} />
        <input type="date" value={query.date_from} onChange={(event) => setFilter("date_from", event.target.value)} className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" />
        <input type="date" value={query.date_to} onChange={(event) => setFilter("date_to", event.target.value)} className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" />
      </FilterBar>

      <GradeAuditViewer
        rows={rows}
        loading={loading}
        error={error}
        meta={meta}
        onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, ...(limit ? { limit } : {}) }))}
        selected={selected}
        onSelect={setSelected}
        onClose={() => setSelected(null)}
      />

      <ExportScoreModal open={exportOpen} onClose={() => setExportOpen(false)} filters={query} defaultType="grade_audit" />
    </>
  );
}
