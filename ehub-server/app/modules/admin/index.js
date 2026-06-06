import { asFunction } from "awilix";
import { createAdminAccessControlRepository } from "./core/accessControl.repository.js";
import { createAdminAcademicRepository } from "./core/academic.repository.js";
import { createAdminDashboardRepository } from "./core/dashboard.repository.js";
import { createAdminStudentGroupRepository } from "./core/studentGroup.repository.js";
import { createAdminProjectSubmissionRepository } from "./core/projectSubmission.repository.js";
import { createAdminEvaluationOpsRepository } from "./core/evaluationOps.repository.js";
import { createAdminLecturerRepository } from "./core/lecturer.repository.js";
import { createAdminRouter } from "./admin.route.js";
import { createAdminAccessControlService } from "./sub-modules/access-control/accessControl.service.js";
import { createAdminAccessControlController } from "./sub-modules/access-control/accessControl.controller.js";
import { createAdminAcademicService } from "./sub-modules/academic/academic.service.js";
import { createAdminAcademicController } from "./sub-modules/academic/academic.controller.js";
import { createAdminDashboardService } from "./sub-modules/dashboard/dashboard.service.js";
import { createAdminDashboardController } from "./sub-modules/dashboard/dashboard.controller.js";
import { createAdminStudentGroupService } from "./sub-modules/student-group/studentGroup.service.js";
import { createAdminStudentGroupController } from "./sub-modules/student-group/studentGroup.controller.js";
import { createAdminProjectSubmissionService } from "./sub-modules/project-submission/projectSubmission.service.js";
import { createAdminProjectSubmissionController } from "./sub-modules/project-submission/projectSubmission.controller.js";
import { createAdminEvaluationOpsService } from "./sub-modules/evaluation-ops/evaluationOps.service.js";
import { createAdminEvaluationOpsController } from "./sub-modules/evaluation-ops/evaluationOps.controller.js";
import { createAdminLecturerService } from "./sub-modules/lecturer/lecturer.service.js";
import { createAdminLecturerController } from "./sub-modules/lecturer/lecturer.controller.js";

export const AdminModule = {
  name: "admin",
  path: "/admin",
  register: (container) => {
    container.register({
      adminAccessControlRepository: asFunction(createAdminAccessControlRepository).singleton(),
      adminAccessControlService: asFunction(createAdminAccessControlService).singleton(),
      adminAccessControlController: asFunction(createAdminAccessControlController).singleton(),
      adminAcademicRepository: asFunction(createAdminAcademicRepository).singleton(),
      adminAcademicService: asFunction(createAdminAcademicService).singleton(),
      adminAcademicController: asFunction(createAdminAcademicController).singleton(),
      adminDashboardRepository: asFunction(createAdminDashboardRepository).singleton(),
      adminDashboardService: asFunction(createAdminDashboardService).singleton(),
      adminDashboardController: asFunction(createAdminDashboardController).singleton(),
      adminStudentGroupRepository: asFunction(createAdminStudentGroupRepository).singleton(),
      adminStudentGroupService: asFunction(createAdminStudentGroupService).singleton(),
      adminStudentGroupController: asFunction(createAdminStudentGroupController).singleton(),
      adminProjectSubmissionRepository: asFunction(createAdminProjectSubmissionRepository).singleton(),
      adminProjectSubmissionService: asFunction(createAdminProjectSubmissionService).singleton(),
      adminProjectSubmissionController: asFunction(createAdminProjectSubmissionController).singleton(),
      adminEvaluationOpsRepository: asFunction(createAdminEvaluationOpsRepository).singleton(),
      adminEvaluationOpsService: asFunction(createAdminEvaluationOpsService).singleton(),
      adminEvaluationOpsController: asFunction(createAdminEvaluationOpsController).singleton(),
      adminLecturerRepository: asFunction(createAdminLecturerRepository).singleton(),
      adminLecturerService: asFunction(createAdminLecturerService).singleton(),
      adminLecturerController: asFunction(createAdminLecturerController).singleton(),
    });
  },
  router: (container) => createAdminRouter(container),
};
