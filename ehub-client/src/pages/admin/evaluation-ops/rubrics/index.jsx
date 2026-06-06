import { useEffect, useMemo, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { evaluationLookupService, rubricService } from "@/api/adminEvaluationOps";
import { useRubrics } from "@/hooks/admin/useRubrics";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal from "@/pages/admin/components/FormModal";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import RubricBuilder from "@/pages/admin/evaluation-ops/components/RubricBuilder";
import { useTranslation } from "@/context/TranslationContext";
import { useAdminColumns } from "@/utils/adminLabels";
import { formatDate, getRubricStatusOptions, pageLimit, toSelectOptions } from "@/pages/admin/evaluation-ops/shared";

const emptyForm = {
  name: "",
  subject_id: "",
  description: "",
  total_score: 10,
  status: "draft",
};

export default function AdminRubrics({ basePath = "/admin/evaluation/rubrics", loadSubjects }) {
  const { t } = useTranslation();
  const toast = useToast();
  const c = useAdminColumns();
  const rubricStatusOptions = useMemo(() => getRubricStatusOptions(t), [t]);
  const navigate = useNavigate();
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", subject_id: "", status: "" });
  const { rows, meta, loading, error, refetch } = useRubrics(query);
  const [subjects, setSubjects] = useState([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSubjects = loadSubjects
      ? loadSubjects
      : async () => {
          const res = await evaluationLookupService.getAll();
          return res?.data?.subjects || [];
        };
    fetchSubjects()
      .then((items) => setSubjects(items || []))
      .catch(() => setSubjects([]));
  }, [loadSubjects]);

  const subjectOptions = useMemo(
    () => toSelectOptions(subjects, (item) => item.id, (item) => `${item.subject_code} - ${item.subject_name}`, t("lookupAll.subjects")),
    [subjects, t],
  );

  const columns = useMemo(() => [
    { key: "name", label: c.rubric, render: (row) => <span className="font-semibold text-gray-900">{row.name || row.rubric_name}</span> },
    { key: "version", label: c.version, render: (row) => `v${row.version || 1}` },
    { key: "subject", label: c.subject, render: (row) => row.subject_name || row.subject_code || "—" },
    { key: "total_score", label: c.totalScore },
    { key: "criteria_count", label: t("admin.rubric.tabs.criteria"), render: (row) => Number(row.criteria_count || 0) },
    { key: "bindings_count", label: c.bindings, render: (row) => Number(row.bindings_count || 0) },
    { key: "evaluation_count", label: c.evaluations, render: (row) => Number(row.evaluation_count || 0) },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "created_by", label: c.createdBy, render: (row) => row.created_by_name || "—" },
    { key: "created_at", label: c.created, render: (row) => formatDate(row.created_at) },
    { key: "updated_at", label: c.updated, render: (row) => formatDate(row.updated_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end">
          <ActionButton onClick={() => navigate(`${basePath}/${row.id}`)} title={t("admin.rubric.detail")}><Eye size={16} /></ActionButton>
        </div>
      ),
    },
  ], [basePath, c, t, navigate]);

  const saveRubric = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("admin.rubric.toasts.createNameRequired"));
      return;
    }
    if (Number(form.total_score) <= 0) {
      toast.error(t("admin.rubric.toasts.createTotalScoreInvalid"));
      return;
    }
    setSaving(true);
    try {
      const res = await rubricService.create({
        name: form.name.trim(),
        subject_id: form.subject_id ? Number(form.subject_id) : null,
        description: form.description || null,
        total_score: Number(form.total_score),
        status: form.status || "draft",
      });
      toast.success(t("admin.rubric.toasts.createSuccess"));
      setBuilderOpen(false);
      setForm(emptyForm);
      await refetch(true);
      if (res?.data?.id) navigate(`${basePath}/${res.data.id}`);
    } catch (err) {
      toast.error(err.message || t("admin.rubric.toasts.createError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div>
        <FilterBar
          right={(
            <button type="button" onClick={() => { setForm(emptyForm); setBuilderOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              <Plus size={16} /> {t("admin.rubric.create")}
            </button>
          )}
        >
          <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("searchPlaceholders.rubrics")} />
          <FilterSelect label={t("filterLabels.subject")} value={query.subject_id} onChange={(subject_id) => setQuery((prev) => ({ ...prev, page: 1, subject_id }))} options={subjectOptions} />
          <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={rubricStatusOptions} />
        </FilterBar>
        <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, ...(limit ? { limit } : {}) }))} emptyText={t("admin.rubric.emptyList")} />
      </div>
      <FormModal open={builderOpen} title={t("admin.rubric.create")} onClose={() => setBuilderOpen(false)} onSubmit={saveRubric} saving={saving}>
        <RubricBuilder subjects={subjects} form={form} onChange={setForm} />
      </FormModal>
    </>
  );
}
