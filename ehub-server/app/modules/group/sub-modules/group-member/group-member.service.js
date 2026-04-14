import crypto from "crypto";
import {
  NotFound,
  AlreadyExists,
  BadRequest,
  Conflict,
  Forbidden,
} from "app/core/errors/errorFactory.js";
import { appConfig } from "app/config/app.js";
import { chunkArray } from "app/core/utils/chunk.js";
import { OUTBOX_GROUP_INVITE_EMAIL_DISPATCH } from "app/core/constants/outboxEventTypes.js";

export const createGroupMemberService = ({
  groupMemberRepository,
  groupRepository,
  studentRepository,
  groupInviteRepository,
  transaction,
  outboxRepository,
  inviteRepository,
}) => {
  const assertCanManageGroup = async (groupId, user) => {
    if (!user?.roles?.length) return;
    if (user.roles.some((r) => ["admin", "department_head"].includes(String(r).toLowerCase()))) return;
    const group = await groupRepository.findById(groupId);
    if (!group) throw NotFound("Group");
    const rows = await groupRepository.rawQuery(
      "SELECT lecturer_id FROM classes WHERE id = :classId AND deleted_at IS NULL LIMIT 1",
      { classId: group.class_id },
    );
    const c = rows?.[0];
    if (c && Number(c.lecturer_id) !== Number(user.id)) {
      throw Forbidden("Group does not belong to your class");
    }
  };

  /**
   * List members of a group
   */
  const getByGroup = async (groupId) => {
    const group = await groupRepository.findById(groupId);
    if (!group) throw NotFound("Group");
    return groupMemberRepository.findByGroup(groupId);
  };

  /**
   * Add a student to a group
   */
  const addMember = async (groupId, data, user = null) => {
    const { student_id, role = "member" } = data;
    if (!user?.id) throw Forbidden("Authentication required");
    if (String(role) !== "member") throw BadRequest("Chỉ được thêm mới với vai trò member.");

    const group = await groupRepository.findById(groupId);
    if (!group) throw NotFound("Group");
    const actorStudent = await studentRepository.findByUserId(user.id);
    if (!actorStudent) throw Forbidden("Chỉ nhóm trưởng mới có quyền thêm thành viên.");
    const actorMembership = await groupMemberRepository.findByGroupAndStudent(groupId, actorStudent.id);
    if (!actorMembership || actorMembership.status !== "active" || actorMembership.role !== "leader") {
      throw Forbidden("Chỉ nhóm trưởng mới có quyền thêm thành viên.");
    }

    const student = await studentRepository.findById(student_id);
    if (!student) throw NotFound("Student");

    // Check if student is already in this group
    const existing = await groupMemberRepository.findByGroupAndStudent(
      groupId,
      student_id,
    );
    if (existing) throw AlreadyExists("Group member");

    // Check if student is already in another group in the same class
    const existingInClass = await groupMemberRepository.findStudentGroupInClass(
      student_id,
      group.class_id,
    );
    if (existingInClass) {
      throw Conflict(
        `Student is already in group "${existingInClass.group_name}" (${existingInClass.group_code}) in this class`,
      );
    }

    const expiryMs = Math.max(1, appConfig.invite.expiryDays) * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiryMs);
    return transaction.run(async (conn) => {
      const [rows] = await conn.execute(
        `SELECT g.id, g.class_id, g.group_name, g.group_code, g.max_members, c.class_code
         FROM \`groups\` g
         JOIN classes c ON c.id = g.class_id AND c.deleted_at IS NULL
         WHERE g.id = ? AND g.deleted_at IS NULL
         LIMIT 1 FOR UPDATE`,
        [groupId]
      );
      const lockedGroup = rows[0];
      if (!lockedGroup) throw NotFound("Group");
      const currentCount = await groupMemberRepository.countActiveByGroup(groupId);
      const pendingCount = await groupInviteRepository.countPendingByGroupConn(conn, groupId);
      if (currentCount + pendingCount >= Number(lockedGroup.max_members)) {
        throw BadRequest(`Group is full — max ${lockedGroup.max_members} members`);
      }

      const pendingSameStudent = await groupInviteRepository.findPendingByGroupAndStudentConn(
        conn,
        groupId,
        student_id
      );
      if (pendingSameStudent) throw Conflict("Student already has a pending invite in this group.");

      const token = crypto.randomBytes(32).toString("hex");
      const inviteId = await groupInviteRepository.insertQueuedConn(conn, {
        group_id: groupId,
        student_id,
        token,
        intended_role: "member",
        expires_at: expiresAt,
        invited_by: user.id ?? null,
      });

      if (!student.user_id) {
        const existingClassInv = await inviteRepository.findPendingUnusedByStudentClassConn(
          conn,
          student_id,
          lockedGroup.class_id
        );
        if (!existingClassInv) {
          await inviteRepository.invalidateUnusedForPairConn(conn, student_id, lockedGroup.class_id);
          const classToken = crypto.randomBytes(32).toString("hex");
          await inviteRepository.insertQueuedInviteConn(conn, {
            email: student.email,
            student_id,
            class_id: lockedGroup.class_id,
            token: classToken,
            expires_at: expiresAt,
          });
        }
      }

      let dispatchPid = null;
      const chunks = chunkArray([inviteId], appConfig.outbox.inviteChunkSize);
      for (const chunk of chunks) {
        const { id: outboxRowId, dispatchPublicId } = await outboxRepository.insertWithConn(conn, {
          eventType: OUTBOX_GROUP_INVITE_EMAIL_DISPATCH,
          payload: {
            groupId,
            groupName: lockedGroup.group_name || lockedGroup.group_code,
            classId: lockedGroup.class_id,
            classCode: lockedGroup.class_code,
            groupInviteIds: chunk,
          },
          dispatchPublicId: dispatchPid,
        });
        if (!dispatchPid) dispatchPid = dispatchPublicId;
        await groupInviteRepository.setOutboxIdConn(conn, outboxRowId, chunk);
      }

      return {
        group_id: Number(groupId),
        student_id: Number(student_id),
        status: "pending_invite",
        message: "Invite queued and email dispatch scheduled.",
        ...(dispatchPid && { mail_dispatch_id: dispatchPid }),
      };
    });
  };

  /**
   * Cập nhật vai trò / trạng thái thành viên
   */
  const updateMember = async (groupId, studentId, body, user = null) => {
    await assertCanManageGroup(groupId, user);
    const { role, status } = body;
    const membership = await groupMemberRepository.findByGroupAndStudent(
      groupId,
      studentId,
    );
    if (!membership) throw NotFound("Group member");

    const updates = {};
    if (role !== undefined) updates.role = role;
    if (status !== undefined) {
      updates.status = status;
      if (status === "left" || status === "removed") updates.left_at = new Date();
      if (status === "active") updates.left_at = null;
    }
    if (!Object.keys(updates).length) {
      throw BadRequest("No fields to update");
    }

    if (updates.role === "leader") {
      await groupMemberRepository.demoteLeadersExcept(groupId, studentId);
    }
    await groupMemberRepository.updateById(membership.id, updates);
    return groupMemberRepository.findJoinedById(membership.id);
  };

  /**
   * Remove a student from a group
   */
  const removeMember = async (groupId, studentId, user = null) => {
    await assertCanManageGroup(groupId, user);
    const membership = await groupMemberRepository.findByGroupAndStudent(
      groupId,
      studentId,
    );
    if (!membership) throw NotFound("Group member");

    return groupMemberRepository.hardDelete(membership.id);
  };

  return { getByGroup, addMember, updateMember, removeMember };
};
