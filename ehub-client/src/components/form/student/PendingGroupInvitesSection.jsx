import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import GroupInviteConfirmCard from "@/components/form/student/GroupInviteConfirmCard";
import StudentNoGroupEmptyState from "@/components/ui/student/StudentNoGroupEmptyState";

/**
 * Hiển thị các card lời mời nhóm khi có pending.
 * Hỗ trợ ?group_invite=&lt;token&gt; để cuộn tới / nhấn mạnh card tương ứng.
 */
export default function PendingGroupInvitesSection({
  className = "",
  sectionTitle = "Lời mời tham gia nhóm",
  onStateChange,
  data,
}) {
  const invites = data?.invites || [];
  const hasGroup = !!data?.hasGroup;
  const activeGroup = data?.activeGroup || null;
  const loading = !!data?.loading;
  const error = data?.error || null;
  const refresh = data?.refresh || (() => {});
  const [searchParams] = useSearchParams();
  const focusToken = searchParams.get("group_invite");

  useEffect(() => {
    onStateChange?.({ hasGroup, invitesCount: invites.length, loading, error, activeGroup });
  }, [hasGroup, invites.length, loading, error, activeGroup, onStateChange]);

  useEffect(() => {
    if (!focusToken || loading || !invites.some((i) => i.token === focusToken)) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`group-invite-card-${focusToken}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-violet-400", "ring-offset-2", "rounded-xl");
      window.setTimeout(() => {
        el.classList.remove("ring-2", "ring-violet-400", "ring-offset-2", "rounded-xl");
      }, 2800);
    }, 120);
    return () => clearTimeout(timer);
  }, [focusToken, loading, invites]);

  // if (error) return null; // Removed to prevent blank screen on error
  if (loading && invites.length === 0) {
    return (
      <div
        className={`rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-secondary ${className}`}
      >
        Đang tải lời mời…
      </div>
    );
  }
  if (!invites.length) {
    return <StudentNoGroupEmptyState className={className} />;
  }

  return (
    <section className={`space-y-3 ${className}`} aria-label={sectionTitle}>
      <h2 className="text-lg font-semibold tracking-tight text-text-primary">{sectionTitle}</h2>
      <div className="space-y-4">
        {invites.map((inv) => (
          <GroupInviteConfirmCard key={inv.id} invite={inv} onUpdated={refresh} />
        ))}
      </div>
    </section>
  );
}
