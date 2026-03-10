import { asFunction } from "awilix";
import { createSubjectRepository } from "./subject.repository.js";
import { createSubjectService } from "./subject.service.js";
import { createSubjectController } from "./subject.controller.js";
import { createSubjectRouter } from "./subject.route.js";

export const SubjectModule = {
  name: "subject",
  path: "/subjects",

  register: (container) => {
    container.register({
      subjectRepository: asFunction(createSubjectRepository).singleton(),
      subjectService: asFunction(createSubjectService).singleton(),
      subjectController: asFunction(createSubjectController).singleton(),
    });
  },

  router: (container) => createSubjectRouter(container),
};
