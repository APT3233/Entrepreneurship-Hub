import { Router } from "express";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  adminProjectSubmissionIdParamSchema,
  adminSubmissionFileParamSchema,
  createAdminAssignmentSchema,
  createAdminCheckpointSchema,
  gradeAdminSubmissionSchema,
  listAdminAssignmentSubmissionsSchema,
  listAdminAssignmentsSchema,
  listAdminCheckpointSubmissionsSchema,
  listAdminCheckpointsSchema,
  listAdminProjectsSchema,
  listAdminSubmissionFilesSchema,
  updateAdminAssignmentSchema,
  updateAdminAssignmentStatusSchema,
  updateAdminCheckpointSchema,
  updateAdminCheckpointStatusSchema,
  updateAdminProjectSchema,
} from "./projectSubmission.validation.js";

export const createAdminProjectSubmissionRouter = (container) => {
  const { adminProjectSubmissionController } = container.cradle;
  const router = Router();
  const can = (...permissions) => permissionGuard(container, ...permissions);

  router.get("/project-submission/lookups", can("core.group.read", "core.class.read"), adminProjectSubmissionController.lookups);

  router.get("/projects", can("core.group.read"), validateRequest(listAdminProjectsSchema), adminProjectSubmissionController.listProjects);
  router.get("/projects/:id", can("core.group.read"), validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.getProject);
  router.put("/projects/:id", can("core.group.update"), validateRequest(updateAdminProjectSchema), adminProjectSubmissionController.updateProject);

  router.get("/checkpoints", can("core.class.read"), validateRequest(listAdminCheckpointsSchema), adminProjectSubmissionController.listCheckpoints);
  router.post("/checkpoints", can("core.class.update"), validateRequest(createAdminCheckpointSchema), adminProjectSubmissionController.createCheckpoint);
  router.get("/checkpoints/:id", can("core.class.read"), validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.getCheckpoint);
  router.put("/checkpoints/:id", can("core.class.update"), validateRequest(updateAdminCheckpointSchema), adminProjectSubmissionController.updateCheckpoint);
  router.patch("/checkpoints/:id/status", can("core.class.update"), validateRequest(updateAdminCheckpointStatusSchema), adminProjectSubmissionController.updateCheckpointStatus);
  router.delete("/checkpoints/:id", can("core.class.update"), validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.deleteCheckpoint);
  router.post("/checkpoints/:id/duplicate", can("core.class.update"), validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.duplicateCheckpoint);

  router.get("/checkpoint-submissions", can("core.group.read"), validateRequest(listAdminCheckpointSubmissionsSchema), adminProjectSubmissionController.listCheckpointSubmissions);
  router.get("/checkpoint-submissions/:id", can("core.group.read"), validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.getCheckpointSubmission);
  router.post("/checkpoint-submissions/:id/grade", can("core.group.update"), validateRequest(gradeAdminSubmissionSchema), adminProjectSubmissionController.gradeCheckpointSubmission);

  router.get("/assignments", can("core.class.read"), validateRequest(listAdminAssignmentsSchema), adminProjectSubmissionController.listAssignments);
  router.post("/assignments", can("core.class.update"), validateRequest(createAdminAssignmentSchema), adminProjectSubmissionController.createAssignment);
  router.get("/assignments/:id", can("core.class.read"), validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.getAssignment);
  router.put("/assignments/:id", can("core.class.update"), validateRequest(updateAdminAssignmentSchema), adminProjectSubmissionController.updateAssignment);
  router.patch("/assignments/:id/status", can("core.class.update"), validateRequest(updateAdminAssignmentStatusSchema), adminProjectSubmissionController.updateAssignmentStatus);
  router.delete("/assignments/:id", can("core.class.update"), validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.deleteAssignment);

  router.get("/assignment-submissions", can("core.group.read"), validateRequest(listAdminAssignmentSubmissionsSchema), adminProjectSubmissionController.listAssignmentSubmissions);
  router.get("/assignment-submissions/:id", can("core.group.read"), validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.getAssignmentSubmission);
  router.post("/assignment-submissions/:id/grade", can("core.group.update"), validateRequest(gradeAdminSubmissionSchema), adminProjectSubmissionController.gradeAssignmentSubmission);

  router.get("/submission-files", can("core.group.read"), validateRequest(listAdminSubmissionFilesSchema), adminProjectSubmissionController.listSubmissionFiles);
  router.patch("/submission-files/:source/:id/delete", can("core.group.update"), validateRequest(adminSubmissionFileParamSchema), adminProjectSubmissionController.deleteSubmissionFile);
  router.patch("/submission-files/:source/:id/restore", can("core.group.update"), validateRequest(adminSubmissionFileParamSchema), adminProjectSubmissionController.restoreSubmissionFile);

  return router;
};
