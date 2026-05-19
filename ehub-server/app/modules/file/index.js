import { asFunction } from "awilix";
import { createFileRepository } from "./file.repository.js";
import { createFileService } from "./file.service.js";
import { createFileController } from "./file.controller.js";
import { createFileRouter } from "./file.route.js";

/**
 * File Module
 * Handles file-related operations like secure proxy downloads
 */
export const FileModule = {
  name: "file",
  path: "/files",

  register: (container) => {
    container.register({
      fileRepository: asFunction(createFileRepository).singleton(),
      fileService: asFunction(createFileService).singleton(),
      fileController: asFunction(createFileController).singleton(),
    });
  },

  router: (container) => createFileRouter(container),
};
