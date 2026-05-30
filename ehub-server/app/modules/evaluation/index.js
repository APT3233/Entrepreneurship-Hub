import { asFunction } from "awilix";
import { createEvaluationRepository } from "./evaluation.repository.js";
import { createEvaluationService } from "./evaluation.service.js";
import { createEvaluationController } from "./evaluation.controller.js";
import { createEvaluationRouter } from "./evaluation.route.js";

export const EvaluationModule = {
  name: "evaluation",
  path: "/evaluations",
  register: (container) => {
    container.register({
      evaluationRepository: asFunction(createEvaluationRepository).singleton(),
      evaluationService: asFunction(createEvaluationService).singleton(),
      evaluationController: asFunction(createEvaluationController).singleton(),
    });
  },
  router: (container) => createEvaluationRouter(container),
};
