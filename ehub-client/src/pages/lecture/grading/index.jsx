import { useEffect, useState } from "react";
import gradingService from "@/api/grading";
import { useTranslation } from "@/context/TranslationContext";
import SubmissionListSection from "./components/SubmissionListSection";

export default function LecturerGradingPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState({});
  const [period, setPeriod] = useState({ year: null, semester_id: null });

  useEffect(() => {
    let mounted = true;
    if (period.year === null || period.semester_id === null) return;
    const params = {
      ...(period.year && { year: period.year }),
      ...(period.semester_id && { semester_id: period.semester_id }),
    };
    gradingService.dashboard(params)
      .then((res) => { if (mounted) setSummary(res?.data || {}); })
      .catch(() => { if (mounted) setSummary({}); });
    return () => { mounted = false; };
  }, [period.year, period.semester_id]);

  const totalNeed = summary.total_need_grading ?? 0;
  const nearestDeadline = summary.nearest_deadline
    ? new Date(summary.nearest_deadline).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
    : null;

  const chips = [
    { label: "Checkpoint", value: summary.checkpoint_need_grading ?? 0, cls: "bg-secondary-bg text-secondary", dot: "bg-secondary" },
    { label: "Assignment", value: summary.assignment_need_grading ?? 0, cls: "bg-subtle text-text-secondary", dot: "bg-text-muted" },
    { label: "Nộp muộn", value: summary.late_submissions ?? 0, cls: "bg-danger-bg text-danger-text", dot: "bg-danger" },
    { label: "Bản nháp", value: summary.draft_evaluations ?? 0, cls: "bg-warning-bg text-warning-text", dot: "bg-warning" },
  ];

  return (
    <div className="space-y-6">
      {/* Hộp việc cần chấm — tâm điểm là khối lượng công việc */}
      <section className="rounded-card bg-surface shadow-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">{t("lecturer.gradingPage.title")}</h1>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-bold text-accent leading-none tracking-tight">{totalNeed}</span>
              <span className="text-sm text-text-secondary mb-1">bài đang chờ bạn chấm</span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <span key={c.label} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${c.cls}`}>
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  {c.label}
                  <span className="font-bold">{c.value}</span>
                </span>
              ))}
            </div>
          </div>

          {nearestDeadline && (
            <div className="rounded-xl bg-accent-bg px-5 py-4 text-center shrink-0">
              <p className="text-xs font-medium text-accent uppercase tracking-wide">Deadline gần nhất</p>
              <p className="mt-1 text-2xl font-bold text-accent leading-none">{nearestDeadline}</p>
            </div>
          )}
        </div>
      </section>

      <SubmissionListSection
        title={t("lecturer.gradingPage.submissionListTitle")}
        onPeriodChange={setPeriod}
      />
    </div>
  );
}
