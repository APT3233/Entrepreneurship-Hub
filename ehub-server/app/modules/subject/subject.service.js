import { createBaseService } from "app/core/services/baseService.js";
import { Events } from "app/core/constants/events.js";

export const createSubjectService = ({ subjectRepository, eventBus }) => {
  const base = createBaseService(subjectRepository, "Subject");

  const ALLOWED_SORT = ["subject_code", "subject_name", "credits", "status", "created_at"];

  /**
   * List subjects (exclude soft-deleted, support search)
   */
  const getList = async (query) => {
    const sortQuery = { ...query };
    if (query.sortBy && !query.sort) sortQuery.sort = `${query.sortBy}:${query.sortOrder || "asc"}`;
    return base.getList(sortQuery, {
      allowedSortColumns: ALLOWED_SORT,
      filters: {
        ...(query.status && { status: query.status }),
        ...(query.search && { search: query.search }),
      },
    });
  };

  /**
   * Create subject — check duplicate subject_code, emit event
   */
  const create = async (data) => {
    const subject = await base.create(data, "subject_code");
    eventBus.emit(Events.SUBJECT_CREATED, { subject });
    return subject;
  };

  /**
   * Update subject — emit event
   */
  const update = async (id, data) => {
    const subject = await base.update(id, data);
    eventBus.emit(Events.SUBJECT_UPDATED, { subject });
    return subject;
  };

  /**
   * Soft delete subject — emit event
   */
  const remove = async (id) => {
    const subject = await base.getById(id);
    await base.remove(id, true);
    eventBus.emit(Events.SUBJECT_DELETED, { subject });
  };

  return {
    getById: base.getById,
    getList,
    create,
    update,
    remove,
  };
};
