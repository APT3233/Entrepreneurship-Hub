import { Router } from "express";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
import { createRateLimiters } from "app/core/middlewares/rateLimiter.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  addEventJudgeSchema,
  addEventStartupSchema,
  alumniIdParamSchema,
  analyticsQuerySchema,
  applyOpportunitySchema,
  confirmDocumentUploadSchema,
  createAlumniSchema,
  createAwardSchema,
  createEventFeedbackSchema,
  createEventMediaSchema,
  createEventSchema,
  createMilestoneSchema,
  createMetricsSchema,
  createOpportunitySchema,
  createPartnerSchema,
  createProgressSchema,
  createSelectionReviewSchema,
  createStageSchema,
  createStartupPartnerSchema,
  createStartupFromGroupSchema,
  createStartupSchema,
  createSupportActivitySchema,
  createSupportNeedSchema,
  deleteEventJudgeSchema,
  deleteEventStartupSchema,
  deleteDocumentSchema,
  eventIdParamSchema,
  founderStartupIdParamSchema,
  initiateDocumentUploadSchema,
  lecturerNominationSchema,
  listAwardsSchema,
  listAlumniSchema,
  listEventFeedbacksSchema,
  listEventJudgesSchema,
  listEventMediaSchema,
  listEventsSchema,
  listEventStartupsSchema,
  listMetricsSchema,
  listOpportunitiesSchema,
  listPartnersSchema,
  listProgressSchema,
  listSelectionReviewsSchema,
  listStagesSchema,
  listStartupsSchema,
  listStartupOpportunitiesSchema,
  listStartupPartnersSchema,
  listSupportActivitiesSchema,
  listSupportNeedsSchema,
  milestoneIdParamSchema,
  opportunityIdParamSchema,
  partnerIdParamSchema,
  progressIdParamSchema,
  reportStartupIdSchema,
  reportsQuerySchema,
  reviewSelectionSchema,
  studentStartupIdParamSchema,
  startupIdParamSchema,
  updateAlumniSchema,
  updateApplicationStatusSchema,
  updateEventSchema,
  updateEventStatusSchema,
  updateFounderStartupSchema,
  updateMilestoneSchema,
  updateOpportunitySchema,
  updateOpportunityStatusSchema,
  updatePartnerConnectionStatusSchema,
  updatePartnerSchema,
  updateProgressSchema,
  updateStageSchema,
  updateStartupSchema,
  updateStartupStageSchema,
  updateSupportNeedStatusSchema,
} from "./incubation.validator.js";

export const createIncubationAdminRouter = (container) => {
  const { incubationController } = container.cradle;
  const router = Router();
  const can = (...permissions) => permissionGuard(container, ...permissions);
  const limiters = createRateLimiters(container);

  router.get("/incubation/startups", can("incubation.startup.read"), validateRequest(listStartupsSchema), incubationController.listStartups);
  router.post("/incubation/startups", can("incubation.startup.create"), validateRequest(createStartupSchema), incubationController.createStartup);
  router.get("/incubation/startups/:id", can("incubation.startup.read"), validateRequest(startupIdParamSchema), incubationController.getStartup);
  router.put("/incubation/startups/:id", can("incubation.startup.update"), validateRequest(updateStartupSchema), incubationController.updateStartup);
  router.delete("/incubation/startups/:id", can("incubation.startup.delete"), validateRequest(startupIdParamSchema), incubationController.deleteStartup);
  router.post("/incubation/startups/from-group/:groupId", can("incubation.startup.create"), validateRequest(createStartupFromGroupSchema), incubationController.createStartupFromGroup);

  router.get("/incubation/selection-reviews", can("incubation.startup.read", "incubation.selection.review"), validateRequest(listSelectionReviewsSchema), incubationController.listSelectionReviews);
  router.post("/incubation/selection-reviews", can("incubation.startup.create"), validateRequest(createSelectionReviewSchema), incubationController.createSelectionReview);
  router.patch("/incubation/selection-reviews/:id/review", can("incubation.selection.review", "incubation.startup.review"), validateRequest(reviewSelectionSchema), incubationController.reviewSelection);

  router.get("/incubation/pipeline/stages", can("incubation.pipeline.read", "incubation.pipeline.manage"), validateRequest(listStagesSchema), incubationController.listStages);
  router.post("/incubation/pipeline/stages", can("incubation.pipeline.manage"), validateRequest(createStageSchema), incubationController.createStage);
  router.put("/incubation/pipeline/stages/:id", can("incubation.pipeline.manage"), validateRequest(updateStageSchema), incubationController.updateStage);
  router.patch("/incubation/startups/:id/stage", can("incubation.pipeline.manage"), validateRequest(updateStartupStageSchema), incubationController.updateStartupStage);
  router.get("/incubation/startups/:id/history", can("incubation.pipeline.read", "incubation.startup.read"), validateRequest(startupIdParamSchema), incubationController.getStartupHistory);

  router.get("/incubation/startups/:id/documents", can("incubation.document.manage", "incubation.startup.read"), validateRequest(startupIdParamSchema), incubationController.listDocuments);
  router.post("/incubation/startups/:id/documents/initiate-upload", limiters.upload, can("incubation.document.manage"), validateRequest(initiateDocumentUploadSchema), incubationController.initiateDocumentUpload);
  router.post("/incubation/startups/:id/documents", limiters.upload, can("incubation.document.manage"), validateRequest(confirmDocumentUploadSchema), incubationController.confirmDocumentUpload);
  router.delete("/incubation/startups/:id/documents/:documentId", can("incubation.document.manage"), validateRequest(deleteDocumentSchema), incubationController.deleteDocument);

  router.get("/incubation/startups/:id/milestones", can("incubation.startup.read", "incubation.milestone.manage"), validateRequest(startupIdParamSchema), incubationController.listMilestones);
  router.post("/incubation/startups/:id/milestones", can("incubation.milestone.manage"), validateRequest(createMilestoneSchema), incubationController.createMilestone);
  router.put("/incubation/startups/:id/milestones/:milestoneId", can("incubation.milestone.manage"), validateRequest(updateMilestoneSchema), incubationController.updateMilestone);
  router.delete("/incubation/startups/:id/milestones/:milestoneId", can("incubation.milestone.manage"), validateRequest(milestoneIdParamSchema), incubationController.deleteMilestone);

  router.get("/incubation/startups/:id/progress", can("incubation.progress.read", "incubation.progress.manage"), validateRequest(listProgressSchema), incubationController.listProgress);
  router.post("/incubation/startups/:id/progress", can("incubation.progress.manage"), validateRequest(createProgressSchema), incubationController.createProgress);
  router.put("/incubation/startups/:id/progress/:progressId", can("incubation.progress.manage"), validateRequest(updateProgressSchema), incubationController.updateProgress);
  router.delete("/incubation/startups/:id/progress/:progressId", can("incubation.progress.manage"), validateRequest(progressIdParamSchema), incubationController.deleteProgress);

  router.get("/incubation/startups/:id/metrics", can("incubation.metrics.read", "incubation.metrics.manage"), validateRequest(listMetricsSchema), incubationController.listMetrics);
  router.post("/incubation/startups/:id/metrics", can("incubation.metrics.manage"), validateRequest(createMetricsSchema), incubationController.createMetrics);

  router.get("/incubation/startups/:id/support-needs", can("incubation.support.read", "incubation.support.manage"), validateRequest(listSupportNeedsSchema), incubationController.listSupportNeeds);
  router.post("/incubation/startups/:id/support-needs", can("incubation.support.manage"), validateRequest(createSupportNeedSchema), incubationController.createSupportNeed);
  router.patch("/incubation/support-needs/:id/status", can("incubation.support.manage"), validateRequest(updateSupportNeedStatusSchema), incubationController.updateSupportNeedStatus);
  router.get("/incubation/startups/:id/support-activities", can("incubation.support.read", "incubation.support.manage"), validateRequest(listSupportActivitiesSchema), incubationController.listSupportActivities);
  router.post("/incubation/startups/:id/support-activities", can("incubation.support.manage"), validateRequest(createSupportActivitySchema), incubationController.createSupportActivity);

  router.get("/ecosystem/events", can("incubation.event.read", "incubation.event.manage"), validateRequest(listEventsSchema), incubationController.listEvents);
  router.post("/ecosystem/events", can("incubation.event.manage"), validateRequest(createEventSchema), incubationController.createEvent);
  router.get("/ecosystem/events/:id", can("incubation.event.read", "incubation.event.manage"), validateRequest(eventIdParamSchema), incubationController.getEvent);
  router.put("/ecosystem/events/:id", can("incubation.event.manage"), validateRequest(updateEventSchema), incubationController.updateEvent);
  router.patch("/ecosystem/events/:id/status", can("incubation.event.manage"), validateRequest(updateEventStatusSchema), incubationController.updateEventStatus);
  router.delete("/ecosystem/events/:id", can("incubation.event.manage"), validateRequest(eventIdParamSchema), incubationController.deleteEvent);
  router.get("/ecosystem/events/:id/startups", can("incubation.event.read", "incubation.event.manage"), validateRequest(listEventStartupsSchema), incubationController.listEventStartups);
  router.post("/ecosystem/events/:id/startups", can("incubation.event.manage"), validateRequest(addEventStartupSchema), incubationController.addEventStartup);
  router.delete("/ecosystem/events/:id/startups/:startupId", can("incubation.event.manage"), validateRequest(deleteEventStartupSchema), incubationController.deleteEventStartup);
  router.get("/ecosystem/events/:id/judges", can("incubation.event.read", "incubation.event.manage"), validateRequest(listEventJudgesSchema), incubationController.listEventJudges);
  router.post("/ecosystem/events/:id/judges", can("incubation.event.manage"), validateRequest(addEventJudgeSchema), incubationController.addEventJudge);
  router.delete("/ecosystem/events/:id/judges/:judgeId", can("incubation.event.manage"), validateRequest(deleteEventJudgeSchema), incubationController.deleteEventJudge);
  router.get("/ecosystem/events/:id/feedbacks", can("incubation.event.read", "incubation.event.manage"), validateRequest(listEventFeedbacksSchema), incubationController.listEventFeedbacks);
  router.post("/ecosystem/events/:id/feedbacks", can("incubation.event.manage"), validateRequest(createEventFeedbackSchema), incubationController.createEventFeedback);
  router.get("/incubation/startups/:id/awards", can("incubation.event.read", "incubation.event.manage"), validateRequest(listAwardsSchema), incubationController.listAwards);
  router.post("/incubation/startups/:id/awards", can("incubation.event.manage"), validateRequest(createAwardSchema), incubationController.createAward);
  router.get("/ecosystem/events/:id/media", can("incubation.event.read", "incubation.event.manage"), validateRequest(listEventMediaSchema), incubationController.listEventMedia);
  router.post("/ecosystem/events/:id/media", can("incubation.event.manage"), validateRequest(createEventMediaSchema), incubationController.createEventMedia);

  router.get("/ecosystem/alumni", can("incubation.ecosystem.read", "incubation.ecosystem.manage"), validateRequest(listAlumniSchema), incubationController.listAlumni);
  router.post("/ecosystem/alumni", can("incubation.ecosystem.manage"), validateRequest(createAlumniSchema), incubationController.createAlumni);
  router.get("/ecosystem/alumni/:id", can("incubation.ecosystem.read", "incubation.ecosystem.manage"), validateRequest(alumniIdParamSchema), incubationController.getAlumni);
  router.put("/ecosystem/alumni/:id", can("incubation.ecosystem.manage"), validateRequest(updateAlumniSchema), incubationController.updateAlumni);
  router.delete("/ecosystem/alumni/:id", can("incubation.ecosystem.manage"), validateRequest(alumniIdParamSchema), incubationController.deleteAlumni);

  router.get("/ecosystem/partners", can("incubation.ecosystem.read", "incubation.ecosystem.manage"), validateRequest(listPartnersSchema), incubationController.listPartners);
  router.post("/ecosystem/partners", can("incubation.ecosystem.manage"), validateRequest(createPartnerSchema), incubationController.createPartner);
  router.get("/ecosystem/partners/:id", can("incubation.ecosystem.read", "incubation.ecosystem.manage"), validateRequest(partnerIdParamSchema), incubationController.getPartner);
  router.put("/ecosystem/partners/:id", can("incubation.ecosystem.manage"), validateRequest(updatePartnerSchema), incubationController.updatePartner);
  router.delete("/ecosystem/partners/:id", can("incubation.ecosystem.manage"), validateRequest(partnerIdParamSchema), incubationController.deletePartner);

  router.get("/incubation/startups/:id/partners", can("incubation.ecosystem.read", "incubation.ecosystem.manage"), validateRequest(listStartupPartnersSchema), incubationController.listStartupPartners);
  router.post("/incubation/startups/:id/partners", can("incubation.ecosystem.manage"), validateRequest(createStartupPartnerSchema), incubationController.createStartupPartner);
  router.patch("/startup-partner-connections/:id/status", can("incubation.ecosystem.manage"), validateRequest(updatePartnerConnectionStatusSchema), incubationController.updatePartnerConnectionStatus);

  router.get("/ecosystem/opportunities", can("incubation.opportunity.read", "incubation.opportunity.manage"), validateRequest(listOpportunitiesSchema), incubationController.listOpportunities);
  router.post("/ecosystem/opportunities", can("incubation.opportunity.manage"), validateRequest(createOpportunitySchema), incubationController.createOpportunity);
  router.get("/ecosystem/opportunities/:id", can("incubation.opportunity.read", "incubation.opportunity.manage"), validateRequest(opportunityIdParamSchema), incubationController.getOpportunity);
  router.put("/ecosystem/opportunities/:id", can("incubation.opportunity.manage"), validateRequest(updateOpportunitySchema), incubationController.updateOpportunity);
  router.patch("/ecosystem/opportunities/:id/status", can("incubation.opportunity.manage"), validateRequest(updateOpportunityStatusSchema), incubationController.updateOpportunityStatus);
  router.get("/incubation/startups/:id/opportunities", can("incubation.opportunity.read", "incubation.opportunity.manage"), validateRequest(listStartupOpportunitiesSchema), incubationController.listStartupOpportunities);
  router.post("/incubation/startups/:id/opportunities/:opportunityId/apply", can("incubation.opportunity.manage"), validateRequest(applyOpportunitySchema), incubationController.applyOpportunity);
  router.patch("/startup-opportunity-applications/:id/status", can("incubation.opportunity.manage"), validateRequest(updateApplicationStatusSchema), incubationController.updateOpportunityApplicationStatus);

  router.get("/incubation/analytics/overview", can("incubation.analytics.read", "incubation.analytics.admin_read"), validateRequest(analyticsQuerySchema), incubationController.getAnalyticsOverview);
  router.get("/incubation/analytics/pipeline", can("incubation.analytics.read", "incubation.analytics.admin_read"), validateRequest(analyticsQuerySchema), incubationController.getPipelineAnalytics);
  router.get("/incubation/analytics/progress", can("incubation.analytics.read", "incubation.analytics.admin_read"), validateRequest(analyticsQuerySchema), incubationController.getProgressAnalytics);
  router.get("/incubation/analytics/events", can("incubation.analytics.read", "incubation.analytics.admin_read"), validateRequest(analyticsQuerySchema), incubationController.getEventAnalytics);
  router.get("/incubation/analytics/alumni-partners", can("incubation.analytics.read", "incubation.analytics.admin_read"), validateRequest(analyticsQuerySchema), incubationController.getAlumniPartnerAnalytics);
  router.get("/incubation/analytics/ecosystem-health", can("incubation.ecosystem_health.read", "incubation.analytics.admin_read"), validateRequest(analyticsQuerySchema), incubationController.getEcosystemHealth);
  router.get("/incubation/reports/startups", can("incubation.reports.export", "incubation.analytics.admin_read"), validateRequest(reportsQuerySchema), incubationController.listStartupReports);
  router.get("/incubation/reports/startups/:id", can("incubation.reports.export", "incubation.analytics.admin_read"), validateRequest(reportStartupIdSchema), incubationController.getStartupReport);

  return router;
};

export const createIncubationRouter = (container) => {
  const { incubationController } = container.cradle;
  const router = Router();
  const can = (...permissions) => permissionGuard(container, ...permissions);

  router.get(
    "/lecturer/incubation/nominations",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    can("incubation.startup.read"),
    validateRequest(listSelectionReviewsSchema),
    incubationController.listLecturerNominations,
  );
  router.post(
    "/lecturer/groups/:groupId/nominate-startup",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    can("incubation.startup.create"),
    validateRequest(lecturerNominationSchema),
    incubationController.createLecturerNomination,
  );

  router.get(
    "/student/startup-profiles",
    authenticate,
    roleGuard("student"),
    can("incubation.startup.read"),
    validateRequest(listStartupsSchema),
    incubationController.listMyStartupProfiles,
  );
  router.get(
    "/student/startup-profiles/:startupId",
    authenticate,
    roleGuard("student"),
    can("incubation.startup.read"),
    validateRequest(founderStartupIdParamSchema),
    incubationController.getMyStartupProfile,
  );
  router.get(
    "/student/startups/:id",
    authenticate,
    roleGuard("student"),
    can("incubation.startup.read"),
    validateRequest(studentStartupIdParamSchema),
    incubationController.getMyStartup,
  );
  router.put(
    "/student/startup-profiles/:startupId",
    authenticate,
    roleGuard("student"),
    can("incubation.startup.update"),
    validateRequest(updateFounderStartupSchema),
    incubationController.updateMyStartupProfile,
  );
  router.get(
    "/student/startups/:id/progress",
    authenticate,
    roleGuard("student"),
    can("incubation.progress.read"),
    validateRequest(listProgressSchema),
    incubationController.listMyProgress,
  );
  router.post(
    "/student/startups/:id/progress",
    authenticate,
    roleGuard("student"),
    can("incubation.progress.manage"),
    validateRequest(createProgressSchema),
    incubationController.createMyProgress,
  );
  router.get(
    "/student/startups/:id/support-needs",
    authenticate,
    roleGuard("student"),
    can("incubation.support.read"),
    validateRequest(listSupportNeedsSchema),
    incubationController.listMySupportNeeds,
  );
  router.post(
    "/student/startups/:id/support-needs",
    authenticate,
    roleGuard("student"),
    can("incubation.support.manage"),
    validateRequest(createSupportNeedSchema),
    incubationController.createMySupportNeed,
  );

  router.get(
    "/student/ecosystem/opportunities",
    authenticate,
    roleGuard("student"),
    can("incubation.opportunity.read"),
    validateRequest(listOpportunitiesSchema),
    incubationController.listStudentOpportunities,
  );
  router.get(
    "/student/startups/:id/opportunities",
    authenticate,
    roleGuard("student"),
    can("incubation.opportunity.read"),
    validateRequest(listStartupOpportunitiesSchema),
    incubationController.listMyStartupOpportunities,
  );
  router.post(
    "/student/startups/:id/opportunities/:opportunityId/apply",
    authenticate,
    roleGuard("student"),
    can("incubation.opportunity.read"),
    validateRequest(applyOpportunitySchema),
    incubationController.applyMyOpportunity,
  );

  router.get(
    "/lecturer/incubation/analytics",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    can("incubation.analytics.read"),
    validateRequest(analyticsQuerySchema),
    incubationController.getAnalyticsOverview,
  );

  router.get(
    "/mentor/startups/:id",
    authenticate,
    roleGuard("mentor"),
    can("incubation.progress.read", "incubation.support.read"),
    validateRequest(studentStartupIdParamSchema),
    incubationController.getMentorStartup,
  );
  router.get(
    "/mentor/startups/:id/progress",
    authenticate,
    roleGuard("mentor"),
    can("incubation.progress.read"),
    validateRequest(listProgressSchema),
    incubationController.listMentorProgress,
  );

  return router;
};
