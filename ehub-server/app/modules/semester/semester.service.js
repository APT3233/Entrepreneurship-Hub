import { createBaseService } from "app/core/services/baseService.js";

export const createSemesterService = ({ semesterRepository }) => {
  const base = createBaseService(semesterRepository, "Semester");

  const getList = async (query) => {
    return base.getList(query, {
      allowedSortColumns: [
        "semester_code",
        "semester_name",
        "year",
        "start_date",
        "end_date",
        "status",
        "created_at",
      ],
      filters: {
        ...(query.status && { status: query.status }),
        ...(query.year && { year: query.year }),
      },
    });
  };

  const create = async (data) => {
    return base.create(data, "semester_code");
  };

  const update = async (id, data) => {
    return base.update(id, data);
  };

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
