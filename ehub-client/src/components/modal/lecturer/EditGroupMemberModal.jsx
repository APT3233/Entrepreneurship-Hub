import { useState, useEffect } from "react";
import { X } from "lucide-react";
import GroupApi from "@/api/group";
import { useToast } from "@/components/ui/Toast";
import DropDown from "@/components/ui/filter/DropDown";

export default function EditGroupMemberModal({
  isOpen,
  onClose,
  groupId,
  member,
  onSuccess,
}) {
  const toast = useToast();
  const [role, setRole] = useState("member");
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);
  const roleOptions = [
    { value: "member", label: "Thành viên" },
    { value: "leader", label: "Nhóm trưởng" },
  ];
  const statusOptions = [
    { value: "active", label: "Đang tham gia" },
    { value: "left", label: "Đã rời nhóm" },
    { value: "removed", label: "Đã gỡ khỏi nhóm (ghi nhận)" },
  ];

  useEffect(() => {
    if (!member) return;
    setRole(member.role === "leader" ? "leader" : "member");
    setStatus(member.status || "active");
  }, [member, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!member?.student_id) return;
    const body = {};
    if (role !== (member.role === "leader" ? "leader" : "member")) body.role = role;
    if (status !== (member.status || "active")) body.status = status;
    if (!Object.keys(body).length) {
      toast.info("Không có thay đổi.");
      onClose?.();
      return;
    }
    setSubmitting(true);
    try {
      await GroupApi.updateMember(groupId, member.student_id, body);
      toast.success("Đã cập nhật thành viên.");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Cập nhật thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose?.();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Sửa thành viên</h2>
            <p className="mt-1 text-sm text-gray-800 font-medium">
              {member.student_code || member.mssv} — {member.full_name || member.fullName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onClose?.()}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vai trò</label>
            <DropDown
              label="Chọn vai trò"
              options={roleOptions}
              value={role}
              onChange={setRole}
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Trạng thái tham gia</label>
            <DropDown
              label="Chọn trạng thái"
              options={statusOptions}
              value={status}
              onChange={setStatus}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => onClose?.()}
            className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </form>
    </div>
  );
}
