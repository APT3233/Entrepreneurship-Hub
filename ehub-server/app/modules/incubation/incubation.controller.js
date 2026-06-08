import { sendCreated, sendNoContent, sendPaginated, sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createIncubationController = ({ incubationService }) => {
  const listStartups = catchAsync(async (req, res) => {
    const result = await incubationService.listStartups(req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup profiles retrieved successfully" });
  });

  const createStartup = catchAsync(async (req, res) => {
    const data = await incubationService.createStartup(req.body, req.user);
    return sendCreated(res, { data, message: "Startup profile created successfully" });
  });

  const getStartup = catchAsync(async (req, res) => {
    const data = await incubationService.getStartup(req.params.id);
    return sendSuccess(res, { data, message: "Startup profile retrieved successfully" });
  });

  const updateStartup = catchAsync(async (req, res) => {
    const data = await incubationService.updateStartup(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Startup profile updated successfully" });
  });

  const deleteStartup = catchAsync(async (req, res) => {
    await incubationService.deleteStartup(req.params.id, req.user);
    return sendNoContent(res);
  });

  const createStartupFromGroup = catchAsync(async (req, res) => {
    const data = await incubationService.createStartupFromGroup(req.params.groupId, req.body, req.user);
    return sendCreated(res, { data, message: "Startup profile created from group successfully" });
  });

  const listSelectionReviews = catchAsync(async (req, res) => {
    const result = await incubationService.listSelectionReviews(req.query, req.user);
    return sendPaginated(res, { ...result, message: "Selection reviews retrieved successfully" });
  });

  const createSelectionReview = catchAsync(async (req, res) => {
    const data = await incubationService.createSelectionReview(req.body, req.user, "admin");
    return sendCreated(res, { data, message: "Selection review created successfully" });
  });

  const reviewSelection = catchAsync(async (req, res) => {
    const data = await incubationService.reviewSelection(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Selection review updated successfully" });
  });

  const listStages = catchAsync(async (req, res) => {
    const result = await incubationService.listStages(req.query);
    return sendPaginated(res, { ...result, message: "Pipeline stages retrieved successfully" });
  });

  const createStage = catchAsync(async (req, res) => {
    const data = await incubationService.createStage(req.body, req.user);
    return sendCreated(res, { data, message: "Pipeline stage created successfully" });
  });

  const updateStage = catchAsync(async (req, res) => {
    const data = await incubationService.updateStage(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Pipeline stage updated successfully" });
  });

  const updateStartupStage = catchAsync(async (req, res) => {
    const data = await incubationService.updateStartupStage(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Startup stage updated successfully" });
  });

  const getStartupHistory = catchAsync(async (req, res) => {
    const data = await incubationService.getStartupHistory(req.params.id);
    return sendSuccess(res, { data, message: "Startup history retrieved successfully" });
  });

  const listProgress = catchAsync(async (req, res) => {
    const result = await incubationService.listProgress(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup progress updates retrieved successfully" });
  });

  const createProgress = catchAsync(async (req, res) => {
    const data = await incubationService.createProgress(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Startup progress update created successfully" });
  });

  const updateProgress = catchAsync(async (req, res) => {
    const data = await incubationService.updateProgress(req.params.id, req.params.progressId, req.body, req.user);
    return sendSuccess(res, { data, message: "Startup progress update saved successfully" });
  });

  const deleteProgress = catchAsync(async (req, res) => {
    await incubationService.deleteProgress(req.params.id, req.params.progressId, req.user);
    return sendNoContent(res);
  });

  const listMetrics = catchAsync(async (req, res) => {
    const result = await incubationService.listMetrics(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup metrics retrieved successfully" });
  });

  const createMetrics = catchAsync(async (req, res) => {
    const data = await incubationService.createMetrics(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Startup metrics snapshot created successfully" });
  });

  const listSupportNeeds = catchAsync(async (req, res) => {
    const result = await incubationService.listSupportNeeds(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup support needs retrieved successfully" });
  });

  const createSupportNeed = catchAsync(async (req, res) => {
    const data = await incubationService.createSupportNeed(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Startup support need created successfully" });
  });

  const updateSupportNeedStatus = catchAsync(async (req, res) => {
    const data = await incubationService.updateSupportNeedStatus(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Startup support need updated successfully" });
  });

  const listSupportActivities = catchAsync(async (req, res) => {
    const result = await incubationService.listSupportActivities(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup support activities retrieved successfully" });
  });

  const createSupportActivity = catchAsync(async (req, res) => {
    const data = await incubationService.createSupportActivity(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Startup support activity created successfully" });
  });

  const listEvents = catchAsync(async (req, res) => {
    const result = await incubationService.listEvents(req.query, req.user);
    return sendPaginated(res, { ...result, message: "Ecosystem events retrieved successfully" });
  });

  const createEvent = catchAsync(async (req, res) => {
    const data = await incubationService.createEvent(req.body, req.user);
    return sendCreated(res, { data, message: "Ecosystem event created successfully" });
  });

  const getEvent = catchAsync(async (req, res) => {
    const data = await incubationService.getEvent(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Ecosystem event retrieved successfully" });
  });

  const updateEvent = catchAsync(async (req, res) => {
    const data = await incubationService.updateEvent(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Ecosystem event updated successfully" });
  });

  const updateEventStatus = catchAsync(async (req, res) => {
    const data = await incubationService.updateEventStatus(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Ecosystem event status updated successfully" });
  });

  const deleteEvent = catchAsync(async (req, res) => {
    await incubationService.deleteEvent(req.params.id, req.user);
    return sendNoContent(res);
  });

  const listEventStartups = catchAsync(async (req, res) => {
    const result = await incubationService.listEventStartups(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Event startup participants retrieved successfully" });
  });

  const addEventStartup = catchAsync(async (req, res) => {
    const data = await incubationService.addEventStartup(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Startup added to event successfully" });
  });

  const deleteEventStartup = catchAsync(async (req, res) => {
    await incubationService.deleteEventStartup(req.params.id, req.params.startupId, req.user);
    return sendNoContent(res);
  });

  const listEventJudges = catchAsync(async (req, res) => {
    const result = await incubationService.listEventJudges(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Event judges retrieved successfully" });
  });

  const addEventJudge = catchAsync(async (req, res) => {
    const data = await incubationService.addEventJudge(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Event judge added successfully" });
  });

  const deleteEventJudge = catchAsync(async (req, res) => {
    await incubationService.deleteEventJudge(req.params.id, req.params.judgeId, req.user);
    return sendNoContent(res);
  });

  const listEventFeedbacks = catchAsync(async (req, res) => {
    const result = await incubationService.listEventFeedbacks(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Event feedbacks retrieved successfully" });
  });

  const createEventFeedback = catchAsync(async (req, res) => {
    const data = await incubationService.createEventFeedback(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Event feedback created successfully" });
  });

  const listAwards = catchAsync(async (req, res) => {
    const result = await incubationService.listAwards(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup awards retrieved successfully" });
  });

  const createAward = catchAsync(async (req, res) => {
    const data = await incubationService.createAward(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Startup award created successfully" });
  });

  const listEventMedia = catchAsync(async (req, res) => {
    const result = await incubationService.listEventMedia(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Event media retrieved successfully" });
  });

  const createEventMedia = catchAsync(async (req, res) => {
    const data = await incubationService.createEventMedia(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Event media created successfully" });
  });

  const listAlumni = catchAsync(async (req, res) => {
    const result = await incubationService.listAlumni(req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup alumni retrieved successfully" });
  });

  const createAlumni = catchAsync(async (req, res) => {
    const data = await incubationService.createAlumni(req.body, req.user);
    return sendCreated(res, { data, message: "Startup alumni created successfully" });
  });

  const getAlumni = catchAsync(async (req, res) => {
    const data = await incubationService.getAlumni(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Startup alumni retrieved successfully" });
  });

  const updateAlumni = catchAsync(async (req, res) => {
    const data = await incubationService.updateAlumni(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Startup alumni updated successfully" });
  });

  const deleteAlumni = catchAsync(async (req, res) => {
    await incubationService.deleteAlumni(req.params.id, req.user);
    return sendNoContent(res);
  });

  const listPartners = catchAsync(async (req, res) => {
    const result = await incubationService.listPartners(req.query, req.user);
    return sendPaginated(res, { ...result, message: "Ecosystem partners retrieved successfully" });
  });

  const createPartner = catchAsync(async (req, res) => {
    const data = await incubationService.createPartner(req.body, req.user);
    return sendCreated(res, { data, message: "Ecosystem partner created successfully" });
  });

  const getPartner = catchAsync(async (req, res) => {
    const data = await incubationService.getPartner(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Ecosystem partner retrieved successfully" });
  });

  const updatePartner = catchAsync(async (req, res) => {
    const data = await incubationService.updatePartner(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Ecosystem partner updated successfully" });
  });

  const deletePartner = catchAsync(async (req, res) => {
    await incubationService.deletePartner(req.params.id, req.user);
    return sendNoContent(res);
  });

  const listStartupPartners = catchAsync(async (req, res) => {
    const result = await incubationService.listStartupPartners(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup partner connections retrieved successfully" });
  });

  const createStartupPartner = catchAsync(async (req, res) => {
    const data = await incubationService.createStartupPartner(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Startup partner connection created successfully" });
  });

  const updatePartnerConnectionStatus = catchAsync(async (req, res) => {
    const data = await incubationService.updatePartnerConnectionStatus(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Startup partner connection updated successfully" });
  });

  const listOpportunities = catchAsync(async (req, res) => {
    const result = await incubationService.listOpportunities(req.query, req.user);
    return sendPaginated(res, { ...result, message: "Ecosystem opportunities retrieved successfully" });
  });

  const createOpportunity = catchAsync(async (req, res) => {
    const data = await incubationService.createOpportunity(req.body, req.user);
    return sendCreated(res, { data, message: "Ecosystem opportunity created successfully" });
  });

  const getOpportunity = catchAsync(async (req, res) => {
    const data = await incubationService.getOpportunity(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Ecosystem opportunity retrieved successfully" });
  });

  const updateOpportunity = catchAsync(async (req, res) => {
    const data = await incubationService.updateOpportunity(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Ecosystem opportunity updated successfully" });
  });

  const updateOpportunityStatus = catchAsync(async (req, res) => {
    const data = await incubationService.updateOpportunityStatus(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Ecosystem opportunity status updated successfully" });
  });

  const listStartupOpportunities = catchAsync(async (req, res) => {
    const result = await incubationService.listStartupOpportunities(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup opportunity applications retrieved successfully" });
  });

  const applyOpportunity = catchAsync(async (req, res) => {
    const data = await incubationService.applyOpportunity(req.params.id, req.params.opportunityId, req.body, req.user);
    return sendCreated(res, { data, message: "Startup opportunity application saved successfully" });
  });

  const updateOpportunityApplicationStatus = catchAsync(async (req, res) => {
    const data = await incubationService.updateOpportunityApplicationStatus(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Startup opportunity application updated successfully" });
  });

  const getAnalyticsOverview = catchAsync(async (req, res) => {
    const data = await incubationService.getAnalyticsOverview(req.query, req.user);
    return sendSuccess(res, { data, message: "Incubation overview analytics retrieved successfully" });
  });

  const getPipelineAnalytics = catchAsync(async (req, res) => {
    const data = await incubationService.getPipelineAnalytics(req.query, req.user);
    return sendSuccess(res, { data, message: "Incubation pipeline analytics retrieved successfully" });
  });

  const getProgressAnalytics = catchAsync(async (req, res) => {
    const data = await incubationService.getProgressAnalytics(req.query, req.user);
    return sendSuccess(res, { data, message: "Incubation progress analytics retrieved successfully" });
  });

  const getEventAnalytics = catchAsync(async (req, res) => {
    const data = await incubationService.getEventAnalytics(req.query, req.user);
    return sendSuccess(res, { data, message: "Incubation event analytics retrieved successfully" });
  });

  const getAlumniPartnerAnalytics = catchAsync(async (req, res) => {
    const data = await incubationService.getAlumniPartnerAnalytics(req.query, req.user);
    return sendSuccess(res, { data, message: "Incubation alumni and partner analytics retrieved successfully" });
  });

  const getEcosystemHealth = catchAsync(async (req, res) => {
    const data = await incubationService.getEcosystemHealth(req.query, req.user);
    return sendSuccess(res, { data, message: "Incubation ecosystem health retrieved successfully" });
  });

  const listStartupReports = catchAsync(async (req, res) => {
    const result = await incubationService.listStartupReports(req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup reports retrieved successfully" });
  });

  const getStartupReport = catchAsync(async (req, res) => {
    const data = await incubationService.getStartupReport(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Startup report retrieved successfully" });
  });

  const listStudentOpportunities = catchAsync(async (req, res) => {
    const result = await incubationService.listOpportunities(req.query, req.user, "student");
    return sendPaginated(res, { ...result, message: "Ecosystem opportunities retrieved successfully" });
  });

  const listMyStartupOpportunities = catchAsync(async (req, res) => {
    const result = await incubationService.listStartupOpportunities(req.params.id, req.query, req.user, "student");
    return sendPaginated(res, { ...result, message: "Startup opportunity applications retrieved successfully" });
  });

  const applyMyOpportunity = catchAsync(async (req, res) => {
    const data = await incubationService.applyOpportunity(req.params.id, req.params.opportunityId, req.body, req.user, "student");
    return sendCreated(res, { data, message: "Startup opportunity application saved successfully" });
  });

  const listDocuments = catchAsync(async (req, res) => {
    const data = await incubationService.listDocuments(req.params.id);
    return sendSuccess(res, { data, message: "Startup documents retrieved successfully" });
  });

  const initiateDocumentUpload = catchAsync(async (req, res) => {
    const data = await incubationService.initiateDocumentUpload(req.params.id, req.body.file, req.body.document_type, req.body.visibility, req.user);
    return sendSuccess(res, { data, message: "Startup document upload initialized" });
  });

  const confirmDocumentUpload = catchAsync(async (req, res) => {
    const data = await incubationService.confirmDocumentUpload(req.params.id, req.body.upload_token, req.user);
    return sendCreated(res, { data, message: "Startup document uploaded successfully" });
  });

  const deleteDocument = catchAsync(async (req, res) => {
    await incubationService.deleteDocument(req.params.id, req.params.documentId, req.user);
    return sendNoContent(res);
  });

  const listMilestones = catchAsync(async (req, res) => {
    const data = await incubationService.listMilestones(req.params.id);
    return sendSuccess(res, { data, message: "Startup milestones retrieved successfully" });
  });

  const createMilestone = catchAsync(async (req, res) => {
    const data = await incubationService.createMilestone(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Startup milestone created successfully" });
  });

  const updateMilestone = catchAsync(async (req, res) => {
    const data = await incubationService.updateMilestone(req.params.id, req.params.milestoneId, req.body, req.user);
    return sendSuccess(res, { data, message: "Startup milestone updated successfully" });
  });

  const deleteMilestone = catchAsync(async (req, res) => {
    await incubationService.deleteMilestone(req.params.id, req.params.milestoneId, req.user);
    return sendNoContent(res);
  });

  const listLecturerNominations = catchAsync(async (req, res) => {
    const result = await incubationService.listSelectionReviews(req.query, req.user);
    return sendPaginated(res, { ...result, message: "Lecturer nominations retrieved successfully" });
  });

  const createLecturerNomination = catchAsync(async (req, res) => {
    const data = await incubationService.createSelectionReview({ ...req.body, group_id: Number(req.params.groupId) }, req.user, "lecturer");
    return sendCreated(res, { data, message: "Startup nomination created successfully" });
  });

  const listMyStartupProfiles = catchAsync(async (req, res) => {
    const result = await incubationService.listMyStartupProfiles(req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup profiles retrieved successfully" });
  });

  const getMyStartupProfile = catchAsync(async (req, res) => {
    const data = await incubationService.getMyStartupProfile(req.params.startupId, req.user);
    return sendSuccess(res, { data, message: "Startup profile retrieved successfully" });
  });

  const getMyStartup = catchAsync(async (req, res) => {
    const data = await incubationService.getMyStartupProfile(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Startup profile retrieved successfully" });
  });

  const updateMyStartupProfile = catchAsync(async (req, res) => {
    const data = await incubationService.updateMyStartupProfile(req.params.startupId, req.body, req.user);
    return sendSuccess(res, { data, message: "Startup profile updated successfully" });
  });

  const listMyProgress = catchAsync(async (req, res) => {
    const result = await incubationService.listFounderProgress(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup progress updates retrieved successfully" });
  });

  const createMyProgress = catchAsync(async (req, res) => {
    const data = await incubationService.createFounderProgress(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Startup progress update created successfully" });
  });

  const listMySupportNeeds = catchAsync(async (req, res) => {
    const result = await incubationService.listFounderSupportNeeds(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup support needs retrieved successfully" });
  });

  const createMySupportNeed = catchAsync(async (req, res) => {
    const data = await incubationService.createFounderSupportNeed(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Startup support need created successfully" });
  });

  const getMentorStartup = catchAsync(async (req, res) => {
    const data = await incubationService.getMentorStartup(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Startup profile retrieved successfully" });
  });

  const listMentorProgress = catchAsync(async (req, res) => {
    const result = await incubationService.listMentorProgress(req.params.id, req.query, req.user);
    return sendPaginated(res, { ...result, message: "Startup progress updates retrieved successfully" });
  });

  return {
    listStartups,
    createStartup,
    getStartup,
    updateStartup,
    deleteStartup,
    createStartupFromGroup,
    listSelectionReviews,
    createSelectionReview,
    reviewSelection,
    listStages,
    createStage,
    updateStage,
    updateStartupStage,
    getStartupHistory,
    listProgress,
    createProgress,
    updateProgress,
    deleteProgress,
    listMetrics,
    createMetrics,
    listSupportNeeds,
    createSupportNeed,
    updateSupportNeedStatus,
    listSupportActivities,
    createSupportActivity,
    listEvents,
    createEvent,
    getEvent,
    updateEvent,
    updateEventStatus,
    deleteEvent,
    listEventStartups,
    addEventStartup,
    deleteEventStartup,
    listEventJudges,
    addEventJudge,
    deleteEventJudge,
    listEventFeedbacks,
    createEventFeedback,
    listAwards,
    createAward,
    listEventMedia,
    createEventMedia,
    listAlumni,
    createAlumni,
    getAlumni,
    updateAlumni,
    deleteAlumni,
    listPartners,
    createPartner,
    getPartner,
    updatePartner,
    deletePartner,
    listStartupPartners,
    createStartupPartner,
    updatePartnerConnectionStatus,
    listOpportunities,
    createOpportunity,
    getOpportunity,
    updateOpportunity,
    updateOpportunityStatus,
    listStartupOpportunities,
    applyOpportunity,
    updateOpportunityApplicationStatus,
    getAnalyticsOverview,
    getPipelineAnalytics,
    getProgressAnalytics,
    getEventAnalytics,
    getAlumniPartnerAnalytics,
    getEcosystemHealth,
    listStartupReports,
    getStartupReport,
    listStudentOpportunities,
    listMyStartupOpportunities,
    applyMyOpportunity,
    listDocuments,
    initiateDocumentUpload,
    confirmDocumentUpload,
    deleteDocument,
    listMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    listLecturerNominations,
    createLecturerNomination,
    listMyStartupProfiles,
    getMyStartupProfile,
    getMyStartup,
    updateMyStartupProfile,
    listMyProgress,
    createMyProgress,
    listMySupportNeeds,
    createMySupportNeed,
    getMentorStartup,
    listMentorProgress,
  };
};
