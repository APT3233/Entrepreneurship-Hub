import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  adminLecturerIdParamSchema,
  assignAdminLecturerClassSchema,
  createAdminLecturerSchema,
  getAdminLecturerActivitySchema,
  getAdminLecturerGradingSchema,
  listAdminLecturerClassesSchema,
  listAdminLecturersSchema,
  listAdminLecturerWorkloadSchema,
  listAvailableLecturerClassesSchema,
  patchAdminClassLecturerSchema,
  updateAdminLecturerPasswordSchema,
  updateAdminLecturerProfileSchema,
  updateAdminLecturerSchema,
  updateAdminLecturerStatusSchema,
} from "./lecturer.validation.js";

export const createAdminLecturerRouter = (container) => {
  const { adminLecturerController } = container.cradle;
  const router = Router();

  router.get("/lecturers/lookups", adminLecturerController.lookups);
  router.get("/lecturers/workload", validateRequest(listAdminLecturerWorkloadSchema), adminLecturerController.workload);
  router.get("/lecturers/available-classes", validateRequest(listAvailableLecturerClassesSchema), adminLecturerController.availableClasses);

  router.get("/lecturers", validateRequest(listAdminLecturersSchema), adminLecturerController.listLecturers);
  router.post("/lecturers", validateRequest(createAdminLecturerSchema), adminLecturerController.createLecturer);
  router.get("/lecturers/:id", validateRequest(adminLecturerIdParamSchema), adminLecturerController.getLecturer);
  router.put("/lecturers/:id", validateRequest(updateAdminLecturerSchema), adminLecturerController.updateLecturer);
  router.patch("/lecturers/:id/status", validateRequest(updateAdminLecturerStatusSchema), adminLecturerController.updateLecturerStatus);
  router.put("/lecturers/:id/password", validateRequest(updateAdminLecturerPasswordSchema), adminLecturerController.updatePassword);
  router.delete("/lecturers/:id", validateRequest(adminLecturerIdParamSchema), adminLecturerController.deleteLecturer);

  router.get("/lecturers/:id/overview", validateRequest(adminLecturerIdParamSchema), adminLecturerController.overview);
  router.get("/lecturers/:id/profile", validateRequest(adminLecturerIdParamSchema), adminLecturerController.profile);
  router.put("/lecturers/:id/profile", validateRequest(updateAdminLecturerProfileSchema), adminLecturerController.updateProfile);
  router.get("/lecturers/:id/classes", validateRequest(listAdminLecturerClassesSchema), adminLecturerController.classes);
  router.post("/lecturers/:id/classes/assign", validateRequest(assignAdminLecturerClassSchema), adminLecturerController.assignClass);
  router.get("/lecturers/:id/grading", validateRequest(getAdminLecturerGradingSchema), adminLecturerController.grading);
  router.get("/lecturers/:id/created-content", validateRequest(adminLecturerIdParamSchema), adminLecturerController.createdContent);
  router.get("/lecturers/:id/activity", validateRequest(getAdminLecturerActivitySchema), adminLecturerController.activity);
  router.get("/lecturers/:id/permissions", validateRequest(adminLecturerIdParamSchema), adminLecturerController.permissions);

  router.patch("/classes/:classId/lecturer", validateRequest(patchAdminClassLecturerSchema), adminLecturerController.patchClassLecturer);

  return router;
};
