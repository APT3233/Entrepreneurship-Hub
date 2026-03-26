import { useMemo } from "react";
import Dropdown from "@/components/ui/filter/DropDown";
import { GroupIcon2 } from "@/components/icons/lecture";

/**
 * StudentList — Danh sách sinh viên (sau khi tạo nhóm: có cột Nhóm*, Nhóm trưởng, lọc theo nhóm)
 * Sắp xếp: theo nhóm (cùng nhóm đứng gần nhau), sinh viên chưa có nhóm xuống cuối.
 *
 * Props:
 * - students       : Array<{ id, mssv, name, email, major, isLeader?, groupId?, groupName? }>
 * - totalCount     : number
 * - groupCount     : number | null  — null = "Chưa có nhóm"
 * - searchValue    : string
 * - onSearchChange : (value: string) => void
 * - groupOptions   : [{ label, value }] — options lọc nhóm (vd: Tất cả, Alpha, Beta)
 * - selectedGroup  : string  — value đang chọn
 * - onGroupChange  : (value: string) => void
 */

const MAJOR_COLOR = {
  "IT": "text-purple-600",
  "Kinh tế": "text-green-600",
  "Design": "text-blue-500",
};

function majorColor(major) {
  return MAJOR_COLOR[major] ?? "text-gray-600";
}

const columnsWithoutGroup = ["STT", "MSSV", "Họ và tên", "Email", "Chuyên ngành"];
const columnsWithGroup = ["STT", "MSSV", "Họ và tên", "Email", "Chuyên ngành", "Nhóm*"];

export default function StudentList({
  students = [],
  totalCount = 0,
  groupCount = null,
  searchValue = "",
  onSearchChange,
  groupOptions = [],
  selectedGroup = "all",
  onGroupChange,
}) {
  const hasGroups = groupOptions.length > 0;
  const columns = hasGroups ? columnsWithGroup : columnsWithoutGroup;

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

      {/* Header: tiêu đề bên trái; bên phải: lọc nhóm (nếu có) + tìm kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm md:text-base font-bold text-gray-900">Danh sách sinh viên</h2>
          <p className="text-xs text-gray-400 mt-0.5">Tổng số: {totalCount} sinh viên</p>
          <p className="text-xs text-gray-400">
            Số nhóm: {groupCount != null ? `${groupCount} nhóm` : "Chưa có nhóm"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {hasGroups && onGroupChange && (
            <Dropdown
              label="Nhóm: Tất cả"
              options={groupOptions}
              value={selectedGroup}
              onChange={onGroupChange}
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

      {/* Table wrapper — scroll ngang trên mobile */}
      <div className="rounded-xl border border-gray-100 overflow-x-auto w-full">
        <table className="w-full min-w-[800px] text-sm border-collapse whitespace-nowrap">

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
                <tr key={s.id ?? i} className="hover:bg-gray-50 transition-colors duration-100">
                  <td className="px-4 py-3 md:px-6 md:py-5 text-gray-500 font-medium text-[11px] md:text-xs">{i + 1}</td>
                  <td className="px-4 py-3 md:px-6 md:py-5">
                    <span className="font-mono text-[11px] md:text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg group-hover:bg-white transition-colors">
                      {s.mssv}
                    </span>
                  </td>
                  <td className="px-4 py-3 md:px-6 md:py-5 text-gray-800">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-gray-800 text-xs md:text-sm leading-none group-hover:text-indigo-600 transition-colors">
                        {s.name}
                      </span>
                      {s.isLeader && (
                        <span className="text-[9px] md:text-[10px] text-emerald-600 font-bold uppercase tracking-tight mt-1">
                          Nhóm trưởng
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 md:px-6 md:py-5">
                    <span className="text-gray-400 font-medium text-[11px] md:text-xs leading-none">
                      {s.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 md:px-6 md:py-5 text-left">
                    <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-gray-50 border border-gray-100 ${majorColor(s.major)} shadow-sm`}>
                      {s.major}
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}