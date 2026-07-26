import { useMemo } from "react";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import AdminTable from "@/pages/admin/components/AdminTable";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import { useTranslation } from "@/context/TranslationContext";
import { useAdminColumns } from "@/utils/adminLabels";

export default function CriteriaTable({ criteria = [], planned = false, onAdd, onEdit, onDelete }) {
  const { t } = useTranslation();
  const c = useAdminColumns();

  const columns = useMemo(() => [
    { key: "name", label: c.criterion, render: (row) => <span className="font-semibold text-gray-900">{row.name || row.criteria_name}</span> },
    { key: "description", label: c.description },
    { key: "max_score", label: c.maxScore },
    { key: "weight", label: c.weight },
    { key: "order_index", label: c.order },
    {
      key: "required_feedback",
      label: c.feedback,
      render: (row) => (row.is_required_feedback || row.required_feedback ? c.required : c.optional),
    },
    {
      key: "actions",
      label: "",
      render: (row) => planned ? null : (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => onEdit?.(row)} title={t("admin.actions.edit")}><SquarePen size={16} /></ActionButton>
          <ActionButton onClick={() => onDelete?.(row)} title={t("admin.actions.delete")} tone="red"><Trash2 size={16} /></ActionButton>
        </div>
      ),
    },
  ], [c, planned, onEdit, onDelete, t]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          disabled={planned}
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} /> {t("admin.rubric.addCriterion")}
        </button>
      </div>
      <AdminTable columns={columns} rows={criteria} emptyText={t("admin.rubric.emptyCriteria")} />
    </div>
  );
}
