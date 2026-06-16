import { useEffect, useState } from "react";
import gradingService from "@/api/grading";
import { useTranslation } from "@/context/TranslationContext";
import GradingDashboardCards from "./components/GradingDashboardCards";
import SubmissionListSection from "./components/SubmissionListSection";

export default function LecturerGradingPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState({});
  const [period, setPeriod] = useState({ year: null, semester_id: null });

  // Fetch stats when period changes
  useEffect(() => {
    let mounted = true;
    if (period.year === null || period.semester_id === null) return;
    
    const params = {
      ...(period.year && { year: period.year }),
      ...(period.semester_id && { semester_id: period.semester_id })
    };
    gradingService.dashboard(params)
      .then((res) => {
        if (mounted) setSummary(res?.data || {});
      })
      .catch(() => {
        if (mounted) setSummary({});
      });
    return () => {
      mounted = false;
    };
  }, [period.year, period.semester_id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("lecturer.gradingPage.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("lecturer.gradingPage.subtitle")}</p>
        </div>
      </div>

      <GradingDashboardCards summary={summary} />
      
      <SubmissionListSection 
        title={t("lecturer.gradingPage.submissionListTitle")} 
        onPeriodChange={setPeriod}
      />
    </div>
  );
}
