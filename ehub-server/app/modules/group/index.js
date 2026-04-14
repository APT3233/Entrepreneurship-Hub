import { asFunction } from "awilix";
import { createGroupRepository } from "./group.repository.js";
import { createGroupService } from "./group.service.js";
import { createGroupController } from "./group.controller.js";
import { createGroupRouter } from "./group.route.js";
import { createGroupMemberRepository } from "./sub-modules/group-member/group-member.repository.js";
import { createGroupMemberService } from "./sub-modules/group-member/group-member.service.js";
import { createGroupMemberController } from "./sub-modules/group-member/group-member.controller.js";
import { createGroupInviteRepository } from "./sub-modules/group-invite/groupInvite.repository.js";
import { createGroupInviteService } from "./sub-modules/group-invite/groupInvite.service.js";
import { createGroupInviteController } from "./sub-modules/group-invite/groupInvite.controller.js";

export const GroupModule = {
  name: "group",
  path: "/groups",

  register: (container) => {
    container.register({
      // Group
      groupRepository: asFunction(createGroupRepository).singleton(),
      groupService: asFunction(createGroupService).singleton(),
      groupController: asFunction(createGroupController).singleton(),
      // Group Member sub-module
      groupMemberRepository: asFunction(
        createGroupMemberRepository,
      ).singleton(),
      groupMemberService: asFunction(createGroupMemberService).singleton(),
      groupMemberController: asFunction(
        createGroupMemberController,
      ).singleton(),
      groupInviteRepository: asFunction(createGroupInviteRepository).singleton(),
      groupInviteService: asFunction(createGroupInviteService).singleton(),
      groupInviteController: asFunction(createGroupInviteController).singleton(),
    });
  },

  router: (container) => createGroupRouter(container),
};
