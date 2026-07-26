import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/context/TranslationContext";
import { useSemesterOptions, useSemesterYearOptions } from "@/hooks/useLectureFilterOptions";

export function pickDefaultSemesterYear(semesters) {
  if (!semesters?.length) return { year: null, semesterId: "" };
  const ongoing = semesters.find((s) => s.status === "ongoing");
  if (ongoing) return { year: ongoing.year, semesterId: String(ongoing.id) };
  const currentYear = new Date().getFullYear();
  const inYear = semesters.filter((s) => s.year === currentYear);
  const pick = inYear[0] || semesters[0];
  return { year: pick.year, semesterId: String(pick.id) };
}

export function useAdminSemesterFilter(semesters, { onSemesterChange, preferredSemesterId = "" } = {}) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  const [filterYear, setFilterYear] = useState(null);
  const [semesterId, setSemesterId] = useState("");

  useEffect(() => {
    if (!semesters?.length || ready) return;
    if (preferredSemesterId) {
      const preferred = semesters.find((s) => String(s.id) === String(preferredSemesterId));
      if (preferred) {
        const year = preferred.year;
        const sid = String(preferred.id);
        setFilterYear(year);
        setSemesterId(sid);
        setReady(true);
        onSemesterChange?.({ year, semesterId: sid, isInit: true });
        return;
      }
    }
    const { year, semesterId: sid } = pickDefaultSemesterYear(semesters);
    setFilterYear(year);
    setSemesterId(sid);
    setReady(true);
    onSemesterChange?.({ year, semesterId: sid, isInit: true });
  }, [semesters, ready, onSemesterChange, preferredSemesterId]);

  const yearOptionsRaw = useSemesterYearOptions(semesters || []);
  const yearOptions = useMemo(
    () => yearOptionsRaw.map((o) => ({ value: String(o.value), label: o.label })),
    [yearOptionsRaw],
  );

  const semesterOptionsRaw = useSemesterOptions(semesters || [], filterYear, { prependAll: false });
  const semesterOptions = useMemo(
    () => [
      { value: "", label: t("lookupAll.semesters") },
      ...semesterOptionsRaw.map((o) => ({ value: String(o.value), label: o.label })),
    ],
    [semesterOptionsRaw, t],
  );

  const onYearChange = useCallback((yearVal) => {
    const y = Number(yearVal);
    const inYear = (semesters || []).filter((s) => s.year === y);
    const ongoing = inYear.find((s) => s.status === "ongoing");
    const nextId = ongoing ? String(ongoing.id) : (inYear[0] ? String(inYear[0].id) : "");
    setFilterYear(y);
    setSemesterId(nextId);
    onSemesterChange?.({ year: y, semesterId: nextId });
  }, [semesters, onSemesterChange]);

  const onSemesterIdChange = useCallback((id) => {
    const sid = id ?? "";
    setSemesterId(sid);
    onSemesterChange?.({ year: filterYear, semesterId: sid });
  }, [filterYear, onSemesterChange]);

  const reset = useCallback(() => {
    if (!semesters?.length) return;
    const { year, semesterId: sid } = pickDefaultSemesterYear(semesters);
    setFilterYear(year);
    setSemesterId(sid);
    onSemesterChange?.({ year, semesterId: sid });
  }, [semesters, onSemesterChange]);

  return {
    ready,
    filterYear,
    semesterId,
    yearOptions,
    semesterOptions,
    onYearChange,
    onSemesterIdChange,
    reset,
  };
}
