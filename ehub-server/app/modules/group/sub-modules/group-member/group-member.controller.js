import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createGroupMemberController = ({ groupMemberService }) => {
  const list = catchAsync(async (req, res) => {
    const members = await groupMemberService.getByGroup(req.params.groupId);
    return sendSuccess(res, {
      data: members,
      message: "Group members retrieved successfully",
    });
  });

  const add = catchAsync(async (req, res) => {
    const member = await groupMemberService.addMember(
      req.params.groupId,
      req.body,
      req.user,
    );
    return sendCreated(res, {
      data: member,
      message: "Member added to group successfully",
    });
  });

  const update = catchAsync(async (req, res) => {
    const member = await groupMemberService.updateMember(
      req.params.groupId,
      req.params.studentId,
      req.body,
      req.user,
    );
    return sendSuccess(res, {
      data: member,
      message: "Group member updated successfully",
    });
  });

  const remove = catchAsync(async (req, res) => {
    await groupMemberService.removeMember(
      req.params.groupId,
      req.params.studentId,
      req.user,
    );
    return sendNoContent(res);
  });

  return { list, add, update, remove };
};
