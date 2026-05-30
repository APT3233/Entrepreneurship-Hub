import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { evaluationLookupService } from "@/api/adminEvaluationOps";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import ExportScoreModal from "@/pages/admin/evaluation-ops/components/ExportScoreModal";
import { buildClassLabel, getSourceTypeOptions, toSelectOptions } from "@/pages/admin/evaluation-ops/shared";
import { useTranslation } from "@/context/TranslationContext";

export default function AdminEvaluationExports() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ semester_id: "", subject_id: "", class_id: "", lecturer_id: "", target_type: "" });
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
  }), [lookups, t]);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4">
      <FilterBar
        right={(
          <button type="button" onClick={() => setExportOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <Download size={16} /> Export
          </button>
        )}
      >
        <FilterSelect label="Semester" value={filters.semester_id} onChange={(value) => setFilter("semester_id", value)} options={options.semesters} />
        <FilterSelect label="Subject" value={filters.subject_id} onChange={(value) => setFilter("subject_id", value)} options={options.subjects} />
        <FilterSelect label="Class" value={filters.class_id} onChange={(value) => setFilter("class_id", value)} options={options.classes} />
        <FilterSelect label="Lecturer" value={filters.lecturer_id} onChange={(value) => setFilter("lecturer_id", value)} options={options.lecturers} />
        <FilterSelect label="Type" value={filters.target_type} onChange={(value) => setFilter("target_type", value)} options={options.types} />
      </FilterBar>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">Export Scores</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
              Xuất điểm theo lớp, checkpoint, assignment, nhóm, rubric criteria, feedback và grading progress. Dữ liệu export dùng đúng bộ lọc đang chọn.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FileSpreadsheet size={26} />
          </div>
        </div>
      </section>

      <ExportScoreModal open={exportOpen} onClose={() => setExportOpen(false)} filters={filters} defaultType="results" />
    </div>
  );
}
