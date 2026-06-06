import { NotFound } from "app/core/errors/errorFactory.js";
import { parsePagination } from "app/core/utils/pagination.js";

const normalize = (query = {}, actor = null) => {
  const pagination = parsePagination(query);
  return {
    semesterId: query.semester_id || null,
    subjectId: query.subject_id || null,
    classId: query.class_id || null,
    mentorType: query.mentor_type || null,
    expertiseId: query.expertise_id || null,
    dateFrom: query.date_from || null,
    dateTo: query.date_to || null,
    search: query.search || null,
    lecturerId: actor?.lecturerScoped ? actor.id : null,
    limit: pagination.limit,
    offset: pagination.offset,
    page: pagination.page,
  };
};

export const createMentorAnalyticsService = ({ mentorAnalyticsRepository }) => {
  const overview = (query, actor = null) => mentorAnalyticsRepository.getOverview(normalize(query, actor));

  const workload = async (query, actor = null) => {
    const filters = normalize(query, actor);
    const result = await mentorAnalyticsRepository.listWorkload(filters);
    return { data: result.rows, page: filters.page, limit: filters.limit, total: result.total };
  };

  const effectiveness = async (query, actor = null) => {
    const filters = normalize(query, actor);
    const result = await mentorAnalyticsRepository.listEffectiveness(filters);
    return { data: result.rows, page: filters.page, limit: filters.limit, total: result.total };
  };

  const matching = (query, actor = null) => mentorAnalyticsRepository.getMatchingAnalytics(normalize(query, actor));
  const expertiseHeatmap = () => mentorAnalyticsRepository.getExpertiseHeatmap();

  const groupSupport = async (query, actor = null) => {
    const filters = normalize(query, actor);
    const result = await mentorAnalyticsRepository.listGroupSupport(filters);
    return { data: result.rows, page: filters.page, limit: filters.limit, total: result.total };
  };

  const ecosystem = () => mentorAnalyticsRepository.getEcosystem();

  const lecturerDashboard = async (query, actor) => {
    const scopedActor = { ...actor, lecturerScoped: true };
    const [overviewData, workloadData, groupSupportData] = await Promise.all([
      overview(query, scopedActor),
      workload({ ...query, limit: 10 }, scopedActor),
      groupSupport({ ...query, limit: 10 }, scopedActor),
    ]);
    return { overview: overviewData, workload: workloadData.data, group_support: groupSupportData.data };
  };

  const mentorDashboard = async (actor) => {
    const dashboard = await mentorAnalyticsRepository.getMentorDashboard(actor.id);
    if (!dashboard) throw NotFound("Mentor profile");
    return dashboard;
  };

  return { overview, workload, effectiveness, matching, expertiseHeatmap, groupSupport, ecosystem, lecturerDashboard, mentorDashboard };
};
