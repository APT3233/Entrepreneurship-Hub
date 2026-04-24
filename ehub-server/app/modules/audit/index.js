import { asFunction } from "awilix";
import { createAuditService } from "./audit.service.js";
import { createAuditRepository } from "./audit.repository.js";
import { createAuditController } from "./audit.controller.js";
import { createAuditRouter } from "./audit.route.js";

export const AuditModule = {
  name: "audit",
  path: "/audit",

  /**
   * Đăng ký tất cả services vào DI container bằng Awilix
   */
  register: (container) => {
    container.register({
      auditRepository: asFunction(createAuditRepository).singleton(),
      auditService: asFunction(createAuditService).singleton(),
      auditController: asFunction(createAuditController).singleton(),
    });
  },

  router: (container) => createAuditRouter(container),
};
