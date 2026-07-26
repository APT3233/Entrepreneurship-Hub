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
import Card from "@/components/ui/Card/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import Banner from "@/components/ui/Banner";
import StatCard from "@/components/ui/Card/StatCard";

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
        return <StatusBadge status="success" label="Đủ điều kiện" />;
      case 'needs_review':
        return <StatusBadge status="warning" label="Cần review" />;
      default:
        return <StatusBadge status="danger" label="Chưa đạt" />;
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
          <Card className="p-6">
            <div className="flex flex-col h-full justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-control bg-subtle text-text-secondary text-xs font-medium mb-4">
                  <Target size={12} />
                  Dự án hiện tại
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-lg font-medium text-text-primary leading-tight">
                    {group.group_name || "Tên nhóm chưa cập nhật"}
                  </h2>
                  {getStatusBadge(memberStats.status)}
                </div>
                {group.topic && (
                  <p className="text-text-secondary text-sm max-w-xl line-clamp-2 leading-relaxed">
                    {group.topic}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-label text-text-secondary">
                  {group.mentor_display_name?.replace(/\s*\(.*?\)/g, "") || "Chưa có Mentor"}
                  <span className="text-text-muted"> · </span>
                  Lớp {group.class_code || "—"}
                  <span className="text-text-muted"> · </span>
                  {group.category || "—"}
                </p>
                <Link
                  to="/student/groups"
                  className="inline-flex items-center gap-2 px-4 h-9 rounded-control bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
                >
                  Chi tiết nhóm
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </Card>

          {!group.topic && (
            <div className="mt-4">
              <Banner variant="warning" icon={<Target size={16} />}>
                Đề tài dự án chưa được thiết lập. Hãy thảo luận với Mentor để cập nhật đề tài.
              </Banner>
            </div>
          )}

          {/* Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {stats.map((stat, idx) => (
              <Link key={idx} to={stat.to} className="block h-full">
                <StatCard title={stat.label} value={stat.value} className="h-full" />
              </Link>
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
                  title={group.zalo_link ? "Mở nhóm Zalo" : "Nhóm chưa có liên kết Zalo"}
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
