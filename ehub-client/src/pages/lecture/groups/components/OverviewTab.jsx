import { 
  CheckCircle2, Clock, Eye, BarChart2 
} from "lucide-react";
import { Avatar, StatusBadge, ProgressBar, Skeleton } from "./Common";

/**
 * Overview Tab Component
 */
export default function OverviewTab({ 
  checkpoints = [], 
  members = [], 
  loading, 
  onViewAllMembers, 
  onViewCheckpointDetail 
}) {
  const total = checkpoints.length;
  const done = checkpoints.filter((c) => c.status === "graded").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const memberPreview = members.slice(0, 3);

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 mt-6 md:mt-8">
        <div className="flex-1 space-y-4 w-full">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="w-full lg:w-72 h-60 shrink-0" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-6 md:mt-8 items-start">
      {/* Left: Progress & Recent Checkpoints */}
      <div className="flex-1 space-y-6 min-w-0 w-full">
        {/* Progress Card */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 md:p-6 shadow-sm w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-indigo-500" />
              <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">
                Tiến độ Checkpoint
              </p>
            </div>
            <span className="font-bold text-indigo-600 text-base">
              {pct}%
            </span>
          </div>
          
          <ProgressBar value={pct} className="h-3 mb-4" />
          
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            {done} / {total} checkpoint đã hoàn thành
          </div>
        </div>

        {/* Recent Checkpoints */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-sm font-bold text-gray-800 tracking-tight uppercase">
              Checkpoint gần nhất
            </p>
          </div>
          
          <div className="space-y-4">
            {checkpoints.length > 0 ? (
              checkpoints.slice(0, 3).map((cp) => (
                <div
                  key={cp.id}
                  className="bg-white border border-gray-100 rounded-2xl p-4 md:px-5 md:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      cp.status === "graded"
                        ? "bg-green-100 text-green-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {cp.status === "graded" ? (
                      <CheckCircle2 size={18} className="md:w-5 md:h-5" />
                    ) : (
                      <Clock size={18} className="md:w-5 md:h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate leading-tight mb-0.5 md:mb-1 group-hover:text-indigo-600 transition-colors">
                      {cp.name}
                    </p>
                    <p className="text-[11px] md:text-xs text-gray-400 font-medium">
                      Deadline: {cp.deadline}
                    </p>
                  </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 w-full sm:w-auto shrink-0 sm:ml-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-50">
                    <StatusBadge status={cp.status} />
                    <button
                      onClick={() => onViewCheckpointDetail?.(cp.id)}
                      className="p-1.5 md:p-2 rounded-xl bg-gray-50 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl py-8 text-center">
                <p className="text-sm text-gray-400 font-medium">Chưa có checkpoint nào được tạo.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Member Summary Card */}
      <div className="w-full lg:w-72 shrink-0 bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">
            Thành viên
          </p>
          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
            {members.length}
          </span>
        </div>
        
        <div className="space-y-4 md:space-y-5">
          {memberPreview.map((m, idx) => (
            <div key={m.id} className="flex items-center gap-3">
              <Avatar name={m.fullName || m.fullName || m.full_name} avatar={m.avatar} index={idx} />
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs md:text-sm font-semibold text-gray-800 truncate leading-tight">
                    {m.fullName || m.fullName || m.full_name}
                  </span>
                </div>
                {m.role === "leader" || m.isLeader ? (
                  <span className="text-[9px] md:text-[10px] font-bold text-emerald-600 w-fit leading-none tracking-tight">
                    NHÓM TRƯỞNG
                  </span>
                ) : (
                  <p className="text-[9px] md:text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                    {m.student_code || m.mssv}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {members.length > 3 && (
          <button
            onClick={onViewAllMembers}
            className="mt-8 w-full py-2.5 rounded-xl border border-indigo-100 text-xs text-indigo-600 font-bold hover:bg-indigo-50 transition-all uppercase tracking-wider shadow-sm cursor-pointer"
          >
            Xem tất cả TV
          </button>
        )}
      </div>
    </div>
  );
}
