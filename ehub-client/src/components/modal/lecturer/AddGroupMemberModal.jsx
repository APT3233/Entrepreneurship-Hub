import { useState, useEffect } from "react";
import { X } from "lucide-react";
import ClassApi from "@/api/class";
import GroupApi from "@/api/group";
import { useToast } from "@/components/ui/Toast";
import DropDown from "@/components/ui/filter/DropDown";

export default function AddGroupMemberModal({
  isOpen,
  onClose,
  classId,
  groupId,
  onSuccess,
}) {
  const toast = useToast();
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [studentId, setStudentId] = useState("");
  const studentOptions = candidates.map((s) => ({
    value: String(s.id),
    label: `${s.student_code || s.mssv} — ${s.name}`,
  }));

  useEffect(() => {
    if (!isOpen || !classId) return;
    let cancel = false;
    (async () => {
      setLoadingList(true);
      try {
        const res = await ClassApi.getOverview(classId);
        const students = res?.data?.students || [];
        const eligible = students.filter((s) => !s.groupId);
        if (!cancel) setCandidates(eligible);
      } catch {
        if (!cancel) toast.error("Không tải được danh sách sinh viên lớp.");
      } finally {
        if (!cancel) setLoadingList(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [isOpen, classId]);

  useEffect(() => {
    if (!isOpen) {
      setStudentId("");
      setCandidates([]);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) {
      toast.warning("Chưa chọn sinh viên", "Vui lòng chọn một sinh viên trong danh sách.");
      return;
    }
    setSubmitting(true);
    try {
      await GroupApi.addMember(groupId, { student_id: Number(studentId), role: "member" });
      toast.success("Đã gửi lời mời vào nhóm qua email.");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Thêm thành viên thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
            <h2 className="text-base font-bold text-gray-900">Thêm thành viên</h2>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              Chỉ hiển thị sinh viên đã ghi danh lớp và chưa thuộc nhóm nào.
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
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sinh viên</label>
            {loadingList ? (
              <p className="text-sm text-gray-400 py-2">Đang tải danh sách…</p>
            ) : candidates.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                Không còn sinh viên nào chưa có nhóm trong lớp này.
              </p>
            ) : (
              <DropDown
                label="— Chọn MSSV —"
                options={studentOptions}
                value={studentId}
                onChange={setStudentId}
                disabled={submitting}
              />
            )}
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
            disabled={submitting || loadingList || !candidates.length}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Đang thêm…" : "Thêm"}
          </button>
        </div>
      </form>
    </div>
  );
}
