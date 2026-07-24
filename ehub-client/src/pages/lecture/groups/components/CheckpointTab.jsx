import {
  Calendar, Upload, ChevronRight, BarChart2
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
      <div className="bg-subtle rounded-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-text-muted" />
            <p className="text-label text-text-secondary">
              Tiến độ hoàn thành
            </p>
          </div>
          <span className="font-medium text-text-primary text-base">
            {pct}%
          </span>
        </div>

        <ProgressBar value={pct} className="h-2 mb-4" />

        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="w-2 h-2 rounded-full bg-accent" />
          {done} / {total} checkpoint đã hoàn thành
        </div>
      </div>

      {/* Checkpoint List */}
      <div className="space-y-4">
        {checkpoints.length > 0 ? (
          checkpoints.map((cp) => (
            <div
              key={cp.id}
              className="bg-surface border border-border rounded-card p-6 transition-colors hover:border-border-strong"
            >
              <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
                {/* Left Info Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <p className="font-medium text-text-primary">
                      {cp.name}
                    </p>
                    <StatusBadge status={cp.status} />
                  </div>

                  <div className="flex items-center gap-6 text-label text-text-secondary flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-text-muted" /> Deadline: {cp.deadline}
                    </span>
                    {cp.submittedAt && (
                      <span className="flex items-center gap-1.5 text-success-text">
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
                        <span className="text-label text-text-secondary ml-1.5">
                          +{cp.submitters.length - 4} TV khác
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Action Column */}
                <div className="flex flex-row-reverse md:flex-col items-center md:items-end justify-between gap-4 shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                  <button
                    onClick={() => onViewDetail?.(cp.id)}
                    className="flex items-center gap-1.5 h-9 px-5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-control transition-colors whitespace-nowrap shrink-0"
                  >
                    Xem chi tiết <ChevronRight size={14} />
                  </button>

                  {cp.files?.length > 0 && (
                    <div className="flex flex-col items-start md:items-end flex-1 md:flex-none">
                      <p className="hidden md:block text-label text-text-secondary mb-1.5">
                        {cp.files.length} tệp đính kèm
                      </p>
                      <div className="flex items-center gap-2">
                        {cp.files.slice(0, 3).map((f) => (
                          <span
                            key={f.id}
                            className="w-5 h-7 md:w-6 md:h-8 flex items-center justify-center"
                            title={f.file_name || f.name}
                          >
                            <FileIcon ext={f.file_type || f.type || (f.file_name || f.name || "").split('.').pop()} className="w-full h-full" />
                          </span>
                        ))}
                        {cp.files.length > 3 && (
                          <span className="text-label text-text-secondary ml-1">
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
          <div className="bg-subtle border border-dashed border-border rounded-card py-12 text-center">
            <p className="text-sm text-text-muted">
              Nhóm chưa có checkpoint nào được tạo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
