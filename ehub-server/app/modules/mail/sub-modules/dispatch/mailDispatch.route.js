import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { mailDispatchPublicIdSchema } from "./mailDispatch.validation.js";

export const createMailDispatchRouter = (container) => {
  const { mailDispatchController } = container.cradle;
  const router = Router();
  router.get("/:publicId", authenticate, validateRequest(mailDispatchPublicIdSchema), mailDispatchController.progress);
  router.get("/:publicId/stream", authenticate, validateRequest(mailDispatchPublicIdSchema), mailDispatchController.stream);
  return router;
};
