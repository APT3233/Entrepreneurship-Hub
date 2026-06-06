import { asFunction } from "awilix";
import { createMentorAnalyticsController } from "./mentorAnalytics.controller.js";
import { createMentorAnalyticsRepository } from "./mentorAnalytics.repository.js";
import { createMentorAnalyticsRouter } from "./mentorAnalytics.route.js";
import { createMentorAnalyticsService } from "./mentorAnalytics.service.js";

export const MentorAnalyticsModule = {
  name: "mentorAnalytics",
  path: "",
  register: (container) => {
    container.register({
      mentorAnalyticsRepository: asFunction(createMentorAnalyticsRepository).singleton(),
      mentorAnalyticsService: asFunction(createMentorAnalyticsService).singleton(),
      mentorAnalyticsController: asFunction(createMentorAnalyticsController).singleton(),
    });
  },
  router: (container) => createMentorAnalyticsRouter(container),
};
