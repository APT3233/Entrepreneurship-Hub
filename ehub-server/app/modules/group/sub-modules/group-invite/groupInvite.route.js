import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import { groupInviteTokenParams, groupInviteReportSchema } from "./groupInvite.validation.js";

/** Prefix: /api/v1/groups/invites (mounted from group router before /:id) */
export const createGroupInviteRouter = (container) => {
  const { groupInviteController } = container.cradle;
  const router = Router();

  router.get(
    "/pending",
    authenticate,
    roleGuard("student"),
    groupInviteController.listPending,
  );

  router.get(
    "/preview/:token",
    authenticate,
    roleGuard("student"),
    validateRequest(groupInviteTokenParams),
    groupInviteController.preview,
  );

  router.post(
    "/:token/accept",
    authenticate,
    roleGuard("student"),
    validateRequest(groupInviteTokenParams),
    groupInviteController.accept,
  );

  router.post(
    "/:token/decline",
    authenticate,
    roleGuard("student"),
    validateRequest(groupInviteTokenParams),
    groupInviteController.decline,
  );

  router.post(
    "/:token/report",
    authenticate,
    roleGuard("student"),
    validateRequest(groupInviteTokenParams),
    validateRequest(groupInviteReportSchema),
    groupInviteController.report,
  );

  return router;
};
