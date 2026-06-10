import { Router } from "express";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  adminAcademicIdParamSchema,
  createAdminClassSchema,
  createAdminSemesterSchema,
  createAdminSubjectSchema,
  getAdminAcademicByIdSchema,
  listAdminClassesSchema,
  listAdminSemestersSchema,
  listAdminSubjectsSchema,
  updateAdminClassSchema,
  updateAdminClassStatusSchema,
  updateAdminSemesterSchema,
  updateAdminSemesterStatusSchema,
  updateAdminSubjectSchema,
  updateAdminSubjectStatusSchema,
} from "./academic.validation.js";

export const createAdminAcademicRouter = (container) => {
  const { adminAcademicController } = container.cradle;
  const router = Router();
  const can = (...permissions) => permissionGuard(container, ...permissions);

  router.get("/lookups", can("core.subject.read", "core.semester.read", "core.class.read"), adminAcademicController.lookups);

  router.get("/subjects", can("core.subject.read"), validateRequest(listAdminSubjectsSchema), adminAcademicController.listSubjects);
  router.post("/subjects", can("core.subject.create"), validateRequest(createAdminSubjectSchema), adminAcademicController.createSubject);
  router.get("/subjects/:id", can("core.subject.read"), validateRequest(getAdminAcademicByIdSchema), adminAcademicController.getSubject);
  router.put("/subjects/:id", can("core.subject.update"), validateRequest(updateAdminSubjectSchema), adminAcademicController.updateSubject);
  router.patch("/subjects/:id/status", can("core.subject.update"), validateRequest(updateAdminSubjectStatusSchema), adminAcademicController.updateSubjectStatus);
  router.delete("/subjects/:id", can("core.subject.delete"), validateRequest(adminAcademicIdParamSchema), adminAcademicController.deleteSubject);
  router.post("/subjects/:id/restore", can("core.subject.update"), validateRequest(adminAcademicIdParamSchema), adminAcademicController.restoreSubject);

  router.get("/semesters", can("core.semester.read"), validateRequest(listAdminSemestersSchema), adminAcademicController.listSemesters);
  router.post("/semesters", can("core.semester.create"), validateRequest(createAdminSemesterSchema), adminAcademicController.createSemester);
  router.get("/semesters/:id", can("core.semester.read"), validateRequest(getAdminAcademicByIdSchema), adminAcademicController.getSemester);
  router.put("/semesters/:id", can("core.semester.update"), validateRequest(updateAdminSemesterSchema), adminAcademicController.updateSemester);
  router.patch("/semesters/:id/status", can("core.semester.update"), validateRequest(updateAdminSemesterStatusSchema), adminAcademicController.updateSemesterStatus);

  router.get("/classes", can("core.class.read"), validateRequest(listAdminClassesSchema), adminAcademicController.listClasses);
  router.post("/classes", can("core.class.create"), validateRequest(createAdminClassSchema), adminAcademicController.createClass);
  router.get("/classes/:id", can("core.class.read"), validateRequest(getAdminAcademicByIdSchema), adminAcademicController.getClass);
  router.put("/classes/:id", can("core.class.update"), validateRequest(updateAdminClassSchema), adminAcademicController.updateClass);
  router.patch("/classes/:id/status", can("core.class.update"), validateRequest(updateAdminClassStatusSchema), adminAcademicController.updateClassStatus);
  router.delete("/classes/:id", can("core.class.delete"), validateRequest(adminAcademicIdParamSchema), adminAcademicController.deleteClass);

  return router;
};
