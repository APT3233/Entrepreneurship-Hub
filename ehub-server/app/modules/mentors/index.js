import { asFunction } from "awilix";
import { Router } from "express";
import { createMentorController } from "./sub-modules/profile/mentor.controller.js";
import { createMentorRepository } from "./sub-modules/profile/mentor.repository.js";
import { createMentorRouter } from "./sub-modules/profile/mentor.route.js";
import { createMentorService } from "./sub-modules/profile/mentor.service.js";
import { createMentorAnalyticsController } from "./sub-modules/analytics/mentorAnalytics.controller.js";
import { createMentorAnalyticsRepository } from "./sub-modules/analytics/mentorAnalytics.repository.js";
import { createMentorAnalyticsRouter } from "./sub-modules/analytics/mentorAnalytics.route.js";
import { createMentorAnalyticsService } from "./sub-modules/analytics/mentorAnalytics.service.js";
import { createMentorMatchingController } from "./sub-modules/matching/mentorMatching.controller.js";
import { createMentorMatchingRepository } from "./sub-modules/matching/mentorMatching.repository.js";
import { createMentorMatchingRouter } from "./sub-modules/matching/mentorMatching.route.js";
import { createMentorMatchingService } from "./sub-modules/matching/mentorMatching.service.js";
import { createMentorWorkflowController } from "./sub-modules/workflow/mentorWorkflow.controller.js";
import { createMentorWorkflowRepository } from "./sub-modules/workflow/mentorWorkflow.repository.js";
import { createMentorWorkflowRouter } from "./sub-modules/workflow/mentorWorkflow.route.js";
import { createMentorWorkflowService } from "./sub-modules/workflow/mentorWorkflow.service.js";

export const MentorModule = {
  name: "mentors",
  path: "",
  register: (container) => {
    container.register({
      mentorRepository: asFunction(createMentorRepository).singleton(),
      mentorService: asFunction(createMentorService).singleton(),
      mentorController: asFunction(createMentorController).singleton(),
      mentorWorkflowRepository: asFunction(createMentorWorkflowRepository).singleton(),
      mentorWorkflowService: asFunction(createMentorWorkflowService).singleton(),
      mentorWorkflowController: asFunction(createMentorWorkflowController).singleton(),
      mentorMatchingRepository: asFunction(createMentorMatchingRepository).singleton(),
      mentorMatchingService: asFunction(createMentorMatchingService).singleton(),
      mentorMatchingController: asFunction(createMentorMatchingController).singleton(),
      mentorAnalyticsRepository: asFunction(createMentorAnalyticsRepository).singleton(),
      mentorAnalyticsService: asFunction(createMentorAnalyticsService).singleton(),
      mentorAnalyticsController: asFunction(createMentorAnalyticsController).singleton(),
    });
  },
  router: (container) => {
    const router = Router();
    router.use("/mentors", createMentorRouter(container));
    router.use("/", createMentorWorkflowRouter(container));
    router.use("/mentor-matching", createMentorMatchingRouter(container));
    router.use("/", createMentorAnalyticsRouter(container));
    return router;
  },
};
