import { Hammer } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

/**
 * Trang placeholder — hiển thị khi chưa có nội dung thật, tránh 404.
 */
export default function PlaceholderPage({ title, description }) {
  return (
    <div className="rounded-card border border-border bg-surface">
      <EmptyState
        icon={<Hammer size={24} />}
        title={title}
        description={
          <>
            {description}
            <br />
            Trang này đang được phát triển.
          </>
        }
      />
    </div>
  );
}
