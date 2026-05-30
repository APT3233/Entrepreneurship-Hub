import { AlertTriangle, ClipboardCheck, ClipboardList, FileCheck2, History, Layers3, PencilLine, ShieldCheck } from "lucide-react";
import StatCard from "@/components/ui/Card/StatCard";

export default function EvaluationOverviewCards({ cards = {}, loading = false }) {
  const value = (key) => (loading ? "..." : Number(cards[key] || 0));
  const items = [
    { key: "total_graded", title: "Đã chấm", icon: FileCheck2, bg: "bg-emerald-50", color: "text-emerald-600" },
    { key: "total_pending", title: "Chờ chấm", icon: ClipboardList, bg: "bg-amber-50", color: "text-amber-600" },
    { key: "total_draft", title: "Draft", icon: PencilLine, bg: "bg-slate-50", color: "text-slate-600" },
    { key: "total_submitted", title: "Submitted", icon: ClipboardCheck, bg: "bg-blue-50", color: "text-blue-600" },
    { key: "total_confirmed", title: "Confirmed", icon: ShieldCheck, bg: "bg-indigo-50", color: "text-indigo-600" },
    { key: "active_rubrics", title: "Rubric active", icon: Layers3, bg: "bg-cyan-50", color: "text-cyan-600" },
    { key: "unbound_targets", title: "Chưa gắn rubric", icon: AlertTriangle, bg: "bg-orange-50", color: "text-orange-600" },
    { key: "edited_grades", title: "Audit sửa điểm", icon: History, bg: "bg-rose-50", color: "text-rose-600" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <StatCard
            key={item.key}
            title={item.title}
            value={value(item.key)}
            icon={<Icon size={22} />}
            iconBg={item.bg}
            iconColor={item.color}
          />
        );
      })}
    </div>
  );
}
