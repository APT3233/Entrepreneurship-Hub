import { AlertTriangle, ClipboardCheck, ClipboardList, FileCheck2, History, Layers3, PencilLine, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "@/context/TranslationContext";

const cardDefs = [
  { key: "total_graded", icon: FileCheck2, bg: "bg-emerald-50", color: "text-emerald-600" },
  { key: "total_pending", icon: ClipboardList, bg: "bg-amber-50", color: "text-amber-600" },
  { key: "total_draft", icon: PencilLine, bg: "bg-slate-50", color: "text-slate-600" },
  { key: "total_submitted", icon: ClipboardCheck, bg: "bg-blue-50", color: "text-blue-600" },
  { key: "total_confirmed", icon: ShieldCheck, bg: "bg-accent-bg", color: "text-accent" },
  { key: "active_rubrics", icon: Layers3, bg: "bg-cyan-50", color: "text-cyan-600" },
  { key: "unbound_targets", icon: AlertTriangle, bg: "bg-orange-50", color: "text-orange-600" },
  { key: "edited_grades", icon: History, bg: "bg-rose-50", color: "text-rose-600" },
];

export default function EvaluationOverviewCards({ cards = {}, loading = false }) {
  const { t } = useTranslation();
  const items = useMemo(
    () => cardDefs.map((card) => ({ ...card, title: t(`admin.evaluationOps.overview.cards.${card.key}`) })),
    [t],
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.key} className="rounded-card border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="mt-2 text-3xl font-black text-gray-900">{loading ? "—" : Number(cards[card.key] || 0)}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg} ${card.color}`}>
                <Icon size={22} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
