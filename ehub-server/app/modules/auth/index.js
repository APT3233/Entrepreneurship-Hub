import { asFunction } from "awilix";
import { createAuthService } from "./auth.service.js";
import { createAuthController } from "./auth.controller.js";
import { createAuthRouter } from "./auth.route.js";
import { createTokenService } from "app/core/services/tokenService.js";
import { createAccessLogRepository } from "./accessLog.repository.js";

export const AuthModule = {
  name: "auth",
  path: "/auth",

  /**
   * Đăng ký tất cả services vào DI container bằng Awilix
   */
  register: (container) => {
    container.register({
      accessLogRepository: asFunction(createAccessLogRepository).singleton(),
      tokenService: asFunction(createTokenService).singleton(),
      authService: asFunction(createAuthService).singleton(),
      authController: asFunction(createAuthController).singleton(),
    });
  },

  router: (container) => createAuthRouter(container),
};
