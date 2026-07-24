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
        <div className="bg-subtle rounded-card p-4 md:p-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-text-muted" />
              <p className="text-label text-text-secondary">
                Tiến độ checkpoint
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

        {/* Recent Checkpoints */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-sm font-medium text-text-primary">
              Checkpoint gần nhất
            </p>
          </div>

          <div className="space-y-4">
            {checkpoints.length > 0 ? (
              checkpoints.slice(0, 3).map((cp) => (
                <div
                  key={cp.id}
                  className="bg-surface border border-border rounded-card p-4 md:px-5 md:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 transition-colors hover:border-border-strong"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-control flex items-center justify-center shrink-0 ${
                      cp.status === "graded"
                        ? "bg-success-bg text-success-text"
                        : "bg-warning-bg text-warning-text"
                    }`}
                  >
                    {cp.status === "graded" ? (
                      <CheckCircle2 size={18} className="md:w-5 md:h-5" />
                    ) : (
                      <Clock size={18} className="md:w-5 md:h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate leading-tight mb-0.5 md:mb-1">
                      {cp.name}
                    </p>
                    <p className="text-label text-text-secondary">
                      Deadline: {cp.deadline}
                    </p>
                  </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 w-full sm:w-auto shrink-0 sm:ml-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-border">
                    <StatusBadge status={cp.status} />
                    <button
                      onClick={() => onViewCheckpointDetail?.(cp.id)}
                      className="p-2 rounded-control bg-subtle text-text-secondary hover:bg-border transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-subtle border border-dashed border-border rounded-card py-8 text-center">
                <p className="text-sm text-text-muted">Chưa có checkpoint nào được tạo.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Member Summary Card */}
      <div className="w-full lg:w-72 shrink-0 bg-surface border border-border rounded-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <p className="text-label text-text-secondary">
            Thành viên
          </p>
          <span className="text-xs font-medium text-text-secondary bg-subtle px-2 py-1 rounded-control">
            {members.length}
          </span>
        </div>

        <div className="space-y-4 md:space-y-5">
          {memberPreview.map((m, idx) => (
            <div key={m.id} className="flex items-center gap-3">
              <Avatar name={m.fullName || m.fullName || m.full_name} avatar={m.avatar} index={idx} />
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-sm font-medium text-text-primary truncate leading-tight">
                    {m.fullName || m.fullName || m.full_name}
                  </span>
                </div>
                {m.role === "leader" || m.isLeader ? (
                  <span className="text-label font-medium text-accent w-fit leading-none">
                    Nhóm trưởng
                  </span>
                ) : (
                  <p className="text-label text-text-secondary">
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
            className="mt-8 w-full h-9 rounded-control border border-border text-sm text-text-secondary font-medium hover:bg-subtle transition-colors cursor-pointer"
          >
            Xem tất cả thành viên
          </button>
        )}
      </div>
    </div>
  );
}
