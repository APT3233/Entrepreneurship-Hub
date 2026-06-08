import { useEffect, useMemo, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";
import aiEvaluationApi from "@/api/aiEvaluation";
import { evaluationLookupService } from "@/api/adminEvaluationOps";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import { buildClassLabel, formatDate, pageLimit, toSelectOptions } from "@/pages/admin/evaluation-ops/shared";
import { useTranslation } from "@/context/TranslationContext";

const formatConfidence = (value) => value === null || value === undefined ? "—" : `${Math.round(Number(value) * 100)}%`;

export default function AdminAiSuggestionsPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, class_id: "", lecturer_id: "", status: "", provider_key: "", model: "", date_from: "", date_to: "" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lookups, setLookups] = useState({ classes: [], lecturers: [] });
  const [selected, setSelected] = useState(null);

  const statusOptions = useMemo(() => [
    { value: "", label: t("ai.suggestions.allStatus") },
    { value: "pending", label: t("ai.suggestions.statusPending") },
    { value: "processing", label: t("ai.suggestions.statusProcessing") },
    { value: "completed", label: t("ai.suggestions.statusCompleted") },
    { value: "failed", label: t("ai.suggestions.statusFailed") },
  ], [t]);

  const providerOptions = useMemo(() => [
    { value: "", label: "All providers" },
    { value: "third-party-api", label: "Third-party API" },
    { value: "local-gemma", label: "Local Gemma" },
  ], []);

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await aiEvaluationApi.adminListSuggestions(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("ai.assistant.failAnalyze"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.limit, query.class_id, query.lecturer_id, query.status, query.provider_key, query.model, query.date_from, query.date_to]);

  useEffect(() => {
    evaluationLookupService.getAll()
      .then((res) => setLookups(res?.data || { classes: [], lecturers: [] }))
      .catch(() => setLookups({ classes: [], lecturers: [] }));
  }, []);

  const options = useMemo(() => ({
    classes: toSelectOptions(lookups.classes, (item) => item.id, buildClassLabel, t("lookupAll.classes")),
    lecturers: toSelectOptions(lookups.lecturers, (item) => item.id, (item) => item.full_name || item.email, t("lookupAll.lecturers")),
  }), [lookups, t]);

  const columns = useMemo(() => [
    {
      key: "target",
      label: t("ai.suggestions.colTarget"),
      render: (row) => (
        <div>
          <StatusBadge value={row.target_type === "checkpoint_submission" ? "checkpoint" : "assignment"} />
          <p className="mt-1 font-mono text-xs text-gray-500">#{row.target_id}</p>
        </div>
      ),
    },
    { key: "class", label: t("ai.suggestions.colClass"), render: (row) => row.class_code || "—" },
    { key: "group", label: t("filterLabels.group"), render: (row) => <span className="font-semibold text-gray-900">{row.group_name || "—"}</span> },
    { key: "requested_by", label: t("ai.suggestions.labelRequestedBy"), render: (row) => row.requested_by_name || "—" },
    { key: "provider", label: "Provider", render: (row) => <span className="font-mono text-xs">{row.provider_key || "—"}</span> },
    { key: "model", label: t("ai.suggestions.filterModel"), render: (row) => <span className="font-mono text-xs">{row.model_name || "—"}</span> },
    { key: "status", label: t("ai.suggestions.filterStatus"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "confidence", label: t("ai.suggestions.colConfidence"), render: (row) => formatConfidence(row.confidence_score) },
    { key: "created", label: t("common.created"), render: (row) => formatDate(row.created_at) },
    { key: "completed", label: t("ai.suggestions.labelCompletedAt"), render: (row) => formatDate(row.completed_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          {row.group_id ? <Link to={`/admin/groups/${row.group_id}`}><ActionButton title="Group"><ExternalLink size={16} /></ActionButton></Link> : null}
          <Link to="/admin/evaluation/results"><ActionButton title="Evaluation results" tone="blue"><ExternalLink size={16} /></ActionButton></Link>
        </div>
      ),
    },
  ], [t]);

  return (
    <>
      <FilterBar>
        <FilterSelect label={t("ai.suggestions.filterClass")} value={query.class_id} onChange={(class_id) => setQuery((prev) => ({ ...prev, page: 1, class_id }))} options={options.classes} />
        <FilterSelect label={t("ai.suggestions.filterLecturer")} value={query.lecturer_id} onChange={(lecturer_id) => setQuery((prev) => ({ ...prev, page: 1, lecturer_id }))} options={options.lecturers} />
        <FilterSelect label={t("ai.suggestions.filterStatus")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={statusOptions} />
        <FilterSelect label="Provider" value={query.provider_key} onChange={(provider_key) => setQuery((prev) => ({ ...prev, page: 1, provider_key }))} options={providerOptions} />
        <input
          className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          value={query.model}
          onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, model: e.target.value }))}
          placeholder={t("ai.suggestions.filterModel")}
        />
        <input
          type="date"
          className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          value={query.date_from}
          onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, date_from: e.target.value }))}
        />
        <input
          type="date"
          className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          value={query.date_to}
          onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, date_to: e.target.value }))}
        />
      </FilterBar>
      <AdminTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        meta={meta}
        onRowClick={setSelected}
        onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))}
        emptyText={t("ai.suggestions.noFilterMatch")}
      />
      {selected ? <SuggestionDetail row={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

function SuggestionDetail({ row, onClose }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/30" onClick={onClose}>
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t("ai.suggestions.detailTitle")} #{row.id}</h2>
            <p className="mt-1 text-sm text-gray-500">{row.class_code || "—"} · {row.group_name || "—"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700"><X size={18} /></button>
        </div>
        <div className="mt-6 space-y-5 text-sm text-gray-700">
          <Info label={t("ai.suggestions.colTarget")} value={`${row.target_type} #${row.target_id}`} />
          <Info label={t("ai.suggestions.labelRequestedBy")} value={row.requested_by_name || "—"} />
          <Info label="Provider" value={row.provider_key || "—"} />
          <Info label={t("ai.suggestions.filterModel")} value={row.model_name || "—"} />
          <Info label={t("ai.suggestions.filterStatus")} value={row.status} />
          <Info label={t("ai.suggestions.colConfidence")} value={formatConfidence(row.confidence_score)} />
          <Info label={t("ai.suggestions.potentialLevel")} value={`${row.project_potential_level || "unknown"} · ${formatConfidence(row.project_potential_confidence_score)}`} />
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">Summary</p>
            <p className="mt-1 leading-6">{row.summary || "—"}</p>
          </div>
          {row.error_message ? <div className="rounded-xl border border-red-100 bg-red-50 p-3 font-semibold text-red-600">{row.error_message}</div> : null}
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs font-bold uppercase text-gray-400">{label}</p><p className="mt-1 font-semibold text-gray-900">{value}</p></div>;
}
