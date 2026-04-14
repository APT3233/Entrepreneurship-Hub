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
} from "lucide-react";
import NavProgress from "@/components/ui/NavProgress";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { authApi } from "@/api/auth";
import GroupInviteApi from "@/api/groupInvite";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectAuthUser } from "@/store/slices/authSlice";
import { LogOut } from "lucide-react";

const studentNavItems = [
  { label: "Trang chủ", icon: Home, path: "/student/dashboard" },
  { label: "Nhóm", icon: Users, path: "/student/groups" },
  { label: "Bài tập", icon: ClipboardList, path: "/student/assignments" },
  { label: "Trạng thái", icon: Activity, path: "/student/status" },
  { label: "Lịch dạy", icon: Calendar, path: "/student/schedule" },
];

const StudentLayout = () => {
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [hasGroup, setHasGroup] = useState(true);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);

  useEffect(() => {
    let mounted = true;
    const loadGroupGate = async () => {
      try {
        const res = await GroupInviteApi.listPending();
        if (!mounted) return;
        setHasGroup(Boolean(res?.data?.hasGroup));
      } catch {
        if (!mounted) return;
        setHasGroup(true);
      }
    };
    loadGroupGate();
    const onGate = (event) => {
      if (!mounted) return;
      if (typeof event?.detail?.hasGroup === "boolean") setHasGroup(event.detail.hasGroup);
    };
    window.addEventListener("student-group-gate", onGate);
    return () => {
      mounted = false;
      window.removeEventListener("student-group-gate", onGate);
    };
  }, []);

  const navItems = useMemo(() => {
    if (hasGroup) return studentNavItems;
    return studentNavItems.map((it) => ({
      ...it,
      disabled: !(it.path === "/student/dashboard" || it.path === "/student/groups"),
    }));
  }, [hasGroup]);

  const handleLogout = () => {
    setLogoutModalOpen(false);
    authApi.logout();
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-slate-100">
      <NavProgress />
      <AppSidebar items={navItems} subtitle="Cổng sinh viên" />
      <div className="flex flex-1 flex-col min-w-0 min-h-0 relative">
        <AppHeader user={user} onLogout={() => setLogoutModalOpen(true)} />
        <main className="flex-1 min-h-0 overflow-auto p-4 pb-20 sm:p-6 sm:pb-6 bg-slate-100">
          <Suspense
            fallback={
              <div className="min-h-[200px] flex items-center justify-center">
                <div className="h-1 w-24 rounded-full bg-indigo-200 overflow-hidden">
                  <div className="h-full w-1/2 bg-indigo-500 rounded-full animate-nav-progress" />
                </div>
              </div>
            }
          >
            <div key={location.pathname} className="page-fade-in">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>

      <ConfirmModal
        isOpen={logoutModalOpen}
        title="Đăng xuất tài khoản"
        subtitle="Bạn có chắc chắn muốn đăng xuất?"
        color="indigo"
        yesLabel="Đăng xuất"
        noLabel="Huỷ"
        onYes={handleLogout}
        yesIcon={<LogOut />}
        onClose={() => setLogoutModalOpen(false)}
        onNo={() => setLogoutModalOpen(false)}
      />
    </div>
  );
};

export default StudentLayout;

