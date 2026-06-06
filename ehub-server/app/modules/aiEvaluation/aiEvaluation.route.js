import { Router } from "express";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  aiJobParamsSchema,
  aiSuggestionActionSchema,
  aiSuggestionTargetSchema,
  analyzeAiEvaluationSchema,
  listAdminAiSuggestionSchema,
  testAiPromptSchema,
  testAiSettingsSchema,
  updateAiSettingsSchema,
} from "./aiEvaluation.validation.js";

export const createAiEvaluationRouter = (container) => {
  const { aiEvaluationController } = container.cradle;
  const router = Router();
  const evaluatorRoles = roleGuard("admin", "department_head", "lecturer");

  router.use(authenticate, evaluatorRoles);
  router.post("/analyze", validateRequest(analyzeAiEvaluationSchema), aiEvaluationController.analyze);
  router.get("/jobs/:id", validateRequest(aiJobParamsSchema), aiEvaluationController.getJob);
  router.get(
    "/suggestions/:targetType/:targetId",
    validateRequest(aiSuggestionTargetSchema),
    aiEvaluationController.getLatestSuggestion,
  );
  router.post(
    "/suggestions/:id/actions",
    validateRequest(aiSuggestionActionSchema),
    aiEvaluationController.recordAction,
  );

  return router;
};

export const createAdminAiEvaluationRouter = (container) => {
  const { aiEvaluationController } = container.cradle;
  const router = Router();

  router.get(
    "/ai/evaluation-suggestions",
    validateRequest(listAdminAiSuggestionSchema),
    aiEvaluationController.listAdminSuggestions,
  );
  router.get("/settings/ai", aiEvaluationController.getAiSettings);
  router.post("/settings/ai/models", validateRequest(testAiSettingsSchema), aiEvaluationController.listProviderModels);
  router.post("/settings/ai/test-connection", validateRequest(testAiSettingsSchema), aiEvaluationController.testConnection);
  router.post("/settings/ai/test-prompt", validateRequest(testAiPromptSchema), aiEvaluationController.testPrompt);
  router.post("/settings/ai/test", validateRequest(testAiSettingsSchema), aiEvaluationController.testAiSettings);
  router.put("/settings/ai", validateRequest(updateAiSettingsSchema), aiEvaluationController.updateAiSettings);

  return router;
};
