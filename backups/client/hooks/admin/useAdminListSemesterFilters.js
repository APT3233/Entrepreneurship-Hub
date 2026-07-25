import { useCallback, useMemo } from "react";
import { useTranslation } from "@/context/TranslationContext";
import { filterClassesBySemester } from "@/pages/admin/shared/filterUtils";
import { toSelectOptions } from "@/utils/i18nOptions";
import { useAdminSemesterFilter } from "./useAdminSemesterFilter";

export function useAdminListSemesterFilters({
  semesters = [],
  classes = [],
  buildClassLabel,
  setQuery,
  querySemesterId = "",
}) {
  const { t } = useTranslation();

  const onSemesterChange = useCallback(({ semesterId, isInit = false }) => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      semester_id: semesterId,
      class_id: isInit || String(prev.semester_id || "") === String(semesterId || "") ? prev.class_id : "",
    }));
  }, [setQuery]);

  const semesterFilter = useAdminSemesterFilter(semesters, {
    onSemesterChange,
    preferredSemesterId: querySemesterId,
  });

  const classOptions = useMemo(() => {
    const filtered = filterClassesBySemester(classes, semesters, {
      semesterId: semesterFilter.semesterId,
      year: semesterFilter.filterYear,
    });
    return toSelectOptions(filtered, (item) => item.id, buildClassLabel, t("lookupAll.classes"));
  }, [classes, semesters, semesterFilter.semesterId, semesterFilter.filterYear, buildClassLabel, t]);

  return {
    semesterFilter,
    classOptions,
    listEnabled: semesterFilter.ready,
  };
}
