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
}) {
  const rows = [
    [
      { label: "Mã lớp học",           value: classCode },
      { label: "Giảng viên phụ trách", value: lecturer  },
    ],
    [
      { label: "Môn học", value: subject  },
      { label: "Học kỳ", value: semester },
    ],
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 w-full">

      {/* Title */}
      <h2 className="text-sm md:text-base font-bold text-gray-900 mb-5">
        Thông tin lớp học
      </h2>

      {/* Rows */}
      <div className="flex flex-col divide-y divide-gray-100">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 first:pt-0 last:pb-0">
            {row.map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  );
}