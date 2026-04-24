import React from "react";
import { 
  Users, 
  Target, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Layout,
  MessageCircle,
  FileText,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { LastNameAvatar } from "@/components/icons/ui";
import { Link } from "react-router-dom";

/**
 * Stat Card component for the dashboard
 */
function StatCard({ icon: Icon, label, value, iconColor, bgColor, subValue, to }) {
  const content = (
    <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group h-full cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${bgColor} flex items-center justify-center transition-colors`}>
          <Icon className={`${iconColor}`} size={20} strokeWidth={2.5} />
        </div>
        {subValue && (
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subValue}</span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-black text-gray-900 tracking-tight">{value}</p>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block h-full">{content}</Link>;
  }

  return content;
}

export default function StudentDashboardOverview({ group, user, statsData, loading }) {
  if (!group) return null;

  const members = Array.isArray(group.members) ? group.members : [];
  const activeMembers = Number(group.active_members) || 0;
  const maxMembers = Number(group.max_members) || 5;

  const cpStats = statsData?.checkpointStats || { submitted: 0, total: 0, pending: 0, avgScore: 0 };
  const memberStats = statsData?.group?.memberStats || { status: 'ineligible', de: 0, dsda: 0 };

  const stats = [
    { 
      icon: FileText, 
      label: "Bài tập nộp", 
      value: `${cpStats.submitted}/${cpStats.total}`, 
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      subValue: "Tiến độ",
      to: "/student/assignments"
    },
    { 
      icon: Clock, 
      label: "Checkpoint chờ", 
      value: cpStats.pending > 0 ? `${cpStats.pending} bài` : "Xong", 
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      subValue: "Cần xử lý",
      to: "/student/assignments?tab=checkpoints"
    },
    { 
      icon: Users, 
      label: "Thành viên", 
      value: `${activeMembers}/${maxMembers}`, 
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      subValue: "Nhóm",
      to: "/student/groups"
    },
    { 
      icon: CheckCircle2, 
      label: "Điểm TB", 
      value: cpStats.avgScore.toFixed(1), 
      iconColor: "text-violet-600",
      bgColor: "bg-violet-50",
      subValue: "Kết quả",
      to: "/student/assignments"
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'eligible':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">Đủ điều kiện</span>;
      case 'needs_review':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">Cần review</span>;
      default:
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">Chưa đạt</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Chào {user?.full_name?.replace(/\s*\(.*?\)/g, "") || "bạn"}, 👋
          </h1>
          <p className="text-gray-500 font-medium mt-1">Chúc bạn một ngày học tập và làm việc hiệu quả!</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
          <Calendar size={16} className="text-indigo-500" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            {new Date().toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Project Banner */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] p-8 text-white shadow-lg shadow-indigo-200">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl" />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest">
                    <Target size={12} />
                    Dự án hiện tại
                  </div>
                  {getStatusBadge(memberStats.status)}
                </div>
                <h2 className="text-2xl font-black mb-3 leading-tight">
                  {group.group_name || "Tên nhóm chưa cập nhật"}
                </h2>
                <p className="text-indigo-50/80 text-sm font-medium max-w-xl line-clamp-2 mb-8 leading-relaxed">
                  {group.topic || "Đề tài dự án chưa được thiết lập. Hãy thảo luận với Mentor để cập nhật đề tài."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 mt-4">
                <div className="flex items-center gap-3">
                  <LastNameAvatar name={group.mentor_display_name || "M"} index={7} size="sm" className="border-2 border-white/20" />
                  <div>
                    <p className="text-[10px] font-bold text-indigo-100/60 uppercase tracking-widest">Mentor</p>
                    <p className="text-xs font-bold">{group.mentor_display_name?.replace(/\s*\(.*?\)/g, "") || "Chưa có Mentor"}</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/20 hidden sm:block" />
                <div>
                  <p className="text-[10px] font-bold text-indigo-100/60 uppercase tracking-widest">Lớp học</p>
                  <p className="text-xs font-bold">{group.class_code || "—"}</p>
                </div>
                <div className="h-8 w-px bg-white/20 hidden sm:block" />
                <div>
                  <p className="text-[10px] font-bold text-indigo-100/60 uppercase tracking-widest">Lĩnh vực</p>
                  <p className="text-xs font-bold">{group.category || "—"}</p>
                </div>
                <div className="h-8 w-px bg-white/20 hidden sm:block" />
                <Link 
                  to="/student/groups" 
                  className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-indigo-600 text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  Chi tiết nhóm
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {stats.map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </div>
        </div>

        {/* Sidebar: Recent Members / Quick Actions */}
        <div className="space-y-8">
          {/* Members List */}
          <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users size={16} className="text-indigo-500" />
                Thành viên ({members.length})
              </h3>
              <Link to="/student/groups" className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-widest">Tất cả</Link>
            </div>
            
            <div className="max-h-[190px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-100 scrollbar-track-transparent">
              <div className="space-y-1">
                {members.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors group">
                    <LastNameAvatar name={m.full_name || "U"} index={idx} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {m.full_name?.replace(/\s*\(.*?\)/g, "")}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        {m.role === 'leader' ? 'Nhóm trưởng' : 'Thành viên'}
                      </p>
                    </div>
                    {m.role === 'leader' && <CheckCircle2 size={12} className="text-amber-400 fill-amber-400" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-6 px-2">Lối tắt nhanh</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link 
                to="/student/assignments" 
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-all group"
              >
                <Layout size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Nộp bài tập</span>
              </Link>
              
              <div className="group relative">
                <a 
                  href={group.zalo_link || "#"} 
                  target={group.zalo_link ? "_blank" : "_self"}
                  rel="noreferrer"
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 transition-all duration-300 h-full ${group.zalo_link ? 'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100 hover:-translate-y-1' : 'opacity-50 cursor-not-allowed text-gray-400'}`}
                >
                  <MessageCircle size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Nhóm Zalo</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
