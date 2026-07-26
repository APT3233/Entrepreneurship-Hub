import { AlertTriangle, ClipboardCheck, ClipboardList, Clock3, FileClock, TimerReset } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";
import StatCard from "@/components/ui/Card/StatCard";

export default function GradingDashboardCards({ summary = {} }) {
  const { t } = useTranslation();
  const value = (key) => summary[key] ?? "—";
  const nearestDeadline = summary.nearest_deadline
    ? new Date(summary.nearest_deadline).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
    : "—";

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard title={t("lecturer.gradingPage.cards.totalNeedGrading")} value={value("total_need_grading")} icon={<ClipboardCheck />} tone="accent" />
      <StatCard title={t("lecturer.gradingPage.cards.checkpoint")} value={value("checkpoint_need_grading")} icon={<ClipboardList />} tone="blue" />
      <StatCard title={t("lecturer.gradingPage.cards.assignment")} value={value("assignment_need_grading")} icon={<FileClock />} tone="slate" />
      <StatCard title={t("lecturer.gradingPage.cards.late")} value={value("late_submissions")} icon={<AlertTriangle />} tone="red" />
      <StatCard title={t("lecturer.gradingPage.cards.draft")} value={value("draft_evaluations")} icon={<TimerReset />} tone="amber" />
      <StatCard title={t("lecturer.gradingPage.cards.nearestDeadline")} value={nearestDeadline} icon={<Clock3 />} tone="green" valueClassName="text-2xl font-bold" />
    </div>
  );
}
