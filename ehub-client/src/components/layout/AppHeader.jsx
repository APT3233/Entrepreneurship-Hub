import { CircleUserRound, LogOut } from "lucide-react";

export default function AppHeader({
  user = { name: "TS. Nguyễn Văn B", department: "Khoa kinh tế" },
  onLogout,
}) {
  return (
    <header className="shrink-0 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-end gap-3 sm:gap-6 px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <CircleUserRound className="w-7 h-7 sm:w-8 sm:h-8 text-gray-500 shrink-0" />
          <div className="text-right leading-tight min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
              {user.name}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">
              {user.department}
            </p>
          </div>
        </div>
        <div className="h-6 sm:h-8 w-px bg-gray-200 shrink-0" />
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors duration-200 group shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4 sm:w-[18px] sm:h-[18px] group-hover:translate-x-0.5 transition-transform" />
          Log out
        </button>
      </div>
    </header>
  );
}

