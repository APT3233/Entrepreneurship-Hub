import { useEffect, useMemo, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { evaluationLookupService } from "@/api/adminEvaluationOps";
import { useRubrics } from "@/hooks/admin/useRubrics";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal from "@/pages/admin/components/FormModal";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import RubricBuilder from "@/pages/admin/evaluation-ops/components/RubricBuilder";
import PlannedState from "@/pages/admin/evaluation-ops/components/PlannedState";
import { useTranslation } from "@/context/TranslationContext";
import { formatDate, getRubricStatusOptions, getRubricTypeOptions, pageLimit, toSelectOptions } from "@/pages/admin/evaluation-ops/shared";

const emptyForm = {
  rubric_name: "",
  subject_id: "",
  type: "checkpoint",
  description: "",
  total_score: 10,
  status: "draft",
};

export default function AdminRubrics() {
  const { t } = useTranslation();
  const rubricTypeOptions = useMemo(() => getRubricTypeOptions(t), [t]);
  const rubricStatusOptions = useMemo(() => getRubricStatusOptions(t), [t]);
  const navigate = useNavigate();
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", subject_id: "", type: "", status: "" });
  const { rows, meta, loading, error } = useRubrics(query);
  const [subjects, setSubjects] = useState([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    evaluationLookupService.getAll()
      .then((res) => setSubjects(res?.data?.subjects || []))
      .catch(() => setSubjects([]));
  }, []);

  const subjectOptions = useMemo(
    () => toSelectOptions(subjects, (item) => item.id, (item) => `${item.subject_code} - ${item.subject_name}`, t("lookupAll.subjects")),
    [subjects, t],
  );

  const columns = [
    { key: "rubric_name", label: "Rubric", render: (row) => <span className="font-semibold text-gray-900">{row.rubric_name}</span> },
    { key: "subject", label: "Subject", render: (row) => row.subject_name || row.subject_code || "—" },
    { key: "type", label: "Type", render: (row) => <StatusBadge value={row.type} /> },
    { key: "total_score", label: "Total score" },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "created_by", label: "Created by", render: (row) => row.created_by_name || "—" },
    { key: "created_at", label: "Created", render: (row) => formatDate(row.created_at) },
    { key: "updated_at", label: "Updated", render: (row) => formatDate(row.updated_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end">
          <ActionButton onClick={() => navigate(`/admin/evaluation/rubrics/${row.id}`)} title="Chi tiết"><Eye size={16} /></ActionButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <PlannedState
        title="Rubric API is not implemented yet"
        message="Hệ thống chưa có bảng rubrics/rubric_criteria/rubric_scores, nên màn này chỉ dựng khung tích hợp và không dùng dữ liệu giả."
      />
      <div className="mt-4">
        <FilterBar
          right={(
            <button type="button" onClick={() => { setForm(emptyForm); setBuilderOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              <Plus size={16} /> Create rubric
            </button>
          )}
        >
          <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Rubric name..." />
          <FilterSelect label={t("filterLabels.subject")} value={query.subject_id} onChange={(subject_id) => setQuery((prev) => ({ ...prev, page: 1, subject_id }))} options={subjectOptions} />
          <FilterSelect label={t("filterLabels.type")} value={query.type} onChange={(type) => setQuery((prev) => ({ ...prev, page: 1, type }))} options={rubricTypeOptions} />
          <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={rubricStatusOptions} />
        </FilterBar>
        <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText="Rubric API is not implemented yet." />
      </div>
      <FormModal open={builderOpen} title="Create rubric" onClose={() => setBuilderOpen(false)} onSubmit={(e) => { e.preventDefault(); setBuilderOpen(false); }} submitLabel="Planned">
        <RubricBuilder subjects={subjects} form={form} onChange={setForm} planned />
      </FormModal>
    </>
  );
}
