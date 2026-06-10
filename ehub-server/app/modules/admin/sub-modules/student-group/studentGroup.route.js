import { Router } from "express";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  adminStudentGroupIdParamSchema,
  adminGroupMemberParamSchema,
  bulkCreateAdminEnrollmentSchema,
  bulkDeleteAdminStudentsSchema,
  createAdminEnrollmentSchema,
  createAdminGroupMemberSchema,
  createAdminGroupSchema,
  deleteAdminGroupSchema,
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
  const can = (...permissions) => permissionGuard(container, ...permissions);

  router.get("/student-group/lookups", can("core.student.read", "core.group.read", "core.class.read"), adminStudentGroupController.lookups);

  router.get("/students", can("core.student.read"), validateRequest(listAdminStudentsSchema), adminStudentGroupController.listStudents);
  router.post("/students", can("core.student.create"), validateRequest(createAdminStudentSchema), adminStudentGroupController.createStudent);
  router.post("/students/bulk-delete", can("core.student.delete"), validateRequest(bulkDeleteAdminStudentsSchema), adminStudentGroupController.bulkDeleteStudents);
  router.get("/students/:id", can("core.student.read"), validateRequest(adminStudentGroupIdParamSchema), adminStudentGroupController.getStudent);
  router.put("/students/:id", can("core.student.update"), validateRequest(updateAdminStudentSchema), adminStudentGroupController.updateStudent);
  router.delete("/students/:id", can("core.student.delete"), validateRequest(adminStudentGroupIdParamSchema), adminStudentGroupController.deleteStudent);

  router.get("/enrollments", can("core.student.read", "core.class.read"), validateRequest(listAdminEnrollmentsSchema), adminStudentGroupController.listEnrollments);
  router.post("/enrollments", can("core.student.update", "core.class.update"), validateRequest(createAdminEnrollmentSchema), adminStudentGroupController.addEnrollment);
  router.post("/enrollments/bulk", can("core.student.update", "core.class.update"), validateRequest(bulkCreateAdminEnrollmentSchema), adminStudentGroupController.bulkAddEnrollments);
  router.patch("/enrollments/:id/status", can("core.student.update", "core.class.update"), validateRequest(updateAdminEnrollmentStatusSchema), adminStudentGroupController.updateEnrollmentStatus);
  router.post("/enrollments/:id/send-invite", can("core.student.update", "core.class.update"), validateRequest(sendAdminEnrollmentInviteSchema), adminStudentGroupController.sendEnrollmentInvite);
  router.get("/classes/:classId/students-without-group", can("core.student.read", "core.group.read"), validateRequest(listStudentsWithoutGroupSchema), adminStudentGroupController.listStudentsWithoutGroup);

  router.get("/groups", can("core.group.read"), validateRequest(listAdminGroupsSchema), adminStudentGroupController.listGroups);
  router.post("/groups", can("core.group.create"), validateRequest(createAdminGroupSchema), adminStudentGroupController.createGroup);
  router.get("/groups/:id", can("core.group.read"), validateRequest(adminStudentGroupIdParamSchema), adminStudentGroupController.getGroup);
  router.put("/groups/:id", can("core.group.update"), validateRequest(updateAdminGroupSchema), adminStudentGroupController.updateGroup);
  router.delete("/groups/:id", can("core.group.delete"), validateRequest(deleteAdminGroupSchema), adminStudentGroupController.deleteGroup);
  router.post("/groups/:id/members", can("core.group.update"), validateRequest(createAdminGroupMemberSchema), adminStudentGroupController.addGroupMember);
  router.patch("/groups/:id/members/:studentId", can("core.group.update"), validateRequest(updateAdminGroupMemberSchema), adminStudentGroupController.updateGroupMember);
  router.delete("/groups/:id/members/:studentId", can("core.group.update"), validateRequest(adminGroupMemberParamSchema), adminStudentGroupController.removeGroupMember);

  router.get("/group-invites", can("core.group.read"), validateRequest(listAdminGroupInvitesSchema), adminStudentGroupController.listGroupInvites);
  router.patch("/group-invites/:id/status", can("core.group.update"), validateRequest(updateAdminGroupInviteStatusSchema), adminStudentGroupController.updateGroupInviteStatus);
  router.post("/group-invites/:id/resend", can("core.group.update"), validateRequest(adminStudentGroupIdParamSchema), (req, res, next) => {
    req.body = { ...(req.body || {}), status: "pending" };
    return adminStudentGroupController.updateGroupInviteStatus(req, res, next);
  });
  router.post("/group-invites/:id/revoke", can("core.group.update"), validateRequest(adminStudentGroupIdParamSchema), (req, res, next) => {
    req.body = { ...(req.body || {}), status: "revoked" };
    return adminStudentGroupController.updateGroupInviteStatus(req, res, next);
  });
  router.post("/group-invites/:id/expire", can("core.group.update"), validateRequest(adminStudentGroupIdParamSchema), (req, res, next) => {
    req.body = { ...(req.body || {}), status: "expired" };
    return adminStudentGroupController.updateGroupInviteStatus(req, res, next);
  });

  router.get("/group-reports", can("core.group.read"), validateRequest(listAdminGroupReportsSchema), adminStudentGroupController.listGroupReports);
  router.get("/group-reports/:id", can("core.group.read"), validateRequest(adminStudentGroupIdParamSchema), adminStudentGroupController.getGroupReport);

  return router;
};
