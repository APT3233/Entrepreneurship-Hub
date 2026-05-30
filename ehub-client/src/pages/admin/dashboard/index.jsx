import { useEffect, useState } from "react";
import { BookOpen, ClipboardCheck, Mail, UserCog, Users, UsersRound } from "lucide-react";
import AdminDashboardApi from "@/api/adminDashboard";
import { useTranslation } from "@/context/TranslationContext";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cards = [
    { key: "totalUsers", label: t("profile.actions.register") === "Đăng ký tài khoản" ? "Tổng số users" : "Total Users", icon: Users, color: "bg-blue-50 text-blue-600" },
    { key: "totalLecturers", label: t("lecturer.portal") === "Cổng giảng viên" ? "Giảng viên" : "Lecturers", icon: UserCog, color: "bg-indigo-50 text-indigo-600" },
    { key: "totalStudents", label: t("student.portal") === "Cổng sinh viên" ? "Sinh viên" : "Students", icon: UsersRound, color: "bg-emerald-50 text-emerald-600" },
    { key: "totalClasses", label: t("nav.classes"), icon: BookOpen, color: "bg-amber-50 text-amber-600" },
    { key: "totalGroups", label: t("nav.groups"), icon: UsersRound, color: "bg-violet-50 text-violet-600" },
    { key: "pendingInvites", label: t("nav.groupInvites"), icon: Mail, color: "bg-orange-50 text-orange-600" },
    { key: "needGrading", label: t("profile.actions.grade_assignment") === "Chấm điểm bài tập" ? "Bài cần chấm" : "Needs Grading", icon: ClipboardCheck, color: "bg-rose-50 text-rose-600" },
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
    return <div className="rounded-2xl border border-gray-100 bg-white p-8 text-gray-400 shadow-sm">{t("common.loading")}</div>;
  }
  if (error) {
    return <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.key} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{Number(stats?.[card.key] || 0)}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color}`}>
                <Icon size={22} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
