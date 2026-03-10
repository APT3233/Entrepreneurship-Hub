import { createBaseService } from "app/core/services/baseService.js";
import { NotFound } from "app/core/errors/errorFactory.js";

export const createClassService = ({ classRepository }) => {
  const base = createBaseService(classRepository, "Class");

  const getById = async (id) => {
    const cls = await classRepository.findWithDetails(id);
    if (!cls) throw NotFound("Class");
    return cls;
  };

  const getList = async (query) => {
    return base.getList(query, {
      allowedSortColumns: [
        "class_code",
        "class_name",
        "status",
        "max_students",
        "created_at",
      ],
      filters: {
        ...(query.status && { status: query.status }),
        ...(query.subject_id && { subject_id: query.subject_id }),
        ...(query.semester_id && { semester_id: query.semester_id }),
      },
    });
  };

  const create = async (data) => {
    return base.create(data);
  };

  const update = async (id, data) => {
    return base.update(id, data);
  };

  const remove = async (id) => {
    return base.remove(id, true);
  };

  return {
    getById,
    getList,
    create,
    update,
    remove,
  };
};
