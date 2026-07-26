import { useState, useEffect, useMemo, Suspense } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AppHeader from "@/components/layout/AppHeader";
import AppSidebar from "@/components/layout/AppSidebar";
import {
  Home,
  Users,
  ClipboardList,
  Activity,
  Calendar,
  CalendarClock,
  Megaphone,
  Rocket,
} from "lucide-react";
import NavProgress from "@/components/ui/NavProgress";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { authApi } from "@/api/auth";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectAuthUser } from "@/store/slices/authSlice";
import { useTranslation } from "@/context/TranslationContext";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import useHideOnScroll from "@/hooks/useHideOnScroll";
import { getStudentPageTitle } from "@/utils/portalPageTitles";

const StudentLayout = () => {
  const { t } = useTranslation();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [hasGroup, setHasGroup] = useState(true);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);

  const baseNavItems = useMemo(() => [
    { label: t("student.dashboard"), icon: Home, path: "/student/dashboard" },
    { label: t("student.groups"), icon: Users, path: "/student/groups" },
    { label: t("student.assignments"), icon: ClipboardList, path: "/student/assignments" },
    { label: "Mentoring", icon: CalendarClock, path: "/student/mentoring" },
    { label: "Startup", icon: Rocket, path: "/student/startup-profile" },
    { label: "Cơ hội", icon: Megaphone, path: "/student/ecosystem/opportunities" },
    { label: t("student.status"), icon: Activity, path: "/student/status", disabled: true },
    { label: t("student.schedule"), icon: Calendar, path: "/student/schedule", disabled: true },
  ], [t]);

  useEffect(() => {
    const onGate = (event) => {
      if (typeof event?.detail?.hasGroup === "boolean") setHasGroup(event.detail.hasGroup);
    };
    window.addEventListener("student-group-gate", onGate);
    return () => {
      window.removeEventListener("student-group-gate", onGate);
    };
  }, []);

  const navItems = useMemo(() => {
    if (hasGroup) return baseNavItems;
    return baseNavItems.map((it) => ({
      ...it,
      disabled: !(it.path === "/student/dashboard" || it.path === "/student/groups"),
    }));
  }, [hasGroup, baseNavItems]);

  const pageTitle = useMemo(() => getStudentPageTitle(location.pathname, t), [location.pathname, t]);
  useDocumentTitle(pageTitle);

  const [headerHidden, handleScroll] = useHideOnScroll();

  const handleLogout = () => {
    setLogoutModalOpen(false);
    authApi.logout();
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-page">
      <NavProgress />
      <AppSidebar items={navItems} subtitle={t("student.portal")} navHidden={headerHidden} />
      <div className="flex flex-1 flex-col min-w-0 min-h-0 relative">
        <main onScroll={handleScroll} className="flex-1 min-h-0 overflow-auto bg-page">
          <AppHeader user={user} onLogout={() => setLogoutModalOpen(true)} hidden={headerHidden} />
          <div className="p-4 pb-20 sm:p-6 sm:pb-6">
            <Suspense
              fallback={
                <div className="min-h-[200px] flex items-center justify-center">
                  <div className="h-1 w-24 rounded-full bg-accent-200 overflow-hidden">
                    <div className="h-full w-1/2 bg-accent-500 rounded-full animate-nav-progress" />
                  </div>
                </div>
              }
            >
              <div key={location.pathname} className="page-fade-in">
                <Outlet />
              </div>
            </Suspense>
          </div>
        </main>
      </div>

      <ConfirmModal
        isOpen={logoutModalOpen}
        title={t("student.logoutTitle")}
        subtitle={t("student.logoutSubtitle")}
        variant="logout"
        color="indigo"
        yesLabel={t("student.logoutYes")}
        noLabel={t("student.logoutNo")}
        onYes={handleLogout}
        onClose={() => setLogoutModalOpen(false)}
        onNo={() => setLogoutModalOpen(false)}
      />
    </div>
  );
};

export default StudentLayout;
