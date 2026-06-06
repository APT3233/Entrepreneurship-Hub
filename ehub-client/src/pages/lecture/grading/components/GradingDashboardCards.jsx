import { AlertTriangle, ClipboardCheck, ClipboardList, Clock3, FileClock, TimerReset } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

function StatCard({ title, value, icon, iconBg, iconColor }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function GradingDashboardCards({ summary = {} }) {
  const { t } = useTranslation();
  const value = (key) => summary[key] ?? "—";
  const nearestDeadline = summary.nearest_deadline ? new Date(summary.nearest_deadline).toLocaleString() : "—";

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard title={t("lecturer.gradingPage.cards.totalNeedGrading")} value={value("total_need_grading")} icon={<ClipboardCheck size={22} />} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
      <StatCard title={t("lecturer.gradingPage.cards.checkpoint")} value={value("checkpoint_need_grading")} icon={<ClipboardList size={22} />} iconBg="bg-blue-50" iconColor="text-blue-600" />
      <StatCard title={t("lecturer.gradingPage.cards.assignment")} value={value("assignment_need_grading")} icon={<FileClock size={22} />} iconBg="bg-cyan-50" iconColor="text-cyan-600" />
      <StatCard title={t("lecturer.gradingPage.cards.late")} value={value("late_submissions")} icon={<AlertTriangle size={22} />} iconBg="bg-red-50" iconColor="text-red-600" />
      <StatCard title={t("lecturer.gradingPage.cards.draft")} value={value("draft_evaluations")} icon={<TimerReset size={22} />} iconBg="bg-amber-50" iconColor="text-amber-600" />
      <StatCard title={t("lecturer.gradingPage.cards.nearestDeadline")} value={nearestDeadline} icon={<Clock3 size={22} />} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
    </div>
  );
}
