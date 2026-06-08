import { asFunction } from "awilix";
import { Router } from "express";
import { createIncubationController } from "./incubation.controller.js";
import { createIncubationRepository } from "./incubation.repository.js";
import { createIncubationRouter } from "./incubation.route.js";
import { createIncubationService } from "./incubation.service.js";

export const IncubationModule = {
  name: "incubation",
  path: "",
  register: (container) => {
    container.register({
      incubationRepository: asFunction(createIncubationRepository).singleton(),
      incubationService: asFunction(createIncubationService).singleton(),
      incubationController: asFunction(createIncubationController).singleton(),
    });
  },
  router: (container) => {
    const router = Router();
    router.use("/", createIncubationRouter(container));
    return router;
  },
};
