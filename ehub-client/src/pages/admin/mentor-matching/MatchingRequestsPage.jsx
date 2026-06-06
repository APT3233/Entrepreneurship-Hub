import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminMentorApi from "@/api/adminMentors";
import groupService from "@/api/adminStudentGroup/groupService";
import MentorMatchingApi from "@/api/mentorMatching";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import FormModal from "@/pages/admin/components/FormModal";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { MatchingRequestForm, matchingStatusOptions, priorityOptions, ScoreBadge } from "./components";

const emptyForm = { group_id: "", preferred_mentor_type: "any", required_expertise: [], support_needed: "", priority: "normal" };

export default function MatchingRequestsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", status: "" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [groups, setGroups] = useState([]);
  const [expertise, setExpertise] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [requestsRes, groupsRes, expertiseRes] = await Promise.all([
        MentorMatchingApi.listRequests(query),
        groupService.list({ limit: 100, status: "active" }),
        AdminMentorApi.getExpertiseAreas({ limit: 100, status: "active" }),
      ]);
      setRows(requestsRes?.data || []); setMeta(requestsRes?.meta || null);
      setGroups(groupsRes?.data || []); setExpertise(expertiseRes?.data || []);
    } catch (err) { setError(err.message || "Unable to load matching requests"); }
    finally { setLoading(false); }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const createRequest = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await MentorMatchingApi.createRequest({ ...form, group_id: Number(form.group_id) });
      toast.success("Matching request created");
      setModalOpen(false); setForm(emptyForm); await load();
      if (res?.data?.id) navigate(`/admin/mentor-matching/${res.data.id}`);
    } catch (err) { toast.error(err.message || "Unable to create request"); }
    finally { setSaving(false); }
  };

  const columns = useMemo(() => [
    { key: "group_name", label: "Group", render: (row) => <span className="font-black text-slate-900">{row.group_name}</span> },
    { key: "topic", label: "Topic", render: (row) => row.topic || "-" },
    { key: "class_code", label: "Class" },
    { key: "preferred_mentor_type", label: "Preferred", render: (row) => <StatusBadge value={row.preferred_mentor_type} /> },
    { key: "priority", label: "Priority", render: (row) => <StatusBadge value={row.priority} /> },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "suggestion_count", label: "Suggestions", render: (row) => row.suggestion_count || 0 },
    { key: "top_score", label: "Top score", render: (row) => row.top_score ? <ScoreBadge score={row.top_score} /> : "-" },
    { key: "created_at", label: "Created", render: (row) => formatDate(row.created_at) },
    { key: "actions", label: "", render: (row) => <div className="flex justify-end gap-1"><button className="rounded-lg p-2 text-teal-600 hover:bg-teal-50" onClick={(e) => { e.stopPropagation(); navigate(`/admin/mentor-matching/${row.id}`); }}><Eye size={16} /></button><button className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50" onClick={async (e) => { e.stopPropagation(); await MentorMatchingApi.generate(row.id, { matching_method: "hybrid" }); toast.success("Suggestions generated"); await load(); }}><Sparkles size={16} /></button></div> },
  ], [load, navigate, toast]);

  return (
    <>
      <FilterBar right={<button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700"><Plus size={16} /> Create request</button>}>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Group, topic, support..." />
        <FilterSelect label="Status" value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={[{ value: "", label: "All" }, ...matchingStatusOptions]} />
        <FilterSelect label="Priority" value={query.priority || ""} onChange={(priority) => setQuery((prev) => ({ ...prev, page: 1, priority }))} options={[{ value: "", label: "All" }, ...priorityOptions]} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No matching requests" meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/admin/mentor-matching/${row.id}`)} />
      <FormModal open={modalOpen} title="Create matching request" submitLabel="Create" saving={saving} onClose={() => setModalOpen(false)} onSubmit={createRequest}>
        <MatchingRequestForm form={form} setForm={setForm} groups={groups} expertise={expertise} />
      </FormModal>
    </>
  );
}
