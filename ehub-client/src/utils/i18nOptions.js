/** Build select options with translated status labels */
export function statusOptions(t, values) {
  return values.map((value) => ({
    value,
    label: value === "" ? t("filters.all") : t(`status.${value}`),
  }));
}

export function booleanYesNoOptions(t) {
  return [
    { value: "", label: t("filters.all") },
    { value: "true", label: t("filters.yes") },
    { value: "false", label: t("filters.no") },
  ];
}

export function deadlineFilterOptions(t) {
  return [
    { value: "", label: t("filters.all") },
    { value: "upcoming", label: t("filters.upcoming") },
    { value: "overdue", label: t("filters.overdue") },
  ];
}

export function httpMethodOptions(t) {
  return ["", "GET", "POST", "PUT", "PATCH", "DELETE"].map((value) => ({
    value,
    label: value === "" ? t("filters.all") : value,
  }));
}

export function toSelectOptions(rows = [], getValue, getLabel, allLabel) {
  return [
    { value: "", label: allLabel },
    ...rows.map((row) => ({ value: String(getValue(row)), label: getLabel(row) })),
  ];
}
