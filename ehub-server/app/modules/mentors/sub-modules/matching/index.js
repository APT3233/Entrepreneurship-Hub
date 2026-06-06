import { asFunction } from "awilix";
import { createMentorMatchingController } from "./mentorMatching.controller.js";
import { createMentorMatchingRepository } from "./mentorMatching.repository.js";
import { createMentorMatchingRouter } from "./mentorMatching.route.js";
import { createMentorMatchingService } from "./mentorMatching.service.js";

export const MentorMatchingModule = {
  name: "mentorMatching",
  path: "/mentor-matching",
  register: (container) => {
    container.register({
      mentorMatchingRepository: asFunction(createMentorMatchingRepository).singleton(),
      mentorMatchingService: asFunction(createMentorMatchingService).singleton(),
      mentorMatchingController: asFunction(createMentorMatchingController).singleton(),
    });
  },
  router: (container) => createMentorMatchingRouter(container),
};
