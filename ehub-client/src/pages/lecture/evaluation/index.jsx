import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, ClipboardList, Star, TimerReset, Layers3, ArrowRight } from "lucide-react";
import gradingService from "@/api/grading";
import { rubricService } from "@/api/adminEvaluationOps";
import { useTranslation } from "@/context/TranslationContext";

export default function LecturerEvaluationOverview() {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState({});
  const [rubricMeta, setRubricMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      gradingService.dashboard(),
      rubricService.list({ page: 1, limit: 1 }),
    ])
      .then(([dashboardRes, rubricRes]) => {
        if (!mounted) return;
        setDashboard(dashboardRes?.data || {});
        setRubricMeta(rubricRes?.meta || { total: rubricRes?.total || 0 });
      })
      .catch(() => {
        if (!mounted) return;
        setDashboard({});
        setRubricMeta({ total: 0 });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const breakdown = useMemo(() => [
    { label: "Checkpoint", value: dashboard.checkpoint_need_grading ?? 0, icon: ClipboardList, dot: "bg-secondary", text: "text-secondary" },
    { label: "Assignment", value: dashboard.assignment_need_grading ?? 0, icon: Star, dot: "bg-success", text: "text-success" },
    { label: "Bản nháp", value: dashboard.draft_evaluations ?? 0, icon: TimerReset, dot: "bg-warning", text: "text-warning" },
  ], [dashboard]);

  const totalNeed = dashboard.total_need_grading ?? 0;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">{t("lecturer.evaluation")}</h1>
        <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
          Theo dõi hàng chờ chấm và quản lý bộ rubric đánh giá của bạn.
        </p>
      </div>

      {/* Workspace: hàng chờ chấm (tâm điểm) + rubrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grading queue — focal */}
        <div className="lg:col-span-2 rounded-card bg-surface shadow-card p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-accent-bg text-accent">
              <ClipboardCheck size={18} />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Hàng chờ chấm</h2>
          </div>

          <div className="mt-5 flex items-end gap-3">
            <span className="text-5xl font-bold text-text-primary leading-none tracking-tight">
              {loading ? "—" : totalNeed}
            </span>
            <span className="text-sm text-text-secondary mb-1">bài đang chờ chấm điểm</span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {breakdown.map((b) => (
              <div key={b.label} className="rounded-xl bg-subtle p-4">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${b.dot}`} />
                  <span className="text-xs text-text-secondary">{b.label}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-text-primary leading-none">{loading ? "—" : b.value}</p>
              </div>
            ))}
          </div>

          <Link
            to="/lecturer/grading"
            className="mt-auto pt-6 self-start"
          >
            <span className="inline-flex items-center gap-2 rounded-control bg-accent hover:bg-accent-hover text-white px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-150">
              Bắt đầu chấm
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>

        {/* Rubrics panel */}
        <div className="lg:col-span-1 rounded-card bg-surface shadow-card p-6 flex flex-col">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-secondary-bg text-secondary">
              <Layers3 size={18} />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Rubrics</h2>
          </div>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-4xl font-bold text-text-primary leading-none tracking-tight">
              {loading ? "—" : (rubricMeta.total ?? 0)}
            </span>
            <span className="text-sm text-text-secondary mb-1">rubric của bạn</span>
          </div>

          <p className="mt-3 text-sm text-text-secondary leading-relaxed">
            Tạo, sửa, nhân bản và gắn rubric cho các bài đánh giá.
          </p>

          <Link
            to="/lecturer/evaluation/rubrics"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-control border border-border px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-subtle transition-colors"
          >
            <Layers3 size={16} /> Quản lý rubric
          </Link>

          <p className="mt-auto pt-6 text-xs text-text-muted leading-relaxed">
            Bạn chỉ quản lý rubric do mình sở hữu. Toàn bộ rubric hệ thống do Admin quản lý.
          </p>
        </div>
      </div>
    </div>
  );
}
