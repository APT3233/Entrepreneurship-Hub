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
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-border shrink-0 bg-subtle"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-surface bg-subtle flex items-center justify-center shrink-0">
      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted" />
    </div>
  );
}

export default function AppHeader({ user = null, onLogout }) {
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
    <header className="shrink-0 w-full bg-surface border-b border-border">
      <div className="flex items-center justify-end gap-3 sm:gap-6 px-4 sm:px-6 py-2 sm:py-3">
        <LanguageSwitcher />
        <div className="h-6 sm:h-8 w-px bg-border shrink-0" />
        <div
          onClick={handleProfileClick}
          className="flex items-center gap-1.5 sm:gap-2 min-h-[44px] min-w-0 cursor-pointer group/header"
        >
          <UserAvatar user={user} />
          <div className="text-right leading-tight min-w-0">
            <p className="text-xs sm:text-sm font-medium text-text-primary truncate group-hover/header:text-accent transition-colors" title={name}>
              {name}
            </p>
            {major ? (
              <p className="text-[11px] sm:text-xs text-text-secondary font-medium truncate mt-0.5" title={major}>
                {major}
              </p>
            ) : null}
            {!major && !email && department ? (
              <p className="text-[11px] sm:text-xs text-text-muted truncate">{department}</p>
            ) : null}
            {!major && !email && !department && rolesLine ? (
              <p className="text-[11px] sm:text-xs text-text-muted truncate">{rolesLine}</p>
            ) : null}
          </div>
        </div>
        <div className="h-6 sm:h-8 w-px bg-border shrink-0" />
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 sm:gap-2 min-h-[44px] text-xs sm:text-sm font-medium text-text-secondary hover:text-accent transition-colors duration-200 group shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4 sm:w-[18px] sm:h-[18px] group-hover:translate-x-0.5 transition-transform" />
          {t("header.logoutButton")}
        </button>
      </div>
    </header>
  );
}
