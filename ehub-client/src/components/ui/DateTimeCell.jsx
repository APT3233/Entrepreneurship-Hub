import { useTranslation } from "@/context/TranslationContext";
import { getDateOnlyParts, getDateTimeParts } from "@/utils/formatDateTime";

export default function DateTimeCell({
  value,
  dateOnly = false,
  className = "",
  dateClassName = "text-sm font-medium text-gray-800",
  timeClassName = "text-xs font-normal text-gray-400",
}) {
  const { language } = useTranslation();
  const parts = dateOnly
    ? getDateOnlyParts(value, language)
    : getDateTimeParts(value, language);

  if (!parts) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  return (
    <div className={`flex flex-col gap-0.5 leading-tight ${className}`}>
      <span className={dateClassName}>{parts.dateLine}</span>
      {!dateOnly && parts.timeLine ? (
        <span className={timeClassName}>{parts.timeLine}</span>
      ) : null}
    </div>
  );
}
