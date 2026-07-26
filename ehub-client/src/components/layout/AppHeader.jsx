import { useState } from "react";
import { Users, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "@/context/TranslationContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

function displayNameFromUser(user) {
  if (!user) return "";
  return (
    user.full_name ||
    user.fullName ||
    user.name ||
    user.username ||
    user.email ||
    ""
  );
}

function UserAvatar({ user }) {
  const [failed, setFailed] = useState(false);
  const url = user?.avatar_url || user?.avatarUrl;
  if (url && !failed) {
    return (
      <img
        src={url}
        alt=""
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-border shrink-0 bg-page"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-surface bg-page flex items-center justify-center shrink-0">
      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted" />
    </div>
  );
}

export default function AppHeader({ user = null, onLogout, hidden = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const name = displayNameFromUser(user) || "—";
  const major = user?.major || user?.student_major || "";
  const email = user?.email || "";
  const department = user?.department || "";
  const rolesLine =
    Array.isArray(user?.roles) && user.roles.length ? user.roles.join(" · ") : "";

  const handleProfileClick = () => {
    const isLecturer = location.pathname.startsWith("/lecturer");
    const isStudent = location.pathname.startsWith("/student");
    const isMentor = location.pathname.startsWith("/mentor");
    if (isLecturer) navigate("/lecturer/profile");
    else if (isStudent) navigate("/student/profile");
    else if (isMentor) navigate("/mentor/profile");
    else navigate("/profile");
  };

  return (
    <header
      className={`sticky top-0 z-30 w-full bg-page/90 backdrop-blur-md transition-transform duration-300 ease-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="flex items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3">
        <LanguageSwitcher />

        {/* Profile */}
        <div
          onClick={handleProfileClick}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer rounded-full pl-1 pr-1 sm:pr-3 py-1 hover:bg-subtle transition-colors group/header"
        >
          <UserAvatar user={user} />
          <div className="leading-tight min-w-0 hidden sm:block">
            <p className="text-sm font-semibold text-text-primary truncate group-hover/header:text-accent transition-colors" title={name}>
              {name}
            </p>
            {(major || department || rolesLine) && (
              <p className="text-xs text-text-muted truncate">
                {major || department || rolesLine}
              </p>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-2 text-sm font-medium text-text-secondary hover:bg-danger-bg hover:text-danger-text transition-colors shrink-0 cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span className="hidden sm:inline">{t("header.logoutButton")}</span>
        </button>
      </div>
    </header>
  );
}
