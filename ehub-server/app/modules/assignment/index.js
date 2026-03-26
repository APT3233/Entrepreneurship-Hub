import { asFunction } from "awilix";
import { createAssignmentRepository } from "./assignment.repository.js";
import { createAssignmentService } from "./assignment.service.js";
import { createAssignmentController } from "./assignment.controller.js";
import { createAssignmentRouter } from "./assignment.route.js";

export const AssignmentModule = {
  name: "assignment",
  path: "/assignments",
  register: (container) => {
    container.register({
      assignmentRepository: asFunction(createAssignmentRepository).singleton(),
      assignmentService: asFunction(createAssignmentService).singleton(),
      assignmentController: asFunction(createAssignmentController).singleton(),
    });
  },
  router: (container) => createAssignmentRouter(container),
};
