import { appConfig } from "app/config/app.js";
import { logger } from "app/core/logger/index.js";
import { AuditModule } from "app/modules/audit/index.js";
import { AuthModule } from "app/modules/auth/index.js";
import { UserModule } from "app/modules/user/index.js";
import { SubjectModule } from "app/modules/subject/index.js";
import { SemesterModule } from "app/modules/semester/index.js";
import { ClassModule } from "app/modules/class/index.js";
import { StudentModule } from "app/modules/student/index.js";
import { GroupModule } from "app/modules/group/index.js";
import { AssignmentModule } from "app/modules/assignment/index.js";
import { MailModule } from "app/modules/mail/index.js";
import { CheckpointModule } from "app/modules/checkpoint/index.js";
import { FileModule } from "app/modules/file/index.js";

const MODULES = [
  AuditModule,
  AuthModule,
  UserModule,
  SubjectModule,
  SemesterModule,
  MailModule,
  ClassModule,
  StudentModule,
  GroupModule,
  AssignmentModule,
  CheckpointModule,
  FileModule,
];

/** Đăng ký DI của toàn bộ module (repositories, services). Dùng chung API + worker fork (mailOutbox.entry). */
export const registerAppModules = (container) => {
  for (const mod of MODULES) {
    if (mod.register) mod.register(container);
  }
};

export const loadRoutes = (app, container) => {
  const prefix = appConfig.apiPrefix; // '/api/v1'

  registerAppModules(container);

  for (const mod of MODULES) {
    const router = mod.router(container);
    app.use(`${prefix}${mod.path}`, router);
    // logger.info(
    //   `[Bootstrap] Route mounted: [${mod.name.toUpperCase()}] ${prefix}${mod.path}`,
    // );
  }

  return app;
};
