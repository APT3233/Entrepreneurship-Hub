import { createBaseService } from "app/core/services/baseService.js";
import { parsePagination, parseSort } from "app/core/utils/pagination.js";
import { BadRequest, Forbidden, NotFound } from "app/core/errors/errorFactory.js";
import { Events } from "app/core/constants/events.js";

export const createAssignmentService = ({ assignmentRepository, transaction, eventBus }) => {
  const base = createBaseService(assignmentRepository, "Assignment");
  const ALLOWED_SORT = ["title", "deadline", "max_score", "status", "created_at"];

  const toCardDto = (row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    deadline: row.deadline,
    maxScore: Number(row.max_score),
    status: row.status,
    classId: row.class_id,
    classCode: row.class_code,
    submittedGroups: Number(row.submitted_groups || 0),
    totalGroups: Number(row.total_groups || 0),
  });

  const checkOwnership = async (assignmentId, user) => {
    const row = await assignmentRepository.findByIdWithClass(assignmentId);
    if (!row) throw NotFound("Assignment");
    if (!user?.roles?.length) return row;
    const isAdminOrDept = user.roles.some((r) => ["admin", "department_head"].includes(String(r).toLowerCase()));
    if (!isAdminOrDept && Number(row.lecturer_id) !== Number(user.id)) throw Forbidden("Assignment does not belong to your class");
    return row;
  };

  const createBulk = async (data, user) => {
    const classIds = [...new Set((data.class_ids || []).map((id) => Number(id)).filter(Boolean))];
    if (!classIds.length) throw BadRequest("class_ids is required");
    if (!user?.id) throw Forbidden("User not authorized");
    const classes = await assignmentRepository.findClassesByIdsAndLecturer(classIds, user.id);
    if (classes.length !== classIds.length) throw BadRequest("Một hoặc nhiều lớp không tồn tại hoặc không thuộc quyền giảng viên");
    const payloads = classIds.map((classId) => ({
      class_id: classId,
      title: data.title,
      description: data.description || null,
      deadline: data.deadline,
      max_score: Number(data.max_score),
      status: data.status || "open",
      created_by: user.id,
    }));
    const insertedIds = await transaction.run(async (conn) => assignmentRepository.insertMany(payloads, conn));
    const createdRows = await Promise.all(insertedIds.map((id) => assignmentRepository.findDetailById(id)));
    eventBus.emit(Events.ASSIGNMENT_CREATED, { assignmentIds: insertedIds, classIds, createdBy: user.id });
    return createdRows.map(toCardDto);
  };

  const getList = async (query, user) => {
    const pagination = parsePagination(query);
    const sort = parseSort(query.sort, ALLOWED_SORT);
    const filters = {
      ...(query.class_id && { class_id: Number(query.class_id) }),
      ...(query.status && { status: query.status }),
      ...(query.semester_id && { semester_id: Number(query.semester_id) }),
      ...(query.year && { year: Number(query.year) }),
    };
    if (query.lecturerScope === "mine") {
      if (!user?.id) throw Forbidden("User not authorized");
      filters.lecturer_id = user.id;
    }
    const [data, total] = await Promise.all([
      assignmentRepository.findManyWithStats({ filters, pagination, sort }),
      assignmentRepository.countManyWithStats(filters),
    ]);
    return { data: data.map(toCardDto), ...pagination, total };
  };

  const getById = async (id, user) => {
    await checkOwnership(id, user);
    const row = await assignmentRepository.findDetailById(id);
    if (!row) throw NotFound("Assignment");
    return toCardDto(row);
  };

  const update = async (id, data, user) => {
    await checkOwnership(id, user);
    await base.update(id, data);
    eventBus.emit(Events.ASSIGNMENT_UPDATED, { assignmentId: Number(id), updatedBy: user?.id || null });
    return getById(id, user);
  };

  const updateStatus = async (id, status, user) => {
    await checkOwnership(id, user);
    await base.update(id, { status });
    eventBus.emit(Events.ASSIGNMENT_UPDATED, { assignmentId: Number(id), status, updatedBy: user?.id || null });
    return getById(id, user);
  };

  const remove = async (id, user) => {
    await checkOwnership(id, user);
    await base.remove(id, true);
    eventBus.emit(Events.ASSIGNMENT_DELETED, { assignmentId: Number(id), deletedBy: user?.id || null });
  };

  return {
    createBulk,
    getList,
    getById,
    update,
    updateStatus,
    remove,
  };
};
