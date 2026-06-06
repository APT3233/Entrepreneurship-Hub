import { asFunction } from "awilix";
import { createAiEvaluationController } from "./aiEvaluation.controller.js";
import { createAiEvaluationRepository } from "./aiEvaluation.repository.js";
import { createAiEvaluationRouter } from "./aiEvaluation.route.js";
import { createAiEvaluationService } from "./aiEvaluation.service.js";

export const AiEvaluationModule = {
  name: "aiEvaluation",
  path: "/ai/evaluation",
  register: (container) => {
    container.register({
      aiEvaluationRepository: asFunction(createAiEvaluationRepository).singleton(),
      aiEvaluationService: asFunction(createAiEvaluationService).singleton(),
      aiEvaluationController: asFunction(createAiEvaluationController).singleton(),
    });
  },
  router: (container) => createAiEvaluationRouter(container),
};
