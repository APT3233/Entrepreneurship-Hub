import { Suspense, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BarChart3, CalendarDays, ClipboardList, FileText, Handshake, Tags, UserRound, Users } from "lucide-react";
import { authApi } from "@/api/auth";
import AppHeader from "@/components/layout/AppHeader";
import AppSidebar from "@/components/layout/AppSidebar";
import ConfirmModal from "@/components/modal/ConfirmModal";
import NavProgress from "@/components/ui/NavProgress";
import { useTranslation } from "@/context/TranslationContext";
import { logout, selectAuthUser } from "@/store/slices/authSlice";

export default function MentorLayout() {
  const { t } = useTranslation();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);

  const navItems = useMemo(() => [
    { label: t("mentorPortal.nav.dashboard"), icon: BarChart3, path: "/mentor/dashboard" },
    { label: t("mentorPortal.nav.profile"), icon: UserRound, path: "/mentor/profile" },
    { label: t("mentorPortal.nav.expertise"), icon: Tags, path: "/mentor/profile?tab=expertise" },
    { label: t("mentorPortal.nav.availability"), icon: CalendarDays, path: "/mentor/availability" },
    { label: t("mentorPortal.nav.documents"), icon: FileText, path: "/mentor/documents" },
    { label: t("mentorPortal.nav.assignments"), icon: Handshake, path: "/mentor/assignments" },
    { label: t("mentorPortal.nav.groups"), icon: Users, path: "/mentor/groups" },
    { label: t("mentorPortal.nav.sessions"), icon: ClipboardList, path: "/mentor/sessions" },
  ], [t]);

  const handleLogout = () => {
    setLogoutOpen(false);
    authApi.logout();
    dispatch(logout());
    navigate("/auth/login");
  };

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-slate-100">
      <NavProgress />
      <AppSidebar items={navItems} subtitle="Mentor Portal" />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <AppHeader user={user} onLogout={() => setLogoutOpen(true)} />
        <main className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4 pb-20 sm:p-6 sm:pb-6">
          <Suspense fallback={<div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("common.loading") || "Loading..."}</div>}>
            <div key={location.pathname + location.search} className="page-fade-in">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>

      <ConfirmModal
        isOpen={logoutOpen}
        title={t("mentorPortal.logout.title")}
        subtitle={t("mentorPortal.logout.subtitle")}
        variant="logout"
        color="indigo"
        yesLabel={t("mentorPortal.logout.title")}
        noLabel={t("common.cancel") || "Cancel"}
        onYes={handleLogout}
        onClose={() => setLogoutOpen(false)}
        onNo={() => setLogoutOpen(false)}
      />
    </div>
  );
}
