import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, FileText, Save, Trash2, Upload } from "lucide-react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import AdminMentorApi from "@/api/adminMentors";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import { Field } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { AvailabilityEditor, documentTypeOptions, ExpertiseEditor, MentorForm, MentorHeader, Select } from "./components";

const tabs = [
  { key: "overview", path: "" },
  { key: "profile", path: "profile" },
  { key: "expertise", path: "expertise" },
  { key: "availability", path: "availability" },
  { key: "documents", path: "documents" },
  { key: "assignments", path: "assignments" },
  { key: "sessions", path: "sessions" },
  { key: "activity", path: "activity" },
];

const activeTabFromPath = (pathname) => tabs.find((tab) => tab.path && pathname.endsWith(`/${tab.path}`))?.key || "overview";

export default function MentorDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const activeTab = activeTabFromPath(location.pathname);
  const [mentor, setMentor] = useState(null);
  const [areas, setAreas] = useState([]);
  const [profileForm, setProfileForm] = useState({});
  const [expertiseItems, setExpertiseItems] = useState([]);
  const [availabilityItems, setAvailabilityItems] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [upload, setUpload] = useState({ document_type: "cv", file: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteDoc, setDeleteDoc] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mentorRes, areasRes] = await Promise.all([
        AdminMentorApi.getMentor(id),
        AdminMentorApi.getExpertiseAreas({ limit: 100 }),
      ]);
      const data = mentorRes?.data || null;
      setMentor(data);
      setAreas(areasRes?.data || []);
      setProfileForm(data || {});
      setExpertiseItems((data?.expertise || []).map((item) => ({ ...item, expertise_id: String(item.expertise_id) })));
      setAvailabilityItems(data?.availability || []);
      setDocuments(data?.documents || []);
    } catch (err) {
      setError(err.message || t("admin.mentors.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { status: _status, created_at: _createdAt, updated_at: _updatedAt, ...payload } = profileForm;
      const res = await AdminMentorApi.updateMentor(id, payload);
      setMentor(res?.data || mentor);
      toast.success(t("admin.mentors.profileUpdated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.mentors.updateProfileError"));
    } finally {
      setSaving(false);
    }
  };

  const saveExpertise = async () => {
    setSaving(true);
    try {
      const items = expertiseItems.filter((item) => item.expertise_id).map((item) => ({ ...item, expertise_id: Number(item.expertise_id) }));
      const res = await AdminMentorApi.replaceMentorExpertise(id, items);
      setExpertiseItems((res?.data || []).map((item) => ({ ...item, expertise_id: String(item.expertise_id) })));
      toast.success(t("admin.mentors.expertiseUpdated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.mentors.updateExpertiseError"));
    } finally {
      setSaving(false);
    }
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      const res = await AdminMentorApi.replaceMentorAvailability(id, availabilityItems);
      setAvailabilityItems(res?.data || []);
      toast.success(t("admin.mentors.availabilityUpdated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.mentors.updateAvailabilityError"));
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async (e) => {
    e.preventDefault();
    if (!upload.file) return toast.error(t("admin.mentors.documentsTab.chooseFileError"));
    setSaving(true);
    try {
      const init = await AdminMentorApi.initiateDocumentUpload(id, {
        document_type: upload.document_type,
        file: { name: upload.file.name, size: upload.file.size, type: upload.file.type },
      });
      const uploadRes = await fetch(init.data.uploadUrl, { method: "PUT", body: upload.file, headers: { "Content-Type": upload.file.type || "application/octet-stream" } });
      if (!uploadRes.ok) throw new Error("Storage upload failed");
      await AdminMentorApi.confirmDocumentUpload(id, init.data.uploadToken);
      setUpload({ document_type: "cv", file: null });
      toast.success(t("admin.mentors.documentsTab.docUploaded"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.mentors.documentsTab.uploadDocError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteDocument = async () => {
    if (!deleteDoc) return;
    try {
      await AdminMentorApi.deleteDocument(id, deleteDoc.id);
      toast.success(t("admin.mentors.documentsTab.docDeleted"));
      setDeleteDoc(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.mentors.documentsTab.deleteDocError"));
    }
  };

  const docColumns = useMemo(() => [
    { key: "document_type", label: t("admin.mentors.documentsTab.type"), width: 120, render: (row) => <StatusBadge value={row.document_type} /> },
    { key: "file_name", label: t("admin.mentors.documentsTab.file"), render: (row) => <span className="font-bold text-slate-900">{row.file_name}</span> },
    { key: "file_size", label: t("admin.mentors.documentsTab.size"), width: 100, render: (row) => row.file_size ? `${Math.round(row.file_size / 1024)} KB` : "—" },
    { key: "uploaded_by_name", label: t("admin.mentors.documentsTab.uploadedBy"), width: 160, render: (row) => row.uploaded_by_name || "—" },
    { key: "created_at", label: t("admin.mentors.documentsTab.created"), width: 150, render: (row) => formatDate(row.created_at) },
    { key: "actions", label: "", width: 110, render: (row) => <div className="flex justify-end gap-1"><a href={row.file_url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-accent hover:bg-accent-bg"><ExternalLink size={16} /></a><button type="button" onClick={() => setDeleteDoc(row)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button></div> },
  ], [t]);

  const activityColumns = useMemo(() => [
    { key: "action", label: t("admin.columns.action") || "Action" },
    { key: "table_name", label: t("admin.fields.tableName") || "Table" },
    { key: "user_name", label: t("admin.columns.user") || "User", render: (row) => row.user_name || row.user_email || "—" },
    { key: "created_at", label: t("admin.columns.created") || "Created", render: (row) => formatDate(row.created_at) }
  ], [t]);

  const localizedDocumentTypeOptions = useMemo(() => documentTypeOptions.map((opt) => ({ value: opt.value, label: t(`status.${opt.value}`) })), [t]);

  if (loading) return <div className="rounded-card bg-surface p-8 text-center text-sm text-slate-400">{t("common.loading") || "Loading..."}</div>;
  if (error) return <div className="rounded-card bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  if (!mentor) return null;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate("/admin/mentors")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> {t("admin.mentors.back")}</button>
      <MentorHeader mentor={mentor} />
      <div className="flex gap-2 overflow-x-auto rounded-card border border-border bg-surface p-2">
        {tabs.map((tab) => <NavLink key={tab.key} to={tab.path ? `/admin/mentors/${id}/${tab.path}` : `/admin/mentors/${id}`} end={tab.key === "overview"} className={({ isActive }) => `whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${isActive ? "bg-accent-bg text-accent" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>{t(`admin.mentors.tabs.${tab.key}`)}</NavLink>)}
      </div>

      {activeTab === "overview" ? <Overview mentor={mentor} /> : null}
      {activeTab === "profile" ? (
        <form onSubmit={saveProfile} className="rounded-card border border-border bg-surface p-5">
          <MentorForm form={profileForm} setForm={setProfileForm} />
          <div className="mt-4 flex justify-end">
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"><Save size={16} /> {t("admin.mentors.saveProfile")}</button>
          </div>
        </form>
      ) : null}
      {activeTab === "expertise" ? (
        <Panel title={t("admin.mentors.tabs.expertise")}>
          <ExpertiseEditor areas={areas} items={expertiseItems} setItems={setExpertiseItems} />
          <div className="mt-4 flex justify-end">
            <button type="button" disabled={saving} onClick={saveExpertise} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"><Save size={16} /> {t("admin.mentors.saveExpertise")}</button>
          </div>
        </Panel>
      ) : null}
      {activeTab === "availability" ? (
        <Panel title={t("admin.mentors.tabs.availability")}>
          <AvailabilityEditor items={availabilityItems} setItems={setAvailabilityItems} />
          <div className="mt-4 flex justify-end">
            <button type="button" disabled={saving} onClick={saveAvailability} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"><Save size={16} /> {t("admin.mentors.saveAvailability")}</button>
          </div>
        </Panel>
      ) : null}
      {activeTab === "documents" ? (
        <Panel title={t("admin.mentors.tabs.documents")}>
          <form onSubmit={uploadDocument} className="mb-4 grid gap-3 rounded-xl bg-slate-50 p-3 md:grid-cols-[180px_1fr_auto]">
            <Field label={t("admin.mentors.documentsTab.docType")}><Select value={upload.document_type} onChange={(value) => setUpload((prev) => ({ ...prev, document_type: value }))} options={localizedDocumentTypeOptions} /></Field>
            <Field label={t("admin.mentors.documentsTab.docFile")}><input type="file" className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-accent-bg file:px-3 file:py-2 file:text-sm file:font-bold file:text-accent" onChange={(e) => setUpload((prev) => ({ ...prev, file: e.target.files?.[0] || null }))} /></Field>
            <button disabled={saving} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"><Upload size={16} /> {t("admin.mentors.documentsTab.btnUpload")}</button>
          </form>
          <AdminTable columns={docColumns} rows={documents} emptyText={t("admin.mentors.documentsTab.noDocuments")} />
        </Panel>
      ) : null}
      {activeTab === "assignments" ? <Placeholder title="assignments" /> : null}
      {activeTab === "sessions" ? <Placeholder title="sessions" /> : null}
      {activeTab === "activity" ? <Panel title={t("admin.mentors.tabs.activity")}><AdminTable columns={activityColumns} rows={mentor.activity_logs || []} emptyText={t("admin.mentors.emptyText")} /></Panel> : null}

      <ConfirmDialog isOpen={!!deleteDoc} title={t("admin.mentors.documentsTab.deleteDocTitle")} subtitle={deleteDoc ? deleteDoc.file_name : ""} variant="delete" color="red" yesLabel={t("admin.mentors.yesLabel")} noLabel={t("admin.mentors.noLabel")} onYes={confirmDeleteDocument} onNo={() => setDeleteDoc(null)} onClose={() => setDeleteDoc(null)} />
    </div>
  );
}

function Overview({ mentor }) {
  const { t } = useTranslation();
  const stats = [
    [t("admin.mentors.status"), <StatusBadge key="status" value={mentor.status} />],
    [t("admin.mentors.type"), <StatusBadge key="type" value={mentor.mentor_type} />],
    [t("admin.mentors.overviewStats.totalExpertise"), mentor.total_expertise || 0],
    [t("admin.mentors.overviewStats.availabilitySlots"), mentor.active_availability_slots || 0],
    [t("admin.mentors.overviewStats.assignments"), 0],
    [t("admin.mentors.overviewStats.mentoringHours"), 0],
    [t("admin.mentors.overviewStats.lastUpdated"), formatDate(mentor.updated_at)],
  ];
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value]) => <div key={label} className="rounded-card border border-border bg-surface p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><div className="mt-2 text-2xl font-black text-slate-900">{value}</div></div>)}</div>;
}

function Panel({ title, children }) {
  return <div className="rounded-card border border-border bg-surface p-5"><h3 className="mb-4 text-sm font-black text-slate-900">{title}</h3>{children}</div>;
}

function Placeholder({ title }) {
  const { t } = useTranslation();
  return <Panel title={t(`admin.mentors.tabs.${title}`)}><div className="rounded-xl border border-dashed border-border bg-slate-50 p-8 text-center text-sm font-semibold text-slate-400"><FileText className="mx-auto mb-2 text-slate-300" /> {t("admin.mentors.placeholderComingSoon")}</div></Panel>;
}
