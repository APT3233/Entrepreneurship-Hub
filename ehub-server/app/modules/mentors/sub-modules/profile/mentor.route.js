import { Router } from "express";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  confirmMentorSelfDocumentUploadSchema,
  deleteMentorSelfDocumentSchema,
  initiateMentorSelfDocumentUploadSchema,
  replaceMentorSelfAvailabilitySchema,
  replaceMentorSelfExpertiseSchema,
  listExpertiseAreasSchema,
  updateMentorSelfSchema,
} from "./mentor.validation.js";

export const createMentorRouter = (container) => {
  const { mentorController } = container.cradle;
  const router = Router();
  const can = (...permissions) => permissionGuard(container, ...permissions);

  router.use(authenticate, roleGuard("mentor"));

  router.get("/expertise-areas", can("mentor.profile.read", "mentor.expertise.manage"), validateRequest(listExpertiseAreasSchema), mentorController.listExpertiseAreas);

  router.get("/me", can("mentor.profile.read"), mentorController.getMyProfile);
  router.put("/me", can("mentor.profile.update"), validateRequest(updateMentorSelfSchema), mentorController.updateMyProfile);

  router.get("/me/expertise", can("mentor.profile.read", "mentor.expertise.manage"), mentorController.getMyExpertise);
  router.put("/me/expertise", can("mentor.expertise.manage"), validateRequest(replaceMentorSelfExpertiseSchema), mentorController.replaceMyExpertise);

  router.get("/me/availability", can("mentor.profile.read", "mentor.availability.manage"), mentorController.getMyAvailability);
  router.put("/me/availability", can("mentor.availability.manage"), validateRequest(replaceMentorSelfAvailabilitySchema), mentorController.replaceMyAvailability);

  router.get("/me/documents", can("mentor.document.manage"), mentorController.getMyDocuments);
  router.post("/me/documents/initiate-upload", can("mentor.document.manage"), validateRequest(initiateMentorSelfDocumentUploadSchema), mentorController.initiateMyDocumentUpload);
  router.post("/me/documents", can("mentor.document.manage"), validateRequest(confirmMentorSelfDocumentUploadSchema), mentorController.confirmMyDocumentUpload);
  router.delete("/me/documents/:documentId", can("mentor.document.manage"), validateRequest(deleteMentorSelfDocumentSchema), mentorController.deleteMyDocument);

  return router;
};
