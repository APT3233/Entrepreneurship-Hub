export function filterClassesBySemester(classes, semesters, { semesterId, year } = {}) {
  if (!classes?.length) return [];
  if (semesterId) {
    return classes.filter((c) => String(c.semester_id) === String(semesterId));
  }
  if (year != null) {
    const yearSemesterIds = new Set(
      (semesters || []).filter((s) => s.year === year).map((s) => String(s.id)),
    );
    return classes.filter((c) => yearSemesterIds.has(String(c.semester_id)));
  }
  return classes;
}

export function countActiveAdminFilters(query, ignoreKeys = ["page", "limit", "search", "semester_id"]) {
  return Object.entries(query || {}).filter(
    ([key, val]) => !ignoreKeys.includes(key) && val !== "" && val != null,
  ).length;
}
