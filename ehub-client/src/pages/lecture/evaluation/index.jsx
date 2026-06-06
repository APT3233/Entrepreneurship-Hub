import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, ClipboardList, Layers3, Star, TimerReset } from "lucide-react";
import gradingService from "@/api/grading";
import { rubricService } from "@/api/adminEvaluationOps";
import { useTranslation } from "@/context/TranslationContext";

function MetricCard({ label, value, icon: Icon, tone = "indigo" }) {
  const toneClass = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  }[tone] || "bg-indigo-50 text-indigo-600";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon size={21} />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-gray-900">{value ?? 0}</p>
    </div>
  );
}

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

  const cards = useMemo(() => [
    { label: "Bài cần chấm", value: dashboard.total_need_grading, icon: ClipboardCheck, tone: "indigo" },
    { label: "Checkpoint", value: dashboard.checkpoint_need_grading, icon: ClipboardList, tone: "blue" },
    { label: "Assignment", value: dashboard.assignment_need_grading, icon: Star, tone: "emerald" },
    { label: "Draft evaluation", value: dashboard.draft_evaluations, icon: TimerReset, tone: "amber" },
    { label: "Rubric của tôi", value: rubricMeta.total, icon: Layers3, tone: "violet" },
  ], [dashboard, rubricMeta.total]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">{t("lecturer.evaluation")}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý rubric của chính bạn và theo dõi nhanh các bài đang chờ chấm.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/lecturer/evaluation/rubrics" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <Layers3 size={16} /> Rubrics
          </Link>
          <Link to="/lecturer/grading" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <ClipboardCheck size={16} /> Chấm điểm
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">
          {t("common.loading")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => <MetricCard key={card.label} {...card} />)}
        </div>
      )}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-800">
        Lecturer chỉ được tạo, sửa, clone, gắn rubric do chính mình sở hữu. Admin vẫn quản lý toàn bộ rubric ở khu vực Admin.
      </div>
    </div>
  );
}
