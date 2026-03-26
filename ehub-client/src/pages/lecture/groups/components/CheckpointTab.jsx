import { 
  Calendar, Upload, FileText, ChevronRight, BarChart2 
} from "lucide-react";
import { Avatar, StatusBadge, ProgressBar, Skeleton } from "./Common";
import FileIcon from "@/components/icons/FileIcon";

/**
 * Checkpoint Tab Component
 */
export default function CheckpointTab({ checkpoints = [], loading, onViewDetail }) {
  const total = checkpoints.length;
  const done = checkpoints.filter((c) => c.status === "graded").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  if (loading) {
    return (
      <div className="mt-8 space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Overall Progress Section (Synced with Overview Tab) */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-indigo-500" />
            <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">
              Tiến độ hoàn thành
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

      {/* Checkpoint List */}
      <div className="space-y-4">
        {checkpoints.length > 0 ? (
          checkpoints.map((cp) => (
            <div
              key={cp.id}
              className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group"
            >
              <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
                {/* Left Info Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <p className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors tracking-tight">
                      {cp.name}
                    </p>
                    <StatusBadge status={cp.status} />
                  </div>
                  
                  <div className="flex items-center gap-6 text-xs text-gray-400 font-bold uppercase tracking-widest flex-wrap">
                    <span className="flex items-center gap-1.5 ">
                      <Calendar size={13} className="text-gray-300" /> Deadline: {cp.deadline}
                    </span>
                    {cp.submittedAt && (
                      <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                        <Upload size={13} /> Nộp lúc: {cp.submittedAt}
                      </span>
                    )}
                  </div>
                  
                  {/* Submitters Avatars */}
                  {cp.submitters?.length > 0 && (
                    <div className="flex items-center gap-2 mt-4 ml-0.5">
                      <div className="flex -space-x-2">
                        {cp.submitters.slice(0, 4).map((s, idx) => (
                          <Avatar 
                            key={s.id} 
                            name={s.fullName || s.full_name} 
                            avatar={s.avatar} 
                            index={idx} 
                          />
                        ))}
                      </div>
                      {cp.submitters.length > 4 && (
                        <span className="text-[10px] text-gray-400 font-extrabold ml-1.5">
                          +{cp.submitters.length - 4} TV khác
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Action Column */}
                <div className="flex flex-row-reverse md:flex-col items-center md:items-end justify-between gap-4 shrink-0 border-t md:border-t-0 md:border-l border-gray-50 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                  <button
                    onClick={() => onViewDetail?.(cp.id)}
                    className="flex items-center gap-1.5 px-5 py-2.5 md:px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] md:text-xs font-bold rounded-2xl transition-all shadow-md active:scale-95 uppercase tracking-widest whitespace-nowrap shrink-0"
                  >
                    Xem chi tiết <ChevronRight size={14} />
                  </button>
                  
                  {cp.files?.length > 0 && (
                    <div className="flex flex-col items-start md:items-end flex-1 md:flex-none">
                      <p className="hidden md:block text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mb-1.5">
                        {cp.files.length} Tệp đính kèm
                      </p>
                      <div className="flex items-center gap-2">
                        {cp.files.slice(0, 3).map((f) => (
                          <span
                            key={f.id}
                            className="w-5 h-7 md:w-6 md:h-8 flex items-center justify-center hover:-translate-y-0.5 transition-transform"
                            title={f.file_name || f.name}
                          >
                            <FileIcon ext={f.file_type || f.type || (f.file_name || f.name || "").split('.').pop()} className="w-full h-full" />
                          </span>
                        ))}
                        {cp.files.length > 3 && (
                          <span className="text-[10px] text-gray-400 font-bold ml-1 tracking-tighter">
                            +{cp.files.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl py-12 text-center">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest opacity-60">
              Nhóm chưa có checkpoint nào được tạo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
