import { asFunction } from "awilix";
import { createAnalyticsRepository } from "./analytics.repository.js";
import { createAnalyticsService } from "./analytics.service.js";
import { createAnalyticsController } from "./analytics.controller.js";
import { createAnalyticsRouter } from "./analytics.route.js";

export const AnalyticsModule = {
  name: "analytics",
  path: "",
  register: (container) => {
    container.register({
      analyticsRepository: asFunction(createAnalyticsRepository).singleton(),
      analyticsService: asFunction(createAnalyticsService).singleton(),
      analyticsController: asFunction(createAnalyticsController).singleton(),
    });
  },
  router: (container) => createAnalyticsRouter(container),
};
