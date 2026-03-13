import { createBaseService } from "app/core/services/baseService.js";
import { NotFound, Forbidden } from "app/core/errors/errorFactory.js";

export const createClassService = ({ classRepository, semesterRepository }) => {
  const base = createBaseService(classRepository, "Class");

  const isLecturerOnly = (user) =>
    user?.roles?.length && !user.roles.some((r) => ["admin", "department_head"].includes(String(r).toLowerCase()));

  const getById = async (id, user = null) => {
    const cls = await classRepository.findWithDetails(id);
    if (!cls) throw NotFound("Class");
    if (isLecturerOnly(user) && Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Class does not belong to you");
    return cls;
  };

  const getList = async (query, lecturerId = null) => {
    let semesterId = null;
    if (query.semester_code) {
      const sem = await semesterRepository.findByCode(query.semester_code);
      if (!sem) throw NotFound("Semester");
      semesterId = sem.id;
    }
    const filters = {
      ...(query.status && { status: query.status }),
      ...(query.subject_id && { subject_id: query.subject_id }),
      ...(semesterId != null && { semester_id: semesterId }),
      ...(query.lecturerScope === "mine" && lecturerId && { lecturer_id: lecturerId }),
    };
    return base.getList(query, {
      allowedSortColumns: ["class_code", "class_name", "status", "max_students", "created_at"],
      filters,
    });
  };

  const create = async (data) => base.create(data);

  const update = async (id, data, user = null) => {
    const cls = await classRepository.findWithDetails(id);
    if (!cls) throw NotFound("Class");
    if (isLecturerOnly(user) && Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Class does not belong to you");
    return base.update(id, data);
  };

  const remove = async (id, user = null) => {
    const cls = await classRepository.findWithDetails(id);
    if (!cls) throw NotFound("Class");
    if (isLecturerOnly(user) && Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Class does not belong to you");
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
