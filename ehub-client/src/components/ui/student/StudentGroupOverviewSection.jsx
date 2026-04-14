import StatCard from "@/components/ui/Card/StatCard";
import { LastNameAvatar } from "@/components/icons/ui";
import { Users, TrendingUp, BookOpenText, CircleCheckBig, ShieldCheck } from "lucide-react";

export default function StudentGroupOverviewSection({ group }) {
  if (!group) return null;
  const groupName = group.group_name || "—";
  const classCode = group.class_code || "—";
  const semesterName = group.semester_name || "—";
  const mentorName = group.mentor_display_name || "—";
  const activeMembers = Number(group.active_members) || 0;
  const maxMembers = Number(group.max_members) || 0;
  const progressText = maxMembers > 0 ? `${activeMembers}/${maxMembers}` : `${activeMembers}`;
  const isEnoughMembers = maxMembers > 0 ? activeMembers >= maxMembers : activeMembers > 0;
  const members = Array.isArray(group.members) ? group.members : [];

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          title="Nhóm của tôi"
          value={groupName}
          icon={<Users size={20} />}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Tiến độ"
          value={progressText}
          icon={<TrendingUp size={20} />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
          <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-violet-600">
              <BookOpenText className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">Thông tin môn học</h2>
          </header>
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:px-5">
              <p className="text-sm text-slate-500">Môn học:</p>
              <p className="text-right text-sm font-semibold text-slate-900">{classCode}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:px-5">
              <p className="text-sm text-slate-500">Học kỳ:</p>
              <p className="text-right text-sm font-semibold text-slate-900">{semesterName}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:px-5">
              <p className="text-sm text-slate-500">Mentor:</p>
              <p className="text-right text-sm font-semibold text-slate-900">{mentorName}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
              <CircleCheckBig className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">Trạng thái nhóm</h2>
          </header>
          <div className="space-y-3 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              <CircleCheckBig className="h-4 w-4 shrink-0" />
              Nhóm đã được xác nhận
            </div>
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${isEnoughMembers ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"}`}>
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {isEnoughMembers ? "Nhóm đủ thành viên" : "Nhóm chưa đủ thành viên"}
            </div>
            <div className="rounded-xl border border-slate-100">
              <div className="px-3 pt-3">
                <h3 className="text-sm font-bold text-slate-900">{groupName}</h3>
              </div>
              <div className="mt-2 max-h-52 divide-y divide-slate-100 overflow-auto px-3 pb-2">
                {members.length === 0 ? (
                  <p className="py-3 text-sm text-slate-500">Chưa có dữ liệu thành viên.</p>
                ) : (
                  members.map((m, idx) => (
                    <div key={`${m.student_id || idx}`} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <LastNameAvatar name={m.full_name || "—"} index={idx} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{m.full_name || "—"}</p>
                          <p className="truncate text-xs text-slate-500">{m.student_code || "—"}</p>
                        </div>
                      </div>
                      {m.role === "leader" && <span className="rounded-full bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700">Leader</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
