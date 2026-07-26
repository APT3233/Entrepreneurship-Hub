import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/context/TranslationContext";
import { getDateOnlyParts, getDateTimeParts } from "@/utils/formatDateTime";

export default function DateTimeCell({
  value,
  dateOnly = false,
  className = "",
  dateClassName = "text-sm font-medium text-gray-800",
  timeClassName = "text-xs font-normal text-gray-400",
  multiline = null,
}) {
  const { language } = useTranslation();
  const containerRef = useRef(null);
  const [isInsideTable, setIsInsideTable] = useState(false);

  useEffect(() => {
    if (multiline === null && containerRef.current) {
      const inside = !!containerRef.current.closest("td, th, table");
      setIsInsideTable(inside);
    }
  }, [multiline]);

  const parts = dateOnly
    ? getDateOnlyParts(value, language)
    : getDateTimeParts(value, language);

  if (!parts) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  const shouldBeMultiline = multiline !== null ? multiline : isInsideTable;

  if (shouldBeMultiline) {
    return (
      <div ref={containerRef} className={`flex flex-col gap-0.5 leading-tight ${className}`}>
        <span className={dateClassName}>{parts.dateLine}</span>
        {!dateOnly && parts.timeLine ? (
          <span className={timeClassName}>{parts.timeLine}</span>
        ) : null}
      </div>
    );
  }

  return (
    <span ref={containerRef} className={`inline-flex items-center gap-1.5 leading-none ${className}`}>
      <span className={dateClassName}>{parts.dateLine}</span>
      {!dateOnly && parts.timeLine ? (
        <span className={timeClassName}>{parts.timeLine}</span>
      ) : null}
    </span>
  );
}
