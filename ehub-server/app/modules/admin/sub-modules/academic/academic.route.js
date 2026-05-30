import { Router } from "express";
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

  router.get("/lookups", adminAcademicController.lookups);

  router.get("/subjects", validateRequest(listAdminSubjectsSchema), adminAcademicController.listSubjects);
  router.post("/subjects", validateRequest(createAdminSubjectSchema), adminAcademicController.createSubject);
  router.get("/subjects/:id", validateRequest(getAdminAcademicByIdSchema), adminAcademicController.getSubject);
  router.put("/subjects/:id", validateRequest(updateAdminSubjectSchema), adminAcademicController.updateSubject);
  router.patch("/subjects/:id/status", validateRequest(updateAdminSubjectStatusSchema), adminAcademicController.updateSubjectStatus);
  router.delete("/subjects/:id", validateRequest(adminAcademicIdParamSchema), adminAcademicController.deleteSubject);
  router.post("/subjects/:id/restore", validateRequest(adminAcademicIdParamSchema), adminAcademicController.restoreSubject);

  router.get("/semesters", validateRequest(listAdminSemestersSchema), adminAcademicController.listSemesters);
  router.post("/semesters", validateRequest(createAdminSemesterSchema), adminAcademicController.createSemester);
  router.get("/semesters/:id", validateRequest(getAdminAcademicByIdSchema), adminAcademicController.getSemester);
  router.put("/semesters/:id", validateRequest(updateAdminSemesterSchema), adminAcademicController.updateSemester);
  router.patch("/semesters/:id/status", validateRequest(updateAdminSemesterStatusSchema), adminAcademicController.updateSemesterStatus);
  router.post("/semesters/:id/set-current", validateRequest(adminAcademicIdParamSchema), adminAcademicController.setCurrentSemester);

  router.get("/classes", validateRequest(listAdminClassesSchema), adminAcademicController.listClasses);
  router.post("/classes", validateRequest(createAdminClassSchema), adminAcademicController.createClass);
  router.get("/classes/:id", validateRequest(getAdminAcademicByIdSchema), adminAcademicController.getClass);
  router.put("/classes/:id", validateRequest(updateAdminClassSchema), adminAcademicController.updateClass);
  router.patch("/classes/:id/status", validateRequest(updateAdminClassStatusSchema), adminAcademicController.updateClassStatus);
  router.delete("/classes/:id", validateRequest(adminAcademicIdParamSchema), adminAcademicController.deleteClass);

  return router;
};
