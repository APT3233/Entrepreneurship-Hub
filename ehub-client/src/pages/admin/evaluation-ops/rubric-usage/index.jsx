import { useEffect, useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { evaluationLookupService, rubricService, rubricUsageService } from "@/api/adminEvaluationOps";
import { useToast } from "@/components/ui/Toast";
import { useAdminList } from "@/hooks/admin/useAdminList";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import RubricUsageTable from "@/pages/admin/evaluation-ops/components/RubricUsageTable";
import ExportScoreModal from "@/pages/admin/evaluation-ops/components/ExportScoreModal";
import { getBooleanOptions, getRubricStatusOptions, pageLimit, toSelectOptions } from "@/pages/admin/evaluation-ops/shared";
import { useTranslation } from "@/context/TranslationContext";

export default function AdminRubricUsage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", subject_id: "", status: "", unused_only: "" });
  const { rows, meta, loading, error, refetch } = useAdminList(rubricUsageService.list, query);
  const [lookups, setLookups] = useState({ subjects: [] });
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    evaluationLookupService.getAll()
      .then((res) => setLookups(res?.data || { subjects: [] }))
      .catch(() => setLookups({ subjects: [] }));
  }, []);

  const options = useMemo(() => ({
    subjects: toSelectOptions(lookups.subjects, (item) => item.id, (item) => `${item.subject_code} - ${item.subject_name}`, t("lookupAll.subjects")),
    statuses: getRubricStatusOptions(t),
    unused: getBooleanOptions(t),
  }), [lookups, t]);

  const setFilter = (key, value) => setQuery((prev) => ({ ...prev, page: 1, [key]: value }));

  const cloneRubric = async (row) => {
    try {
      await rubricService.clone(row.id, { name: `${row.rubric_name} v${Number(row.rubric_version || 1) + 1}` });
      toast.success(t("admin.rubricUsagePage.cloneSuccess"));
      refetch(true);
    } catch (err) {
      toast.error(err.message || t("admin.rubricUsagePage.cloneError"));
    }
  };

  return (
    <>
      <FilterBar
        right={(
          <button type="button" onClick={() => setExportOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <FileDown size={16} /> {t("common.export")}
          </button>
        )}
      >
        <SearchInput value={query.search} onChange={(value) => setFilter("search", value)} placeholder={t("searchPlaceholders.rubricUsage")} />
        <FilterSelect label={t("filterLabels.subject")} value={query.subject_id} onChange={(value) => setFilter("subject_id", value)} options={options.subjects} />
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(value) => setFilter("status", value)} options={options.statuses} />
        <FilterSelect label={t("filterLabels.unused")} value={query.unused_only} onChange={(value) => setFilter("unused_only", value)} options={options.unused} />
      </FilterBar>

      <RubricUsageTable
        rows={rows}
        loading={loading}
        error={error}
        meta={meta}
        onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, ...(limit ? { limit } : {}) }))}
        onClone={cloneRubric}
      />

      <ExportScoreModal open={exportOpen} onClose={() => setExportOpen(false)} filters={query} defaultType="rubric_usage" />
    </>
  );
}
