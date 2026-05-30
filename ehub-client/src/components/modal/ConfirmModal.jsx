import { cloneElement, isValidElement } from "react";
import {
  AlertTriangle,
  Archive,
  Ban,
  Check,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  RotateCcw,
  Send,
  Trash2,
  Unlock,
  UserMinus,
} from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

/**
 * ConfirmModal — Modal xác nhận dùng chung hỗ trợ i18n
 * variant: logout | lock | unlock | delete | remove | archive | restore | revoke | send | warning | confirm | info
 */

const COLOR_MAP = {
  orange: {
    iconBg: "bg-orange-100",
    iconText: "text-orange-500",
    btn: "bg-orange-500 hover:bg-orange-600 shadow-orange-200",
  },
  red: {
    iconBg: "bg-red-100",
    iconText: "text-red-500",
    btn: "bg-red-500 hover:bg-red-600 shadow-red-200",
  },
  blue: {
    iconBg: "bg-blue-100",
    iconText: "text-blue-500",
    btn: "bg-blue-500 hover:bg-blue-600 shadow-blue-200",
  },
  green: {
    iconBg: "bg-green-100",
    iconText: "text-green-500",
    btn: "bg-green-500 hover:bg-green-600 shadow-green-200",
  },
  indigo: {
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-500",
    btn: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
  },
};

const VARIANT_CONFIG = {
  logout: { Icon: LogOut, yesIcon: LogOut, defaultColor: "indigo" },
  lock: { Icon: Lock, yesIcon: Lock, defaultColor: "red" },
  unlock: { Icon: Unlock, yesIcon: Unlock, defaultColor: "green" },
  delete: { Icon: Trash2, yesIcon: Trash2, defaultColor: "red" },
  remove: { Icon: UserMinus, yesIcon: UserMinus, defaultColor: "red" },
  archive: { Icon: Archive, yesIcon: Archive, defaultColor: "red" },
  restore: { Icon: RotateCcw, yesIcon: RotateCcw, defaultColor: "green" },
  revoke: { Icon: Ban, yesIcon: Ban, defaultColor: "red" },
  send: { Icon: Send, yesIcon: Send, defaultColor: "blue" },
  warning: { Icon: AlertTriangle, yesIcon: null, defaultColor: "orange" },
  confirm: { Icon: HelpCircle, yesIcon: Check, defaultColor: "blue" },
  info: { Icon: Info, yesIcon: Check, defaultColor: "blue" },
};

const COLOR_FALLBACK_VARIANT = {
  red: "warning",
  green: "confirm",
  blue: "confirm",
  orange: "warning",
  indigo: "confirm",
};

function renderLucide(IconComponent, size = 30, strokeWidth = 1.8) {
  if (!IconComponent) return null;
  return <IconComponent size={size} strokeWidth={strokeWidth} />;
}

export default function ConfirmModal({
  isOpen = false,
  title = "Bạn có chắc chắn?",
  subtitle = "Hành động này không thể hoàn tác.",
  icon,
  variant,
  color = "blue",
  yesIcon,
  yesLabel = "Xác nhận",
  noLabel = "Huỷ",
  onYes,
  onNo,
  onClose,
}) {
  const { t, isVi } = useTranslation();
  if (!isOpen) return null;
  const defaultTitle = isVi ? "Bạn có chắc chắn?" : "Are you sure?";
  const defaultSubtitle = isVi ? "Hành động này không thể hoàn tác." : "This action cannot be undone.";

  const finalTitle = title === "Bạn có chắc chắn?" ? defaultTitle : title;
  const finalSubtitle = subtitle === "Hành động này không thể hoàn tác." ? defaultSubtitle : subtitle;
  const finalYesLabel = yesLabel === "Xác nhận" ? t("common.confirm") : yesLabel;
  const finalNoLabel = noLabel === "Huỷ" ? t("common.cancel") : noLabel;

  const resolvedVariant = variant || COLOR_FALLBACK_VARIANT[color] || "confirm";
  const variantCfg = VARIANT_CONFIG[resolvedVariant] || VARIANT_CONFIG.confirm;
  const resolvedColor = color || variantCfg.defaultColor;
  const c = COLOR_MAP[resolvedColor] ?? COLOR_MAP.blue;
  const handleClose = () => {
    onNo?.();
    onClose?.();
  };

  const headerIcon = icon ?? renderLucide(variantCfg.Icon, 30, 1.8);

  let actionIcon = null;
  if (yesIcon !== undefined) {
    actionIcon = yesIcon;
  } else if (variantCfg.yesIcon) {
    actionIcon = <variantCfg.yesIcon size={16} strokeWidth={2} />;
  }

  const buttonIcon = isValidElement(actionIcon)
    ? cloneElement(actionIcon, { size: 16, strokeWidth: 2 })
    : actionIcon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-7 py-8 flex flex-col items-center text-center gap-5">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${c.iconBg}`}>
          <span className={c.iconText}>{headerIcon}</span>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-gray-900">{finalTitle}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{finalSubtitle}</p>
        </div>

        <div className="w-full flex flex-col gap-2.5 mt-1">
          <button
            type="button"
            onClick={onYes}
            className={`
              w-full py-3.5 rounded-2xl text-white text-sm font-semibold
              flex items-center justify-center gap-2 cursor-pointer
              shadow-md transition-all duration-150 active:scale-[0.98]
              ${c.btn}
            `}
          >
            {finalYesLabel}
            {buttonIcon}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-semibold transition-colors duration-150 cursor-pointer"
          >
            {finalNoLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
