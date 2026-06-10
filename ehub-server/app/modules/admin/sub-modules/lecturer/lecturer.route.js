import { Router } from "express";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
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
  const can = (...permissions) => permissionGuard(container, ...permissions);

  router.get("/lecturers/lookups", can("core.lecturer.read"), adminLecturerController.lookups);
  router.get("/lecturers/workload", can("core.lecturer.view_workload"), validateRequest(listAdminLecturerWorkloadSchema), adminLecturerController.workload);
  router.get("/lecturers/available-classes", can("core.lecturer.assign_class", "core.class.read"), validateRequest(listAvailableLecturerClassesSchema), adminLecturerController.availableClasses);

  router.get("/lecturers", can("core.lecturer.read"), validateRequest(listAdminLecturersSchema), adminLecturerController.listLecturers);
  router.post("/lecturers", can("core.lecturer.create"), validateRequest(createAdminLecturerSchema), adminLecturerController.createLecturer);
  router.get("/lecturers/:id", can("core.lecturer.read"), validateRequest(adminLecturerIdParamSchema), adminLecturerController.getLecturer);
  router.put("/lecturers/:id", can("core.lecturer.update"), validateRequest(updateAdminLecturerSchema), adminLecturerController.updateLecturer);
  router.patch("/lecturers/:id/status", can("core.lecturer.update"), validateRequest(updateAdminLecturerStatusSchema), adminLecturerController.updateLecturerStatus);
  router.put("/lecturers/:id/password", can("core.lecturer.update"), validateRequest(updateAdminLecturerPasswordSchema), adminLecturerController.updatePassword);
  router.delete("/lecturers/:id", can("core.lecturer.delete"), validateRequest(adminLecturerIdParamSchema), adminLecturerController.deleteLecturer);

  router.get("/lecturers/:id/overview", can("core.lecturer.read"), validateRequest(adminLecturerIdParamSchema), adminLecturerController.overview);
  router.get("/lecturers/:id/profile", can("core.lecturer.read"), validateRequest(adminLecturerIdParamSchema), adminLecturerController.profile);
  router.put("/lecturers/:id/profile", can("core.lecturer.update"), validateRequest(updateAdminLecturerProfileSchema), adminLecturerController.updateProfile);
  router.get("/lecturers/:id/classes", can("core.lecturer.read", "core.class.read"), validateRequest(listAdminLecturerClassesSchema), adminLecturerController.classes);
  router.post("/lecturers/:id/classes/assign", can("core.lecturer.assign_class"), validateRequest(assignAdminLecturerClassSchema), adminLecturerController.assignClass);
  router.get("/lecturers/:id/grading", can("core.lecturer.view_workload"), validateRequest(getAdminLecturerGradingSchema), adminLecturerController.grading);
  router.get("/lecturers/:id/created-content", can("core.lecturer.read"), validateRequest(adminLecturerIdParamSchema), adminLecturerController.createdContent);
  router.get("/lecturers/:id/activity", can("core.lecturer.view_activity"), validateRequest(getAdminLecturerActivitySchema), adminLecturerController.activity);
  router.get("/lecturers/:id/permissions", can("core.lecturer.read"), validateRequest(adminLecturerIdParamSchema), adminLecturerController.permissions);

  router.patch("/classes/:classId/lecturer", can("core.lecturer.assign_class"), validateRequest(patchAdminClassLecturerSchema), adminLecturerController.patchClassLecturer);

  return router;
};
