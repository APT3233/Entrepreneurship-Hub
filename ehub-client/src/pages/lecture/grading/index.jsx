import { useEffect, useState } from "react";
import gradingService from "@/api/grading";
import GradingDashboardCards from "./components/GradingDashboardCards";
import SubmissionListSection from "./components/SubmissionListSection";

export default function GradingPage() {
  const [stats, setStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoadingStats(true);
    gradingService.dashboard()
      .then((res) => {
        if (mounted) setStats(res?.data || {});
      })
      .catch(() => {
        if (mounted) setStats({});
      })
      .finally(() => {
        if (mounted) setLoadingStats(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chấm điểm</h1>
        <p className="mt-1 text-sm text-gray-500">Theo dõi bài cần chấm và mở form chấm theo rubric.</p>
      </div>
      <GradingDashboardCards stats={stats} loading={loadingStats} />
      <SubmissionListSection />
    </div>
  );
}
