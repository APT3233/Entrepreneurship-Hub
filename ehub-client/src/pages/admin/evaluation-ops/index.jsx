import { useEffect, useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { adminEvaluationService, evaluationLookupService } from "@/api/adminEvaluationOps";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import EvaluationOverviewCards from "@/pages/admin/evaluation-ops/components/EvaluationOverviewCards";
import ExportScoreModal from "@/pages/admin/evaluation-ops/components/ExportScoreModal";
import { buildClassLabel, getSourceTypeOptions, pageLimit, toSelectOptions } from "@/pages/admin/evaluation-ops/shared";
import { useTranslation } from "@/context/TranslationContext";

export default function AdminEvaluationOverview() {
  const { t } = useTranslation();
  const [query, setQuery] = useState({ semester_id: "", subject_id: "", class_id: "", lecturer_id: "", target_type: "" });
  const [data, setData] = useState({ cards: {}, top_pending_classes: [] });
  const [lookups, setLookups] = useState({ subjects: [], semesters: [], classes: [], graders: [] });
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    evaluationLookupService.getAll()
      .then((res) => setLookups(res?.data || { subjects: [], semesters: [], classes: [], graders: [] }))
      .catch(() => setLookups({ subjects: [], semesters: [], classes: [], graders: [] }));
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminEvaluationService.overview(query)
      .then((res) => {
        if (mounted) setData(res?.data || { cards: {}, top_pending_classes: [] });
      })
      .catch(() => {
        if (mounted) setData({ cards: {}, top_pending_classes: [] });
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [query]);

  const options = useMemo(() => ({
    subjects: toSelectOptions(lookups.subjects, (item) => item.id, (item) => `${item.subject_code} - ${item.subject_name}`, "Tất cả môn"),
    semesters: toSelectOptions(lookups.semesters, (item) => item.id, (item) => item.semester_code, "Tất cả kỳ"),
    classes: toSelectOptions(lookups.classes, (item) => item.id, buildClassLabel, "Tất cả lớp"),
    lecturers: toSelectOptions(lookups.graders, (item) => item.id, (item) => item.full_name || item.email, "Tất cả giảng viên"),
    types: getSourceTypeOptions(t),
  }), [lookups, t]);

  const columns = [
    { key: "class_code", label: "Class" },
    { key: "subject_code", label: "Subject" },
    { key: "semester_code", label: "Semester" },
    { key: "pending_count", label: "Pending", render: (row) => Number(row.pending_count || 0) },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        right={(
          <button type="button" onClick={() => setExportOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <FileDown size={16} /> Export
          </button>
        )}
      >
        <FilterSelect label="Semester" value={query.semester_id} onChange={(semester_id) => setQuery((prev) => ({ ...prev, semester_id }))} options={options.semesters} />
        <FilterSelect label="Subject" value={query.subject_id} onChange={(subject_id) => setQuery((prev) => ({ ...prev, subject_id }))} options={options.subjects} />
        <FilterSelect label="Class" value={query.class_id} onChange={(class_id) => setQuery((prev) => ({ ...prev, class_id }))} options={options.classes} />
        <FilterSelect label="Lecturer" value={query.lecturer_id} onChange={(lecturer_id) => setQuery((prev) => ({ ...prev, lecturer_id }))} options={options.lecturers} />
        <FilterSelect label="Type" value={query.target_type} onChange={(target_type) => setQuery((prev) => ({ ...prev, target_type }))} options={options.types} />
      </FilterBar>

      <EvaluationOverviewCards cards={data.cards} loading={loading} />

      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900">Top lớp chờ chấm</h2>
        <AdminTable
          columns={columns}
          rows={data.top_pending_classes || []}
          loading={loading}
          meta={{ page: 1, limit: pageLimit, total: data.top_pending_classes?.length || 0, totalPages: 1, hasNext: false, hasPrev: false }}
          emptyText="Không có lớp đang chờ chấm."
        />
      </section>

      <ExportScoreModal open={exportOpen} onClose={() => setExportOpen(false)} filters={query} defaultType="results" />
    </div>
  );
}
