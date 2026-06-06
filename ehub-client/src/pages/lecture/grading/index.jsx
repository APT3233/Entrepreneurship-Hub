import { useEffect, useState } from "react";
import gradingService from "@/api/grading";
import { useTranslation } from "@/context/TranslationContext";
import GradingDashboardCards from "./components/GradingDashboardCards";
import SubmissionListSection from "./components/SubmissionListSection";

export default function LecturerGradingPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState({});

  useEffect(() => {
    let mounted = true;
    gradingService.dashboard()
      .then((res) => {
        if (mounted) setSummary(res?.data || {});
      })
      .catch(() => {
        if (mounted) setSummary({});
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("lecturer.gradingPage.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("lecturer.gradingPage.subtitle")}</p>
      </div>
      <GradingDashboardCards summary={summary} />
      <SubmissionListSection title={t("lecturer.gradingPage.submissionListTitle")} />
    </div>
  );
}
