import { useMemo } from "react";
import StatusBadge from "@/components/ui/StatusBadge";

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
    <div className="bg-surface rounded-card border border-border p-6 w-full">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-lg font-medium text-text-primary">Thành viên nhóm</h2>
        <p className="text-label text-text-secondary">Tổng số: {totalCount} sinh viên</p>
      </div>

      <div className="rounded-control border border-border overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm border-collapse">
          <thead>
            <tr className="bg-subtle border-b border-border">
              {columns.map((col) => (
                <th key={col} className="px-5 py-4 text-left text-label font-medium text-text-secondary">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedMembers.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-text-muted italic">
                  Chưa có thành viên nào trong nhóm này.
                </td>
              </tr>
            ) : (
              sortedMembers.map((m, i) => (
                <tr key={m.id || i} className="hover:bg-subtle transition-colors">
                  <td className="px-5 py-4 text-text-secondary font-medium">{i + 1}</td>
                  <td className="px-5 py-4 font-medium text-text-primary">{m.student_code || m.mssv || "—"}</td>
                  <td className="px-5 py-4 text-text-primary">
                    <div className="flex flex-col">
                      <span className="font-medium">{m.name || m.fullname}</span>
                      {m.role === 'leader' && <span className="text-label text-accent font-medium">Nhóm trưởng</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">{m.email}</td>
                  <td className="px-5 py-4">
                     <StatusBadge status="neutral" label={m.major || "N/A"} />
                  </td>
                  <td className="px-5 py-4 capitalize font-medium text-text-secondary">
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
