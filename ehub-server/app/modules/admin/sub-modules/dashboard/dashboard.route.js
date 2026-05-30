import { Router } from "express";

export const createAdminDashboardRouter = (container) => {
  const { adminDashboardController } = container.cradle;
  const router = Router();

  router.get("/dashboard", adminDashboardController.dashboard);

  return router;
};
