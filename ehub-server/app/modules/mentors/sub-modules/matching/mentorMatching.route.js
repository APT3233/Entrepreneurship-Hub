import { Router } from "express";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
import { createRateLimiters } from "app/core/middlewares/rateLimiter.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  convertSuggestionSchema,
  createMatchingRequestSchema,
  generateMatchingSchema,
  listMatchingRequestsSchema,
  matchingRequestIdParamSchema,
  recordSuggestionActionSchema,
} from "./mentorMatching.validation.js";

export const createMentorMatchingRouter = (container) => {
  const { mentorMatchingController } = container.cradle;
  const router = Router();
  const can = (...permissions) => permissionGuard(container, ...permissions);
  const limiters = createRateLimiters(container);

  router.use(authenticate, roleGuard("admin", "department_head", "lecturer"));

  router.get("/requests", can("mentor.matching.read"), validateRequest(listMatchingRequestsSchema), mentorMatchingController.listRequests);
  router.post("/requests", can("mentor.matching.create"), validateRequest(createMatchingRequestSchema), mentorMatchingController.createRequest);
  router.get("/requests/:id", can("mentor.matching.read"), validateRequest(matchingRequestIdParamSchema), mentorMatchingController.getRequest);
  router.post("/requests/:id/generate", can("mentor.matching.generate"), limiters.ai, validateRequest(generateMatchingSchema), mentorMatchingController.generateSuggestions);
  router.get("/requests/:id/suggestions", can("mentor.matching.read"), validateRequest(matchingRequestIdParamSchema), mentorMatchingController.listSuggestions);
  router.post("/suggestions/:id/actions", can("mentor.matching.action"), validateRequest(recordSuggestionActionSchema), mentorMatchingController.recordAction);
  router.post("/suggestions/:id/convert-to-assignment", can("mentor.matching.convert"), validateRequest(convertSuggestionSchema), mentorMatchingController.convertToAssignment);

  return router;
};
