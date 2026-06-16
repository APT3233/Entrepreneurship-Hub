import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Link2, Plus, Search, SquarePen } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { evaluationLookupService, rubricService } from "@/api/adminEvaluationOps";
import { assignmentService, checkpointService } from "@/api/adminProjectSubmission";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import { useAdminColumns } from "@/utils/adminLabels";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import CriteriaTable from "@/pages/admin/evaluation-ops/components/CriteriaTable";
import RubricBuilder from "@/pages/admin/evaluation-ops/components/RubricBuilder";
import RubricCriterionFields from "@/pages/admin/evaluation-ops/components/RubricCriterionFields";
import ScorePreview from "@/pages/admin/evaluation-ops/components/ScorePreview";
import { formatDate } from "@/pages/admin/evaluation-ops/shared";

const TAB_KEYS = ["overview", "criteria", "usage", "preview"];

const emptyCriterion = {
  name: "",
  description: "",
  max_score: 1,
  weight: 1,
  order_index: 1,
  is_required_feedback: false,
};

const normalizeRubricForm = (rubric) => ({
  name: rubric?.name || "",
  subject_id: rubric?.subject_id ? String(rubric.subject_id) : "",
  description: rubric?.description || "",
  total_score: rubric?.total_score || 10,
  status: rubric?.status || "draft",
});

const emptyBindForm = {
  target_type: "checkpoint",
  target_id: "",
};

const getTargetLabel = (target) => {
  const parts = [
    target.title,
    target.class_code || target.classCode,
    target.subject_code || target.subjectCode,
    target.semester_code || target.semesterCode,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : `#${target.id}`;
};

export default function AdminRubricDetail({
  basePath = "/admin/evaluation/rubrics",
  loadSubjects,
  targetServices,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const c = useAdminColumns();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [detail, setDetail] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [rubricForm, setRubricForm] = useState(normalizeRubricForm(null));
  const [criterionModal, setCriterionModal] = useState({ open: false, criterion: null });
  const [criterionForm, setCriterionForm] = useState(emptyCriterion);
  const [deleteCriterion, setDeleteCriterion] = useState(null);
  const [bindOpen, setBindOpen] = useState(false);
  const [bindForm, setBindForm] = useState(emptyBindForm);
  const [bindSearch, setBindSearch] = useState("");
  const [bindTargets, setBindTargets] = useState([]);
  const [bindLoading, setBindLoading] = useState(false);
  const [bindError, setBindError] = useState("");
  const [saving, setSaving] = useState(false);

  const tabs = useMemo(
    () => TAB_KEYS.map((key) => ({ key, label: t(`admin.rubric.tabs.${key}`) })),
    [t],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await rubricService.get(id);
      setDetail(res?.data || null);
    } catch (err) {
      setError(err.message || t("admin.rubric.toasts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

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

  const rubric = detail || {};
  const criteria = detail?.criteria || [];
  const bindings = detail?.bindings || [];
  const nextOrderIndex = useMemo(() => criteria.length + 1, [criteria.length]);
  const boundTargetKeys = useMemo(
    () => new Set(bindings.map((binding) => `${binding.target_type}:${binding.target_id}`)),
    [bindings],
  );
  const availableBindTargets = useMemo(
    () => bindTargets.filter((target) => !boundTargetKeys.has(`${bindForm.target_type}:${target.id}`)),
    [bindForm.target_type, bindTargets, boundTargetKeys],
  );

  const usageColumns = useMemo(() => [
    { key: "target_type", label: t("filterLabels.type"), render: (row) => <StatusBadge value={row.target_type} /> },
    { key: "target_title", label: t("admin.rubric.target"), render: (row) => <span className="font-semibold text-gray-900">{row.target_title || `#${row.target_id}`}</span> },
    { key: "class_code", label: c.class, render: (row) => row.class_code || "—" },
    { key: "created_at", label: t("admin.rubric.boundAt"), render: (row) => formatDate(row.created_at) },
  ], [t, c]);

  const openEditRubric = () => {
    setRubricForm(normalizeRubricForm(rubric));
    setEditOpen(true);
  };

  const loadBindTargets = useCallback(async () => {
    setBindLoading(true);
    setBindError("");
    try {
      const services = targetServices || { assignment: assignmentService, checkpoint: checkpointService };
      const service = bindForm.target_type === "assignment" ? services.assignment : services.checkpoint;
      const res = await service.list({ page: 1, limit: 100, search: bindSearch.trim() });
      setBindTargets(res?.data || []);
    } catch (err) {
      setBindTargets([]);
      setBindError(err.message || t("admin.rubric.bind.toasts.loadTargetsError"));
    } finally {
      setBindLoading(false);
    }
  }, [bindForm.target_type, bindSearch, t, targetServices]);

  useEffect(() => {
    if (!bindOpen) return;
    loadBindTargets();
  }, [bindOpen, loadBindTargets]);

  const openBindRubric = () => {
    if (rubric.status !== "active") {
      toast.error(t("admin.rubric.bind.toasts.activeOnly"));
      return;
    }
    setBindForm(emptyBindForm);
    setBindSearch("");
    setBindTargets([]);
    setBindError("");
    setBindOpen(true);
  };

  const saveBinding = async (event) => {
    event.preventDefault();
    if (!bindForm.target_id) {
      toast.error(t("admin.rubric.bind.toasts.selectTarget"));
      return;
    }
    setSaving(true);
    try {
      const res = await rubricService.bind(id, {
        target_type: bindForm.target_type,
        target_id: bindForm.target_id,
      });
      setDetail(res?.data || null);
      setBindOpen(false);
      toast.success(t("admin.rubric.bind.toasts.success"));
    } catch (err) {
      toast.error(err.message || t("admin.rubric.bind.toasts.error"));
    } finally {
      setSaving(false);
    }
  };

  const saveRubric = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: rubricForm.name.trim(),
        subject_id: rubricForm.subject_id ? Number(rubricForm.subject_id) : null,
        description: rubricForm.description || null,
        total_score: Number(rubricForm.total_score),
        status: rubricForm.status,
      };
      const res = await rubricService.update(id, payload);
      setDetail(res?.data || null);
      setEditOpen(false);
      toast.success(t("admin.rubric.toasts.updateSuccess"));
    } catch (err) {
      toast.error(err.message || t("admin.rubric.toasts.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const cloneRubric = async () => {
    setSaving(true);
    try {
      const res = await rubricService.clone(id);
      toast.success(t("admin.rubric.toasts.cloneSuccess"));
      if (res?.data?.id) navigate(`${basePath}/${res.data.id}`);
    } catch (err) {
      toast.error(err.message || t("admin.rubric.toasts.cloneError"));
    } finally {
      setSaving(false);
    }
  };

  const openCreateCriterion = () => {
    setCriterionForm({ ...emptyCriterion, order_index: nextOrderIndex });
    setCriterionModal({ open: true, criterion: null });
  };

  const openEditCriterion = (criterion) => {
    setCriterionForm({
      name: criterion.name || "",
      description: criterion.description || "",
      max_score: criterion.max_score || 1,
      weight: criterion.weight ?? 1,
      order_index: criterion.order_index || 1,
      is_required_feedback: Boolean(criterion.is_required_feedback),
    });
    setCriterionModal({ open: true, criterion });
  };

  const saveCriterion = async (event) => {
    event.preventDefault();
    if (!criterionForm.name.trim()) {
      toast.error(t("admin.rubric.toasts.criterionNameRequired"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: criterionForm.name.trim(),
        description: criterionForm.description || null,
        max_score: Number(criterionForm.max_score),
        weight: Number(criterionForm.weight || 0),
        order_index: Number(criterionForm.order_index || 1),
        is_required_feedback: Boolean(criterionForm.is_required_feedback),
      };
      const res = criterionModal.criterion
        ? await rubricService.updateCriterion(id, criterionModal.criterion.id, payload)
        : await rubricService.createCriterion(id, payload);
      setDetail(res?.data || null);
      setCriterionModal({ open: false, criterion: null });
      toast.success(
        criterionModal.criterion
          ? t("admin.rubric.toasts.criterionUpdateSuccess")
          : t("admin.rubric.toasts.criterionAddSuccess"),
      );
    } catch (err) {
      toast.error(err.message || t("admin.rubric.toasts.criterionSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteCriterion = async () => {
    if (!deleteCriterion) return;
    setSaving(true);
    try {
      const res = await rubricService.deleteCriterion(id, deleteCriterion.id);
      setDetail(res?.data || null);
      setDeleteCriterion(null);
      toast.success(t("admin.rubric.toasts.criterionDeleteSuccess"));
    } catch (err) {
      toast.error(err.message || t("admin.rubric.toasts.criterionDeleteError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">
        {t("common.loading")}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm font-medium text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-gray-900">{rubric.name}</h1>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">v{rubric.version || 1}</span>
              <StatusBadge value={rubric.status} />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {rubric.subject_code ? `${rubric.subject_code} - ${rubric.subject_name}` : t("admin.rubric.noSubjectLinked")}
            </p>
            {rubric.description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{rubric.description}</p> : null}
          </div>
          <div className="flex gap-2">
            <ActionButton onClick={openEditRubric} title={t("admin.rubric.editRubric")}><SquarePen size={16} /></ActionButton>
            <ActionButton onClick={cloneRubric} title={t("admin.rubric.cloneVersion")} tone="blue"><Copy size={16} /></ActionButton>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${activeTab === tab.key ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400">{c.totalScore}</p>
            <p className="mt-2 text-2xl font-black text-gray-900">{Number(rubric.total_score || 0)}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400">{t("admin.rubric.tabs.criteria")}</p>
            <p className="mt-2 text-2xl font-black text-gray-900">{criteria.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400">{c.bindings}</p>
            <p className="mt-2 text-2xl font-black text-gray-900">{bindings.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400">{c.evaluations}</p>
            <p className="mt-2 text-2xl font-black text-gray-900">{Number(rubric.evaluation_count || 0)}</p>
          </div>
        </div>
      ) : null}
      {activeTab === "criteria" ? (
        <CriteriaTable
          criteria={criteria}
          onAdd={openCreateCriterion}
          onEdit={openEditCriterion}
          onDelete={setDeleteCriterion}
        />
      ) : null}
      {activeTab === "usage" ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">{t("admin.rubric.bind.usageTitle")}</p>
              <p className="mt-1 text-xs text-gray-500">{t("admin.rubric.bind.usageHint")}</p>
            </div>
            <button
              type="button"
              onClick={openBindRubric}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={rubric.status !== "active"}
              title={rubric.status !== "active" ? t("admin.rubric.bind.activeRequiredTitle") : t("admin.rubric.bind.submitLabel")}
            >
              <Link2 size={16} />
              {t("admin.rubric.bind.bindButton")}
            </button>
          </div>
          <AdminTable columns={usageColumns} rows={bindings} emptyText={t("admin.rubric.usageEmpty")} />
        </div>
      ) : null}
      {activeTab === "preview" ? <ScorePreview criteria={criteria} totalScore={rubric.total_score} /> : null}

      <FormModal open={editOpen} title={t("admin.rubric.edit")} onClose={() => setEditOpen(false)} onSubmit={saveRubric} saving={saving}>
        <RubricBuilder subjects={subjects} form={rubricForm} onChange={setRubricForm} />
      </FormModal>

      <FormModal
        open={criterionModal.open}
        title={criterionModal.criterion ? t("admin.rubric.editCriterion") : t("admin.rubric.addCriterion")}
        onClose={() => setCriterionModal({ open: false, criterion: null })}
        onSubmit={saveCriterion}
        saving={saving}
      >
        <RubricCriterionFields form={criterionForm} onChange={setCriterionForm} />
      </FormModal>

      <FormModal
        open={bindOpen}
        title={t("admin.rubric.bind.title")}
        onClose={() => setBindOpen(false)}
        onSubmit={saveBinding}
        submitLabel={t("admin.rubric.bind.submitLabel")}
        saving={saving}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {t("admin.rubric.bind.hint")}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("admin.rubric.bind.targetType")}>
              <select
                className={inputClass}
                value={bindForm.target_type}
                onChange={(event) => {
                  setBindForm({ target_type: event.target.value, target_id: "" });
                  setBindTargets([]);
                }}
              >
                <option value="checkpoint">{t("status.checkpoint")}</option>
                <option value="assignment">{t("status.assignment")}</option>
              </select>
            </Field>

            <Field label={t("admin.rubric.bind.search")}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  className={`${inputClass} pl-9`}
                  value={bindSearch}
                  onChange={(event) => setBindSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.preventDefault();
                  }}
                  placeholder={t("searchPlaceholders.bindRubric")}
                />
              </div>
            </Field>
          </div>

          <Field label={bindForm.target_type === "assignment" ? t("filterLabels.assignment") : t("filterLabels.checkpoint")}>
            <select
              className={inputClass}
              value={bindForm.target_id}
              onChange={(event) => setBindForm((prev) => ({ ...prev, target_id: event.target.value }))}
              disabled={bindLoading}
            >
              <option value="">
                {bindLoading
                  ? t("admin.rubric.bind.loadingTargets")
                  : availableBindTargets.length
                    ? t("admin.rubric.bind.selectTarget")
                    : t("admin.rubric.bind.noTargets")}
              </option>
              {availableBindTargets.map((target) => (
                <option key={target.id} value={target.id}>
                  {getTargetLabel(target)}
                </option>
              ))}
            </select>
          </Field>

          {bindError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {bindError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={loadBindTargets}
            disabled={bindLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} />
            {t("admin.rubric.bind.reloadList")}
          </button>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={Boolean(deleteCriterion)}
        title={t("admin.rubric.deleteCriterion.title")}
        subtitle={t("admin.rubric.deleteCriterion.subtitle")}
        variant="delete"
        color="red"
        yesLabel={t("admin.actions.delete")}
        onYes={confirmDeleteCriterion}
        onClose={() => setDeleteCriterion(null)}
        onNo={() => setDeleteCriterion(null)}
      />
    </div>
  );
}
