import { useEffect, useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { gradingProgressService, evaluationLookupService } from "@/api/adminEvaluationOps";
import { useAdminList } from "@/hooks/admin/useAdminList";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import GradingProgressTable from "@/pages/admin/evaluation-ops/components/GradingProgressTable";
import ExportScoreModal from "@/pages/admin/evaluation-ops/components/ExportScoreModal";
import { buildClassLabel, getSourceTypeOptions, pageLimit, toSelectOptions } from "@/pages/admin/evaluation-ops/shared";
import { statusOptions } from "@/utils/i18nOptions";
import { useTranslation } from "@/context/TranslationContext";

export default function AdminGradingProgress() {
  const { t } = useTranslation();
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", semester_id: "", subject_id: "", class_id: "", lecturer_id: "", target_type: "", status: "" });
  const { rows, meta, loading, error } = useAdminList(gradingProgressService.list, query);
  const [lookups, setLookups] = useState({ subjects: [], semesters: [], classes: [], graders: [] });
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    evaluationLookupService.getAll()
      .then((res) => setLookups(res?.data || { subjects: [], semesters: [], classes: [], graders: [] }))
      .catch(() => setLookups({ subjects: [], semesters: [], classes: [], graders: [] }));
  }, []);

  const options = useMemo(() => ({
    subjects: toSelectOptions(lookups.subjects, (item) => item.id, (item) => `${item.subject_code} - ${item.subject_name}`, "Tất cả môn"),
    semesters: toSelectOptions(lookups.semesters, (item) => item.id, (item) => item.semester_code, "Tất cả kỳ"),
    classes: toSelectOptions(lookups.classes, (item) => item.id, buildClassLabel, "Tất cả lớp"),
    lecturers: toSelectOptions(lookups.graders, (item) => item.id, (item) => item.full_name || item.email, "Tất cả giảng viên"),
    types: getSourceTypeOptions(t),
    statuses: statusOptions(t, ["", "draft", "open", "closed", "archived", "active", "completed"]),
  }), [lookups, t]);

  const setFilter = (key, value) => setQuery((prev) => ({ ...prev, page: 1, [key]: value }));

  return (
    <>
      <FilterBar
        right={(
          <button type="button" onClick={() => setExportOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <FileDown size={16} /> Export
          </button>
        )}
      >
        <SearchInput value={query.search} onChange={(value) => setFilter("search", value)} placeholder="Class, checkpoint, assignment..." />
        <FilterSelect label="Semester" value={query.semester_id} onChange={(value) => setFilter("semester_id", value)} options={options.semesters} />
        <FilterSelect label="Subject" value={query.subject_id} onChange={(value) => setFilter("subject_id", value)} options={options.subjects} />
        <FilterSelect label="Class" value={query.class_id} onChange={(value) => setFilter("class_id", value)} options={options.classes} />
        <FilterSelect label="Lecturer" value={query.lecturer_id} onChange={(value) => setFilter("lecturer_id", value)} options={options.lecturers} />
        <FilterSelect label="Type" value={query.target_type} onChange={(value) => setFilter("target_type", value)} options={options.types} />
        <FilterSelect label="Status" value={query.status} onChange={(value) => setFilter("status", value)} options={options.statuses} />
      </FilterBar>

      <GradingProgressTable
        rows={rows}
        loading={loading}
        error={error}
        meta={meta}
        onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, ...(limit ? { limit } : {}) }))}
      />

      <ExportScoreModal open={exportOpen} onClose={() => setExportOpen(false)} filters={query} defaultType="progress" />
    </>
  );
}
