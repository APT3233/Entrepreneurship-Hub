import { Info, Edit } from "lucide-react";

/**
 * GroupInfo Component
 * - Displays group overview information: Name, Mentor, Category, Topic, and Class.
 */
export default function GroupInfo({
  name = "Alpha",
  category = "Web Development",
  mentor = {
    name: "Nguyễn Văn A",
    department: "Khoa Công nghệ Thông tin",
    avatar: null,
  },
  classInfo = {
    code: "EXE101",
    semester: "Fall 2026",
  },
  topic = "E-commerce Platform for Local Businesses",
  topicDescription = "Mô tả ngắn gọn khoảng 15 - 20 từ",
  zaloLink = null,
  onEdit,
  canEdit = true,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
            <Info size={14} className="text-white" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 tracking-tight">
            Thông tin nhóm
          </h2>
        </div>

        {canEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-indigo-100 bg-white text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors shadow-sm"
          >
            <Edit size={14} className="text-indigo-500" />
            Chỉnh sửa
          </button>
        )}
      </div>

      {/* Body Content */}
      <div className="px-6 py-6 flex flex-col gap-8">
        {/* Row 1: Group Name & Categories */}
        <div className="grid grid-cols-2 gap-4 md:gap-8">
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Tên nhóm
            </span>
            <span className="text-sm md:text-base font-semibold text-gray-800 truncate">{name}</span>
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Categories
            </span>
            <button className="text-left text-xs md:text-sm font-semibold text-indigo-600 hover:underline truncate">
              {category}
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-gray-200" />

        {/* Row 2: Mentor & ClassInfo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-400 capitalize">
              Mentor
            </span>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {mentor?.avatar ? (
                  <img
                    src={mentor.avatar}
                    alt={mentor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-gray-400">
                    {mentor?.name?.split(" ").pop()?.charAt(0) || "M"}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800 leading-snug">
                  {mentor?.name}
                </span>
                <span className="text-xs text-gray-400">
                  {mentor?.department}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-400 capitalize">
              Lớp / Môn học
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-gray-800 uppercase tracking-wide">
                {classInfo?.code}
              </span>
              <span className="text-xs font-medium text-gray-400">
                {classInfo?.semester}
              </span>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-gray-200" />

        {/* Row 3: Topic & Zalo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Topic
            </span>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold text-gray-800 leading-relaxed tracking-tight break-words">
                {topic}
              </h3>
              <p className="text-xs text-gray-400 break-words">{topicDescription}</p>
            </div>
          </div>
          
          {zaloLink && (
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                Link Zalo
              </span>
              <a 
                href={zaloLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1.5"
              >
                Tham gia nhóm Zalo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
