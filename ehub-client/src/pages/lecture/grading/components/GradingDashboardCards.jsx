import { useTranslation } from "@/context/TranslationContext";
import StatCard from "@/components/ui/Card/StatCard";

export default function GradingDashboardCards({ summary = {} }) {
  const { t } = useTranslation();
  const value = (key) => summary[key] ?? "—";
  const nearestDeadline = summary.nearest_deadline ? new Date(summary.nearest_deadline).toLocaleString() : "—";

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard title={t("lecturer.gradingPage.cards.totalNeedGrading")} value={value("total_need_grading")} />
      <StatCard title={t("lecturer.gradingPage.cards.checkpoint")} value={value("checkpoint_need_grading")} />
      <StatCard title={t("lecturer.gradingPage.cards.assignment")} value={value("assignment_need_grading")} />
      <StatCard title={t("lecturer.gradingPage.cards.late")} value={value("late_submissions")} />
      <StatCard title={t("lecturer.gradingPage.cards.draft")} value={value("draft_evaluations")} />
      <StatCard title={t("lecturer.gradingPage.cards.nearestDeadline")} value={nearestDeadline} />
    </div>
  );
}
