import { MentorProfileNotActive } from "app/core/errors/errorFactory.js";

/**
 * Mentor Status Guard — chỉ mentor có hồ sơ `active` mới dùng được nghiệp vụ mentor.
 *
 * Dùng SAU authenticate + roleGuard("mentor"):
 *   router.get('/assignments', authenticate, roleGuard('mentor'), mentorStatusGuard(container), controller.list)
 *
 * Các route hồ sơ/tài liệu KHÔNG gắn guard này — mentor `pending` vẫn cần bổ sung hồ sơ để được duyệt.
 * Gắn `req.mentorProfile` để handler phía sau dùng lại, khỏi query lần nữa.
 */
export const mentorStatusGuard = (container) => async (req, _res, next) => {
  try {
    const mentor = await container.cradle.mentorRepository.findMentorByUserId(req.user.id);
    if (!mentor || mentor.status !== "active") return next(MentorProfileNotActive());
    req.mentorProfile = mentor;
    return next();
  } catch (err) {
    return next(err);
  }
};
