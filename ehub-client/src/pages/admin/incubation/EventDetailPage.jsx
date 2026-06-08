import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import {
  awardTypeOptions,
  eventStatusOptions,
  eventTypeOptions,
  interestLevelOptions,
  judgeTypeOptions,
  mediaTypeOptions,
  Panel,
  participantStatusOptions,
  SaveButton,
  SelectField,
  visibilityOptions,
} from "./components";
import { useTranslation } from "@/context/TranslationContext";

const tabs = ["overview", "startups", "judges", "feedback", "awards", "media"];
const today = () => new Date().toISOString().slice(0, 10);
const toInputDateTime = (value) => value ? String(value).slice(0, 16) : "";

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const routeTab = ["startups", "judges", "media"].find((tab) => location.pathname.endsWith(`/${tab}`)) || (location.pathname.endsWith("/feedback") ? "feedback" : null);
  const activeTab = routeTab || (tabs.includes(params.get("tab")) ? params.get("tab") : "overview");
  const [event, setEvent] = useState(null);
  const [eventForm, setEventForm] = useState({});
  const [startups, setStartups] = useState([]);
  const [startupOptions, setStartupOptions] = useState([]);
  const [judges, setJudges] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [awards, setAwards] = useState([]);
  const [media, setMedia] = useState([]);
  const [participantForm, setParticipantForm] = useState({ startup_id: "", participation_status: "invited" });
  const [judgeForm, setJudgeForm] = useState({ full_name: "", judge_type: "guest" });
  const [feedbackForm, setFeedbackForm] = useState({ startup_id: "", interest_level: "none" });
  const [awardForm, setAwardForm] = useState({ startup_id: "", award_name: "", award_type: "winner", awarded_at: today() });
  const [mediaForm, setMediaForm] = useState({ media_type: "image", visibility: "internal" });
  const [participantModal, setParticipantModal] = useState(false);
  const [judgeModal, setJudgeModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [awardModal, setAwardModal] = useState(false);
  const [mediaModal, setMediaModal] = useState(false);
  const [deleteParticipant, setDeleteParticipant] = useState(null);
  const [deleteJudge, setDeleteJudge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const openTab = (tab) => {
    if (["startups", "judges", "media"].includes(tab)) navigate(`/admin/ecosystem/events/${id}/${tab}`);
    else if (tab === "feedback") navigate(`/admin/ecosystem/events/${id}/feedback`);
    else navigate(`/admin/ecosystem/events/${id}${tab === "overview" ? "" : `?tab=${tab}`}`);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [eventRes, startupRes, judgesRes, feedbackRes, mediaRes, optionsRes] = await Promise.all([
        IncubationApi.getEvent(id),
        IncubationApi.listEventStartups(id, { limit: 100 }),
        IncubationApi.listEventJudges(id, { limit: 100 }),
        IncubationApi.listEventFeedbacks(id, { limit: 100 }),
        IncubationApi.listEventMedia(id, { limit: 100 }),
        IncubationApi.listStartups({ limit: 100 }),
      ]);
      const eventData = eventRes?.data || null;
      const participantRows = startupRes?.data || [];
      const awardResponses = await Promise.all(participantRows.map((row) => IncubationApi.listAwards(row.startup_id, { limit: 100 }).catch(() => ({ data: [] }))));
      setEvent(eventData);
      setEventForm({ ...eventData, start_at: toInputDateTime(eventData?.start_at), end_at: toInputDateTime(eventData?.end_at) });
      setStartups(participantRows);
      setJudges(judgesRes?.data || []);
      setFeedbacks(feedbackRes?.data || []);
      setMedia(mediaRes?.data || []);
      setStartupOptions((optionsRes?.data || []).filter((startup) => !["archived", "rejected"].includes(startup.startup_status)));
      setAwards(awardResponses.flatMap((res) => res?.data || []).filter((award) => Number(award.event_id) === Number(id)));
    } catch (err) {
      setError(err.message || t("admin.ecosystem.events.toasts.loadDetailError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const startupSelectOptions = useMemo(() => [{ value: "", label: t("admin.ecosystem.events.modals.addStartup") }, ...startupOptions.map((startup) => ({ value: String(startup.id), label: startup.startup_name }))], [startupOptions, t]);
  const participantOptions = useMemo(() => [{ value: "", label: t("admin.ecosystem.events.modals.addStartup") }, ...startups.map((startup) => ({ value: String(startup.startup_id), label: startup.startup_name }))], [startups, t]);
  const judgeOptions = useMemo(() => [{ value: "", label: t("admin.ecosystem.common.none") }, ...judges.map((judge) => ({ value: String(judge.id), label: judge.full_name }))], [judges, t]);

  const translatedEventTypeOptions = useMemo(() => eventTypeOptions.map((o) => ({ ...o, label: t(`status.${o.value}`) || o.label })), [t]);
  const translatedEventStatusOptions = useMemo(() => eventStatusOptions.map((o) => ({ ...o, label: t(`status.${o.value}`) || o.label })), [t]);
  const translatedVisibilityOptions = useMemo(() => visibilityOptions.map((o) => ({ ...o, label: t(`status.${o.value}`) || o.label })), [t]);
  const translatedParticipantStatusOptions = useMemo(() => participantStatusOptions.map((o) => ({ ...o, label: t(`status.${o.value}`) || o.label })), [t]);
  const translatedJudgeTypeOptions = useMemo(() => judgeTypeOptions.map((o) => ({ ...o, label: t(`status.${o.value}`) || o.label })), [t]);
  const translatedInterestLevelOptions = useMemo(() => interestLevelOptions.map((o) => ({ ...o, label: t(`status.${o.value}`) || o.label })), [t]);
  const translatedAwardTypeOptions = useMemo(() => awardTypeOptions.map((o) => ({ ...o, label: t(`status.${o.value}`) || o.label })), [t]);
  const translatedMediaTypeOptions = useMemo(() => mediaTypeOptions.map((o) => ({ ...o, label: t(`status.${o.value}`) || o.label })), [t]);

  const saveEvent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.updateEvent(id, eventForm);
      toast.success(t("admin.ecosystem.events.toasts.updated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.events.toasts.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const submitParticipant = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.addEventStartup(id, { ...participantForm, startup_id: Number(participantForm.startup_id), pitch_order: participantForm.pitch_order || null });
      toast.success(t("admin.ecosystem.events.toasts.startupAdded"));
      setParticipantModal(false);
      setParticipantForm({ startup_id: "", participation_status: "invited" });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.events.toasts.startupAddError"));
    } finally {
      setSaving(false);
    }
  };

  const submitJudge = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.addEventJudge(id, judgeForm);
      toast.success(t("admin.ecosystem.events.toasts.judgeAdded"));
      setJudgeModal(false);
      setJudgeForm({ full_name: "", judge_type: "guest" });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.events.toasts.judgeAddError"));
    } finally {
      setSaving(false);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.createEventFeedback(id, { ...feedbackForm, startup_id: Number(feedbackForm.startup_id), judge_id: feedbackForm.judge_id || null, rating: feedbackForm.rating || null });
      toast.success(t("admin.ecosystem.events.toasts.feedbackRecorded"));
      setFeedbackModal(false);
      setFeedbackForm({ startup_id: "", interest_level: "none" });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.events.toasts.feedbackRecordError"));
    } finally {
      setSaving(false);
    }
  };

  const submitAward = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.createAward(awardForm.startup_id, { ...awardForm, event_id: Number(id) });
      toast.success(t("admin.ecosystem.events.toasts.awardRecorded"));
      setAwardModal(false);
      setAwardForm({ startup_id: "", award_name: "", award_type: "winner", awarded_at: today() });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.events.toasts.awardRecordError"));
    } finally {
      setSaving(false);
    }
  };

  const submitMedia = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.createEventMedia(id, { ...mediaForm, startup_id: mediaForm.startup_id || null });
      toast.success(t("admin.ecosystem.events.toasts.mediaAdded"));
      setMediaModal(false);
      setMediaForm({ media_type: "image", visibility: "internal" });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.events.toasts.mediaAddError"));
    } finally {
      setSaving(false);
    }
  };

  const removeParticipant = async () => {
    if (!deleteParticipant) return;
    try {
      await IncubationApi.deleteEventStartup(id, deleteParticipant.startup_id);
      toast.success(t("admin.ecosystem.events.toasts.startupRemoved"));
      setDeleteParticipant(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.events.toasts.startupRemoveError"));
    }
  };

  const removeJudge = async () => {
    if (!deleteJudge) return;
    try {
      await IncubationApi.deleteEventJudge(id, deleteJudge.id);
      toast.success(t("admin.ecosystem.events.toasts.judgeRemoved"));
      setDeleteJudge(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.events.toasts.judgeRemoveError"));
    }
  };

  const startupColumns = useMemo(() => [
    { key: "startup_name", label: t("admin.ecosystem.analytics.columns.startup"), render: (row) => <span className="font-black text-slate-900">{row.startup_name}</span> },
    { key: "category", label: t("admin.ecosystem.analytics.columns.category"), render: (row) => row.category || row.industry || "-" },
    { key: "product_stage", label: t("admin.ecosystem.analytics.columns.stage"), render: (row) => <StatusBadge value={row.product_stage} /> },
    { key: "pitch_order", label: t("admin.ecosystem.events.columns.pitchOrder"), render: (row) => row.pitch_order ?? "-" },
    { key: "booth_location", label: t("admin.ecosystem.events.columns.booth"), render: (row) => row.booth_location || "-" },
    { key: "participation_status", label: t("admin.ecosystem.common.status"), render: (row) => <StatusBadge value={row.participation_status} /> },
    { key: "actions", label: "", width: 80, render: (row) => <button type="button" onClick={() => setDeleteParticipant(row)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button> },
  ], [t]);

  const judgeColumns = useMemo(() => [
    { key: "full_name", label: t("admin.ecosystem.alumni.fields.fullName"), render: (row) => <span className="font-black text-slate-900">{row.full_name}</span> },
    { key: "organization", label: t("admin.ecosystem.events.columns.organization"), render: (row) => row.organization || "-" },
    { key: "judge_type", label: t("admin.ecosystem.common.type"), render: (row) => <StatusBadge value={row.judge_type} /> },
    { key: "email", label: t("admin.ecosystem.alumni.fields.email"), render: (row) => row.email || "-" },
    { key: "role_title", label: t("admin.ecosystem.alumni.fields.position"), render: (row) => row.role_title || "-" },
    { key: "actions", label: "", width: 80, render: (row) => <button type="button" onClick={() => setDeleteJudge(row)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button> },
  ], [t]);

  const feedbackColumns = useMemo(() => [
    { key: "startup_name", label: t("admin.ecosystem.analytics.columns.startup") },
    { key: "judge_name", label: t("admin.ecosystem.events.columns.judges"), render: (row) => row.judge_name || row.from_user_name || "-" },
    { key: "rating", label: t("admin.ecosystem.events.columns.rating"), render: (row) => row.rating ?? "-" },
    { key: "interest_level", label: t("admin.ecosystem.events.columns.interest"), render: (row) => <StatusBadge value={row.interest_level} /> },
    { key: "feedback", label: t("admin.ecosystem.events.columns.feedback"), render: (row) => row.feedback || row.strengths || row.improvements || "-" },
    { key: "created_at", label: t("admin.ecosystem.events.columns.created"), render: (row) => formatDate(row.created_at) },
  ], [t]);

  const awardColumns = useMemo(() => [
    { key: "award_name", label: t("admin.ecosystem.analytics.panels.awards"), render: (row) => <span className="font-black text-slate-900">{row.award_name}</span> },
    { key: "award_type", label: t("admin.ecosystem.common.type"), render: (row) => <StatusBadge value={row.award_type} /> },
    { key: "awarded_at", label: t("admin.ecosystem.events.columns.awarded"), render: (row) => formatDate(row.awarded_at) },
    { key: "evidence_url", label: t("admin.ecosystem.events.columns.evidence"), render: (row) => row.evidence_url ? <a href={row.evidence_url} target="_blank" rel="noreferrer" className="font-bold text-indigo-700 hover:underline">Open</a> : "-" },
  ], [t]);

  const mediaColumns = useMemo(() => [
    { key: "title", label: t("admin.ecosystem.events.columns.title"), render: (row) => row.title || row.file_url || row.external_url || "-" },
    { key: "media_type", label: t("admin.ecosystem.common.type"), render: (row) => <StatusBadge value={row.media_type} /> },
    { key: "startup_name", label: t("admin.ecosystem.analytics.columns.startup"), render: (row) => row.startup_name || "-" },
    { key: "visibility", label: t("admin.ecosystem.common.visibility"), render: (row) => <StatusBadge value={row.visibility} /> },
    { key: "link", label: t("admin.ecosystem.events.columns.link"), render: (row) => row.file_url || row.external_url ? <a href={row.file_url || row.external_url} target="_blank" rel="noreferrer" className="font-bold text-indigo-700 hover:underline">Open</a> : "-" },
    { key: "created_at", label: t("admin.ecosystem.events.columns.created"), render: (row) => formatDate(row.created_at) },
  ], [t]);

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("admin.ecosystem.common.loading")}</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  if (!event) return null;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate("/admin/ecosystem/events")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> {t("admin.ecosystem.common.back")}</button>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">{event.event_name}</h2>
            <p className="mt-1 text-sm text-slate-500">{event.location || event.meeting_link || "No location"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge value={event.event_type} />
              <StatusBadge value={event.status} />
              <StatusBadge value={event.visibility} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm font-black text-indigo-700">
            <div className="rounded-xl bg-indigo-50 p-3">
              {event.total_startups || 0}
              <p className="text-[11px] uppercase opacity-70">{t("admin.ecosystem.events.columns.startups")}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              {event.total_judges || 0}
              <p className="text-[11px] uppercase opacity-70">{t("admin.ecosystem.events.columns.judges")}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              {event.total_feedbacks || 0}
              <p className="text-[11px] uppercase opacity-70">{t("admin.ecosystem.events.columns.feedback")}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <button key={tab} type="button" onClick={() => openTab(tab)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${activeTab === tab ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"}`}>
            {t(`admin.ecosystem.events.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <Panel title={t("admin.ecosystem.events.tabs.overview")}>
          <form onSubmit={saveEvent} className="grid gap-4 sm:grid-cols-2">
            <Field label={t("admin.ecosystem.events.fields.name")}><input required className={inputClass} value={eventForm.event_name || ""} onChange={(e) => setEventForm((prev) => ({ ...prev, event_name: e.target.value }))} /></Field>
            <Field label={t("admin.ecosystem.events.fields.code")}><input className={inputClass} value={eventForm.event_code || ""} onChange={(e) => setEventForm((prev) => ({ ...prev, event_code: e.target.value }))} /></Field>
            <Field label={t("admin.ecosystem.events.fields.type")}><SelectField value={eventForm.event_type || "other"} onChange={(event_type) => setEventForm((prev) => ({ ...prev, event_type }))} options={translatedEventTypeOptions} /></Field>
            <Field label={t("admin.ecosystem.events.fields.status")}><SelectField value={eventForm.status || "draft"} onChange={(status) => setEventForm((prev) => ({ ...prev, status }))} options={translatedEventStatusOptions} /></Field>
            <Field label={t("admin.ecosystem.events.fields.visibility")}><SelectField value={eventForm.visibility || "internal"} onChange={(visibility) => setEventForm((prev) => ({ ...prev, visibility }))} options={translatedVisibilityOptions} /></Field>
            <Field label={t("admin.ecosystem.events.fields.startAt")}><input required type="datetime-local" className={inputClass} value={eventForm.start_at || ""} onChange={(e) => setEventForm((prev) => ({ ...prev, start_at: e.target.value }))} /></Field>
            <Field label={t("admin.ecosystem.events.fields.endAt")}><input type="datetime-local" className={inputClass} value={eventForm.end_at || ""} onChange={(e) => setEventForm((prev) => ({ ...prev, end_at: e.target.value }))} /></Field>
            <Field label={t("admin.ecosystem.events.fields.location")}><input className={inputClass} value={eventForm.location || ""} onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))} /></Field>
            <Field label={t("admin.ecosystem.events.fields.meetingLink")}><input className={inputClass} value={eventForm.meeting_link || ""} onChange={(e) => setEventForm((prev) => ({ ...prev, meeting_link: e.target.value }))} /></Field>
            <div className="sm:col-span-2"><Field label={t("admin.ecosystem.events.fields.description")}><textarea className={inputClass} rows={5} value={eventForm.description || ""} onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))} /></Field></div>
            <div className="sm:col-span-2 flex justify-end"><SaveButton saving={saving}>{t("admin.ecosystem.common.save")}</SaveButton></div>
          </form>
        </Panel>
      ) : null}

      {activeTab === "startups" ? (
        <Panel title={t("admin.ecosystem.events.tabs.startups")} actions={<button type="button" onClick={() => setParticipantModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.common.add")}</button>}>
          <AdminTable columns={startupColumns} rows={startups} emptyText={t("admin.ecosystem.events.empty.startups")} />
        </Panel>
      ) : null}

      {activeTab === "judges" ? (
        <Panel title={t("admin.ecosystem.events.tabs.judges")} actions={<button type="button" onClick={() => setJudgeModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.common.add")}</button>}>
          <AdminTable columns={judgeColumns} rows={judges} emptyText={t("admin.ecosystem.events.empty.judges")} />
        </Panel>
      ) : null}

      {activeTab === "feedback" ? (
        <Panel title={t("admin.ecosystem.events.tabs.feedback")} actions={<button type="button" onClick={() => setFeedbackModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.common.add")}</button>}>
          <AdminTable columns={feedbackColumns} rows={feedbacks} emptyText={t("admin.ecosystem.events.empty.feedback")} />
        </Panel>
      ) : null}

      {activeTab === "awards" ? (
        <Panel title={t("admin.ecosystem.events.tabs.awards")} actions={<button type="button" onClick={() => setAwardModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.common.add")}</button>}>
          <AdminTable columns={awardColumns} rows={awards} emptyText={t("admin.ecosystem.events.empty.awards")} />
        </Panel>
      ) : null}

      {activeTab === "media" ? (
        <Panel title={t("admin.ecosystem.events.tabs.media")} actions={<button type="button" onClick={() => setMediaModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.common.add")}</button>}>
          <AdminTable columns={mediaColumns} rows={media} emptyText={t("admin.ecosystem.events.empty.media")} />
        </Panel>
      ) : null}

      <FormModal open={participantModal} title={t("admin.ecosystem.events.modals.addStartup")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setParticipantModal(false)} onSubmit={submitParticipant}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.ecosystem.analytics.columns.startup")}><SelectField value={participantForm.startup_id || ""} onChange={(startup_id) => setParticipantForm((prev) => ({ ...prev, startup_id }))} options={startupSelectOptions} /></Field>
          <Field label={t("admin.ecosystem.common.status")}><SelectField value={participantForm.participation_status || "invited"} onChange={(participation_status) => setParticipantForm((prev) => ({ ...prev, participation_status }))} options={translatedParticipantStatusOptions} /></Field>
          <Field label={t("admin.ecosystem.events.columns.pitchOrder")}><input type="number" min="0" className={inputClass} value={participantForm.pitch_order || ""} onChange={(e) => setParticipantForm((prev) => ({ ...prev, pitch_order: e.target.value }))} /></Field>
          <Field label={t("admin.ecosystem.events.columns.booth")}><input className={inputClass} value={participantForm.booth_location || ""} onChange={(e) => setParticipantForm((prev) => ({ ...prev, booth_location: e.target.value }))} /></Field>
          <Field label="Pitch deck"><input className={inputClass} value={participantForm.pitch_deck_url || ""} onChange={(e) => setParticipantForm((prev) => ({ ...prev, pitch_deck_url: e.target.value }))} /></Field>
          <Field label="Demo URL"><input className={inputClass} value={participantForm.demo_url || ""} onChange={(e) => setParticipantForm((prev) => ({ ...prev, demo_url: e.target.value }))} /></Field>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.alumni.fields.note")}><textarea className={inputClass} rows={3} value={participantForm.note || ""} onChange={(e) => setParticipantForm((prev) => ({ ...prev, note: e.target.value }))} /></Field></div>
        </div>
      </FormModal>

      <FormModal open={judgeModal} title={t("admin.ecosystem.events.modals.addJudge")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setJudgeModal(false)} onSubmit={submitJudge}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.ecosystem.alumni.fields.fullName")}><input required className={inputClass} value={judgeForm.full_name || ""} onChange={(e) => setJudgeForm((prev) => ({ ...prev, full_name: e.target.value }))} /></Field>
          <Field label={t("admin.ecosystem.common.type")}><SelectField value={judgeForm.judge_type || "guest"} onChange={(judge_type) => setJudgeForm((prev) => ({ ...prev, judge_type }))} options={translatedJudgeTypeOptions} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.email")}><input className={inputClass} value={judgeForm.email || ""} onChange={(e) => setJudgeForm((prev) => ({ ...prev, email: e.target.value }))} /></Field>
          <Field label={t("admin.ecosystem.events.columns.organization")}><input className={inputClass} value={judgeForm.organization || ""} onChange={(e) => setJudgeForm((prev) => ({ ...prev, organization: e.target.value }))} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.position")}><input className={inputClass} value={judgeForm.role_title || ""} onChange={(e) => setJudgeForm((prev) => ({ ...prev, role_title: e.target.value }))} /></Field>
          <Field label="Mentor ID"><input type="number" min="1" className={inputClass} value={judgeForm.mentor_id || ""} onChange={(e) => setJudgeForm((prev) => ({ ...prev, mentor_id: e.target.value || null }))} /></Field>
        </div>
      </FormModal>

      <FormModal open={feedbackModal} title={t("admin.ecosystem.events.modals.addFeedback")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setFeedbackModal(false)} onSubmit={submitFeedback}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.ecosystem.analytics.columns.startup")}><SelectField value={feedbackForm.startup_id || ""} onChange={(startup_id) => setFeedbackForm((prev) => ({ ...prev, startup_id }))} options={participantOptions} /></Field>
          <Field label={t("admin.ecosystem.events.columns.judges")}><SelectField value={feedbackForm.judge_id || ""} onChange={(judge_id) => setFeedbackForm((prev) => ({ ...prev, judge_id }))} options={judgeOptions} /></Field>
          <Field label={t("admin.ecosystem.events.columns.rating")}><input type="number" min="1" max="5" className={inputClass} value={feedbackForm.rating || ""} onChange={(e) => setFeedbackForm((prev) => ({ ...prev, rating: e.target.value }))} /></Field>
          <Field label={t("admin.ecosystem.events.columns.interest")}><SelectField value={feedbackForm.interest_level || "none"} onChange={(interest_level) => setFeedbackForm((prev) => ({ ...prev, interest_level }))} options={translatedInterestLevelOptions} /></Field>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.events.columns.feedback")}><textarea className={inputClass} rows={4} value={feedbackForm.feedback || ""} onChange={(e) => setFeedbackForm((prev) => ({ ...prev, feedback: e.target.value }))} /></Field></div>
          <Field label="Strengths"><textarea className={inputClass} rows={3} value={feedbackForm.strengths || ""} onChange={(e) => setFeedbackForm((prev) => ({ ...prev, strengths: e.target.value }))} /></Field>
          <Field label="Improvements"><textarea className={inputClass} rows={3} value={feedbackForm.improvements || ""} onChange={(e) => setFeedbackForm((prev) => ({ ...prev, improvements: e.target.value }))} /></Field>
        </div>
      </FormModal>

      <FormModal open={awardModal} title={t("admin.ecosystem.events.modals.addAward")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setAwardModal(false)} onSubmit={submitAward}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.ecosystem.analytics.columns.startup")}><SelectField value={awardForm.startup_id || ""} onChange={(startup_id) => setAwardForm((prev) => ({ ...prev, startup_id }))} options={participantOptions} /></Field>
          <Field label={t("admin.ecosystem.analytics.panels.awards")}><input required className={inputClass} value={awardForm.award_name || ""} onChange={(e) => setAwardForm((prev) => ({ ...prev, award_name: e.target.value }))} /></Field>
          <Field label={t("admin.ecosystem.common.type")}><SelectField value={awardForm.award_type || "other"} onChange={(award_type) => setAwardForm((prev) => ({ ...prev, award_type }))} options={translatedAwardTypeOptions} /></Field>
          <Field label={t("admin.ecosystem.events.columns.awarded")}><input required type="date" className={inputClass} value={String(awardForm.awarded_at || "").slice(0, 10)} onChange={(e) => setAwardForm((prev) => ({ ...prev, awarded_at: e.target.value }))} /></Field>
          <Field label={t("admin.ecosystem.events.columns.evidence")}><input className={inputClass} value={awardForm.evidence_url || ""} onChange={(e) => setAwardForm((prev) => ({ ...prev, evidence_url: e.target.value }))} /></Field>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.common.description")}><textarea className={inputClass} rows={4} value={awardForm.description || ""} onChange={(e) => setAwardForm((prev) => ({ ...prev, description: e.target.value }))} /></Field></div>
        </div>
      </FormModal>

      <FormModal open={mediaModal} title={t("admin.ecosystem.events.modals.addMedia")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setMediaModal(false)} onSubmit={submitMedia}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.ecosystem.common.type")}><SelectField value={mediaForm.media_type || "other"} onChange={(media_type) => setMediaForm((prev) => ({ ...prev, media_type }))} options={translatedMediaTypeOptions} /></Field>
          <Field label={t("admin.ecosystem.common.visibility")}><SelectField value={mediaForm.visibility || "internal"} onChange={(visibility) => setMediaForm((prev) => ({ ...prev, visibility }))} options={translatedVisibilityOptions} /></Field>
          <Field label={t("admin.ecosystem.analytics.columns.startup")}><SelectField value={mediaForm.startup_id || ""} onChange={(startup_id) => setMediaForm((prev) => ({ ...prev, startup_id }))} options={[{ value: "", label: "Event only" }, ...participantOptions.slice(1)]} /></Field>
          <Field label={t("admin.ecosystem.events.columns.title")}><input className={inputClass} value={mediaForm.title || ""} onChange={(e) => setMediaForm((prev) => ({ ...prev, title: e.target.value }))} /></Field>
          <Field label={t("admin.ecosystem.events.columns.link")}><input className={inputClass} value={mediaForm.file_url || ""} onChange={(e) => setMediaForm((prev) => ({ ...prev, file_url: e.target.value }))} /></Field>
          <Field label="External URL"><input className={inputClass} value={mediaForm.external_url || ""} onChange={(e) => setMediaForm((prev) => ({ ...prev, external_url: e.target.value }))} /></Field>
        </div>
      </FormModal>

      <ConfirmDialog isOpen={!!deleteParticipant} title={t("admin.ecosystem.events.dialogs.removeStartupTitle")} subtitle={deleteParticipant?.startup_name || ""} variant="delete" color="red" yesLabel={t("admin.ecosystem.common.remove")} noLabel={t("admin.ecosystem.common.cancel")} onYes={removeParticipant} onNo={() => setDeleteParticipant(null)} onClose={() => setDeleteParticipant(null)} />
      <ConfirmDialog isOpen={!!deleteJudge} title={t("admin.ecosystem.events.dialogs.removeJudgeTitle")} subtitle={deleteJudge?.full_name || ""} variant="delete" color="red" yesLabel={t("admin.ecosystem.common.remove")} noLabel={t("admin.ecosystem.common.cancel")} onYes={removeJudge} onNo={() => setDeleteJudge(null)} onClose={() => setDeleteJudge(null)} />
    </div>
  );
}
