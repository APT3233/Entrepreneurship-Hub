import { useMemo } from "react";

/**
 * MemberList — Displays the list of students in a single group.
 */
export default function MemberList({
  members = [],
  totalCount = 0,
}) {
  const columns = ["STT", "MSSV", "Họ và tên", "Email", "Chuyên ngành", "Vai trò"];

  const sortedMembers = useMemo(() => {
     // Leader first, then rest
     return [...members].sort((a, b) => {
        if (a.role === 'leader' && b.role !== 'leader') return -1;
        if (a.role !== 'leader' && b.role === 'leader') return 1;
        return (a.student_code || "").localeCompare(b.student_code || "");
     });
  }, [members]);

  return (
    <div className="bg-surface rounded-2xl shadow-card p-6 w-full">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-lg font-bold text-text-primary">Thành viên nhóm</h2>
        <p className="text-xs text-text-muted">Tổng số: {totalCount} sinh viên</p>
      </div>

      <div className="rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full min-w-[600px] text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-border">
              {columns.map((col) => (
                <th key={col} className="px-5 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedMembers.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-text-muted font-medium italic">
                  Chưa có thành viên nào trong nhóm này.
                </td>
              </tr>
            ) : (
              sortedMembers.map((m, i) => (
                <tr key={m.id || i} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-4 text-text-secondary font-medium">{i + 1}</td>
                  <td className="px-5 py-4 font-bold text-text-primary">{m.student_code || m.mssv || "—"}</td>
                  <td className="px-5 py-4 text-text-primary">
                    <div className="flex flex-col">
                      <span className="font-semibold">{m.name || m.fullname}</span>
                      {m.role === 'leader' && <span className="text-[10px] text-accent-500 font-bold uppercase tracking-tighter">Group Leader</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-text-muted italic">{m.email}</td>
                  <td className="px-5 py-4">
                     <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border
                        ${m.major === 'IT' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                          m.major === 'Design' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                          'bg-green-50 text-green-600 border-green-100'}`}>
                        {m.major || "N/A"}
                     </span>
                  </td>
                  <td className="px-5 py-4 capitalize font-semibold text-text-secondary">
                    {m.role || "member"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
