import { AlertTriangle, ClipboardCheck, ClipboardList, Clock3, FileClock, TimerReset } from "lucide-react";
import StatCard from "@/components/ui/Card/StatCard";
import { getDateTimeParts } from "@/utils/formatDateTime";

const formatDeadline = (value) => {
  const parts = getDateTimeParts(value);
  if (!parts) return "—";
  return `${parts.dateLine} ${parts.timeLine || ""}`.trim();
};

export default function GradingDashboardCards({ stats = {}, loading = false }) {
  const value = (key) => (loading ? "..." : Number(stats[key] || 0));
  const nearestDeadline = loading ? "..." : formatDeadline(stats.nearest_deadline);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard title="Tổng cần chấm" value={value("total_need_grading")} icon={<ClipboardCheck size={22} />} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
      <StatCard title="Checkpoint" value={value("checkpoint_need_grading")} icon={<ClipboardList size={22} />} iconBg="bg-blue-50" iconColor="text-blue-600" />
      <StatCard title="Assignment" value={value("assignment_need_grading")} icon={<FileClock size={22} />} iconBg="bg-cyan-50" iconColor="text-cyan-600" />
      <StatCard title="Nộp muộn" value={value("late_submissions")} icon={<AlertTriangle size={22} />} iconBg="bg-red-50" iconColor="text-red-600" />
      <StatCard title="Draft" value={value("draft_evaluations")} icon={<TimerReset size={22} />} iconBg="bg-amber-50" iconColor="text-amber-600" />
      <StatCard title="Deadline gần nhất" value={nearestDeadline} icon={<Clock3 size={22} />} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
    </div>
  );
}
