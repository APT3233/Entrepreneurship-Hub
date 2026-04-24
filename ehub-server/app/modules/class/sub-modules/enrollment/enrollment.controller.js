import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createEnrollmentController = ({ enrollmentService }) => {
  const list = catchAsync(async (req, res) => {
    const enrollments = await enrollmentService.getByClass(req.params.classId, req.user);
    return sendSuccess(res, { data: enrollments, message: "Enrollments retrieved successfully" });
  });

  const enroll = catchAsync(async (req, res) => {
    const enrollment = await enrollmentService.enroll(req.params.classId, req.body, req.user);
    return sendCreated(res, {
      data: enrollment,
      message: "Student enrolled successfully",
    });
  });

  const unenroll = catchAsync(async (req, res) => {
    await enrollmentService.unenroll(req.params.classId, req.params.studentId, req.user);
    return sendNoContent(res);
  });

  const update = catchAsync(async (req, res) => {
    const updated = await enrollmentService.updateStudentInfo(
      req.params.classId,
      req.params.studentId,
      req.body,
      req.user,
    );
    return sendSuccess(res, { data: updated, message: "Student updated successfully" });
  });

  return { list, enroll, unenroll, update };
};
