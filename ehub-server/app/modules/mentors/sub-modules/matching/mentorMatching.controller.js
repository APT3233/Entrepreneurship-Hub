import { sendCreated, sendPaginated, sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createMentorMatchingController = ({ mentorMatchingService }) => {
  const listRequests = catchAsync(async (req, res) => {
    const result = await mentorMatchingService.listRequests(req.query, req.user);
    return sendPaginated(res, { ...result, message: "Mentor matching requests retrieved successfully" });
  });

  const createRequest = catchAsync(async (req, res) => {
    const data = await mentorMatchingService.createRequest(req.body, req.user);
    return sendCreated(res, { data, message: "Mentor matching request created successfully" });
  });

  const getRequest = catchAsync(async (req, res) => {
    const data = await mentorMatchingService.getRequest(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Mentor matching request retrieved successfully" });
  });

  const generateSuggestions = catchAsync(async (req, res) => {
    const data = await mentorMatchingService.generateSuggestions(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Mentor matching suggestions generated successfully" });
  });

  const listSuggestions = catchAsync(async (req, res) => {
    const data = await mentorMatchingService.listSuggestions(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Mentor matching suggestions retrieved successfully" });
  });

  const recordAction = catchAsync(async (req, res) => {
    const data = await mentorMatchingService.recordAction(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Mentor matching action recorded successfully" });
  });

  const convertToAssignment = catchAsync(async (req, res) => {
    const data = await mentorMatchingService.convertToAssignment(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Mentor matching suggestion converted successfully" });
  });

  return { listRequests, createRequest, getRequest, generateSuggestions, listSuggestions, recordAction, convertToAssignment };
};
