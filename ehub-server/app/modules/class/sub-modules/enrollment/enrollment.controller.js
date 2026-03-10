import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createEnrollmentController = ({ enrollmentService }) => {
  const list = catchAsync(async (req, res) => {
    const enrollments = await enrollmentService.getByClass(req.params.classId);
    return sendSuccess(res, {
      data: enrollments,
      message: "Enrollments retrieved successfully",
    });
  });

  const enroll = catchAsync(async (req, res) => {
    const enrollment = await enrollmentService.enroll(
      req.params.classId,
      req.body.student_id,
    );
    return sendCreated(res, {
      data: enrollment,
      message: "Student enrolled successfully",
    });
  });

  const unenroll = catchAsync(async (req, res) => {
    await enrollmentService.unenroll(req.params.classId, req.params.studentId);
    return sendNoContent(res);
  });

  return { list, enroll, unenroll };
};
