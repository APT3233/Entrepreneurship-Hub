import { useEffect, useState } from "react";
import AdminDashboardApi from "@/api/adminDashboard";
import { useTranslation } from "@/context/TranslationContext";
import StatCard from "@/components/ui/Card/StatCard";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cards = [
    { key: "totalUsers", label: t("profile.actions.register") === "Đăng ký tài khoản" ? "Tổng số users" : "Total Users" },
    { key: "totalLecturers", label: t("lecturer.portal") === "Cổng giảng viên" ? "Giảng viên" : "Lecturers" },
    { key: "totalStudents", label: t("student.portal") === "Cổng sinh viên" ? "Sinh viên" : "Students" },
    { key: "totalClasses", label: t("nav.classes") },
    { key: "totalGroups", label: t("nav.groups") },
    { key: "pendingInvites", label: t("nav.groupInvites") },
    { key: "needGrading", label: t("profile.actions.grade_assignment") === "Chấm điểm bài tập" ? "Bài cần chấm" : "Needs Grading" },
  ];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await AdminDashboardApi.getDashboard();
        if (mounted) setStats(res?.data || {});
      } catch (err) {
        if (mounted) setError(err.message || t("admin.toasts.actionFailed"));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [t]);

  if (loading) {
    return <div className="rounded-card border border-border bg-surface p-8 text-text-muted">{t("common.loading")}</div>;
  }
  if (error) {
    return <div className="rounded-card border border-border bg-surface p-8 text-danger-text">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.key} title={card.label} value={Number(stats?.[card.key] || 0)} />
      ))}
    </div>
  );
}
