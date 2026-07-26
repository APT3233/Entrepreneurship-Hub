/**
 * RecentClasses
 *
 * Props:
 * - classes   : Array<{ id, code, studentCount, groupCount }>
 * - onViewAll : () => void  — callback nút "Xem tất cả"
 * - onSelect  : (classItem) => void  — click vào 1 lớp
 */
import { BookOpen } from "lucide-react";

export default function RecentClasses({
  classes = [],
  onViewAll,
  onSelect,
}) {
  return (
    <div className="h-full w-full rounded-card bg-surface p-5 shadow-card">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-accent-bg text-accent">
            <BookOpen size={17} />
          </span>
          <h2 className="text-base font-semibold text-text-primary">Lớp học gần đây</h2>
        </div>
        <button
          onClick={onViewAll}
          className="text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-150 cursor-pointer"
        >
          Xem tất cả
        </button>
      </div>

      {/* List */}
      <ul className="flex flex-1 flex-col gap-3">
        {classes.length === 0 ? (
          <li className="text-sm text-text-muted text-center py-6">
            Chưa có lớp học nào
          </li>
        ) : (
          classes.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSelect?.(item)}
                className="
                  w-full text-left px-4 py-3.5 rounded-xl
                  bg-subtle hover:bg-accent-bg cursor-pointer
                  transition-colors duration-150 group
                "
              >
                <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors duration-150">
                  {item.code}
                </p>
                <p className="text-sm text-text-muted mt-0.5">
                  {item.studentCount} sinh viên
                  <span className="mx-1.5">•</span>
                  {item.groupCount} nhóm
                </p>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}