import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, XCircle } from "lucide-react";
import IncubationApi from "@/api/incubation";
import { groupService } from "@/api/adminStudentGroup";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { reviewSourceOptions, reviewStatusOptions, SelectField } from "./components";

export default function SelectionReviewsPage() {
  const toast = useToast();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stages, setStages] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", status: "", source_type: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [form, setForm] = useState({ group_id: "", source_type: "manual", nomination_reason: "", support_needed: "", proposed_stage_id: "" });
  const [reviewForm, setReviewForm] = useState({ review_status: "approved", review_note: "", startup_name: "", initial_stage_id: "" });
  const [saving, setSaving] = useState(false);

  const withAll = useCallback((items) => [
    { value: "", label: t("admin.ecosystem.common.all") },
    ...items.map((item) => ({ ...item, label: t(`status.${item.value}`) || item.label })),
  ], [t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reviewsRes, groupsRes, stagesRes] = await Promise.all([
        IncubationApi.listSelectionReviews(query),
        groupService.list({ limit: 100 }),
        IncubationApi.listStages({ limit: 100, status: "active" }),
      ]);
      setRows(reviewsRes?.data || []);
      setMeta(reviewsRes?.meta || null);
      setGroups(groupsRes?.data || []);
      setStages(stagesRes?.data || []);
    } catch (err) {
      setError(err.message || t("admin.ecosystem.selectionReviews.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const groupOptions = useMemo(() => [{ value: "", label: t("admin.ecosystem.selectionReviews.selectGroup") }, ...groups.map((group) => ({ value: String(group.id), label: `${group.group_name || group.group_code} · ${group.class_code || ""}` }))], [groups, t]);
  const stageOptions = useMemo(() => [{ value: "", label: t("admin.ecosystem.selectionReviews.autoStage") }, ...stages.map((stage) => ({ value: String(stage.id), label: stage.name }))], [stages, t]);

  const submitCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (!form.group_id) throw new Error(t("admin.ecosystem.selectionReviews.selectGroup"));
      await IncubationApi.createSelectionReview({ ...form, group_id: Number(form.group_id), proposed_stage_id: form.proposed_stage_id ? Number(form.proposed_stage_id) : null });
      toast.success(t("admin.ecosystem.selectionReviews.created"));
      setCreateOpen(false);
      setForm({ group_id: "", source_type: "manual", nomination_reason: "", support_needed: "", proposed_stage_id: "" });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.selectionReviews.createError"));
    } finally {
      setSaving(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewModal) return;
    setSaving(true);
    try {
      await IncubationApi.reviewSelection(reviewModal.id, { ...reviewForm, initial_stage_id: reviewForm.initial_stage_id ? Number(reviewForm.initial_stage_id) : null });
      toast.success(t("admin.ecosystem.selectionReviews.updated"));
      setReviewModal(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.selectionReviews.reviewError"));
    } finally {
      setSaving(false);
    }
  };

  const openReview = (row, status) => {
    setReviewModal(row);
    setReviewForm({ review_status: status, review_note: "", startup_name: row.startup_name || row.group_name || row.topic || "", initial_stage_id: row.proposed_stage_id ? String(row.proposed_stage_id) : "" });
  };

  const columns = useMemo(() => [
    { key: "group_name", label: t("admin.ecosystem.columns.group"), render: (row) => row.group_name || "-" },
    { key: "topic", label: t("admin.ecosystem.columns.projectTopic"), width: 220, render: (row) => row.topic || row.startup_name || "-" },
    { key: "nominated_by_name", label: t("admin.ecosystem.columns.nominatedBy"), width: 160, render: (row) => row.nominated_by_name || "-" },
    { key: "source_type", label: t("admin.ecosystem.columns.source"), width: 150, render: (row) => <StatusBadge value={row.source_type} /> },
    { key: "average_score", label: t("admin.ecosystem.columns.avg"), width: 90, render: (row) => row.average_score ?? "-" },
    { key: "potential_score", label: t("admin.ecosystem.columns.potential"), width: 100, render: (row) => row.potential_score ?? "-" },
    { key: "review_status", label: t("admin.ecosystem.columns.status"), width: 140, render: (row) => <StatusBadge value={row.review_status} /> },
    { key: "created_at", label: t("admin.ecosystem.columns.created"), width: 140, render: (row) => formatDate(row.created_at) },
    { key: "reviewed_by_name", label: t("admin.ecosystem.columns.reviewedBy"), width: 160, render: (row) => row.reviewed_by_name || "-" },
    { key: "reviewed_at", label: t("admin.ecosystem.columns.reviewed"), width: 140, render: (row) => formatDate(row.reviewed_at) },
    { key: "actions", label: "", width: 140, render: (row) => row.review_status === "pending" ? <div className="flex justify-end gap-1"><button type="button" onClick={() => openReview(row, "approved")} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><CheckCircle2 size={16} /></button><button type="button" onClick={() => openReview(row, "rejected")} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><XCircle size={16} /></button><button type="button" onClick={() => openReview(row, "needs_more_info")} className="rounded-lg px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-50">{t("admin.ecosystem.columns.info")}</button></div> : null },
  ], [t]);

  return (
    <>
      <FilterBar right={<button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover"><Plus size={16} /> {t("admin.ecosystem.selectionReviews.createBtn")}</button>}>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.ecosystem.selectionReviews.searchPlaceholder")} />
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={withAll(reviewStatusOptions)} />
        <FilterSelect label={t("filterLabels.source")} value={query.source_type} onChange={(source_type) => setQuery((prev) => ({ ...prev, page: 1, source_type }))} options={withAll(reviewSourceOptions)} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.ecosystem.selectionReviews.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />
      <FormModal open={createOpen} title={t("admin.ecosystem.selectionReviews.createTitle")} submitLabel={t("admin.ecosystem.common.create")} saving={saving} onClose={() => setCreateOpen(false)} onSubmit={submitCreate}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label={t("admin.ecosystem.columns.group")}><SelectField value={form.group_id} onChange={(group_id) => setForm((prev) => ({ ...prev, group_id }))} options={groupOptions} /></Field><Field label={t("admin.ecosystem.columns.source")}><SelectField value={form.source_type} onChange={(source_type) => setForm((prev) => ({ ...prev, source_type }))} options={reviewSourceOptions.map((item) => ({ ...item, label: t(`status.${item.value}`) || item.label }))} /></Field><Field label={t("admin.ecosystem.selectionReviews.fields.proposedStage")}><SelectField value={form.proposed_stage_id} onChange={(proposed_stage_id) => setForm((prev) => ({ ...prev, proposed_stage_id }))} options={stageOptions} /></Field><Field label={t("admin.ecosystem.columns.potential")}><input type="number" min="0" className={inputClass} value={form.potential_score ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, potential_score: e.target.value === "" ? null : Number(e.target.value) }))} /></Field><div className="sm:col-span-2"><Field label={t("admin.ecosystem.selectionReviews.fields.nominationReason")}><textarea required className={inputClass} rows={4} value={form.nomination_reason} onChange={(e) => setForm((prev) => ({ ...prev, nomination_reason: e.target.value }))} /></Field></div><div className="sm:col-span-2"><Field label={t("admin.ecosystem.selectionReviews.fields.supportNeeded")}><textarea className={inputClass} rows={3} value={form.support_needed || ""} onChange={(e) => setForm((prev) => ({ ...prev, support_needed: e.target.value }))} /></Field></div></div>
      </FormModal>
      <FormModal open={!!reviewModal} title={t("admin.ecosystem.selectionReviews.reviewTitle")} submitLabel={t("admin.ecosystem.selectionReviews.saveReview")} saving={saving} onClose={() => setReviewModal(null)} onSubmit={submitReview}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label={t("admin.ecosystem.selectionReviews.fields.decision")}><SelectField value={reviewForm.review_status} onChange={(review_status) => setReviewForm((prev) => ({ ...prev, review_status }))} options={["approved", "rejected", "needs_more_info"].map((value) => ({ value, label: t(`status.${value}`) || value }))} /></Field>{reviewForm.review_status === "approved" ? <><Field label={t("admin.ecosystem.selectionReviews.fields.startupName")}><input className={inputClass} value={reviewForm.startup_name || ""} onChange={(e) => setReviewForm((prev) => ({ ...prev, startup_name: e.target.value }))} /></Field><Field label={t("admin.ecosystem.selectionReviews.fields.initialStage")}><SelectField value={reviewForm.initial_stage_id} onChange={(initial_stage_id) => setReviewForm((prev) => ({ ...prev, initial_stage_id }))} options={stageOptions} /></Field></> : null}<div className="sm:col-span-2"><Field label={t("admin.ecosystem.selectionReviews.fields.reviewNote")}><textarea className={inputClass} rows={4} value={reviewForm.review_note || ""} onChange={(e) => setReviewForm((prev) => ({ ...prev, review_note: e.target.value }))} /></Field></div></div>
      </FormModal>
    </>
  );
}
