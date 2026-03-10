import { createBaseService } from "app/core/services/baseService.js";

export const createStudentService = ({ studentRepository }) => {
  const base = createBaseService(studentRepository, "Student");

  const getList = async (query) => {
    return base.getList(query, {
      allowedSortColumns: [
        "student_code",
        "full_name",
        "email",
        "major",
        "campus",
        "status",
        "created_at",
      ],
      filters: {
        ...(query.status && { status: query.status }),
        ...(query.major && { major: query.major }),
        ...(query.campus && { campus: query.campus }),
      },
    });
  };

  const create = async (data) => {
    return base.create(data, "student_code");
  };

  const update = async (id, data) => {
    return base.update(id, data);
  };

  const remove = async (id) => {
    return base.remove(id, true);
  };

  const search = async (keyword) => {
    return studentRepository.search(keyword);
  };

  return {
    getById: base.getById,
    getList,
    create,
    update,
    remove,
    search,
  };
};
