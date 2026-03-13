import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { authApi } from "@/api/auth";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { LogOut } from "lucide-react";

const LectureLayout = () => {
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    setLogoutModalOpen(false);
    authApi.logout()
    dispatch(logout())
    navigate("/auth/login")
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        <Header onLogout={() => setLogoutModalOpen(true)} />
        <main className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 bg-slate-100">
          <Outlet />
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

export default LectureLayout;
