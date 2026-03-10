import { asFunction } from "awilix";
import { createSemesterRepository } from "./semester.repository.js";
import { createSemesterService } from "./semester.service.js";
import { createSemesterController } from "./semester.controller.js";
import { createSemesterRouter } from "./semester.route.js";

export const SemesterModule = {
  name: "semester",
  path: "/semesters",

  register: (container) => {
    container.register({
      semesterRepository: asFunction(createSemesterRepository).singleton(),
      semesterService: asFunction(createSemesterService).singleton(),
      semesterController: asFunction(createSemesterController).singleton(),
    });
  },

  router: (container) => createSemesterRouter(container),
};
