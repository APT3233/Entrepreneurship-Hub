import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import {
  addGroupMemberSchema,
  removeGroupMemberSchema,
  listGroupMemberSchema,
} from "./group-member.validation.js";

/**
 * Group Member Router — nested under /groups/:groupId
 *
 * GET    /                   — list group members
 * POST   /                   — add member             [LECTURER+]
 * DELETE /:studentId         — remove member           [LECTURER+]
 */
export const createGroupMemberRouter = (container) => {
  const { groupMemberController } = container.cradle;
  const router = Router({ mergeParams: true });

  router.get(
    "/",
    validateRequest(listGroupMemberSchema),
    groupMemberController.list,
  );

  router.post(
    "/",
    authenticate,
    roleGuard("admin", "department_head", "teacher"),
    validateRequest(addGroupMemberSchema),
    groupMemberController.add,
  );

  router.delete(
    "/:studentId",
    authenticate,
    roleGuard("admin", "department_head", "teacher"),
    validateRequest(removeGroupMemberSchema),
    groupMemberController.remove,
  );

  return router;
};
