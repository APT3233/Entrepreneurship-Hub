/**
 * RecentClasses
 *
 * Props:
 * - classes   : Array<{ id, code, studentCount, groupCount }>
 * - onViewAll : () => void  — callback nút "Xem tất cả"
 * - onSelect  : (classItem) => void  — click vào 1 lớp
 */
export default function RecentClasses({
  classes = [],
  onViewAll,
  onSelect,
}) {
  return (
    <div className="h-full w-full rounded-card border border-border bg-surface p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-text-primary">Lớp học gần đây</h2>
        <button
          onClick={onViewAll}
          className="text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-150 cursor-pointer"
        >
          Xem tất cả
        </button>
      </div>

      {/* List */}
      <ul className="flex flex-1 flex-col gap-2">
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
                  w-full text-left px-4 py-3 rounded-control
                  bg-subtle hover:bg-accent-bg cursor-pointer
                  transition-colors duration-150
                "
              >
                <p className="text-sm font-medium text-text-primary">
                  {item.code}
                </p>
                <p className="text-label text-text-secondary mt-0.5">
                  {item.studentCount} sinh viên
                  <span className="mx-1.5 text-text-muted">•</span>
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
