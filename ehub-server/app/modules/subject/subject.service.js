import { createBaseService } from "app/core/services/baseService.js";

export const createSubjectService = ({ subjectRepository }) => {
  const base = createBaseService(subjectRepository, "Subject");

  /**
   * List subjects (chỉ lấy chưa xoá)
   */
  const getList = async (query) => {
    return base.getList(query, {
      allowedSortColumns: [
        "subject_code",
        "subject_name",
        "credits",
        "status",
        "created_at",
      ],
      filters: { ...(query.status && { status: query.status }) },
    });
  };

  /**
   * Create subject — kiểm tra trùng subject_code
   */
  const create = async (data) => {
    return base.create(data, "subject_code");
  };

  /**
   * Update subject
   */
  const update = async (id, data) => {
    return base.update(id, data);
  };

  /**
   * Soft delete subject
   */
  const remove = async (id) => {
    return base.remove(id, true);
  };

  return {
    getById: base.getById,
    getList,
    create,
    update,
    remove,
  };
};
