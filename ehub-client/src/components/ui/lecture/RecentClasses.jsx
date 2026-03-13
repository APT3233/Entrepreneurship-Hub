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
    <div className="h-full w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">Lớp học gần đây</h2>
        <button
          onClick={onViewAll}
          className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors duration-150 cursor-pointer"
        >
          Xem tất cả
        </button>
      </div>

      {/* List */}
      <ul className="flex flex-1 flex-col gap-3">
        {classes.length === 0 ? (
          <li className="text-sm text-gray-400 text-center py-6">
            Chưa có lớp học nào
          </li>
        ) : (
          classes.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSelect?.(item)}
                className="
                  w-full text-left px-4 py-3.5 rounded-xl
                  bg-gray-50 hover:bg-indigo-50 cursor-pointer
                  transition-colors duration-150 group
                "
              >
                <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-700 transition-colors duration-150">
                  {item.code}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">
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