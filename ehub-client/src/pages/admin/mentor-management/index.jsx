import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Eye, Plus, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminMentorApi from "@/api/adminMentors";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import { inputClass } from "@/pages/admin/components/FormModal";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { ExpertiseTag, MentorAvatar, mentorTypeOptions, visibilityOptions } from "./components";

export default function AdminMentors() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [areas, setAreas] = useState([]);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", mentor_type: "", status: "", visibility: "", expertise_id: "", min_years: "", max_years: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mentorsRes, areasRes] = await Promise.all([
        AdminMentorApi.getMentors(query),
        AdminMentorApi.getExpertiseAreas({ limit: 100, status: "active" }),
      ]);
      setRows(mentorsRes?.data || []);
      setMeta(mentorsRes?.meta || null);
      setAreas(areasRes?.data || []);
    } catch (err) {
      setError(err.message || t("admin.mentors.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const typeOptions = useMemo(() => [
    { value: "", label: t("common.all") || "All" },
    ...mentorTypeOptions.map((opt) => ({ value: opt.value, label: t(`status.${opt.value}`) })),
  ], [t]);

  const statusOptions = useMemo(() => [
    { value: "", label: t("common.all") || "All" },
    ...["pending", "active", "inactive", "rejected", "archived"].map((value) => ({
      value,
      label: t(`status.${value}`),
    })),
  ], [t]);

  const localizedVisibilityOptions = useMemo(() => [
    { value: "", label: t("common.all") || "All" },
    ...visibilityOptions.map((opt) => ({ value: opt.value, label: t(`status.${opt.value}`) })),
  ], [t]);

  const expertiseOptions = useMemo(() => [
    { value: "", label: t("common.all") || "All" },
    ...areas.map((area) => ({ value: String(area.id), label: area.name })),
  ], [areas, t]);

  const updateStatus = async () => {
    if (!confirm) return;
    try {
      await AdminMentorApi.updateMentorStatus(confirm.mentor.id, confirm.status);
      toast.success(t("admin.mentors.statusUpdated"));
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.mentors.actionFailed"));
    }
  };

  const columns = useMemo(() => [
    { key: "avatar", label: t("admin.mentors.avatar"), width: 80, render: (row) => <MentorAvatar mentor={row} /> },
    { key: "full_name", label: t("admin.mentors.name"), width: 190, render: (row) => <button type="button" onClick={() => navigate(`/admin/mentors/${row.id}`)} className="text-left font-black text-slate-900 hover:text-accent">{row.full_name}</button> },
    { key: "email", label: t("admin.mentors.email"), width: 220 },
    { key: "mentor_type", label: t("admin.mentors.type"), width: 160, render: (row) => <StatusBadge value={row.mentor_type} /> },
    { key: "organization", label: t("admin.mentors.organization"), width: 190, render: (row) => row.organization || "—" },
    { key: "position_title", label: t("admin.mentors.position"), width: 180, render: (row) => row.position_title || "—" },
    { key: "expertise", label: t("admin.mentors.expertise"), width: 240, render: (row) => <div className="flex flex-wrap gap-1">{(row.expertise_names || []).slice(0, 3).map((name) => <ExpertiseTag key={name} label={name} />)}{(row.expertise_names || []).length > 3 ? <span className="text-xs font-bold text-slate-400">+{row.expertise_names.length - 3}</span> : null}</div> },
    { key: "years_of_experience", label: t("admin.mentors.years"), width: 90, render: (row) => row.years_of_experience ?? "—" },
    { key: "status", label: t("admin.mentors.status"), width: 120, render: (row) => <StatusBadge value={row.status} /> },
    { key: "visibility", label: t("admin.mentors.visibility"), width: 120, render: (row) => <StatusBadge value={row.visibility} /> },
    { key: "reviewed", label: t("admin.mentors.reviewed"), width: 200, render: (row) => row.reviewed_at ? <div className="space-y-0.5"><p className="font-semibold text-slate-700">{row.reviewed_by_name || "—"}</p>{formatDate(row.reviewed_at)}</div> : "—" },
    { key: "created_at", label: t("admin.mentors.created"), width: 150, render: (row) => formatDate(row.created_at) },
    { key: "actions", label: "", width: 190, render: (row) => (
      <div className="flex justify-end gap-1">
        <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/admin/mentors/${row.id}`); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50" title="View"><Eye size={16} /></button>
        {row.status === "pending" ? <button type="button" onClick={(e) => { e.stopPropagation(); setConfirm({ mentor: row, status: "active", actionKey: "approve", variant: "confirm", color: "green" }); }} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" title="Approve"><CheckCircle2 size={16} /></button> : null}
        {row.status === "pending" ? <button type="button" onClick={(e) => { e.stopPropagation(); setConfirm({ mentor: row, status: "rejected", actionKey: "reject", variant: "warning", color: "red" }); }} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Reject"><XCircle size={16} /></button> : null}
        {row.status === "inactive" ? <button type="button" onClick={(e) => { e.stopPropagation(); setConfirm({ mentor: row, status: "active", actionKey: "activate", variant: "confirm", color: "green" }); }} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" title="Activate"><CheckCircle2 size={16} /></button> : null}
        {row.status === "active" ? <button type="button" onClick={(e) => { e.stopPropagation(); setConfirm({ mentor: row, status: "inactive", actionKey: "inactivate", variant: "warning", color: "red" }); }} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Inactivate"><XCircle size={16} /></button> : null}
        {row.status !== "archived" ? <button type="button" onClick={(e) => { e.stopPropagation(); setConfirm({ mentor: row, status: "archived", actionKey: "archive", variant: "archive", color: "red" }); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50" title="Archive"><Archive size={16} /></button> : null}
      </div>
    ) },
  ], [navigate, t]);

  const confirmTitle = useMemo(() => {
    if (!confirm) return "";
    return t(`admin.mentors.${confirm.actionKey}Title`);
  }, [confirm, t]);

  const confirmSubtitle = useMemo(() => {
    if (!confirm) return "";
    return t("admin.mentors.confirmSubtitle", {
      name: confirm.mentor.full_name,
      status: t(`status.${confirm.status}`),
    });
  }, [confirm, t]);

  return (
    <>
      <FilterBar right={<button type="button" onClick={() => navigate("/admin/users?page=1&create=mentor")} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover"><Plus size={16} /> {t("admin.mentors.create")}</button>}>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.mentors.searchPlaceholder")} />
        <FilterSelect label={t("admin.mentors.type")} value={query.mentor_type} onChange={(mentor_type) => setQuery((prev) => ({ ...prev, page: 1, mentor_type }))} options={typeOptions} />
        <FilterSelect label={t("admin.mentors.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={statusOptions} />
        <FilterSelect label={t("admin.mentors.visibility")} value={query.visibility} onChange={(visibility) => setQuery((prev) => ({ ...prev, page: 1, visibility }))} options={localizedVisibilityOptions} />
        <FilterSelect label={t("admin.mentors.expertise")} value={query.expertise_id} onChange={(expertise_id) => setQuery((prev) => ({ ...prev, page: 1, expertise_id }))} options={expertiseOptions} />
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-500">{t("admin.mentors.years")}</span>
          <input type="number" min="0" className={`${inputClass} w-24`} placeholder={t("admin.mentors.min")} value={query.min_years} onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, min_years: e.target.value }))} />
          <input type="number" min="0" className={`${inputClass} w-24`} placeholder={t("admin.mentors.max")} value={query.max_years} onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, max_years: e.target.value }))} />
        </div>
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.mentors.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/admin/mentors/${row.id}`)} />
      <ConfirmDialog isOpen={!!confirm} title={confirmTitle} subtitle={confirmSubtitle} variant={confirm?.variant} color={confirm?.color} yesLabel={t("admin.mentors.yesLabel")} noLabel={t("admin.mentors.noLabel")} onYes={updateStatus} onNo={() => setConfirm(null)} onClose={() => setConfirm(null)} />
    </>
  );
}
