import { useMemo } from "react";
import { Plus, Trash2, Pencil, Download } from "lucide-react";
import Dropdown from "@/components/ui/filter/DropDown";
import { LastNameAvatar } from "@/components/icons/ui";
import StatusBadge from "@/components/ui/StatusBadge";
import { downloadCsv } from "@/utils/exportCsv";

/**
 * StudentList — Danh sách sinh viên (sau khi tạo nhóm: có cột Nhóm*, Nhóm trưởng, lọc theo nhóm)
 * Sắp xếp: theo nhóm (cùng nhóm đứng gần nhau), sinh viên chưa có nhóm xuống cuối.
 */

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
  classCode = "",
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

  const handleExport = () => {
    const groupOpt = groupOptions.find((g) => String(g.value) === String(selectedGroup));
    const groupLabel = groupOpt && selectedGroup !== "all" ? `_${groupOpt.label.replace(/\s+/g, "_")}` : "";
    const filename = `danh_sach_sinh_vien_${classCode || "lop"}${groupLabel}`;

    const headers = ["MSSV", "Họ và tên", "Email", "Nhóm", "Chuyên ngành", "Trạng thái kích hoạt"];
    const rows = sortedStudents.map((s) => ({
      mssv: s.mssv || s.student_code || "",
      "họ và tên": s.name || s.full_name || "",
      email: s.email || "",
      "nhóm": s.groupName || s.group_name || "Chưa phân nhóm",
      "chuyên ngành": s.major || "Chưa cập nhật",
      "trạng thái kích hoạt": s.accountActivated ? "Đã kích hoạt" : "Chưa kích hoạt",
    }));

    downloadCsv({ filename, headers, rows });
  };

  return (
    <div className="bg-surface rounded-card border border-border p-5 md:p-6 w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-medium text-text-primary">Danh sách sinh viên</h2>
          <div className="flex flex-col gap-0.5 mt-1">
             <p className="text-label text-text-secondary">Tổng số: {totalCount} sinh viên</p>
             <p className="text-label text-text-secondary">
               Số nhóm: {groupCount != null ? `${groupCount} nhóm` : "Chưa có nhóm"}
             </p>
          </div>
          {students.length !== totalCount && totalCount > 0 && (
            <p className="text-label text-accent font-medium mt-1">
              Đang hiển thị: {students.length} / {totalCount} sinh viên
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 h-9 px-4 rounded-control bg-subtle text-text-secondary text-sm font-medium hover:bg-border transition-colors cursor-pointer"
          >
            <Download size={16} />
            Xuất danh sách
          </button>
          {canEdit && onAddStudent && (
            <button
              onClick={onAddStudent}
              className="flex items-center gap-2 h-9 px-4 rounded-control bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer"
            >
              <Plus size={16} />
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
              className="flex-1 min-w-[140px] sm:w-56 md:w-64 h-9 px-4 rounded-control border border-border bg-surface text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent shrink-0"
            />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-control border border-border overflow-x-auto w-full">
        <table className="w-full min-w-[920px] text-sm border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-subtle border-b border-border">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 md:px-6 md:py-4 text-left text-label font-medium text-text-secondary whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {sortedStudents.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-text-muted">
                  Chưa có sinh viên nào
                </td>
              </tr>
            ) : (
              sortedStudents.map((s, i) => (
                <tr key={s.id ?? i} className="hover:bg-subtle transition-colors duration-100">
                  <td className="px-4 py-3 md:px-6 md:py-4 text-text-secondary font-medium text-xs">{i + 1}</td>
                  <td className="px-4 py-3 md:px-6 md:py-4">
                    <span className="font-mono text-sm font-medium text-text-primary leading-none">
                      {s.mssv}
                    </span>
                  </td>
                  <td className="px-4 py-3 md:px-6 md:py-4 text-text-primary">
                    <div className="flex items-center gap-3">
                      <LastNameAvatar name={s.name || "—"} avatar={s.avatar} index={i} />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-medium text-text-primary text-sm leading-none truncate">
                          {s.name}
                        </span>
                        {s.isLeader && (
                          <span className="text-label text-text-secondary mt-1">
                            Nhóm trưởng
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 md:px-6 md:py-4">
                    <span className="text-text-secondary text-xs leading-none">
                      {s.email}
                    </span>
                  </td>

                  {hasGroups && (
                    <td className="px-4 py-3 md:px-6 md:py-4 text-text-primary font-medium text-xs">
                      {s.groupId != null ? (
                        <span className="font-medium text-text-primary">{s.groupName ?? "—"}</span>
                      ) : (
                        <span className="text-text-muted italic">Chưa phân nhóm</span>
                      )}
                    </td>
                  )}

                  <td className="px-4 py-3 md:px-6 md:py-4">
                    {s.accountActivated ? (
                      <StatusBadge status="success" label="Đã kích hoạt" />
                    ) : (
                      <StatusBadge status="warning" label="Chưa kích hoạt" />
                    )}
                  </td>

                  {canEdit && (
                    <td className="px-4 py-3 md:px-6 md:py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditStudent?.(s)}
                          title="Sửa thông tin"
                          className="p-2 rounded-control text-text-muted hover:bg-subtle hover:text-text-primary transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteStudent?.(s)}
                          disabled={s.groupId != null}
                          title={s.groupId != null ? "Không thể xóa sinh viên đã có nhóm" : "Xóa khỏi lớp"}
                          className={`p-2 rounded-control transition-colors ${
                            s.groupId != null
                              ? "text-border cursor-not-allowed"
                              : "text-text-muted hover:bg-danger-bg hover:text-danger-text"
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
