import { useMemo } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import Dropdown from "@/components/ui/filter/DropDown";
import { LastNameAvatar } from "@/components/icons/ui";

/**
 * StudentList — Danh sách sinh viên (sau khi tạo nhóm: có cột Nhóm*, Nhóm trưởng, lọc theo nhóm)
 * Sắp xếp: theo nhóm (cùng nhóm đứng gần nhau), sinh viên chưa có nhóm xuống cuối.
 */

const MAJOR_COLOR = {
  "IT": "text-purple-600",
  "Kinh tế": "text-green-600",
  "Design": "text-blue-500",
};

// function majorColor(major) {
//   return MAJOR_COLOR[major] ?? "text-gray-600";
// }

const columnsWithoutGroup = ["STT", "MSSV", "Họ và tên", "Email", "Kích hoạt"];
const columnsWithGroup = ["STT", "MSSV", "Họ và tên", "Email", "Nhóm*", "Kích hoạt"];

export default function StudentList({
  students = [],
  totalCount = 0,
  groupCount = null,
  searchValue = "",
  onSearchChange,
  groupOptions = [],
  selectedGroup = "all",
  onGroupChange,
  activationOptions = [],
  selectedActivation = "all",
  onActivationChange,
  canEdit = false,
  onDeleteStudent,
  onAddStudent,
  onEditStudent,
}) {
  const hasGroups = groupOptions.length > 0;
  const columns = [...(hasGroups ? columnsWithGroup : columnsWithoutGroup)];
  if (canEdit) columns.push("Hành động");

  // Sắp xếp: có nhóm trước (cùng nhóm đứng gần nhau), chưa có nhóm xuống cuối; trong nhóm: leader trước, rồi mssv
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const aNoGroup = a.groupId == null;
      const bNoGroup = b.groupId == null;
      if (aNoGroup && bNoGroup) return (a.mssv || "").localeCompare(b.mssv || "");
      if (aNoGroup) return 1;
      if (bNoGroup) return -1;
      if (a.groupId !== b.groupId) return (a.groupName || "").localeCompare(b.groupName || "");
      if (a.isLeader !== b.isLeader) return a.isLeader ? -1 : 1;
      return (a.mssv || "").localeCompare(b.mssv || "");
    });
  }, [students]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm md:text-base font-bold text-gray-900">Danh sách sinh viên</h2>
          <div className="flex flex-col gap-0.5 mt-1">
             <p className="text-xs text-gray-400">Tổng số: {totalCount} sinh viên</p>
             <p className="text-xs text-gray-400">
               Số nhóm: {groupCount != null ? `${groupCount} nhóm` : "Chưa có nhóm"}
             </p>
          </div>
          {students.length !== totalCount && totalCount > 0 && (
            <p className="text-xs text-indigo-600 font-medium mt-1">
              Đang hiển thị: {students.length} / {totalCount} sinh viên
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {canEdit && onAddStudent && (
            <button
              onClick={onAddStudent}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100"
            >
              <Plus size={16} strokeWidth={2.5} />
              Thêm sinh viên
            </button>
          )}
          {hasGroups && onGroupChange && (
            <Dropdown
              label="Nhóm: Tất cả"
              options={groupOptions}
              value={selectedGroup}
              onChange={onGroupChange}
            />
          )}
          {activationOptions.length > 0 && onActivationChange && (
            <Dropdown
              label="Kích hoạt: Tất cả"
              options={activationOptions}
              value={selectedActivation}
              onChange={onActivationChange}
            />
          )}
          {onSearchChange && (
            <input
              type="search"
              placeholder="Tìm kiếm..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 min-w-[140px] sm:w-56 md:w-64 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 shrink-0"
            />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-100 overflow-x-auto w-full">
        <table className="w-full min-w-[920px] text-sm border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-indigo-50/20 border-b border-gray-50">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-4 md:px-6 md:py-5 text-left text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {sortedStudents.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-gray-300">
                  Chưa có sinh viên nào
                </td>
              </tr>
            ) : (
              sortedStudents.map((s, i) => (
                <tr key={s.id ?? i} className="hover:bg-gray-50 transition-colors duration-100 group">
                  <td className="px-4 py-3 md:px-6 md:py-5 text-gray-500 font-medium text-[11px] md:text-xs">{i + 1}</td>
                  <td className="px-4 py-3 md:px-6 md:py-5">
                    <span className="font-mono text-xs md:text-sm font-semibold text-gray-700 leading-none">
                      {s.mssv}
                    </span>
                  </td>
                  <td className="px-4 py-3 md:px-6 md:py-5 text-gray-800">
                    <div className="flex items-center gap-3">
                      <LastNameAvatar name={s.name || "—"} avatar={s.avatar} index={i} />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-medium text-gray-800 text-xs md:text-sm leading-none group-hover:text-indigo-600 transition-colors truncate">
                          {s.name}
                        </span>
                        {s.isLeader && (
                          <span className="text-[9px] md:text-[10px] text-emerald-600 font-bold uppercase tracking-tight mt-1">
                            Nhóm trưởng
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 md:px-6 md:py-5">
                    <span className="text-gray-400 font-medium text-[11px] md:text-xs leading-none">
                      {s.email}
                    </span>
                  </td>

                  {hasGroups && (
                    <td className="px-4 py-3 md:px-6 md:py-5 text-gray-700 font-medium text-[11px] md:text-xs">
                      {s.groupId != null ? (
                        <span className="font-semibold text-gray-700">{s.groupName ?? "—"}</span>
                      ) : (
                        <span className="text-gray-400 italic">Chưa phân nhóm</span>
                      )}
                    </td>
                  )}

                  <td className="px-4 py-3 md:px-6 md:py-5">
                    {s.accountActivated ? (
                      <span className="inline-flex items-center px-2 md:px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Đã kích hoạt
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 md:px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-100">
                        Chưa kích hoạt
                      </span>
                    )}
                  </td>

                  {canEdit && (
                    <td className="px-4 py-3 md:px-6 md:py-5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditStudent?.(s)}
                          title="Sửa thông tin"
                          className="p-2 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 active:scale-95"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteStudent?.(s)}
                          disabled={s.groupId != null}
                          title={s.groupId != null ? "Không thể xóa sinh viên đã có nhóm" : "Xóa khỏi lớp"}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            s.groupId != null
                              ? "text-gray-200 cursor-not-allowed"
                              : "text-gray-400 hover:bg-red-50 hover:text-red-600 active:scale-95"
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}