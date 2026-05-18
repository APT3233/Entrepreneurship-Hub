import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import {
  addGroupMemberSchema,
  removeGroupMemberSchema,
  listGroupMemberSchema,
  updateGroupMemberSchema,
} from "./group-member.validation.js";

/**
 * Group Member Router — nested under /groups/:groupId
 *
 * GET    /                   — list group members
 * POST   /                   — add member (leader only)
 * PATCH  /:studentId         — update role/status      [LECTURER+]
 * DELETE /:studentId         — remove member           [LECTURER+]
 */
export const createGroupMemberRouter = (container) => {
  const { groupMemberController } = container.cradle;
  const router = Router({ mergeParams: true });

  router.get(
    "/",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    validateRequest(listGroupMemberSchema),
    groupMemberController.list,
  );

  router.post(
    "/",
    authenticate,
    roleGuard("admin", "department_head", "lecturer", "student"),
    validateRequest(addGroupMemberSchema),
    groupMemberController.add,
  );

  router.patch(
    "/:studentId",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    validateRequest(updateGroupMemberSchema),
    groupMemberController.update,
  );

  router.delete(
    "/:studentId",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    validateRequest(removeGroupMemberSchema),
    groupMemberController.remove,
  );

  return router;
};
