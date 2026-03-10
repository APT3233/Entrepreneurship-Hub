import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import {
  createGroupSchema,
  updateGroupSchema,
  listGroupSchema,
  groupParamsSchema,
} from "./group.validation.js";
import { createGroupMemberRouter } from "./sub-modules/group-member/group-member.route.js";

/**
 * Group Router
 * Prefix: /api/v1/groups
 *
 * GET    /                            — list groups
 * GET    /:id                         — get group by id
 * POST   /                            — create group          [LECTURER+]
 * PUT    /:id                         — update group           [LECTURER+]
 * DELETE /:id                         — delete group (soft)    [LECTURER+]
 *
 * Sub-module: Group Member — mounted at /:groupId/members
 */
export const createGroupRouter = (container) => {
  const { groupController } = container.cradle;
  const router = Router();

  router.get("/", validateRequest(listGroupSchema), groupController.list);
  router.get(
    "/:id",
    validateRequest(groupParamsSchema),
    groupController.getById,
  );

  router.post(
    "/",
    authenticate,
    roleGuard("admin", "department_head", "teacher"),
    validateRequest(createGroupSchema),
    groupController.create,
  );

  router.put(
    "/:id",
    authenticate,
    roleGuard("admin", "department_head", "teacher"),
    validateRequest(updateGroupSchema),
    groupController.update,
  );

  router.delete(
    "/:id",
    authenticate,
    roleGuard("admin", "department_head", "teacher"),
    validateRequest(groupParamsSchema),
    groupController.remove,
  );

  // ── Mount Group Member sub-module ─────────────────
  router.use("/:groupId/members", createGroupMemberRouter(container));

  return router;
};
