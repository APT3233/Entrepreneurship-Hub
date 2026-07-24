import { useEffect, useState } from "react";
import gradingService from "@/api/grading";
import { useTranslation } from "@/context/TranslationContext";
import GradingDashboardCards from "./components/GradingDashboardCards";
import SubmissionListSection from "./components/SubmissionListSection";
import PageHeader from "@/components/ui/PageHeader";

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
      <PageHeader
        title={t("lecturer.gradingPage.title")}
        description={t("lecturer.gradingPage.subtitle")}
      />

      <GradingDashboardCards summary={summary} />
      
      <SubmissionListSection 
        title={t("lecturer.gradingPage.submissionListTitle")} 
        onPeriodChange={setPeriod}
      />
    </div>
  );
}
