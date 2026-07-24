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
    <div className="bg-surface rounded-card border border-border overflow-hidden w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-accent-bg flex items-center justify-center">
            <Info size={14} className="text-accent" />
          </div>
          <h2 className="text-base font-medium text-text-primary">
            Thông tin nhóm
          </h2>
        </div>

        {canEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 h-9 px-4 rounded-control border border-border bg-surface text-text-secondary font-medium text-sm hover:bg-subtle transition-colors"
          >
            <Edit size={14} />
            Chỉnh sửa
          </button>
        )}
      </div>

      {/* Body Content */}
      <div className="px-6 py-6 flex flex-col gap-8">
        {/* Row 1: Group Name & Categories */}
        <div className="grid grid-cols-2 gap-4 md:gap-8">
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-label text-text-secondary">
              Tên nhóm
            </span>
            <span className="text-base font-medium text-text-primary truncate">{name}</span>
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-label text-text-secondary">
              Lĩnh vực
            </span>
            <button className="text-left text-sm font-medium text-accent hover:underline truncate">
              {category}
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-border" />

        {/* Row 2: Mentor & ClassInfo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-1.5">
            <span className="text-label text-text-secondary">
              Mentor
            </span>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-subtle border border-border flex items-center justify-center overflow-hidden shrink-0">
                {mentor?.avatar ? (
                  <img
                    src={mentor.avatar}
                    alt={mentor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium text-text-muted">
                    {mentor?.name?.split(" ").pop()?.charAt(0) || "M"}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-text-primary leading-snug">
                  {mentor?.name}
                </span>
                <span className="text-label text-text-secondary">
                  {mentor?.department}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-label text-text-secondary">
              Lớp
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-medium text-text-primary">
                {classInfo?.code}
              </span>
              <span className="text-label text-text-secondary">
                {classInfo?.semester}
              </span>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-border" />

        {/* Row 3: Topic & Zalo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-label text-text-secondary">
              Đề tài
            </span>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-medium text-text-primary leading-relaxed break-words">
                {topic}
              </h3>
              <p className="text-label text-text-secondary break-words">{topicDescription}</p>
            </div>
          </div>

          {zaloLink && (
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-label text-text-secondary">
                Link Zalo
              </span>
              <a
                href={zaloLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-accent hover:underline flex items-center gap-1.5"
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
