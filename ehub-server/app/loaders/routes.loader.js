import { appConfig } from "app/config/app.js";
import { logger } from "app/core/logger/index.js";
import { AuthModule } from "app/modules/auth/index.js";
import { UserModule } from "app/modules/user/index.js";
import { SubjectModule } from "app/modules/subject/index.js";
import { SemesterModule } from "app/modules/semester/index.js";
import { ClassModule } from "app/modules/class/index.js";
import { StudentModule } from "app/modules/student/index.js";
import { GroupModule } from "app/modules/group/index.js";
import { AssignmentModule } from "app/modules/assignment/index.js";

const MODULES = [
  AuthModule,
  UserModule,
  SubjectModule,
  SemesterModule,
  ClassModule,
  StudentModule,
  GroupModule,
  AssignmentModule,
];

export const loadRoutes = (app, container) => {
  const prefix = appConfig.apiPrefix; // '/api/v1'

  for (const mod of MODULES) {
    if (mod.register) mod.register(container);
  }

  for (const mod of MODULES) {
    const router = mod.router(container);
    app.use(`${prefix}${mod.path}`, router);
    logger.info(
      `[Bootstrap] Route mounted: [${mod.name.toUpperCase()}] ${prefix}${mod.path}`,
    );
  }

  return app;
};
