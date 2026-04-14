import { sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createGroupInviteController = ({ groupInviteService }) => {
  const listPending = catchAsync(async (req, res) => {
    const data = await groupInviteService.listPendingForUser(req.user);
    return sendSuccess(res, { data, message: "Pending group invites" });
  });

  const preview = catchAsync(async (req, res) => {
    const data = await groupInviteService.previewByToken(req.params.token);
    return sendSuccess(res, { data, message: "Group invite preview" });
  });

  const accept = catchAsync(async (req, res) => {
    const data = await groupInviteService.accept(req.params.token, req.user);
    return sendSuccess(res, { data, message: "Đã tham gia nhóm." });
  });

  const decline = catchAsync(async (req, res) => {
    const data = await groupInviteService.decline(req.params.token, req.user);
    return sendSuccess(res, { data, message: "Đã từ chối lời mời." });
  });

  const report = catchAsync(async (req, res) => {
    const data = await groupInviteService.report(req.params.token, req.user, req.body);
    return sendSuccess(res, { data, message: "Đã ghi nhận báo lỗi và từ chối lời mời." });
  });

  return { listPending, preview, accept, decline, report };
};
