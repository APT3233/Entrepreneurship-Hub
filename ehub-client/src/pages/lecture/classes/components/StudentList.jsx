import { useMemo } from "react";
import Dropdown from "@/components/ui/filter/DropDown";
import { LastNameAvatar } from "@/components/icons/ui";

/**
 * StudentList — Danh sách sinh viên (sau khi tạo nhóm: có cột Nhóm*, Nhóm trưởng, lọc theo nhóm)
 * Sắp xếp: theo nhóm (cùng nhóm đứng gần nhau), sinh viên chưa có nhóm xuống cuối.
 *
 * Props:
 * - students       : Array<{ id, mssv, name, email, major, avatar?, accountActivated?, isLeader?, groupId?, groupName? }>
 * - totalCount     : number
 * - groupCount     : number | null  — null = "Chưa có nhóm"
 * - searchValue    : string
 * - onSearchChange : (value: string) => void
 * - groupOptions   : [{ label, value }] — options lọc nhóm (vd: Tất cả, Alpha, Beta)
 * - selectedGroup  : string  — value đang chọn
 * - onGroupChange  : (value: string) => void
 * - activationOptions, selectedActivation, onActivationChange — lọc đã/chưa kích hoạt tài khoản
 */

const MAJOR_COLOR = {
  "IT": "text-purple-600",
  "Kinh tế": "text-green-600",
  "Design": "text-blue-500",
};

function majorColor(major) {
  return MAJOR_COLOR[major] ?? "text-gray-600";
}

const columnsWithoutGroup = ["STT", "MSSV", "Họ và tên", "Email", "Kích hoạt", "Chuyên ngành"];
const columnsWithGroup = ["STT", "MSSV", "Họ và tên", "Email", "Kích hoạt", "Chuyên ngành", "Nhóm*"];

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
          {students.length !== totalCount && totalCount > 0 && (
            <p className="text-xs text-indigo-600 font-medium mt-0.5">
              Đang hiển thị: {students.length} / {totalCount} sinh viên
            </p>
          )}
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

      {/* Table wrapper — scroll ngang trên mobile */}
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
                <tr key={s.id ?? i} className="hover:bg-gray-50 transition-colors duration-100">
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
                  <td className="px-4 py-3 md:px-6 md:py-5 text-left">
                    <span className={`text-[11px] md:text-xs font-semibold ${majorColor(s.major)}`}>
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