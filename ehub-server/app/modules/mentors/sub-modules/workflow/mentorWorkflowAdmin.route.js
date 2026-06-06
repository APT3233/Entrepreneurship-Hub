import { Router } from "express";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  assignmentIdParamSchema,
  createAssignmentSchema,
  createGroupAssignmentSchema,
  groupIdParamSchema,
  listAssignmentsSchema,
  listActionItemsSchema,
  listSessionsSchema,
  updateAssignmentSchema,
  updateAssignmentStatusSchema,
} from "./mentorWorkflow.validation.js";

export const createMentorWorkflowAdminRouter = (container) => {
  const { mentorWorkflowController } = container.cradle;
  const router = Router();
  const can = (...permissions) => permissionGuard(container, ...permissions);

  router.get("/mentor-assignments", can("mentor.assignment.read"), validateRequest(listAssignmentsSchema), mentorWorkflowController.listAdminAssignments);
  router.post("/mentor-assignments", can("mentor.assignment.create"), validateRequest(createAssignmentSchema), mentorWorkflowController.createAdminAssignment);
  router.get("/mentor-assignments/:id", can("mentor.assignment.read"), validateRequest(assignmentIdParamSchema), mentorWorkflowController.getAssignment);
  router.put("/mentor-assignments/:id", can("mentor.assignment.update"), validateRequest(updateAssignmentSchema), mentorWorkflowController.updateAssignment);
  router.patch("/mentor-assignments/:id/status", can("mentor.assignment.approve", "mentor.assignment.cancel", "mentor.assignment.complete"), validateRequest(updateAssignmentStatusSchema), mentorWorkflowController.updateAssignmentStatus);
  router.delete("/mentor-assignments/:id", can("mentor.assignment.cancel"), validateRequest(assignmentIdParamSchema), mentorWorkflowController.deleteAssignment);

  router.get("/groups/:groupId/mentor-assignments", can("mentor.assignment.read"), validateRequest(groupIdParamSchema), mentorWorkflowController.listGroupAssignments);
  router.post("/groups/:groupId/mentor-assignments", can("mentor.assignment.create"), validateRequest(createGroupAssignmentSchema), mentorWorkflowController.createGroupAssignment);

  router.get("/mentoring/sessions", can("mentor.session.read"), validateRequest(listSessionsSchema), mentorWorkflowController.listAdminSessions);
  router.get("/mentoring/feedbacks", can("mentor.feedback.manage", "mentor.session.read"), validateRequest(listSessionsSchema), mentorWorkflowController.listAdminFeedback);
  router.get("/mentoring/action-items", can("mentor.action_item.manage", "mentor.session.read"), validateRequest(listActionItemsSchema), mentorWorkflowController.listAdminActionItems);

  return router;
};
