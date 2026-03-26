import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  BookOpen,
  Users,
  ClipboardList,
  Star,
  Calendar,
  PinIcon,
  PinOff,
} from "lucide-react";
import { GraduationCapIcon } from "@/components/icons/education";

const defaultNavItems = [
  { label: "Trang chủ", icon: Home, path: "/lecturer/dashboard" },
  { label: "Lớp học", icon: BookOpen, path: "/lecturer/classes" },
  { label: "Nhóm Sinh viên", icon: Users, path: "/lecturer/groups" },
  { label: "Bài tập", icon: ClipboardList, path: "/lecturer/assignments" },
  { label: "Chấm điểm", icon: Star, path: "/lecturer/grading" },
  { label: "Lịch dạy", icon: Calendar, path: "/lecturer/schedule" },
];

export default function AppSidebar({ items, subtitle = "Cổng giảng viên" }) {
  const navItems = items && items.length ? items : defaultNavItems;
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(() => {
    return localStorage.getItem("sidebar_pinned") === "true";
  });

  const togglePin = () => {
    const nextValue = !pinned;
    setPinned(nextValue);
    localStorage.setItem("sidebar_pinned", String(nextValue));
  };
  const isOpen = pinned || hovered;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ width: isOpen ? "224px" : "68px" }}
        className="
          hidden md:flex
          relative h-screen flex-col shrink-0 overflow-hidden
          bg-white border-r border-gray-100
          transition-[width] duration-300 ease-in-out
          shadow-[2px_0_12px_rgba(0,0,0,0.06)]
        "
      >
        {/* Branding */}
        <div className="flex items-center gap-3 px-[14px] py-5 border-b border-gray-100 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <GraduationCapIcon />
          </div>
          <div
            style={{
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? "translateX(0)" : "translateX(-6px)",
            }}
            className="transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden"
          >
            <p className="text-[17px] font-bold text-indigo-600 tracking-tight leading-tight">
              E-HUB
            </p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 p-2 mt-1">
          {navItems.map(({ label, icon: Icon, path }, i) => (
            <NavLink
              key={path}
              to={path}
              end={i === 0}
              style={{ transitionDelay: isOpen ? `${i * 20}ms` : "0ms" }}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-[14px] py-[11px] rounded-xl text-sm font-medium
                 transition-all duration-200 overflow-hidden whitespace-nowrap
                 ${
                   isActive
                     ? "bg-indigo-50 text-indigo-600"
                     : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative shrink-0">
                    <Icon
                      size={20}
                      className={`transition-colors duration-200 ${
                        isActive
                          ? "text-indigo-500"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    {isActive && !isOpen && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    )}
                  </span>
                  <span
                    style={{
                      opacity: isOpen ? 1 : 0,
                      width: isOpen ? "auto" : 0,
                    }}
                    className="transition-all duration-300 ease-in-out overflow-hidden"
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer — Pin */}
        <div className="mt-auto border-t border-gray-100 px-[14px] py-4 flex items-center gap-3 overflow-hidden">
          <button
            onClick={togglePin}
            title={pinned ? "Tắt ghim" : "Ghim sidebar"}
            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
              ${
                pinned
                  ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              }`}
          >
            {pinned ? (
              <PinIcon size={16} className="rotate-45" />
            ) : (
              <PinOff size={16} />
            )}
          </button>
          <span
            style={{ opacity: isOpen ? 1 : 0, width: isOpen ? "auto" : 0 }}
            className="text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out"
          >
            {pinned ? (
              <span className="text-indigo-500 font-medium">Đã ghim</span>
            ) : (
              <span className="text-gray-400">Tự động thu</span>
            )}
          </span>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="
        md:hidden fixed bottom-0 left-0 right-0 z-50
        bg-white/95 backdrop-blur-md
        border-t border-gray-100
        shadow-[0_-1px_16px_rgba(0,0,0,0.08)]
        flex items-center justify-around
        px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]
      "
      >
        {navItems.map(({ label, icon: Icon, path }, index) => (
          <NavLink
            key={path}
            to={path}
            end={index === 0}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 flex-1 min-w-0 rounded-xl transition-all duration-200
               ${isActive ? "text-indigo-600" : "text-slate-400"}`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`
                  w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200
                  ${isActive ? "bg-indigo-50 scale-110" : ""}
                `}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                </span>
                <span
                  className={`text-[9px] font-medium leading-none w-full text-center px-0.5 whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${
                    isActive ? "text-indigo-600" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

