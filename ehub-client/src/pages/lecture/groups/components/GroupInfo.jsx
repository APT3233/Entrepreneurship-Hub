import { Edit, ExternalLink } from "lucide-react";

/**
 * GroupInfo — hero "team HQ" của trang chi tiết nhóm: identity + mentor + lớp.
 */
export default function GroupInfo({
  name = "Alpha",
  category = "Web Development",
  mentor = { name: "Nguyễn Văn A", department: "Khoa Công nghệ Thông tin", avatar: null },
  classInfo = { code: "EXE101", semester: "Fall 2026" },
  topic = "E-commerce Platform for Local Businesses",
  topicDescription = "Mô tả ngắn gọn khoảng 15 - 20 từ",
  zaloLink = null,
  onEdit,
  canEdit = true,
}) {
  const initials = (name || "N").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const mentorInitial = mentor?.name?.split(" ").pop()?.charAt(0) || "M";

  return (
    <div className="rounded-card bg-surface shadow-card p-6 sm:p-8 w-full">
      {/* Identity + edit */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="shrink-0 grid place-items-center w-14 h-14 rounded-2xl bg-linear-to-br from-accent-500 to-accent-400 text-white font-bold text-lg shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Nhóm{classInfo?.code ? ` · ${classInfo.code}` : ""}
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-text-primary tracking-tight truncate">{name}</h1>
            {topic && (
              <p className="mt-1.5 text-sm text-text-secondary leading-relaxed line-clamp-2 max-w-2xl">{topic}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {category && (
                <span className="rounded-full bg-secondary-bg text-secondary px-3 py-1 text-xs font-medium">{category}</span>
              )}
              {classInfo?.semester && (
                <span className="rounded-full bg-subtle text-text-secondary px-3 py-1 text-xs font-medium">{classInfo.semester}</span>
              )}
              {zaloLink && (
                <a
                  href={zaloLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-subtle px-3 py-1 text-xs font-medium text-accent hover:bg-accent-bg transition-colors"
                >
                  Nhóm Zalo <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={onEdit}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-control border border-border text-text-primary font-medium text-sm hover:bg-subtle transition-colors cursor-pointer"
          >
            <Edit size={14} />
            Chỉnh sửa
          </button>
        )}
      </div>

      {/* Strip: mentor + đề tài chi tiết */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border pt-5">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Mentor phụ trách</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-subtle flex items-center justify-center overflow-hidden shrink-0">
              {mentor?.avatar ? (
                <img src={mentor.avatar} alt={mentor.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-semibold text-text-secondary">{mentorInitial}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{mentor?.name || "Chưa phân công"}</p>
              <p className="text-xs text-text-muted truncate">{mentor?.department}</p>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Chi tiết đề tài</p>
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{topicDescription}</p>
        </div>
      </div>
    </div>
  );
}
