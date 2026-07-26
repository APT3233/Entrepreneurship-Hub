import { Trash2, Settings2 } from "lucide-react";
import { formatDate } from "@/utils/dateTimeDisplay";

/**
 * ClassInfo — Thông tin lớp học
 *
 * Props:
 * - classCode   : string  — Mã lớp (vd: "GD18D01")
 * - lecturer    : string  — Giảng viên phụ trách
 * - subject     : string  — Môn học
 * - semester    : string  — Học kỳ (vd: "Fall 2026")
 */
export default function ClassInfo({
  classCode = "GD18D01",
  lecturer  = "TS. Nguyễn Văn B",
  subject   = "EXE404",
  semester  = "Fall 2026",
  semesterStatus = null,
  createdAt = null,
  updatedAt = null,
  isNewlyCreated = false,
  manipulationDays = 7,
  onDelete = null,
  onEdit = null,
}) {
  const rows = [
    [
      { label: "Ngày tạo", value: formatDate(createdAt) },
      { label: "Cập nhật mới nhất", value: formatDate(updatedAt) },
    ],
  ];

  const calculateRemainingTime = () => {
    if (!createdAt) return null;
    const createdDate = new Date(createdAt);
    const lockDate = new Date(createdDate.getTime() + manipulationDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = lockDate - now;
    
    if (diff <= 0) return "Đã hết thời gian chỉnh sửa";
    
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    
    let parts = [];
    if (days > 0) parts.push(`${days} ngày`);
    if (hours > 0) parts.push(`${hours} giờ`);
    if (minutes > 0) parts.push(`${minutes} phút`);
    
    return parts.length > 0 ? parts.join(" ") : "ít hơn 1 phút";
  };

  const remainingTime = calculateRemainingTime();

  return (
    <div className="bg-surface rounded-card shadow-card px-6 py-5 w-full">

      {/* Title */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm md:text-base font-semibold text-text-primary">
          Chi tiết & cài đặt lớp
        </h2>

        <div className="flex items-center gap-2">
          {(semesterStatus === "upcoming" || isNewlyCreated) && onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-accent-600 bg-accent-50 hover:bg-accent-100 border border-accent-100 transition-colors shadow-sm cursor-pointer"
            >
              <Settings2 size={14} />
              Sửa thông tin
            </button>
          )}

          {(semesterStatus === "upcoming" || isNewlyCreated) && onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors shadow-sm cursor-pointer"
            >
              <Trash2 size={14} />
              Xóa lớp học
            </button>
          )}
        </div>
      </div>

      {/* Note for Lecturer */}
      {(semesterStatus === "upcoming" || isNewlyCreated) && (
        <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-[11px] text-amber-800 font-bold mb-1 uppercase tracking-wider flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Thời gian còn lại để chỉnh sửa: {remainingTime}
          </p>
          <ul className="list-disc list-inside flex flex-col gap-0.5">
            <li className="text-[11px] text-amber-700 leading-relaxed">
              Bạn có thể thêm sinh viên, xóa sinh viên và sửa thông tin của sinh viên.
            </li>
            <li className="text-[11px] text-amber-700 leading-relaxed italic">
              Lớp học sẽ tự động khóa sau {manipulationDays} ngày kể từ ngày tạo nếu không thuộc học kỳ sắp diễn ra.
            </li>
          </ul>
        </div>
      )}

      {/* Rows */}
      <div className="flex flex-col divide-y divide-border">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 first:pt-0 last:pb-0">
            {row.map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-sm font-semibold text-text-primary">{value}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  );
}