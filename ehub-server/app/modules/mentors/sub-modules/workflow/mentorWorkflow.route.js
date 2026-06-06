import { Router } from "express";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  actionItemIdParamSchema,
  classIdParamSchema,
  createActionItemSchema,
  createAssignmentRequestSchema,
  createFeedbackSchema,
  createNoteSchema,
  createSessionSchema,
  groupIdParamSchema,
  listAssignmentsSchema,
  listSessionsSchema,
  respondAssignmentSchema,
  sessionIdParamSchema,
  updateActionItemStatusSchema,
  updateSessionSchema,
  updateSessionStatusSchema,
} from "./mentorWorkflow.validation.js";

export const createMentorWorkflowRouter = (container) => {
  const { mentorWorkflowController } = container.cradle;
  const router = Router();
  const can = (...permissions) => permissionGuard(container, ...permissions);

  router.get(
    "/mentor/assignments",
    authenticate,
    roleGuard("mentor"),
    can("mentor.assignment.read"),
    validateRequest(listAssignmentsSchema),
    mentorWorkflowController.listMyAssignments,
  );
  router.patch(
    "/mentor/assignments/:id/respond",
    authenticate,
    roleGuard("mentor"),
    can("mentor.assignment.respond"),
    validateRequest(respondAssignmentSchema),
    mentorWorkflowController.respondAssignment,
  );

  router.get("/mentor/sessions", authenticate, roleGuard("mentor"), can("mentor.session.read"), validateRequest(listSessionsSchema), mentorWorkflowController.listMentorSessions);
  router.post("/mentor/sessions", authenticate, roleGuard("mentor"), can("mentor.session.create"), validateRequest(createSessionSchema), mentorWorkflowController.createSession);
  router.get("/mentor/sessions/:id", authenticate, roleGuard("mentor"), can("mentor.session.read"), validateRequest(sessionIdParamSchema), mentorWorkflowController.getSession);
  router.put("/mentor/sessions/:id", authenticate, roleGuard("mentor"), can("mentor.session.update"), validateRequest(updateSessionSchema), mentorWorkflowController.updateSession);
  router.patch("/mentor/sessions/:id/status", authenticate, roleGuard("mentor"), can("mentor.session.status"), validateRequest(updateSessionStatusSchema), mentorWorkflowController.updateSessionStatus);

  router.get("/lecturer/classes/:classId/mentor-assignments", authenticate, roleGuard("admin", "department_head", "lecturer"), can("mentor.assignment.read"), validateRequest(classIdParamSchema), mentorWorkflowController.listLecturerClassAssignments);
  router.get("/lecturer/mentoring/sessions", authenticate, roleGuard("admin", "department_head", "lecturer"), can("mentor.session.read"), validateRequest(listSessionsSchema), mentorWorkflowController.listLecturerSessions);
  router.get("/lecturer/classes/:classId/mentoring-sessions", authenticate, roleGuard("admin", "department_head", "lecturer"), can("mentor.session.read"), validateRequest(classIdParamSchema), mentorWorkflowController.listLecturerClassSessions);
  router.post("/lecturer/groups/:groupId/mentor-assignment-requests", authenticate, roleGuard("admin", "department_head", "lecturer"), can("mentor.assignment.request"), validateRequest(createAssignmentRequestSchema), mentorWorkflowController.createAssignmentRequest);

  router.get("/groups/:groupId/mentoring-sessions", authenticate, roleGuard("admin", "department_head", "lecturer", "student", "mentor"), can("mentor.session.read"), validateRequest(groupIdParamSchema), mentorWorkflowController.listGroupSessions);

  router.get("/mentoring-sessions/:id", authenticate, roleGuard("admin", "department_head", "lecturer", "student", "mentor"), can("mentor.session.read"), validateRequest(sessionIdParamSchema), mentorWorkflowController.getSession);
  router.post("/mentoring-sessions/:id/notes", authenticate, roleGuard("admin", "department_head", "lecturer", "student", "mentor"), can("mentor.session.read"), validateRequest(createNoteSchema), mentorWorkflowController.createNote);
  router.get("/mentoring-sessions/:id/notes", authenticate, roleGuard("admin", "department_head", "lecturer", "student", "mentor"), can("mentor.session.read"), validateRequest(sessionIdParamSchema), mentorWorkflowController.listNotes);
  router.post("/mentoring-sessions/:id/feedback", authenticate, roleGuard("admin", "department_head", "lecturer", "student", "mentor"), can("mentor.feedback.manage"), validateRequest(createFeedbackSchema), mentorWorkflowController.createFeedback);
  router.get("/mentoring-sessions/:id/feedback", authenticate, roleGuard("admin", "department_head", "lecturer", "student", "mentor"), can("mentor.feedback.manage", "mentor.session.read"), validateRequest(sessionIdParamSchema), mentorWorkflowController.listFeedback);
  router.post("/mentoring-sessions/:id/action-items", authenticate, roleGuard("admin", "department_head", "lecturer", "student", "mentor"), can("mentor.action_item.manage"), validateRequest(createActionItemSchema), mentorWorkflowController.createActionItem);
  router.patch("/mentoring-action-items/:id/status", authenticate, roleGuard("admin", "department_head", "lecturer", "student", "mentor"), can("mentor.action_item.manage"), validateRequest(updateActionItemStatusSchema), mentorWorkflowController.updateActionItemStatus);

  return router;
};
