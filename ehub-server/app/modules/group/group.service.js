import { createBaseService } from "app/core/services/baseService.js";

export const createGroupService = ({ groupRepository }) => {
  const base = createBaseService(groupRepository, "Group");

  const getById = async (id) => {
    return base.getById(id);
  };

  const getList = async (query) => {
    return base.getList(query, {
      allowedSortColumns: [
        "group_code",
        "group_name",
        "status",
        "max_members",
        "created_at",
      ],
      filters: {
        ...(query.status && { status: query.status }),
        ...(query.class_id && { class_id: query.class_id }),
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
