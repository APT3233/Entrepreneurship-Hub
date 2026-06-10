import { Router } from "express";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
import { createRateLimiters } from "app/core/middlewares/rateLimiter.js";
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
  const can = (...permissions) => permissionGuard(container, ...permissions);
  const limiters = createRateLimiters(container);

  router.use(authenticate, evaluatorRoles);
  router.post("/analyze", can("ai.evaluation.analyze"), limiters.ai, validateRequest(analyzeAiEvaluationSchema), aiEvaluationController.analyze);
  router.get("/jobs/:id", can("ai.evaluation.read", "ai.evaluation.admin_read"), validateRequest(aiJobParamsSchema), aiEvaluationController.getJob);
  router.get(
    "/suggestions/:targetType/:targetId",
    can("ai.evaluation.read", "ai.evaluation.admin_read"),
    validateRequest(aiSuggestionTargetSchema),
    aiEvaluationController.getLatestSuggestion,
  );
  router.post(
    "/suggestions/:id/actions",
    can("ai.evaluation.action"),
    validateRequest(aiSuggestionActionSchema),
    aiEvaluationController.recordAction,
  );

  return router;
};

export const createAdminAiEvaluationRouter = (container) => {
  const { aiEvaluationController } = container.cradle;
  const router = Router();
  const can = (...permissions) => permissionGuard(container, ...permissions);
  const limiters = createRateLimiters(container);

  router.get(
    "/ai/evaluation-suggestions",
    can("ai.evaluation.admin_read"),
    validateRequest(listAdminAiSuggestionSchema),
    aiEvaluationController.listAdminSuggestions,
  );
  router.get("/settings/ai", can("ai.settings.read"), aiEvaluationController.getAiSettings);
  router.post("/settings/ai/models", can("ai.settings.test_provider", "ai.settings.read"), limiters.ai, validateRequest(testAiSettingsSchema), aiEvaluationController.listProviderModels);
  router.post("/settings/ai/test-connection", can("ai.settings.test_provider"), limiters.ai, validateRequest(testAiSettingsSchema), aiEvaluationController.testConnection);
  router.post("/settings/ai/test-prompt", can("ai.settings.test_provider"), limiters.ai, validateRequest(testAiPromptSchema), aiEvaluationController.testPrompt);
  router.post("/settings/ai/test", can("ai.settings.test_provider"), limiters.ai, validateRequest(testAiSettingsSchema), aiEvaluationController.testAiSettings);
  router.put("/settings/ai", can("ai.settings.update", "ai.settings.switch_provider"), validateRequest(updateAiSettingsSchema), aiEvaluationController.updateAiSettings);

  return router;
};
