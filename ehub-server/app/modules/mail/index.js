import { asFunction } from "awilix";
import { createOutboxRepository } from "./core/outbox.repository.js";
import { createInboxRepository } from "./core/inbox.repository.js";
import { createMailDispatchService } from "./sub-modules/dispatch/mailDispatch.service.js";
import { createMailDispatchController } from "./sub-modules/dispatch/mailDispatch.controller.js";
import { createMailDispatchRouter } from "./sub-modules/dispatch/mailDispatch.route.js";

export const MailModule = {
  name: "mail",
  path: "/mail-dispatch",

  register: (container) => {
    container.register({
      outboxRepository: asFunction(createOutboxRepository).singleton(),
      inboxRepository: asFunction(createInboxRepository).singleton(),
      mailDispatchService: asFunction(createMailDispatchService).singleton(),
      mailDispatchController: asFunction(createMailDispatchController).singleton(),
    });
  },

  router: (container) => createMailDispatchRouter(container),
};
