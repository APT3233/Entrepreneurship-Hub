import { useState } from "react";
import { Pencil, Trash2, UserPlus, Download } from "lucide-react";
import { Avatar, Skeleton } from "./Common";
import StatusBadge from "@/components/ui/StatusBadge";
import GroupApi from "@/api/group";
import { useToast } from "@/components/ui/Toast";
import AddGroupMemberForm from "@/components/form/lecturer/AddGroupMemberForm";
import EditGroupMemberForm from "@/components/form/lecturer/EditGroupMemberForm";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { formatDate } from "@/utils/dateTimeDisplay";
import { downloadCsv } from "@/utils/exportCsv";

const STATUS_LABEL = {
  active: { text: "Đang tham gia", tone: "success" },
  left: { text: "Đã rời nhóm", tone: "neutral" },
  removed: { text: "Đã gỡ", tone: "danger" },
};


/**
 * Tab thành viên nhóm — hiển thị MSSV, vai trò, trạng thái; GV/Admin quản lý thêm/sửa/xóa.
 */
export default function MembersTab({
  members = [],
  loading,
  groupId,
  classId,
  canManageMembers = false,
  onMembersChanged,
  groupName = "",
}) {
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRemoveMember = (studentId, name) => {
    if (!groupId || !studentId) return;
    setMemberToDelete({ id: studentId, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMember = async () => {
    if (!groupId || !memberToDelete?.id || isDeleting) return;
    setIsDeleting(true);
    try {
      await GroupApi.removeMember(groupId, memberToDelete.id);
      toast.success(`Đã xóa ${memberToDelete.name} khỏi nhóm.`);
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
      onMembersChanged?.();
    } catch (err) {
      toast.error(err?.message || "Không thể xóa thành viên.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 md:mt-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const handleExportGroup = () => {
    const filename = `danh_sach_thanh_vien_${groupName || groupId || "nhom"}`;
    const headers = ["MSSV", "Họ và tên", "Email", "Chuyên ngành", "Vai trò", "Trạng thái", "Ngày tham gia"];
    const rows = members.map((m) => {
      const isLeader = m.role === "leader";
      const st = STATUS_LABEL[m.status] || STATUS_LABEL.active;
      return {
        mssv: m.student_code || m.mssv || "",
        "họ và tên": m.full_name || m.fullName || "",
        email: m.email || "",
        "chuyên ngành": m.major || "Chưa cập nhật",
        "vai trò": isLeader ? "Nhóm trưởng" : "Thành viên",
        "trạng thái": st.text,
        "ngày tham gia": formatDate(m.joined_at),
      };
    });
    downloadCsv({ filename, headers, rows });
  };

  const th = "px-4 py-3 md:px-6 md:py-4 text-label font-medium text-text-secondary";

  return (
    <div className="mt-6 md:mt-8 mb-10">
      <div className="mb-4 md:mb-6 flex flex-row items-center justify-between gap-3 flex-wrap">
        <p className="text-base font-medium text-text-primary">
          Danh sách sinh viên
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">
            {members.length} thành viên
          </span>
          <button
            type="button"
            onClick={handleExportGroup}
            className="inline-flex items-center gap-1.5 h-9 rounded-control bg-subtle text-text-secondary text-sm font-medium px-3 hover:bg-border transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Xuất thành viên
          </button>
          {canManageMembers && classId && groupId ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 rounded-control bg-accent text-white text-sm font-medium px-3 hover:bg-accent-hover transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Thêm thành viên
            </button>
          ) : null}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-card overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left border-collapse whitespace-nowrap min-w-[720px]">
            <thead>
              <tr className="bg-subtle border-b border-border">
                <th className={th}>MSSV</th>
                <th className={th}>Họ và tên</th>
                <th className={th}>Email</th>
                <th className={`${th} text-center`}>Chuyên ngành</th>
                <th className={`${th} text-center`}>Vai trò</th>
                <th className={`${th} text-center`}>Trạng thái</th>
                <th className={`${th} text-center`}>Tham gia</th>
                {canManageMembers ? (
                  <th className={`${th} text-right`}>Thao tác</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m, idx) => {
                const st = STATUS_LABEL[m.status] || STATUS_LABEL.active;
                const isLeader = m.role === "leader";
                return (
                  <tr
                    key={m.id ?? `${m.student_id}-${idx}`}
                    className="hover:bg-subtle transition-colors cursor-default"
                  >
                    <td className="px-4 py-3 md:px-6 md:py-4">
                      <span className="font-mono text-xs font-medium text-text-secondary bg-subtle px-2 py-1 rounded-control">
                        {m.student_code || m.mssv}
                      </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={m.full_name || m.fullName || "N A"}
                          avatar={m.avatar}
                          index={idx}
                        />
                        <span className="font-medium text-text-primary text-sm leading-none">
                          {m.full_name || m.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4">
                      <span className="text-text-secondary text-xs leading-none">
                        {m.email || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-center">
                      <StatusBadge status="neutral" label={m.major || "Chưa cập nhật"} />
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-center">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-control ${
                          isLeader ? "text-accent bg-accent-bg" : "text-text-secondary bg-subtle"
                        }`}
                      >
                        {isLeader ? "Nhóm trưởng" : "Thành viên"}
                      </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-center">
                      <StatusBadge status={st.tone} label={st.text} />
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-center text-xs text-text-secondary">
                      {formatDate(m.joined_at)}
                    </td>
                    {canManageMembers ? (
                      <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditMember(m)}
                            className="p-2 rounded-control text-text-muted hover:bg-subtle hover:text-text-primary transition-colors"
                            title="Sửa"
                            aria-label="Sửa thành viên"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.student_id, m.full_name || m.fullName || m.student_code || m.mssv)}
                            className="p-2 rounded-control text-text-muted hover:bg-danger-bg hover:text-danger-text transition-colors"
                            title="Xóa khỏi nhóm"
                            aria-label="Xóa thành viên"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AddGroupMemberForm
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={onMembersChanged}
        groupId={groupId}
        classId={classId}
        currentMembers={members}
      />

      <EditGroupMemberForm
        isOpen={!!editMember}
        onClose={() => setEditMember(null)}
        onUpdate={onMembersChanged}
        member={editMember}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMemberToDelete(null);
        }}
        onYes={confirmDeleteMember}
        title="Xóa thành viên"
        subtitle={`Bạn có chắc chắn muốn xóa ${memberToDelete?.name} khỏi nhóm? Hành động này không thể hoàn tác.`}
        variant="remove"
        color="red"
        yesLabel={isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
      />
    </div>
  );
}
