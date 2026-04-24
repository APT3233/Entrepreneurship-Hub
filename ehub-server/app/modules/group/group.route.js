import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate, optionalAuthenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import {
  createGroupSchema,
  updateGroupSchema,
  listGroupSchema,
  groupParamsSchema,
} from "./group.validation.js";
import { createGroupMemberRouter } from "./sub-modules/group-member/group-member.route.js";
import { createGroupInviteRouter } from "./sub-modules/group-invite/groupInvite.route.js";

/**
 * Group Router
 * Prefix: /api/v1/groups
 *
 * GET    /invites/pending             — student pending group invites
 * GET    /invites/preview/:token      — preview invite
 * POST   /invites/:token/accept|decline
 * GET    /                            — list groups
 * GET    /:id                         — get group by id
 * POST   /                            — create group          [LECTURER+]
 * PUT    /:id                         — update group           [LECTURER+]
 * DELETE /:id                         — delete group (soft)    [LECTURER+]
 *
 * Sub-module: Group Member — mounted at /:groupId/members
 *   GET/PATCH/DELETE …/members, …/members/:studentId
 */
export const createGroupRouter = (container) => {
  const { groupController } = container.cradle;
  const router = Router();

  router.use("/invites", createGroupInviteRouter(container));

  router.get("/my-groups", authenticate, groupController.getMyGroups);
  router.get("/", optionalAuthenticate, validateRequest(listGroupSchema), groupController.list);
  router.get("/:id", optionalAuthenticate, validateRequest(groupParamsSchema), groupController.getById);

  router.post(
    "/",
    authenticate,
    roleGuard("admin", "department_head", "lecturer", "student"),
    validateRequest(createGroupSchema),
    groupController.create,
  );

  router.put(
    "/:id",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    validateRequest(updateGroupSchema),
    groupController.update,
  );

  router.delete(
    "/:id",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    validateRequest(groupParamsSchema),
    groupController.remove,
  );

  // ── Mount Group Member sub-module ─────────────────
  router.use("/:groupId/members", createGroupMemberRouter(container));

  return router;
};
