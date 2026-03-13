import Dropdown from "@/components/ui/filter/DropDown";
import { GroupIcon2 } from "@/components/icons/lecture";

/**
 * StudentList — Danh sách sinh viên (sau khi tạo nhóm: có cột Nhóm*, Nhóm trưởng, lọc theo nhóm)
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
      <div className="rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm border-collapse">

          <thead>
            <tr className="border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-gray-300">
                  Chưa có sinh viên nào
                </td>
              </tr>
            ) : (
              students.map((s, i) => (
                <tr key={s.id ?? i} className="hover:bg-gray-50 transition-colors duration-100">
                  <td className="px-4 py-4 text-gray-500 text-sm">{i + 1}</td>
                  <td className="px-4 py-4 font-semibold text-gray-800">{s.mssv}</td>
                  <td className="px-4 py-4 text-gray-800">
                    <div>
                      <span>
                        {s.name}
                        {s.isLeader && <span className="ml-1 text-gray-400 text-xs">*</span>}
                      </span>
                      {s.isLeader && (
                        <p className="text-xs text-green-600 mt-0.5">Nhóm trưởng</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-400">{s.email}</td>
                  <td className={`px-4 py-4 font-medium ${majorColor(s.major)}`}>{s.major}</td>
                  {hasGroups && (
                    <td className="px-4 py-4 text-gray-700">{s.groupId != null ? (s.groupName ?? "—") : ""}</td>
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