import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import { useTranslation } from "@/context/TranslationContext";
import { buildClassLabel, toOptionList } from "../shared";

const dateInputClass = "h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

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
  const semesterOptions = toOptionList(
    lookups.semesters || [],
    (item) => item.id,
    (item) => item.semester_code,
    t("lookupAll.semesters"),
  );
  const classOptions = toOptionList(lookups.classes || [], (item) => item.id, buildClassLabel, t("lookupAll.classes"));
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
      <FilterSelect label={t("filterLabels.semester")} value={query.semester_id || ""} onChange={(value) => setFilter("semester_id", value)} options={semesterOptions} />
      <FilterSelect label={t("filterLabels.subject")} value={query.subject_id || ""} onChange={(value) => setFilter("subject_id", value)} options={subjectOptions} />
      <FilterSelect label={t("filterLabels.class")} value={query.class_id || ""} onChange={(value) => setFilter("class_id", value)} options={classOptions} />
      {showLecturer ? (
        <FilterSelect label={t("admin.fields.lecturer")} value={query.lecturer_id || ""} onChange={(value) => setFilter("lecturer_id", value)} options={lecturerOptions} />
      ) : null}
      <FilterSelect label={t("filterLabels.type")} value={query.target_type || ""} onChange={(value) => setFilter("target_type", value)} options={targetTypeOptions} />
      {showRubric ? (
        <FilterSelect label={t("filterLabels.rubric")} value={query.rubric_id || ""} onChange={(value) => setFilter("rubric_id", value)} options={rubricOptions} />
      ) : null}
      <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
        {t("filterLabels.dateFrom")}
        <input type="date" value={query.date_from || ""} onChange={(event) => setFilter("date_from", event.target.value)} className={dateInputClass} />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
        {t("filterLabels.dateTo")}
        <input type="date" value={query.date_to || ""} onChange={(event) => setFilter("date_to", event.target.value)} className={dateInputClass} />
      </label>
    </FilterBar>
  );
}
