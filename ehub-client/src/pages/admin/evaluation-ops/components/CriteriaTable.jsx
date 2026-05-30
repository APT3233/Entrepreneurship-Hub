import { Plus } from "lucide-react";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";

export default function CriteriaTable({ criteria = [], planned = false }) {
  const columns = [
    { key: "criteria_name", label: "Criteria", render: (row) => <span className="font-semibold text-gray-900">{row.criteria_name}</span> },
    { key: "description", label: "Description" },
    { key: "max_score", label: "Max score" },
    { key: "weight", label: "Weight" },
    { key: "order_index", label: "Order" },
    { key: "required_feedback", label: "Feedback", render: (row) => row.required_feedback ? "Required" : "Optional" },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status || "draft"} /> },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          disabled={planned}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} /> Add criterion
        </button>
      </div>
      <AdminTable columns={columns} rows={criteria} emptyText="Rubric criteria API chưa triển khai." />
    </div>
  );
}
