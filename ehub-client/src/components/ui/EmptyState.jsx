/**
 * EmptyState — trạng thái rỗng dùng chung (presentational).
 *
 * Props:
 * - icon        : ReactNode  — icon minh hoạ (vd <Inbox size={28} />)
 * - title       : string     — tiêu đề ngắn
 * - description  : ReactNode  — mô tả (muted, đủ tương phản AA)
 * - action?     : ReactNode  — nút tuỳ chọn
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-card bg-subtle text-text-muted">
          {icon}
        </div>
      ) : null}
      <div className="max-w-sm">
        <p className="text-base font-medium text-text-primary">{title}</p>
        {description ? (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

// ─── Ví dụ dùng ────────────────────────────────────────────────────────────
// <EmptyState
//   icon={<Inbox size={24} />}
//   title="Chưa có bài tập"
//   description="Bài tập mới sẽ xuất hiện ở đây."
// />
