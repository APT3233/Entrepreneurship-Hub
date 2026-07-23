import { useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  Users,
  ClipboardList,
  ClipboardCheck,
  Star,
  BarChart3,
  Calendar,
  PinIcon,
  PinOff,
  Rocket,
} from "lucide-react";
import { GraduationCapIcon } from "@/components/icons/education";
import { useTranslation } from "@/context/TranslationContext";

export default function AppSidebar({ items, subtitle }) {
  const { t } = useTranslation();

  const localizedDefaultNavItems = useMemo(() => [
    { label: t("lecturer.dashboard"), icon: Home, path: "/lecturer/dashboard" },
    { label: t("lecturer.classes"), icon: BookOpen, path: "/lecturer/classes" },
    { label: t("lecturer.groups"), icon: Users, path: "/lecturer/groups" },
    { label: t("lecturer.assignments"), icon: ClipboardList, path: "/lecturer/assignments" },
    { label: t("lecturer.grading"), icon: Star, path: "/lecturer/grading" },
    { label: t("lecturer.evaluation"), icon: ClipboardCheck, path: "/lecturer/evaluation" },
    { label: t("lecturer.analytics"), icon: BarChart3, path: "/lecturer/analytics" },
    { label: t("lecturer.mentoring"), icon: ClipboardCheck, path: "/lecturer/mentoring/sessions" },
    { label: t("lecturer.mentorAnalytics"), icon: BarChart3, path: "/lecturer/mentor-analytics" },
    { label: t("lecturer.incubation"), icon: Rocket, path: "/lecturer/incubation/nominations" },
    { label: t("lecturer.schedule"), icon: Calendar, path: "/lecturer/schedule" },
  ], [t]);

  const navItems = items && items.length ? items : localizedDefaultNavItems;
  const actualSubtitle = subtitle || t("lecturer.portal");
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(() => {
    return localStorage.getItem("sidebar_pinned") === "true";
  });
  const location = useLocation();

  // Items with query params (e.g. ?tab=expertise) need an exact pathname+search match.
  // Plain-path siblings on the same pathname must not stay active when a query tab is selected.
  const isNavItemActive = (item, index) => {
    const itemUrl = new URL(item.path, "http://x");
    const hasQuery = itemUrl.search !== "";
    if (hasQuery) {
      return location.pathname === itemUrl.pathname && location.search === itemUrl.search;
    }

    const querySiblingActive = navItems.some((other) => {
      if (other.path === item.path) return false;
      const otherUrl = new URL(other.path, "http://x");
      return (
        otherUrl.pathname === item.path
        && otherUrl.search !== ""
        && location.pathname === otherUrl.pathname
        && location.search === otherUrl.search
      );
    });
    if (querySiblingActive) return false;

    if (index === 0) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

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
          bg-surface border-r border-border
          transition-[width] duration-300 ease-in-out
        "
      >
        {/* Branding */}
        <div className="flex items-center gap-3 px-[14px] py-5 border-b border-border overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <GraduationCapIcon />
          </div>
          <div
            style={{
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? "translateX(0)" : "translateX(-6px)",
            }}
            className="transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden"
          >
            <p className="text-[17px] font-medium text-accent tracking-tight leading-tight">
              E-HUB
            </p>
            <p className="text-xs text-text-muted font-medium mt-0.5">
              {actualSubtitle}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 p-2 mt-1">
          {navItems.map((item, i) => {
            if (item.disabled) {
              return (
                <div
                  key={item.path}
                  title={`${item.label} — ${t("common.comingSoon")}`}
                  style={{ transitionDelay: isOpen ? `${i * 20}ms` : "0ms" }}
                  className="group flex items-center gap-3 px-[14px] py-[11px] rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden whitespace-nowrap text-text-muted opacity-60 cursor-not-allowed"
                >
                  <span className="relative shrink-0">
                    <item.icon size={20} className="transition-colors duration-200 text-text-muted" />
                  </span>
                  <span
                    style={{
                      opacity: isOpen ? 1 : 0,
                      width: isOpen ? "auto" : 0,
                    }}
                    className="transition-all duration-300 ease-in-out overflow-hidden"
                  >
                    {item.label}
                  </span>
                </div>
              );
            }
            const active = isNavItemActive(item, i);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={!isOpen ? item.label : undefined}
                style={{ transitionDelay: isOpen ? `${i * 20}ms` : "0ms" }}
                className={
                  `group flex items-center gap-3 px-[14px] py-[11px] rounded-xl text-sm font-medium
                 transition-all duration-200 overflow-hidden whitespace-nowrap
                 ${
                   active
                     ? "bg-accent-bg text-accent"
                     : "text-text-secondary hover:bg-subtle hover:text-text-primary"
                 }`
                }
              >
                <span className="relative shrink-0">
                  <item.icon
                    size={20}
                    className={`transition-colors duration-200 ${
                      active
                        ? "text-accent"
                        : "text-text-muted group-hover:text-text-secondary"
                    }`}
                  />
                  {active && !isOpen && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                </span>
                <span
                  style={{
                    opacity: isOpen ? 1 : 0,
                    width: isOpen ? "auto" : 0,
                  }}
                  className="transition-all duration-300 ease-in-out overflow-hidden"
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer — Pin */}
        <div className="mt-auto border-t border-border px-[14px] py-4 flex items-center gap-3 overflow-hidden">
          <button
            onClick={togglePin}
            title={pinned ? t("common.unpin") : t("common.pin")}
            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer
              ${
                pinned
                  ? "bg-accent-bg text-accent hover:bg-accent-bg"
                  : "text-text-muted hover:bg-subtle hover:text-text-secondary"
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
              <span className="text-accent font-medium">{t("common.pinned")}</span>
            ) : (
              <span className="text-text-muted">{t("common.autoCollapse")}</span>
            )}
          </span>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="
        md:hidden fixed bottom-0 left-0 right-0 z-50
        bg-surface/95 backdrop-blur-md
        border-t border-border
        flex items-center justify-around
        px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]
      "
      >
        {navItems.map((item, index) => {
          if (item.disabled) {
            return (
              <div key={item.path} title={`${item.label} — ${t("common.comingSoon")}`} className="flex flex-col items-center gap-1 py-1 flex-1 min-w-0 rounded-xl text-text-muted opacity-60 cursor-not-allowed">
                <span className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200">
                  <item.icon size={18} strokeWidth={1.8} />
                </span>
                <span className="text-[9px] font-medium leading-none w-full text-center px-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
              </div>
            );
          }
          const active = isNavItemActive(item, index);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={
                `flex flex-col items-center gap-1 py-1 flex-1 min-w-0 rounded-xl transition-all duration-200
               ${active ? "text-accent" : "text-text-muted"}`
              }
            >
              <span
                className={`
                w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200
                ${active ? "bg-accent-bg scale-110" : ""}
              `}
              >
                <item.icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              </span>
              <span
                className={`text-[9px] font-medium leading-none w-full text-center px-0.5 whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${
                  active ? "text-accent" : "text-text-muted"
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
