import { Router } from "express";
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

  router.get("/project-submission/lookups", adminProjectSubmissionController.lookups);

  router.get("/projects", validateRequest(listAdminProjectsSchema), adminProjectSubmissionController.listProjects);
  router.get("/projects/:id", validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.getProject);
  router.put("/projects/:id", validateRequest(updateAdminProjectSchema), adminProjectSubmissionController.updateProject);

  router.get("/checkpoints", validateRequest(listAdminCheckpointsSchema), adminProjectSubmissionController.listCheckpoints);
  router.post("/checkpoints", validateRequest(createAdminCheckpointSchema), adminProjectSubmissionController.createCheckpoint);
  router.get("/checkpoints/:id", validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.getCheckpoint);
  router.put("/checkpoints/:id", validateRequest(updateAdminCheckpointSchema), adminProjectSubmissionController.updateCheckpoint);
  router.patch("/checkpoints/:id/status", validateRequest(updateAdminCheckpointStatusSchema), adminProjectSubmissionController.updateCheckpointStatus);
  router.post("/checkpoints/:id/duplicate", validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.duplicateCheckpoint);

  router.get("/checkpoint-submissions", validateRequest(listAdminCheckpointSubmissionsSchema), adminProjectSubmissionController.listCheckpointSubmissions);
  router.get("/checkpoint-submissions/:id", validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.getCheckpointSubmission);
  router.post("/checkpoint-submissions/:id/grade", validateRequest(gradeAdminSubmissionSchema), adminProjectSubmissionController.gradeCheckpointSubmission);

  router.get("/assignments", validateRequest(listAdminAssignmentsSchema), adminProjectSubmissionController.listAssignments);
  router.post("/assignments", validateRequest(createAdminAssignmentSchema), adminProjectSubmissionController.createAssignment);
  router.get("/assignments/:id", validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.getAssignment);
  router.put("/assignments/:id", validateRequest(updateAdminAssignmentSchema), adminProjectSubmissionController.updateAssignment);
  router.patch("/assignments/:id/status", validateRequest(updateAdminAssignmentStatusSchema), adminProjectSubmissionController.updateAssignmentStatus);

  router.get("/assignment-submissions", validateRequest(listAdminAssignmentSubmissionsSchema), adminProjectSubmissionController.listAssignmentSubmissions);
  router.get("/assignment-submissions/:id", validateRequest(adminProjectSubmissionIdParamSchema), adminProjectSubmissionController.getAssignmentSubmission);
  router.post("/assignment-submissions/:id/grade", validateRequest(gradeAdminSubmissionSchema), adminProjectSubmissionController.gradeAssignmentSubmission);

  router.get("/submission-files", validateRequest(listAdminSubmissionFilesSchema), adminProjectSubmissionController.listSubmissionFiles);
  router.patch("/submission-files/:source/:id/delete", validateRequest(adminSubmissionFileParamSchema), adminProjectSubmissionController.deleteSubmissionFile);
  router.patch("/submission-files/:source/:id/restore", validateRequest(adminSubmissionFileParamSchema), adminProjectSubmissionController.restoreSubmissionFile);

  return router;
};
