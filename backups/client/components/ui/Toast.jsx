import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

// ── Config per type ───────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-100",
    borderColor: "border-emerald-100",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-red-500",
    iconBg: "bg-red-100",
    borderColor: "border-red-100",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-100",
    borderColor: "border-amber-100",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-100",
    borderColor: "border-blue-100",
  },
};

function nextToastId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ── Single Toast ──────────────────────────────────────────────────────────────
/**
 * Props:
 *  - type: "success" | "error" | "warning" | "info"
 *  - title: string
 *  - subtitle: string
 *  - onClose: () => void
 *  - duration?: number   (ms, 0 = no auto-close, default 4000)
 */
export function Toast({ type = "info", title, subtitle, onClose, duration = 4000 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const finishClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => onClose?.(), 300);
  }, [onClose]);

  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(finishClose, duration);
    return () => clearTimeout(timer);
  }, [duration, finishClose]);

  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.info;
  const Icon = config.icon;
  const hasSubtitle = Boolean(subtitle);

  return (
    <div
      className={`
        flex ${hasSubtitle ? "items-start" : "items-center"} gap-3.5 w-full max-w-sm
        bg-white rounded-2xl border ${config.borderColor} shadow-md px-4 py-4
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
      role="alert"
    >
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${config.iconBg}`}>
        <Icon size={18} className={config.iconColor} strokeWidth={2.2} />
      </div>

      <div
        className={`flex-1 min-w-0 ${hasSubtitle ? "pt-0.5 text-left" : "text-center"}`}
      >
        <p className="text-sm font-semibold text-gray-800 leading-snug">{title}</p>
        {hasSubtitle && (
          <p className="mt-0.5 text-xs text-gray-500 leading-relaxed text-left">{subtitle}</p>
        )}
      </div>

      <button
        type="button"
        onClick={finishClose}
        className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
        aria-label="Đóng"
      >
        <X size={15} />
      </button>
    </div>
  );
}

// ── Toast Container (fixed top-right) ─────────────────────────────────────
export function ToastContainer({ toasts = [], onClose }) {
  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 items-end pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={() => onClose(toast.id)} />
        </div>
      ))}
    </div>
  );
}

const ToastContext = createContext(null);

function useToastState() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((opts) => {
    const id = nextToastId();
    setToasts((prev) => [...prev, { id, ...opts }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}

/**
 * Wrap app root (see App.jsx). Exposes useToast() for pages.
 */
export function ToastProvider({ children }) {
  const { toasts, showToast, removeToast } = useToastState();

  const value = useMemo(
    () => ({
      showToast,
      removeToast,
      success: (title, subtitle, duration) =>
        showToast({ type: "success", title, subtitle, duration }),
      error: (title, subtitle, duration) =>
        showToast({ type: "error", title, subtitle, duration }),
      warning: (title, subtitle, duration) =>
        showToast({ type: "warning", title, subtitle, duration }),
      info: (title, subtitle, duration) =>
        showToast({ type: "info", title, subtitle, duration }),
    }),
    [showToast, removeToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export default Toast;
