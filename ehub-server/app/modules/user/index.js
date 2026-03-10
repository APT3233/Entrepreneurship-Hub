import { asFunction } from "awilix";
import userRouter from "./user.route.js";
import { createUserRepository } from "./user.repository.js";

export const UserModule = {
  name: "user",
  path: "/users",
  /**
   * @param {object} container — awilix container
   */
  router: (container) => userRouter,

  register: (container) => {
    container.register({
      userRepository: asFunction(createUserRepository).singleton(),
    });
  },
};
