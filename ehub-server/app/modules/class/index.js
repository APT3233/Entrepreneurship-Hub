import { asFunction } from "awilix";
import { createClassRepository } from "./class.repository.js";
import { createClassService } from "./class.service.js";
import { createClassController } from "./class.controller.js";
import { createClassRouter } from "./class.route.js";
import { createEnrollmentRepository } from "./sub-modules/enrollment/enrollment.repository.js";
import { createEnrollmentService } from "./sub-modules/enrollment/enrollment.service.js";
import { createEnrollmentController } from "./sub-modules/enrollment/enrollment.controller.js";

export const ClassModule = {
  name: "class",
  path: "/classes",

  register: (container) => {
    container.register({
      // Class
      classRepository: asFunction(createClassRepository).singleton(),
      classService: asFunction(createClassService).singleton(),
      classController: asFunction(createClassController).singleton(),
      // Enrollment sub-module
      enrollmentRepository: asFunction(createEnrollmentRepository).singleton(),
      enrollmentService: asFunction(createEnrollmentService).singleton(),
      enrollmentController: asFunction(createEnrollmentController).singleton(),
    });
  },

  router: (container) => createClassRouter(container),
};
