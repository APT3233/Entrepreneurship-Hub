import { useMemo } from "react";
import { useTranslation } from "@/context/TranslationContext";
import { statusOptions } from "@/utils/i18nOptions";

export const LECTURE_VALUE_ALL = "all";

export function formatSemesterLabel(semester, t) {
  const name = (semester.semester_name || "").replace(/\s?\d{4}$/, "");
  return semester.status === "ongoing"
    ? `${name} ${t("lecturer.currentSemesterTag")}`
    : name;
}

export function useSemesterYearOptions(semesterList) {
  return useMemo(
    () => [...new Set(semesterList.map((s) => s.year))].sort((a, b) => b - a).map((y) => ({ value: y, label: `${y}` })),
    [semesterList],
  );
}

export function useSemesterOptions(semesterList, filterYear, { prependAll, allValue } = {}) {
  const { t } = useTranslation();
  return useMemo(() => {
    if (filterYear == null || filterYear === "") return prependAll ? [{ value: allValue, label: t("filters.all") }] : [];
    const mapped = semesterList
      .filter((s) => s.year === filterYear)
      .map((s) => ({ value: s.id, label: formatSemesterLabel(s, t) }));
    if (prependAll && allValue != null) {
      return [{ value: allValue, label: t("filters.all") }, ...mapped];
    }
    return mapped;
  }, [semesterList, filterYear, t, prependAll, allValue]);
}

export function useGroupStatusFilterOptions() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      { label: t("lecturer.allStatuses"), value: LECTURE_VALUE_ALL },
      ...statusOptions(t, ["forming", "active", "inactive", "completed", "dissolved"]),
    ],
    [t],
  );
}

export function useAllSemestersOption(allValue) {
  const { t } = useTranslation();
  return useMemo(() => ({ value: allValue, label: t("lecturer.allSemesters") }), [t, allValue]);
}
