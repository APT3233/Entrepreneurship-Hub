import { Router } from "express";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  confirmMentorDocumentUploadSchema,
  createExpertiseAreaSchema,
  createMentorSchema,
  deleteMentorDocumentSchema,
  expertiseAreaIdParamSchema,
  initiateMentorDocumentUploadSchema,
  listExpertiseAreasSchema,
  listMentorDocumentsSchema,
  listMentorsSchema,
  mentorIdParamSchema,
  replaceMentorAvailabilitySchema,
  replaceMentorExpertiseSchema,
  updateExpertiseAreaSchema,
  updateMentorSchema,
  updateMentorStatusSchema,
} from "./mentor.validation.js";

export const createMentorAdminRouter = (container) => {
  const { mentorController } = container.cradle;
  const router = Router();
  const can = (...permissions) => permissionGuard(container, ...permissions);

  router.get("/mentor-documents", can("mentor.document.manage", "mentor.admin_read"), validateRequest(listMentorDocumentsSchema), mentorController.listAllDocuments);

  router.get("/mentor-expertise", can("mentor.expertise.manage", "mentor.profile.read", "mentor.admin_read"), validateRequest(listExpertiseAreasSchema), mentorController.listExpertiseAreas);
  router.post("/mentor-expertise", can("mentor.expertise.manage"), validateRequest(createExpertiseAreaSchema), mentorController.createExpertiseArea);
  router.put("/mentor-expertise/:id", can("mentor.expertise.manage"), validateRequest(updateExpertiseAreaSchema), mentorController.updateExpertiseArea);
  router.delete("/mentor-expertise/:id", can("mentor.expertise.manage"), validateRequest(expertiseAreaIdParamSchema), mentorController.deleteExpertiseArea);

  router.get("/mentors", can("mentor.profile.read", "mentor.admin_read"), validateRequest(listMentorsSchema), mentorController.listMentors);
  router.post("/mentors", can("mentor.profile.create"), validateRequest(createMentorSchema), mentorController.createMentor);
  router.get("/mentors/:id", can("mentor.profile.read", "mentor.admin_read"), validateRequest(mentorIdParamSchema), mentorController.getMentor);
  router.put("/mentors/:id", can("mentor.profile.update"), validateRequest(updateMentorSchema), mentorController.updateMentor);
  router.patch("/mentors/:id/status", can("mentor.profile.review"), validateRequest(updateMentorStatusSchema), mentorController.updateMentorStatus);
  router.delete("/mentors/:id", can("mentor.profile.delete"), validateRequest(mentorIdParamSchema), mentorController.deleteMentor);

  router.get("/mentors/:id/expertise", can("mentor.profile.read", "mentor.expertise.manage", "mentor.admin_read"), validateRequest(mentorIdParamSchema), mentorController.getMentorExpertise);
  router.put("/mentors/:id/expertise", can("mentor.expertise.manage"), validateRequest(replaceMentorExpertiseSchema), mentorController.replaceMentorExpertise);

  router.get("/mentors/:id/availability", can("mentor.profile.read", "mentor.availability.manage", "mentor.admin_read"), validateRequest(mentorIdParamSchema), mentorController.getMentorAvailability);
  router.put("/mentors/:id/availability", can("mentor.availability.manage"), validateRequest(replaceMentorAvailabilitySchema), mentorController.replaceMentorAvailability);

  router.get("/mentors/:id/documents", can("mentor.document.manage", "mentor.admin_read"), validateRequest(mentorIdParamSchema), mentorController.listMentorDocuments);
  router.post("/mentors/:id/documents/initiate-upload", can("mentor.document.manage"), validateRequest(initiateMentorDocumentUploadSchema), mentorController.initiateMentorDocumentUpload);
  router.post("/mentors/:id/documents", can("mentor.document.manage"), validateRequest(confirmMentorDocumentUploadSchema), mentorController.confirmMentorDocumentUpload);
  router.delete("/mentors/:id/documents/:documentId", can("mentor.document.manage"), validateRequest(deleteMentorDocumentSchema), mentorController.deleteMentorDocument);

  return router;
};
