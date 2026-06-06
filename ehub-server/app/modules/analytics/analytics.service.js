import { Forbidden, NotFound } from "app/core/errors/errorFactory.js";

const normalizeFilters = (query = {}, extra = {}) => ({
  semesterId: query.semester_id || query.semesterId || null,
  subjectId: query.subject_id || query.subjectId || null,
  classId: extra.classId || query.class_id || query.classId || null,
  targetType: query.target_type || query.targetType || "all",
  rubricId: query.rubric_id || query.rubricId || null,
  criterionId: query.criterion_id || query.criterionId || null,
  dateFrom: query.date_from || query.dateFrom || null,
  dateTo: query.date_to || query.dateTo || null,
  lecturerId: extra.lecturerId || query.lecturer_id || query.lecturerId || null,
});

export const createAnalyticsService = ({ analyticsRepository }) => {
  const userRoles = (user) => (user?.roles || []).map((role) => String(role).toLowerCase());
  const hasRole = (user, ...roles) => userRoles(user).some((role) => roles.includes(role));
  const isAdminScope = (user) => hasRole(user, "admin", "department_head");
  const isLecturerOnly = (user) => hasRole(user, "lecturer") && !isAdminScope(user);

  const assertClassAccess = async (classId, actor) => {
    const cls = await analyticsRepository.findClassById(classId);
    if (!cls) throw NotFound("Class");
    if (isLecturerOnly(actor) && Number(cls.lecturer_id) !== Number(actor.id)) {
      throw Forbidden("Bạn không có quyền xem analytics của lớp này.");
    }
    return cls;
  };

  const lecturerScopedFilters = async (query, actor, classId = null) => {
    if (classId) await assertClassAccess(classId, actor);
    const lecturerId = isLecturerOnly(actor) ? actor.id : null;
    return normalizeFilters(query, { lecturerId, classId });
  };

  const getOverview = (query) => analyticsRepository.getOverview(normalizeFilters(query));
  const getAcademicQuality = (query) => analyticsRepository.getAcademicQuality(normalizeFilters(query));
  const getGradingAnalytics = (query) => analyticsRepository.getGradingAnalytics(normalizeFilters(query));
  const getRubricAnalytics = (query) => analyticsRepository.getRubricAnalytics(normalizeFilters(query));
  const getProjectAnalytics = (query) => analyticsRepository.getProjectAnalytics(normalizeFilters(query));

  const getLecturerAnalytics = async (query, actor) => {
    const filters = await lecturerScopedFilters(query, actor);
    return analyticsRepository.getLecturerAnalytics(filters);
  };

  const getClassAnalytics = async (classId, query, actor) => {
    const filters = await lecturerScopedFilters(query, actor, classId);
    return analyticsRepository.getLecturerAnalytics(filters);
  };

  return {
    getOverview,
    getAcademicQuality,
    getGradingAnalytics,
    getRubricAnalytics,
    getProjectAnalytics,
    getLecturerAnalytics,
    getClassAnalytics,
  };
};
