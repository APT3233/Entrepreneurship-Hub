import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { eventStatusOptions, eventTypeOptions, visibilityOptions } from "./components";
import { useTranslation } from "@/context/TranslationContext";

const withAll = (t, items) => [{ value: "", label: t("admin.ecosystem.common.all") }, ...items];

export default function EcosystemEventsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", event_type: "", status: "", visibility: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await IncubationApi.listEvents(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("admin.ecosystem.events.toasts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const deleteEvent = async () => {
    if (!deleteTarget) return;
    try {
      await IncubationApi.deleteEvent(deleteTarget.id);
      toast.success(t("admin.ecosystem.events.toasts.deleted"));
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.events.toasts.deleteError"));
    }
  };

  const columns = useMemo(() => [
    { key: "event_name", label: t("admin.ecosystem.events.columns.event"), render: (row) => <button type="button" onClick={() => navigate(`/admin/ecosystem/events/${row.id}`)} className="text-left font-black text-slate-900 hover:text-indigo-700">{row.event_name}</button> },
    { key: "event_type", label: t("admin.ecosystem.events.columns.type"), render: (row) => <StatusBadge value={row.event_type} /> },
    { key: "start_at", label: t("admin.ecosystem.events.columns.start"), render: (row) => formatDate(row.start_at) },
    { key: "location", label: t("admin.ecosystem.events.columns.location"), render: (row) => row.location || row.meeting_link || "-" },
    { key: "visibility", label: t("admin.ecosystem.events.columns.visibility"), render: (row) => <StatusBadge value={row.visibility} /> },
    { key: "status", label: t("admin.ecosystem.events.columns.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "total_startups", label: t("admin.ecosystem.events.columns.startups"), render: (row) => row.total_startups || 0 },
    { key: "total_judges", label: t("admin.ecosystem.events.columns.judges"), render: (row) => row.total_judges || 0 },
    { key: "total_feedbacks", label: t("admin.ecosystem.events.columns.feedback"), render: (row) => row.total_feedbacks || 0 },
    { key: "actions", label: "", width: 100, render: (row) => <div className="flex justify-end gap-1"><button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/admin/ecosystem/events/${row.id}`); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><Eye size={16} /></button><button type="button" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button></div> },
  ], [navigate, t]);

  const translatedEventTypeOptions = useMemo(() => {
    return eventTypeOptions.map((opt) => ({ ...opt, label: t(`status.${opt.value}`) || opt.label }));
  }, [t]);

  const translatedEventStatusOptions = useMemo(() => {
    return eventStatusOptions.map((opt) => ({ ...opt, label: t(`status.${opt.value}`) || opt.label }));
  }, [t]);

  const translatedVisibilityOptions = useMemo(() => {
    return visibilityOptions.map((opt) => ({ ...opt, label: t(`status.${opt.value}`) || opt.label }));
  }, [t]);

  return (
    <>
      <FilterBar right={<button type="button" onClick={() => navigate("/admin/ecosystem/events/create")} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"><Plus size={16} /> {t("admin.ecosystem.events.createBtn")}</button>}>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.ecosystem.events.searchPlaceholder")} />
        <FilterSelect label={t("admin.ecosystem.events.columns.type")} value={query.event_type} onChange={(event_type) => setQuery((prev) => ({ ...prev, page: 1, event_type }))} options={withAll(t, translatedEventTypeOptions)} />
        <FilterSelect label={t("admin.ecosystem.events.columns.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={withAll(t, translatedEventStatusOptions)} />
        <FilterSelect label={t("admin.ecosystem.events.columns.visibility")} value={query.visibility} onChange={(visibility) => setQuery((prev) => ({ ...prev, page: 1, visibility }))} options={withAll(t, translatedVisibilityOptions)} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.ecosystem.events.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/admin/ecosystem/events/${row.id}`)} />
      <ConfirmDialog isOpen={!!deleteTarget} title={t("admin.ecosystem.events.dialogs.deleteTitle")} subtitle={deleteTarget?.event_name || ""} variant="delete" color="red" yesLabel={t("admin.ecosystem.common.delete")} noLabel={t("admin.ecosystem.common.cancel")} onYes={deleteEvent} onNo={() => setDeleteTarget(null)} onClose={() => setDeleteTarget(null)} />
    </>
  );
}
