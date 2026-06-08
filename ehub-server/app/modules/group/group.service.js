import crypto from "crypto";
import { createBaseService } from "app/core/services/baseService.js";
import { parsePagination, parseSort } from "app/core/utils/pagination.js";
import { NotFound, BadRequest, Forbidden, Conflict } from "app/core/errors/errorFactory.js";
import { OUTBOX_GROUP_INVITE_EMAIL_DISPATCH } from "app/core/constants/outboxEventTypes.js";
import { chunkArray } from "app/core/utils/chunk.js";
import { appConfig } from "app/config/app.js";

export const createGroupService = ({
  groupRepository,
  groupMemberRepository,
  groupInviteRepository,
  transaction,
  outboxRepository,
  inviteRepository,
  studentRepository,
  auditService,
}) => {
  const base = createBaseService(groupRepository, "Group");
  const ALLOWED_SORT = ["group_code", "group_name", "status", "max_members", "created_at"];

  const userRoles = (user) => (user?.roles || []).map((r) => String(r).toLowerCase());
  const hasRole = (user, ...roles) => userRoles(user).some((role) => roles.includes(role));
  const isAdminOrDept = (user) => hasRole(user, "admin", "department_head");
  const isLecturerOnly = (user) =>
    hasRole(user, "lecturer") && !isAdminOrDept(user);

  const assertLecturerCanReadClass = async (classId, user) => {
    if (!classId || !isLecturerOnly(user)) return;
    const cls = await groupRepository.findClassWithSemesterStatus(classId);
    if (!cls || Number(cls.lecturer_id) !== Number(user.id)) {
      throw Forbidden("Class does not belong to you");
    }
  };

  const getById = async (id, user = null) => {
    const group = await groupRepository.findWithMembers(id);
    if (!group) return group;
    await verifyGroupOwnership(id, user);
    return group;
  };

  const getList = async (query, user = null) => {
    if (isLecturerOnly(user)) {
      await assertLecturerCanReadClass(query.class_id, user);
      const pagination = parsePagination(query);
      const sort = parseSort(query.sort, ALLOWED_SORT);
      const [data, total] = await Promise.all([
        groupRepository.findManyByLecturer({
          lecturerId: user.id,
          status: query.status,
          classId: query.class_id,
          pagination,
          sort,
        }),
        groupRepository.countByLecturer({ lecturerId: user.id, status: query.status, classId: query.class_id }),
      ]);
      return { data, ...pagination, total };
    }

    if (!isAdminOrDept(user)) throw Forbidden("Group access denied");

    return base.getList(query, {
      allowedSortColumns: ALLOWED_SORT,
      filters: {
        ...(query.status && { status: query.status }),
        ...(query.class_id && { class_id: query.class_id }),
      },
    });
  };

  const isStudentOnlyUser = (user) =>
    user?.roles?.length &&
    user.roles.every((r) => String(r).toLowerCase() === "student");

  const assertEnrolledInClassConn = async (conn, classId, studentId) => {
    const [rows] = await conn.execute(
      `SELECT 1 FROM class_students WHERE class_id = ? AND student_id = ? AND status = 'enrolled' LIMIT 1`,
      [classId, studentId]
    );
    if (!rows.length) {
      throw BadRequest(`Sinh viên ${studentId} chưa ghi danh lớp này.`);
    }
  };

  const create = async (data, user = null) => {
    const {
      members = [],
      leader_student_id: leaderStudentId,
      created_by: createdBy,
      ...groupPayload
    } = data;
    const classId = groupPayload.class_id;
    if (!classId) throw BadRequest("class_id is required");

    const cls = await groupRepository.findClassWithSemesterStatus(classId);
    if (!cls) throw NotFound("Class");

    if (cls.subject_status === "inactive") {
      throw BadRequest(`Học phần "${cls.subject_name}" của lớp học này đang ở trạng thái không hoạt động (Inactive). Không thể tạo nhóm.`);
    }

    if (cls.semester_status !== "ongoing") {
      throw BadRequest("Chỉ được tạo nhóm khi học kỳ đang diễn ra (ongoing). Học kỳ hiện tại không ở trạng thái ongoing.");
    }

    const isAdminOrDept =
      user?.roles?.length &&
      user.roles.some((r) => ["admin", "department_head"].includes(String(r).toLowerCase()));

    if (user?.id) {
      if (isStudentOnlyUser(user)) {
        const stu = await studentRepository.findByUserId(user.id);
        if (!stu) throw Forbidden("Không tìm thấy hồ sơ sinh viên cho tài khoản này.");
        if (members.length === 0) {
          throw BadRequest("Sinh viên tạo nhóm cần gửi danh sách members và leader_student_id.");
        }
        if (Number(leaderStudentId) !== Number(stu.id)) {
          throw Forbidden("Sinh viên chỉ có thể tạo nhóm khi bạn là nhóm trưởng.");
        }
        const enr = await groupRepository.rawQuery(
          "SELECT 1 FROM class_students WHERE class_id = :cid AND student_id = :sid AND status = 'enrolled' LIMIT 1",
          { cid: classId, sid: stu.id }
        );
        if (!enr?.length) throw Forbidden("Bạn chưa ghi danh lớp này.");
      } else if (!isAdminOrDept && Number(cls.lecturer_id) !== Number(user.id)) {
        throw Forbidden("Bạn không có quyền tạo nhóm cho lớp này.");
      }
    }

    const existing = await groupRepository.findByCode(groupPayload.group_code, classId);
    if (existing) throw BadRequest(`Mã nhóm "${groupPayload.group_code}" đã tồn tại trong lớp này.`);

    const maxMembers = groupPayload.max_members ?? 6;
    const memberIds = members.map((m) => Number(m.student_id));

    if (members.length > 0) {
      if (!leaderStudentId) throw BadRequest("leader_student_id is required when members is non-empty");
      const leaderId = Number(leaderStudentId);
      if (!memberIds.includes(leaderId)) {
        throw BadRequest("leader_student_id must be one of members");
      }
      const unique = new Set(memberIds);
      if (unique.size !== memberIds.length) throw BadRequest("members must not contain duplicate student_id");
      if (memberIds.length > maxMembers) {
        throw BadRequest(`Số thành viên (${memberIds.length}) vượt quá max_members (${maxMembers}).`);
      }

      const leaderConflict = await groupMemberRepository.findStudentGroupInClass(leaderId, classId);
      if (leaderConflict) {
        throw Conflict(
          `Nhóm trưởng đã thuộc nhóm "${leaderConflict.group_name}" trong lớp này.`
        );
      }

      const { groupId, mailDispatchPublicId } = await transaction.run(async (conn) => {
        for (const sid of memberIds) {
          await assertEnrolledInClassConn(conn, classId, sid);
        }

        const gid = await groupRepository.insertWithConn(conn, {
          ...groupPayload,
          class_id: classId,
          created_by: createdBy ?? user?.id ?? null,
        });

        await groupMemberRepository.insertWithConn(conn, {
          group_id: gid,
          student_id: leaderId,
          role: "leader",
          status: "active",
        });

        const expiryMs = Math.max(1, appConfig.invite.expiryDays) * 24 * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + expiryMs);
        const groupInviteIds = [];

        for (const sid of memberIds) {
          if (Number(sid) === leaderId) continue;

          const [stuRows] = await conn.execute(
            "SELECT id, email, user_id FROM students WHERE id = ? AND deleted_at IS NULL FOR UPDATE",
            [sid]
          );
          const stuRow = stuRows[0];
          if (!stuRow) throw BadRequest(`Không tìm thấy sinh viên id=${sid}.`);

          const token = crypto.randomBytes(32).toString("hex");
          const giId = await groupInviteRepository.insertQueuedConn(conn, {
            group_id: gid,
            student_id: sid,
            token,
            intended_role: "member",
            expires_at: expiresAt,
            invited_by: user?.id ?? null,
          });
          groupInviteIds.push(giId);

          if (!stuRow.user_id) {
            const existingClassInv = await inviteRepository.findPendingUnusedByStudentClassConn(
              conn,
              sid,
              classId
            );
            if (!existingClassInv) {
              await inviteRepository.invalidateUnusedForPairConn(conn, sid, classId);
              const classToken = crypto.randomBytes(32).toString("hex");
              await inviteRepository.insertQueuedInviteConn(conn, {
                email: stuRow.email,
                student_id: sid,
                class_id: classId,
                token: classToken,
                expires_at: expiresAt,
              });
            }
          }
        }

        let publicId = null;
        if (groupInviteIds.length > 0) {
          const idChunks = chunkArray(groupInviteIds, appConfig.outbox.inviteChunkSize);
          let dispatchPid = null;
          for (const chunk of idChunks) {
            const { id: outboxRowId, dispatchPublicId } = await outboxRepository.insertWithConn(conn, {
              eventType: OUTBOX_GROUP_INVITE_EMAIL_DISPATCH,
              payload: {
                groupId: gid,
                groupName: groupPayload.group_name,
                classId,
                classCode: cls.class_code,
                groupInviteIds: chunk,
              },
              dispatchPublicId: dispatchPid,
            });
            if (!dispatchPid) dispatchPid = dispatchPublicId;
            await groupInviteRepository.setOutboxIdConn(conn, outboxRowId, chunk);
          }
          publicId = dispatchPid;
        }

        return { groupId: gid, mailDispatchPublicId: publicId };
      });

      const full = await groupRepository.findWithMembers(groupId);

      // Ghi log audit
      await auditService.log({
        userId: user?.id || null,
        action: "create_group",
        tableName: "groups",
        recordId: groupId,
        title: groupPayload.group_code,
        newValues: { group_code: groupPayload.group_code, class_id: classId }
      });

      return {
        ...full,
        ...(mailDispatchPublicId && { mail_dispatch_id: mailDispatchPublicId }),
      };
    }

    const result = await base.create({ ...groupPayload, class_id: classId, created_by: createdBy ?? user?.id ?? null });

    // Ghi log audit
    await auditService.log({
      userId: user?.id || null,
      action: "create_group",
      tableName: "groups",
      recordId: result.id,
      title: groupPayload.group_code,
      newValues: { group_code: groupPayload.group_code, class_id: classId }
    });

    return result;
  };

  const verifyGroupOwnership = async (groupId, user) => {
    if (!user?.roles?.length) throw Forbidden("Authentication required");
    if (isAdminOrDept(user)) return;
    if (!isLecturerOnly(user)) throw Forbidden("Group access denied");
    const group = await base.getById(groupId);
    if (!group) return;
    const rows = await groupRepository.rawQuery(
      "SELECT lecturer_id FROM classes WHERE id = :classId AND deleted_at IS NULL LIMIT 1",
      { classId: group.class_id }
    );
    const c = rows?.[0];
    if (c && Number(c.lecturer_id) !== Number(user.id)) {
      throw Forbidden("Group does not belong to your class");
    }
  };

  const update = async (id, data, user = null) => {
    await verifyGroupOwnership(id, user);
    const result = await base.update(id, data);

    const group = await groupRepository.findById(id);
    // Ghi log audit
    await auditService.log({
      userId: user?.id || null,
      action: "update_group",
      tableName: "groups",
      recordId: id,
      title: group?.group_code || group?.group_name,
      newValues: data
    });

    return result;
  };

  const remove = async (id, user = null) => {
    await verifyGroupOwnership(id, user);
    const group = await groupRepository.findById(id);
    const result = await base.remove(id, true);

    // Ghi log audit
    await auditService.log({
      userId: user?.id || null,
      action: "delete_group",
      tableName: "groups",
      recordId: id,
      title: group?.group_code || group?.group_name,
      oldValues: { group_code: group?.group_code || group?.group_name }
    });

    return result;
  };

  const getByStudent = async (studentUserId) => {
    const data = await groupRepository.findByStudent(studentUserId);
    return { data };
  };

  const getAvailableMentors = async () => {
    return groupRepository.getAvailableMentors();
  };

  return {
    getById,
    getList,
    create,
    update,
    remove,
    getByStudent,
    getAvailableMentors,
  };
};
