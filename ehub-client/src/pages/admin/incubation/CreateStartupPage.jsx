import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { groupService } from "@/api/adminStudentGroup";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import { Field, inputClass } from "@/pages/admin/components/FormModal";
import { SaveButton, SelectField, StartupForm } from "./components";

const emptyForm = { startup_name: "", product_stage: "idea", startup_status: "candidate", source: "manual_nomination", technology_tags: [] };

export default function CreateStartupPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [mode, setMode] = useState("from_group");
  const [groups, setGroups] = useState([]);
  const [stages, setStages] = useState([]);
  const [groupId, setGroupId] = useState("");
  const [form, setForm] = useState({ ...emptyForm, selected_reason: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadLookups = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsRes, stagesRes] = await Promise.all([
        groupService.list({ limit: 100 }),
        IncubationApi.listStages({ limit: 100, status: "active" }),
      ]);
      setGroups(groupsRes?.data || []);
      setStages(stagesRes?.data || []);
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.createStartup.lookupError"));
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => { loadLookups(); }, [loadLookups]);

  const selectedGroup = useMemo(() => groups.find((group) => String(group.id) === String(groupId)), [groups, groupId]);
  const stageOptions = useMemo(() => [{ value: "", label: t("admin.ecosystem.createStartup.selectStage") }, ...stages.map((stage) => ({ value: String(stage.id), label: stage.name }))], [stages, t]);
  const groupOptions = useMemo(() => [{ value: "", label: t("admin.ecosystem.createStartup.selectGroup") }, ...groups.map((group) => ({ value: String(group.id), label: `${group.group_name || group.group_code} · ${group.class_code || ""}` }))], [groups, t]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      let res;
      if (mode === "from_group") {
        if (!groupId) throw new Error(t("admin.ecosystem.createStartup.selectGroupRequired"));
        if (!form.initial_stage_id) throw new Error(t("admin.ecosystem.createStartup.stageRequired"));
        res = await IncubationApi.createStartupFromGroup(groupId, { ...form, initial_stage_id: Number(form.initial_stage_id), source: form.source || "module3_selection" });
      } else {
        res = await IncubationApi.createStartup(form);
      }
      toast.success(t("admin.ecosystem.createStartup.created"));
      navigate(`/admin/incubation/startups/${res?.data?.id}`);
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.createStartup.createError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate("/admin/incubation/startups")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> {t("common.back")}</button>
      <div className="rounded-card border border-border bg-surface p-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {[["from_group", t("admin.ecosystem.createStartup.modes.fromGroup")], ["manual", t("admin.ecosystem.createStartup.modes.manual")]].map(([key, label]) => <button key={key} type="button" onClick={() => setMode(key)} className={`rounded-xl px-4 py-2 text-sm font-black ${mode === key ? "bg-accent-bg text-accent" : "text-slate-500 hover:bg-slate-50"}`}>{label}</button>)}
        </div>
      </div>
      <form onSubmit={submit} className="rounded-card border border-border bg-surface p-5">
        {mode === "from_group" ? (
          <div className="mb-5 grid gap-4 lg:grid-cols-3">
            <Field label={t("admin.ecosystem.createStartup.fields.group")}><SelectField value={groupId} onChange={(value) => setGroupId(value)} options={groupOptions} /></Field>
            <Field label={t("admin.ecosystem.createStartup.fields.initialStage")}><SelectField value={form.initial_stage_id ?? ""} onChange={(value) => setForm((prev) => ({ ...prev, initial_stage_id: value || "" }))} options={stageOptions} /></Field>
            <Field label={t("admin.ecosystem.createStartup.fields.selectedScore")}><input type="number" min="0" className={inputClass} value={form.selected_score ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, selected_score: e.target.value === "" ? null : Number(e.target.value) }))} /></Field>
            <div className="rounded-xl bg-slate-50 p-4 lg:col-span-3">
              <p className="text-sm font-black text-slate-800">{selectedGroup?.topic || selectedGroup?.group_name || t("admin.ecosystem.createStartup.selectGroupPreview")}</p>
              <p className="mt-1 text-sm text-slate-500">{selectedGroup?.topic_desc || selectedGroup?.category || t("admin.ecosystem.createStartup.noGroupDetail")}</p>
            </div>
            <Field label={t("admin.ecosystem.createStartup.fields.selectedReason")}><textarea required className={inputClass} rows={3} value={form.selected_reason || ""} onChange={(e) => setForm((prev) => ({ ...prev, selected_reason: e.target.value }))} /></Field>
          </div>
        ) : null}
        <StartupForm form={form} setForm={setForm} />
        <div className="mt-5 flex justify-end"><SaveButton saving={saving || loading}>{t("admin.ecosystem.createStartup.createBtn")}</SaveButton></div>
      </form>
    </div>
  );
}
