import { NotFound, BadRequest, Forbidden, Conflict } from "app/core/errors/errorFactory.js";
import { withLogging } from "app/core/services/baseService.js";

export const createGroupInviteService = ({
  groupInviteRepository,
  groupMemberRepository,
  studentRepository,
  transaction,
}) => {
  const statusLabelMap = Object.freeze({
    pending: "Chưa duyệt",
    accepted: "Chấp nhận",
    declined: "Từ chối",
  });

  const normalizePreviewStatus = (status) => {
    const key = String(status || "").toLowerCase();
    if (key === "accepted" || key === "declined" || key === "pending") return key;
    return "pending";
  };

  const listPendingForUser = async (user) => {
    if (!user?.id) throw Forbidden("Authentication required");
    const stu = await studentRepository.findByUserId(user.id);
    if (!stu) throw Forbidden("Không tìm thấy hồ sơ sinh viên.");

    const [invites, hasGroup] = await Promise.all([
      groupInviteRepository.listPendingByStudentUserId(user.id),
      groupInviteRepository.hasActiveGroupByStudentId(stu.id),
    ]);
    let activeGroup = null;
    if (hasGroup) {
      const grp = await groupInviteRepository.findActiveGroupSnapshotByStudentId(stu.id);
      if (grp?.group_id) {
        const members = await groupInviteRepository.listActiveMembersByGroupId(grp.group_id);
        activeGroup = {
          id: grp.group_id,
          group_name: grp.group_name || grp.group_code || "—",
          class_code: grp.class_code || "—",
          semester_name: grp.semester_name || "—",
          mentor_display_name: grp.mentor_display_name || "—",
          max_members: Number(grp.max_members) || 0,
          active_members: Number(grp.active_members) || 0,
          members: members.map((m) => ({
            student_id: m.student_id,
            student_code: m.student_code,
            full_name: m.full_name,
            role: m.role,
          })),
        };
      }
    }
    if (!invites.length) return { invites: [], hasGroup, activeGroup };

    const groupIds = [...new Set(invites.map((x) => Number(x.group_id)).filter(Boolean))];
    const previewRows = await groupInviteRepository.listInvitePreviewMembersByGroupIds(groupIds);
    const previewMap = new Map();
    for (const row of previewRows) {
      const gid = Number(row.group_id);
      const list = previewMap.get(gid) || [];
      const st = normalizePreviewStatus(row.status);
      list.push({
        student_id: row.student_id,
        student_code: row.student_code,
        full_name: row.full_name,
        status: st,
        status_label: statusLabelMap[st],
      });
      previewMap.set(gid, list);
    }

    const statusOrder = Object.freeze({ accepted: 0, pending: 1, declined: 2 });
    const normalizeCode = (code) => String(code || "").toUpperCase();
    for (const [gid, members] of previewMap.entries()) {
      members.sort((a, b) => {
        const sa = statusOrder[a.status] ?? 99;
        const sb = statusOrder[b.status] ?? 99;
        if (sa !== sb) return sa - sb;
        return normalizeCode(a.student_code).localeCompare(normalizeCode(b.student_code));
      });
      previewMap.set(gid, members);
    }

    return {
      invites: invites.map((inv) => ({
        ...inv,
        membersPreview: previewMap.get(Number(inv.group_id)) || [],
      })),
      hasGroup,
      activeGroup,
    };
  };

  const accept = async (token, user) => {
    if (!user?.id) throw Forbidden("Authentication required");
    const stu = await studentRepository.findByUserId(user.id);
    if (!stu) throw Forbidden("Không tìm thấy hồ sơ sinh viên.");

    return transaction.run(async (conn) => {
      const row = await groupInviteRepository.findByTokenForUpdate(conn, token);
      if (!row) throw NotFound("Lời mời không tồn tại.");
      if (String(row.status) !== "pending") throw BadRequest("Lời mời đã được xử lý.");
      if (new Date(row.expires_at) <= new Date()) throw BadRequest("Lời mời đã hết hạn.");
      if (Number(row.student_id) !== Number(stu.id)) {
        throw Forbidden("Lời mời này không dành cho tài khoản của bạn.");
      }

      const [gRows] = await conn.execute(
        "SELECT id, class_id, max_members FROM `groups` WHERE id = ? AND deleted_at IS NULL FOR UPDATE",
        [row.group_id]
      );
      const grp = gRows[0];
      if (!grp) throw NotFound("Nhóm không tồn tại.");

      const other = await groupMemberRepository.findStudentGroupInClass(stu.id, grp.class_id);
      if (other) {
        throw Conflict(`Bạn đã thuộc nhóm khác trong lớp này (${other.group_name}).`);
      }

      const [cntRows] = await conn.execute(
        "SELECT COUNT(*) AS n FROM group_members WHERE group_id = ? AND status = 'active'",
        [row.group_id]
      );
      const n = Number(cntRows[0]?.n) || 0;
      if (n >= Number(grp.max_members)) {
        throw BadRequest("Nhóm đã đủ thành viên.");
      }

      await conn.execute(
        `INSERT INTO group_members (group_id, student_id, role, status, joined_at)
         VALUES (?, ?, 'member', 'active', NOW())`,
        [row.group_id, stu.id]
      );
      await conn.execute("UPDATE group_invites SET status = 'accepted' WHERE id = ?", [row.id]);
      return { groupId: row.group_id };
    });
  };

  const decline = async (token, user) => {
    if (!user?.id) throw Forbidden("Authentication required");
    const stu = await studentRepository.findByUserId(user.id);
    if (!stu) throw Forbidden("Không tìm thấy hồ sơ sinh viên.");

    return transaction.run(async (conn) => {
      const row = await groupInviteRepository.findByTokenForUpdate(conn, token);
      if (!row) throw NotFound("Lời mời không tồn tại.");
      if (String(row.status) !== "pending") throw BadRequest("Lời mời đã được xử lý.");
      if (Number(row.student_id) !== Number(stu.id)) {
        throw Forbidden("Lời mời này không dành cho tài khoản của bạn.");
      }
      await conn.execute("UPDATE group_invites SET status = 'declined' WHERE id = ?", [row.id]);
      return { ok: true };
    });
  };

  const report = async (token, user, payload) => {
    if (!user?.id) throw Forbidden("Authentication required");
    const stu = await studentRepository.findByUserId(user.id);
    if (!stu) throw Forbidden("Không tìm thấy hồ sơ sinh viên.");
    const issueType = String(payload?.issue_type || "").trim();
    const description = String(payload?.description || "").trim();
    if (!description) throw BadRequest("Nội dung báo lỗi không được để trống.");

    return transaction.run(async (conn) => {
      const row = await groupInviteRepository.findByTokenForUpdate(conn, token);
      if (!row) throw NotFound("Lời mời không tồn tại.");
      if (String(row.status) !== "pending") throw BadRequest("Lời mời đã được xử lý.");
      if (Number(row.student_id) !== Number(stu.id)) throw Forbidden("Lời mời này không dành cho tài khoản của bạn.");

      await groupInviteRepository.insertInviteReportConn(conn, {
        groupInviteId: row.id,
        groupId: row.group_id,
        studentId: stu.id,
        issueType,
        description,
      });
      await conn.execute("UPDATE group_invites SET status = 'declined' WHERE id = ?", [row.id]);
      return { ok: true, declined: true };
    });
  };

  const previewByToken = async (token) => {
    const row = await groupInviteRepository.findByToken(token);
    if (!row) throw NotFound("Lời mời không tồn tại.");
    if (String(row.status) !== "pending") throw BadRequest("Lời mời không còn hiệu lực.");
    if (new Date(row.expires_at) <= new Date()) throw BadRequest("Lời mời đã hết hạn.");
    return {
      groupName: row.group_name,
      groupCode: row.group_code,
      classCode: row.class_code,
      expiresAt: row.expires_at,
    };
  };

  return withLogging(
    { listPendingForUser, accept, decline, report, previewByToken },
    "GroupInviteService"
  );
};
