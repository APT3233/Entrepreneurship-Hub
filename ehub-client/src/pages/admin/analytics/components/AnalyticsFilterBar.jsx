import FilterBar, { AdminSemesterFilterGroup, FilterDateField, FilterSelect } from "@/pages/admin/components/FilterBar";
import { useTranslation } from "@/context/TranslationContext";
import { useAdminSemesterFilter } from "@/hooks/admin/useAdminSemesterFilter";
import { filterClassesBySemester } from "@/pages/admin/shared/filterUtils";
import { buildClassLabel, toOptionList } from "../shared";
import { useMemo } from "react";

export default function AnalyticsFilterBar({
  query,
  onChange,
  lookups = {},
  rubrics = [],
  showLecturer = false,
  showRubric = false,
  right,
}) {
  const { t } = useTranslation();
  const setFilter = (key, value) => onChange({ ...query, [key]: value });

  const onSemesterChange = ({ semesterId }) => {
    onChange({ ...query, semester_id: semesterId, class_id: "" });
  };

  const semesterFilter = useAdminSemesterFilter(lookups.semesters || [], { onSemesterChange });

  const targetTypeOptions = [
    { value: "", label: t("admin.analytics.filters.allTypes") },
    { value: "checkpoint", label: t("status.checkpoint") },
    { value: "assignment", label: t("status.assignment") },
  ];

  const subjectOptions = toOptionList(
    lookups.subjects || [],
    (item) => item.id,
    (item) => `${item.subject_code} - ${item.subject_name}`,
    t("lookupAll.subjects"),
  );

  const classOptions = useMemo(() => {
    const filtered = filterClassesBySemester(lookups.classes || [], lookups.semesters || [], {
      semesterId: semesterFilter.semesterId,
      year: semesterFilter.filterYear,
    });
    return toOptionList(filtered, (item) => item.id, buildClassLabel, t("lookupAll.classes"));
  }, [lookups.classes, lookups.semesters, semesterFilter.semesterId, semesterFilter.filterYear, t]);

  const lecturerOptions = toOptionList(
    lookups.graders || [],
    (item) => item.id,
    (item) => item.full_name || item.email,
    t("lookupAll.graders"),
  );
  const rubricOptions = toOptionList(
    rubrics,
    (item) => item.id,
    (item) => `${item.name || item.rubric_name} v${item.version || item.rubric_version || 1}`,
    t("lookupAll.rubrics"),
  );

  return (
    <FilterBar right={right}>
      <AdminSemesterFilterGroup
        filterYear={semesterFilter.filterYear}
        semesterId={semesterFilter.semesterId}
        yearOptions={semesterFilter.yearOptions}
        semesterOptions={semesterFilter.semesterOptions}
        onYearChange={semesterFilter.onYearChange}
        onSemesterChange={semesterFilter.onSemesterIdChange}
      />
      <FilterSelect label={t("filterLabels.subject")} value={query.subject_id || ""} onChange={(value) => setFilter("subject_id", value)} options={subjectOptions} />
      <FilterSelect label={t("filterLabels.class")} value={query.class_id || ""} onChange={(value) => setFilter("class_id", value)} options={classOptions} />
      {showLecturer ? (
        <FilterSelect label={t("admin.fields.lecturer")} value={query.lecturer_id || ""} onChange={(value) => setFilter("lecturer_id", value)} options={lecturerOptions} />
      ) : null}
      <FilterSelect label={t("filterLabels.type")} value={query.target_type || ""} onChange={(value) => setFilter("target_type", value)} options={targetTypeOptions} />
      {showRubric ? (
        <FilterSelect label={t("filterLabels.rubric")} value={query.rubric_id || ""} onChange={(value) => setFilter("rubric_id", value)} options={rubricOptions} />
      ) : null}
      <FilterDateField label={t("filterLabels.dateFrom")} value={query.date_from || ""} onChange={(value) => setFilter("date_from", value)} />
      <FilterDateField label={t("filterLabels.dateTo")} value={query.date_to || ""} onChange={(value) => setFilter("date_to", value)} />
    </FilterBar>
  );
}
