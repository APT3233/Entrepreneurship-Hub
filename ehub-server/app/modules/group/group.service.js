import { createBaseService } from "app/core/services/baseService.js";
import { parsePagination, parseSort } from "app/core/utils/pagination.js";
import { NotFound, BadRequest, Forbidden } from "app/core/errors/errorFactory.js";

export const createGroupService = ({ groupRepository }) => {
  const base = createBaseService(groupRepository, "Group");
  const ALLOWED_SORT = ["group_code", "group_name", "status", "max_members", "created_at"];

  const getById = async (id, user = null) => {
    const group = await groupRepository.findWithMembers(id);
    if (!group) return group;
    await verifyGroupOwnership(id, user);
    return group;
  };

  const getList = async (query, lecturerId = null) => {
    if (query.lecturerScope === "mine" && lecturerId) {
      const pagination = parsePagination(query);
      const sort = parseSort(query.sort, ALLOWED_SORT);
      const [data, total] = await Promise.all([
        groupRepository.findManyByLecturer({
          lecturerId,
          status: query.status,
          classId: query.class_id,
          pagination,
          sort,
        }),
        groupRepository.countByLecturer({ lecturerId, status: query.status, classId: query.class_id }),
      ]);
      return { data, ...pagination, total };
    }
    return base.getList(query, {
      allowedSortColumns: ALLOWED_SORT,
      filters: {
        ...(query.status && { status: query.status }),
        ...(query.class_id && { class_id: query.class_id }),
      },
    });
  };

  const create = async (data, user = null) => {
    const classId = data.class_id;
    if (!classId) throw BadRequest("class_id is required");

    const cls = await groupRepository.findClassWithSemesterStatus(classId);
    if (!cls) throw NotFound("Class");

    if (cls.semester_status !== "ongoing") {
      throw BadRequest("Chỉ được tạo nhóm khi học kỳ đang diễn ra (ongoing). Học kỳ hiện tại không ở trạng thái ongoing.");
    }

    if (user?.id) {
      const isAdminOrDept = user?.roles?.length && user.roles.some((r) => ["admin", "department_head"].includes(String(r).toLowerCase()));
      if (!isAdminOrDept && Number(cls.lecturer_id) !== Number(user.id)) {
        throw Forbidden("Bạn không có quyền tạo nhóm cho lớp này.");
      }
    }

    const existing = await groupRepository.findByCode(data.group_code, classId);
    if (existing) throw BadRequest(`Mã nhóm "${data.group_code}" đã tồn tại trong lớp này.`);

    return base.create(data);
  };

  const verifyGroupOwnership = async (groupId, user) => {
    if (!user?.roles?.length || user.roles.some((r) => ["admin", "department_head"].includes(String(r).toLowerCase()))) return;
    const group = await base.getById(groupId);
    if (!group) return;
    const rows = await groupRepository.rawQuery("SELECT lecturer_id FROM classes WHERE id = :classId AND deleted_at IS NULL LIMIT 1", { classId: group.class_id });
    const cls = rows?.[0];
    if (cls && Number(cls.lecturer_id) !== Number(user.id)) {
      const { Forbidden } = await import("app/core/errors/errorFactory.js");
      throw Forbidden("Group does not belong to your class");
    }
  };

  const update = async (id, data, user = null) => {
    await verifyGroupOwnership(id, user);
    return base.update(id, data);
  };

  const remove = async (id, user = null) => {
    await verifyGroupOwnership(id, user);
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
