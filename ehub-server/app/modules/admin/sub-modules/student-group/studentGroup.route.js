import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  adminStudentGroupIdParamSchema,
  adminGroupMemberParamSchema,
  bulkCreateAdminEnrollmentSchema,
  createAdminEnrollmentSchema,
  createAdminGroupMemberSchema,
  createAdminGroupSchema,
  createAdminStudentSchema,
  listAdminEnrollmentsSchema,
  listAdminGroupInvitesSchema,
  listAdminGroupReportsSchema,
  listAdminGroupsSchema,
  listAdminStudentsSchema,
  listStudentsWithoutGroupSchema,
  updateAdminEnrollmentStatusSchema,
  sendAdminEnrollmentInviteSchema,
  updateAdminGroupInviteStatusSchema,
  updateAdminGroupMemberSchema,
  updateAdminGroupSchema,
  updateAdminStudentSchema,
} from "./studentGroup.validation.js";

export const createAdminStudentGroupRouter = (container) => {
  const { adminStudentGroupController } = container.cradle;
  const router = Router();

  router.get("/student-group/lookups", adminStudentGroupController.lookups);

  router.get("/students", validateRequest(listAdminStudentsSchema), adminStudentGroupController.listStudents);
  router.post("/students", validateRequest(createAdminStudentSchema), adminStudentGroupController.createStudent);
  router.get("/students/:id", validateRequest(adminStudentGroupIdParamSchema), adminStudentGroupController.getStudent);
  router.put("/students/:id", validateRequest(updateAdminStudentSchema), adminStudentGroupController.updateStudent);
  router.delete("/students/:id", validateRequest(adminStudentGroupIdParamSchema), adminStudentGroupController.deleteStudent);

  router.get("/enrollments", validateRequest(listAdminEnrollmentsSchema), adminStudentGroupController.listEnrollments);
  router.post("/enrollments", validateRequest(createAdminEnrollmentSchema), adminStudentGroupController.addEnrollment);
  router.post("/enrollments/bulk", validateRequest(bulkCreateAdminEnrollmentSchema), adminStudentGroupController.bulkAddEnrollments);
  router.patch("/enrollments/:id/status", validateRequest(updateAdminEnrollmentStatusSchema), adminStudentGroupController.updateEnrollmentStatus);
  router.post("/enrollments/:id/send-invite", validateRequest(sendAdminEnrollmentInviteSchema), adminStudentGroupController.sendEnrollmentInvite);
  router.get("/classes/:classId/students-without-group", validateRequest(listStudentsWithoutGroupSchema), adminStudentGroupController.listStudentsWithoutGroup);

  router.get("/groups", validateRequest(listAdminGroupsSchema), adminStudentGroupController.listGroups);
  router.post("/groups", validateRequest(createAdminGroupSchema), adminStudentGroupController.createGroup);
  router.get("/groups/:id", validateRequest(adminStudentGroupIdParamSchema), adminStudentGroupController.getGroup);
  router.put("/groups/:id", validateRequest(updateAdminGroupSchema), adminStudentGroupController.updateGroup);
  router.delete("/groups/:id", validateRequest(adminStudentGroupIdParamSchema), adminStudentGroupController.deleteGroup);
  router.post("/groups/:id/members", validateRequest(createAdminGroupMemberSchema), adminStudentGroupController.addGroupMember);
  router.patch("/groups/:id/members/:studentId", validateRequest(updateAdminGroupMemberSchema), adminStudentGroupController.updateGroupMember);
  router.delete("/groups/:id/members/:studentId", validateRequest(adminGroupMemberParamSchema), adminStudentGroupController.removeGroupMember);

  router.get("/group-invites", validateRequest(listAdminGroupInvitesSchema), adminStudentGroupController.listGroupInvites);
  router.patch("/group-invites/:id/status", validateRequest(updateAdminGroupInviteStatusSchema), adminStudentGroupController.updateGroupInviteStatus);
  router.post("/group-invites/:id/resend", validateRequest(adminStudentGroupIdParamSchema), (req, res, next) => {
    req.body.status = "pending";
    return adminStudentGroupController.updateGroupInviteStatus(req, res, next);
  });
  router.post("/group-invites/:id/revoke", validateRequest(adminStudentGroupIdParamSchema), (req, res, next) => {
    req.body.status = "revoked";
    return adminStudentGroupController.updateGroupInviteStatus(req, res, next);
  });
  router.post("/group-invites/:id/expire", validateRequest(adminStudentGroupIdParamSchema), (req, res, next) => {
    req.body.status = "expired";
    return adminStudentGroupController.updateGroupInviteStatus(req, res, next);
  });

  router.get("/group-reports", validateRequest(listAdminGroupReportsSchema), adminStudentGroupController.listGroupReports);
  router.get("/group-reports/:id", validateRequest(adminStudentGroupIdParamSchema), adminStudentGroupController.getGroupReport);

  return router;
};
