import { Avatar, Skeleton } from "./Common";

/**
 * Members Tab Component
 */
export default function MembersTab({ members = [], loading }) {
  if (loading) {
    return (
      <div className="mt-6 md:mt-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const MAJOR_CONFIG = {
    IT: "text-blue-600 bg-blue-50 border-blue-100",
    "Kinh tế": "text-emerald-600 bg-emerald-50 border-emerald-100",
    Design: "text-purple-600 bg-purple-50 border-purple-100",
  };

  const getMajorStyle = (major) => {
    return MAJOR_CONFIG[major] ?? "text-gray-500 bg-gray-50 border-gray-100";
  };

  return (
    <div className="mt-6 md:mt-8 mb-10">
      <div className="mb-4 md:mb-6 flex flex-row items-center justify-between gap-3">
        <p className="text-sm md:text-base font-semibold text-gray-900 tracking-tight">
          Danh sách sinh viên
        </p>
        <span className="text-xs md:text-sm text-gray-500 font-medium">
          {members.length} thành viên
        </span>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left border-collapse whitespace-nowrap min-w-[600px]">
            <thead>
              <tr className="bg-indigo-50/20 border-b border-gray-50">
                <th className="px-4 py-4 md:px-6 md:py-5 text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  MSSV
                </th>
                <th className="px-4 py-4 md:px-6 md:py-5 text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Họ và tên
                </th>
                <th className="px-4 py-4 md:px-6 md:py-5 ml-2 text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Email
                </th>
                <th className="px-4 py-4 md:px-6 md:py-5 text-[10px] md:text-[11px] font-extrabold text-gray-400 uppercase tracking-widest text-center">
                  Chuyên ngành
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((m, idx) => (
                <tr
                  key={m.id}
                  className="hover:bg-indigo-50/10 transition-colors group cursor-default"
                >
                  <td className="px-4 py-3 md:px-6 md:py-5">
                    <span className="font-mono text-[11px] md:text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg group-hover:bg-white transition-colors">
                      {m.student_code || m.mssv}
                    </span>
                  </td>
                  <td className="px-4 py-3 md:px-6 md:py-5">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={(m.fullName || m.full_name || "N A")}
                        avatar={m.avatar}
                        index={idx}
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-800 text-xs md:text-sm leading-none group-hover:text-indigo-600 transition-colors">
                          {m.fullName || m.full_name}
                        </span>
                        {(m.role === "leader" || m.isLeader) && (
                          <p className="text-[9px] md:text-[10px] text-emerald-600 font-bold uppercase tracking-tight mt-1">
                            Nhóm trưởng
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 md:px-6 md:py-5">
                    <span className="text-gray-400 font-medium text-[11px] md:text-xs leading-none">
                      {m.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 md:px-6 md:py-5 text-center">
                    <span
                      className={`text-[9px] md:text-[10px] font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full border uppercase tracking-wider ${getMajorStyle(
                        m.major || m.major
                      )} shadow-sm`}
                    >
                      {m.major || m.major || "Chưa cập nhật"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
