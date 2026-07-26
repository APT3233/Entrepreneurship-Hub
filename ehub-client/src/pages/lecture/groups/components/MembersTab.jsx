import { useState } from "react";
import { Pencil, Trash2, UserPlus, Download } from "lucide-react";
import { Avatar, Skeleton } from "./Common";
import GroupApi from "@/api/group";
import { useToast } from "@/components/ui/Toast";
import AddGroupMemberForm from "@/components/form/lecturer/AddGroupMemberForm";
import EditGroupMemberForm from "@/components/form/lecturer/EditGroupMemberForm";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { formatDate } from "@/utils/dateTimeDisplay";
import { downloadCsv } from "@/utils/exportCsv";

const STATUS_LABEL = {
  active: { text: "Đang tham gia", className: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  left: { text: "Đã rời nhóm", className: "text-slate-600 bg-slate-100 border-slate-200" },
  removed: { text: "Đã gỡ", className: "text-red-700 bg-red-50 border-red-100" },
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

  const MAJOR_CONFIG = {
    IT: "text-blue-600 bg-blue-50 border-blue-100",
    "Kinh tế": "text-emerald-600 bg-emerald-50 border-emerald-100",
    Design: "text-purple-600 bg-purple-50 border-purple-100",
  };

  const getMajorStyle = (major) => MAJOR_CONFIG[major] ?? "text-text-secondary bg-gray-50 border-border";

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

  return (
    <div className="mt-6 md:mt-8 mb-10">
      <div className="mb-4 md:mb-6 flex flex-row items-center justify-between gap-3 flex-wrap">
        <p className="text-sm md:text-base font-semibold text-text-primary tracking-tight">
          Danh sách sinh viên
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs md:text-sm text-text-secondary font-medium">
            {members.length} thành viên
          </span>
          <button
            type="button"
            onClick={handleExportGroup}
            className="inline-flex items-center gap-1.5 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-semibold px-3 py-2 hover:bg-green-100 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Xuất thành viên
          </button>
          {canManageMembers && classId && groupId ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent text-white text-xs font-semibold px-3 py-2 hover:bg-accent-hover transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Thêm thành viên
            </button>
          ) : null}
        </div>
      </div>

      <div className="bg-surface rounded-3xl overflow-hidden shadow-sm w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left border-collapse whitespace-nowrap min-w-[720px]">
            <thead>
              <tr className="bg-accent-50/20 border-b border-gray-50">
                <th className="px-4 py-4 md:px-6 md:py-5 text-[10px] md:text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  MSSV
                </th>
                <th className="px-4 py-4 md:px-6 md:py-5 text-[10px] md:text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  Họ và tên
                </th>
                <th className="px-4 py-4 md:px-6 md:py-5 text-[10px] md:text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  Email
                </th>
                <th className="px-4 py-4 md:px-6 md:py-5 text-[10px] md:text-[11px] font-bold text-text-muted uppercase tracking-widest text-center">
                  Chuyên ngành
                </th>
                <th className="px-4 py-4 md:px-6 md:py-5 text-[10px] md:text-[11px] font-bold text-text-muted uppercase tracking-widest text-center">
                  Vai trò
                </th>
                <th className="px-4 py-4 md:px-6 md:py-5 text-[10px] md:text-[11px] font-bold text-text-muted uppercase tracking-widest text-center">
                  Trạng thái
                </th>
                <th className="px-4 py-4 md:px-6 md:py-5 text-[10px] md:text-[11px] font-bold text-text-muted uppercase tracking-widest text-center">
                  Tham gia
                </th>
                {canManageMembers ? (
                  <th className="px-4 py-4 md:px-6 md:py-5 text-[10px] md:text-[11px] font-bold text-text-muted uppercase tracking-widest text-right">
                    Thao tác
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((m, idx) => {
                const st = STATUS_LABEL[m.status] || STATUS_LABEL.active;
                const isLeader = m.role === "leader";
                return (
                  <tr
                    key={m.id ?? `${m.student_id}-${idx}`}
                    className="hover:bg-accent-50/10 transition-colors group cursor-default"
                  >
                    <td className="px-4 py-3 md:px-6 md:py-5">
                      <span className="font-mono text-[11px] md:text-xs font-semibold text-text-secondary bg-gray-50 px-2 py-1 rounded-lg group-hover:bg-surface transition-colors">
                        {m.student_code || m.mssv}
                      </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={m.full_name || m.fullName || "N A"}
                          avatar={m.avatar}
                          index={idx}
                        />
                        <span className="font-medium text-text-primary text-xs md:text-sm leading-none group-hover:text-accent-600 transition-colors">
                          {m.full_name || m.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-5">
                      <span className="text-text-muted font-medium text-[11px] md:text-xs leading-none">
                        {m.email || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-5 text-center">
                      <span
                        className={`text-[9px] md:text-[10px] font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full border uppercase tracking-wider ${getMajorStyle(m.major)} shadow-sm`}
                      >
                        {m.major || "Chưa cập nhật"}
                      </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-5 text-center">
                      <span
                        className={`text-[10px] md:text-xs font-semibold px-2 py-1 rounded-lg ${
                          isLeader ? "text-accent-700 bg-accent-50" : "text-text-secondary bg-gray-50"
                        }`}
                      >
                        {isLeader ? "Nhóm trưởng" : "Thành viên"}
                      </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-5 text-center">
                      <span
                        className={`text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-full border ${st.className}`}
                      >
                        {st.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-5 text-center text-[11px] text-text-secondary">
                      {formatDate(m.joined_at)}
                    </td>
                    {canManageMembers ? (
                      <td className="px-4 py-3 md:px-6 md:py-5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditMember(m)}
                            className="p-2 rounded-lg text-accent-600 hover:bg-accent-50 transition-colors"
                            title="Sửa"
                            aria-label="Sửa thành viên"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.student_id, m.full_name || m.fullName || m.student_code || m.mssv)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
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
