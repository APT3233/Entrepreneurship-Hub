import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Trash2, Upload } from "lucide-react";
import MentorPortalApi from "@/api/mentorPortal";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import { Field } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { documentTypeOptions, Select } from "@/pages/admin/mentor-management/components";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function MentorDocumentsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [upload, setUpload] = useState({ document_type: "cv", file: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await MentorPortalApi.getDocuments();
      setRows(res?.data || []);
    } catch (err) {
      setError(err.message || t("mentorPortal.documents.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const uploadDocument = async (e) => {
    e.preventDefault();
    if (!upload.file) return toast.error(t("mentorPortal.documents.chooseFile"));
    setSaving(true);
    try {
      const init = await MentorPortalApi.initiateDocumentUpload({ document_type: upload.document_type, file: { name: upload.file.name, size: upload.file.size, type: upload.file.type } });
      const uploadRes = await fetch(init.data.uploadUrl, { method: "PUT", body: upload.file, headers: { "Content-Type": upload.file.type || "application/octet-stream" } });
      if (!uploadRes.ok) throw new Error("Storage upload failed");
      await MentorPortalApi.confirmDocumentUpload(init.data.uploadToken);
      setUpload({ document_type: "cv", file: null });
      toast.success(t("mentorPortal.documents.uploaded"));
      await load();
    } catch (err) {
      toast.error(err.message || t("mentorPortal.documents.uploadError"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteDoc) return;
    try {
      await MentorPortalApi.deleteDocument(deleteDoc.id);
      toast.success(t("mentorPortal.documents.deleted"));
      setDeleteDoc(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("mentorPortal.documents.deleteError"));
    }
  };

  const columns = useMemo(() => [
    { key: "document_type", label: t("mentorPortal.documents.type"), render: (row) => <StatusBadge value={row.document_type} /> },
    { key: "file_name", label: t("mentorPortal.documents.file"), render: (row) => <span className="font-bold text-slate-900">{row.file_name}</span> },
    { key: "file_size", label: t("mentorPortal.documents.size"), render: (row) => row.file_size ? `${Math.round(row.file_size / 1024)} KB` : "—" },
    { key: "created_at", label: t("mentorPortal.documents.created"), render: (row) => formatDate(row.created_at) },
    { key: "actions", label: "", width: 100, render: (row) => <div className="flex justify-end gap-1"><a href={row.file_url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-teal-600 hover:bg-teal-50"><ExternalLink size={16} /></a><button type="button" onClick={() => setDeleteDoc(row)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button></div> },
  ], [t]);

  const localizedDocumentTypeOptions = useMemo(() => documentTypeOptions.map((opt) => ({ value: opt.value, label: t(`status.${opt.value}`) })), [t]);

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("common.loading") || "Loading..."}</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;

  return (
    <div className="space-y-4">
      <form onSubmit={uploadDocument} className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-[180px_1fr_auto]">
        <Field label={t("mentorPortal.documents.type")}><Select value={upload.document_type} onChange={(value) => setUpload((prev) => ({ ...prev, document_type: value }))} options={localizedDocumentTypeOptions} /></Field>
        <Field label={t("mentorPortal.documents.file")}><input type="file" className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-teal-700" onChange={(e) => setUpload((prev) => ({ ...prev, file: e.target.files?.[0] || null }))} /></Field>
        <button disabled={saving} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"><Upload size={16} /> {t("mentorPortal.documents.uploadBtn")}</button>
      </form>
      <AdminTable columns={columns} rows={rows} emptyText={t("mentorPortal.documents.noDocuments")} />
      <ConfirmDialog isOpen={!!deleteDoc} title={t("mentorPortal.documents.deleteTitle")} subtitle={deleteDoc?.file_name || ""} variant="delete" color="red" yesLabel={t("common.delete") || "Delete"} noLabel={t("common.cancel") || "Cancel"} onYes={remove} onNo={() => setDeleteDoc(null)} onClose={() => setDeleteDoc(null)} />
    </div>
  );
}
