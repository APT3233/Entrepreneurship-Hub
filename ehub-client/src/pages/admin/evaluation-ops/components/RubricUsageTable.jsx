import { Copy, ExternalLink, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import { formatDate } from "@/pages/admin/evaluation-ops/shared";

export default function RubricUsageTable({ rows, loading, error, meta, onPageChange, onClone }) {
  const columns = [
    { key: "rubric_name", label: "Rubric", width: 240, render: (row) => (
      <div>
        <p className="font-semibold text-gray-900">{row.rubric_name} v{row.rubric_version || 1}</p>
        <p className="mt-1 text-xs text-gray-400">{row.subject_code || "No subject"}</p>
      </div>
    ) },
    { key: "status", label: "Status", width: 110, render: (row) => <StatusBadge value={row.status} /> },
    { key: "total_criteria", label: "Criteria", width: 90, render: (row) => Number(row.total_criteria || 0) },
    { key: "total_bindings", label: "Bindings", width: 90, render: (row) => Number(row.total_bindings || 0) },
    { key: "used_in_checkpoints", label: "Checkpoints", width: 110, render: (row) => Number(row.used_in_checkpoints || 0) },
    { key: "used_in_assignments", label: "Assignments", width: 110, render: (row) => Number(row.used_in_assignments || 0) },
    { key: "total_evaluations", label: "Evaluations", width: 110, render: (row) => Number(row.total_evaluations || 0) },
    { key: "last_used_at", label: "Last used", width: 150, render: (row) => formatDate(row.last_used_at) },
    { key: "warning", label: "Warning", width: 130, render: (row) => row.warning_unused_active ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <TriangleAlert size={13} /> Unused
      </span>
    ) : "—" },
    { key: "actions", label: "", width: 100, render: (row) => (
      <div className="flex justify-end gap-1">
        <Link to={`/admin/evaluation/rubrics/${row.id}`}>
          <ActionButton title="View rubric"><ExternalLink size={16} /></ActionButton>
        </Link>
        <ActionButton title="Clone rubric" tone="blue" onClick={() => onClone?.(row)}><Copy size={16} /></ActionButton>
      </div>
    ) },
  ];

  return (
    <AdminTable
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      meta={meta}
      onPageChange={onPageChange}
      emptyText="Chưa có rubric usage."
    />
  );
}
