import { asFunction } from "awilix";
import { createStudentRepository } from "./student.repository.js";
import { createStudentService } from "./student.service.js";
import { createStudentController } from "./student.controller.js";
import { createStudentRouter } from "./student.route.js";

export const StudentModule = {
  name: "student",
  path: "/students",

  register: (container) => {
    container.register({
      studentRepository: asFunction(createStudentRepository).singleton(),
      studentService: asFunction(createStudentService).singleton(),
      studentController: asFunction(createStudentController).singleton(),
    });
  },

  router: (container) => createStudentRouter(container),
};
