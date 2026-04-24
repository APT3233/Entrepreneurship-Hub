import { asFunction } from "awilix";
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
      fileController: asFunction(createFileController).singleton(),
    });
  },

  router: (container) => createFileRouter(container),
};
