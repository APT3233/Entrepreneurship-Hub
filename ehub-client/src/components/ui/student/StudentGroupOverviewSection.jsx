import { Info, Pencil, CheckCircle2, Calendar, FileText, BarChart3, User, BookOpen } from "lucide-react";
import { LastNameAvatar } from "@/components/icons/ui";
import { formatDate } from "@/utils/dateTimeDisplay";
import StatusBadge from "@/components/ui/StatusBadge";

/**
 * Component hiển thị một trường thông tin với nhãn, giá trị và nút Request đổi.
 */
function InfoField({ label, value, onRequestChange, isLongText = false, muted = false }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 py-5 first:pt-2 last:pb-2 border-b border-gray-50 last:border-0 group">
      <div className="flex-1">
        <p className="text-label text-text-secondary mb-1">{label}</p>
        <p className={`text-sm font-bold leading-relaxed ${muted ? "text-text-muted" : "text-gray-900"} ${isLongText ? "max-w-xl" : ""}`}>
          {value || "—"}
        </p>
      </div>
      {onRequestChange && (
        <button
          onClick={onRequestChange}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control border border-border bg-transparent text-text-secondary text-xs font-medium hover:bg-subtle transition-colors cursor-pointer"
        >
          <Pencil size={12} />
          Yêu cầu đổi
        </button>
      )}
    </div>
  );
}

export default function StudentGroupOverviewSection({ group }) {
  if (!group) return null;

  const members = Array.isArray(group.members) ? group.members : [];
  const activeMembers = Number(group.active_members) || 0;
  const maxMembers = Number(group.max_members) || 5;
  const isEnoughMembers = activeMembers >= maxMembers;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nhóm của tôi</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Quản lý thông tin nhóm và thành viên</p>
      </div>

      <div className="space-y-8">
        {/* Top Section: Info and Status Card (Same height) */}
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* Left: Group Information Card */}
          <div className="flex-1">
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Info size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Thông tin nhóm</h2>
              </div>

              <div className="space-y-1">
                <InfoField label="Tên nhóm" value={group.group_name} onRequestChange={() => {}} />
                <InfoField label="Lĩnh vực" value={group.category || "Chưa xác định"} muted={!group.category} onRequestChange={() => {}} />
                <InfoField label="Đề tài" value={group.topic || "Chưa có đề tài"} isLongText muted={!group.topic} onRequestChange={() => {}} />
                
                {/* Mentor Field */}
                <div className="py-5 border-b border-gray-50 group">
                  <p className="text-label text-text-secondary mb-3">Mentor</p>
                  <div className="flex items-center gap-3">
                    <LastNameAvatar name={group.mentor_display_name || "M"} index={7} />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{group.mentor_display_name?.replace(/\s*\(.*?\)/g, "") || "Chưa có Mentor"}</p>
                      <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">Khoa Công nghệ Thông tin</p>
                    </div>
                  </div>
                </div>

                <div className="py-5">
                  <p className="text-label text-text-secondary mb-1">Lớp</p>
                  <p className="text-sm font-bold text-gray-900">{group.class_code || "—"}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">{group.semester_name || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Group Status Card */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-8 px-2">
                <CheckCircle2 className="text-emerald-500 fill-emerald-500 text-white" size={24} strokeWidth={2.5} />
                <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Trạng thái nhóm</h2>
              </div>

              <div className="space-y-4 px-1">
                {/* Verified Status */}
                <div className="flex flex-col gap-2">
                  <StatusBadge status="success" label="Nhóm đã được xác nhận" />
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Giảng viên đã phê duyệt nhóm của bạn
                  </p>
                </div>

                {/* Members Status */}
                {!isEnoughMembers && (
                  <div className="flex flex-col gap-2">
                    <StatusBadge status="warning" label="Nhóm chưa đủ thành viên" />
                    <p className="text-sm text-text-secondary">
                      {activeMembers}/{maxMembers} thành viên đã tham gia
                    </p>
                  </div>
                )}

                <div className="pt-10 mt-10 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Thống kê</h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-gray-500">Ngày tạo nhóm</span>
                      <span className="text-[14px] font-bold text-gray-900">{formatDate(group.created_at) || "15/01/2026"}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-gray-500">Bài tập đã nộp</span>
                      <span className="text-[14px] font-bold text-gray-900">0/5</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-gray-500">Điểm trung bình</span>
                      <span className="text-[14px] font-bold text-emerald-600">0/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Members List */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <User size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Thành viên nhóm</h2>
                </div>
                <span className="px-4 py-1.5 rounded-xl bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-widest border border-gray-100">
                  {members.length} thành viên
                </span>
              </div>

              <div className="divide-y divide-gray-50 px-4">
                {members.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-gray-400 font-medium">Chưa có dữ liệu thành viên</p>
                  </div>
                ) : (
                  members.map((m, idx) => (
                    <div key={m.student_id || idx} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors rounded-2xl my-1 group">
                      <div className="flex items-center gap-4">
                        <LastNameAvatar name={m.full_name || "U"} index={idx} />
                        <div>
                      <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{m.full_name?.replace(/\s*\(.*?\)/g, "") || "—"}</p>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{m.student_code || "—"}</p>
                        </div>
                      </div>
                      <div>
                        {m.role === "leader" ? (
                          <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest border border-amber-100">
                            Nhóm trưởng
                          </span>
                        ) : m.status === "pending" ? (
                          <span className="px-3 py-1 rounded-lg bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-widest border border-orange-100">
                            Chờ xác nhận
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                            Thành viên
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          {/* Spacer to match sidebar width on desktop */}
          <div className="hidden lg:block lg:w-[400px] shrink-0"></div>
        </div>
      </div>
    </div>
  );
}
