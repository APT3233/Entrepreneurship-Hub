import { asFunction } from "awilix";
import { createCheckpointRepository } from "./checkpoint.repository.js";
import { createCheckpointService } from "./checkpoint.service.js";
import { createCheckpointController } from "./checkpoint.controller.js";
import { createCheckpointRouter } from "./checkpoint.route.js";

/**
 * Checkpoint Module Registration
 */
export const CheckpointModule = {
  name: "checkpoint",
  path: "/checkpoints",
  register: (container) => {
    container.register({
      checkpointRepository: asFunction(createCheckpointRepository).singleton(),
      checkpointService: asFunction(createCheckpointService).singleton(),
      checkpointController: asFunction(createCheckpointController).singleton(),
    });
  },
  router: (container) => createCheckpointRouter(container),
};
