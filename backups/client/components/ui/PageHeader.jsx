/**
 * PageHeader — tiêu đề trang dùng chung (presentational).
 *
 * Props:
 * - title       : string     — tiêu đề (h1, 22px/500)
 * - description? : ReactNode  — mô tả phụ (14px, text-secondary)
 * - actions?    : ReactNode   — nút/hành động, canh phải, xuống dòng trên mobile
 */
export default function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-h1 font-medium text-text-primary truncate">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

// ─── Ví dụ dùng ────────────────────────────────────────────────────────────
// <PageHeader
//   title="Lớp học"
//   description="Quản lý các lớp bạn phụ trách"
//   actions={<button className="...">Tạo lớp</button>}
// />
