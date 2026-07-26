import PendingGroupInvitesSection from "@/components/form/student/PendingGroupInvitesSection";
import StudentGroupOverviewSection from "@/components/ui/student/StudentGroupOverviewSection";
import { usePendingGroupInvites } from "@/hooks/usePendingGroupInvites";

/**
 * Trang Nhóm — sinh viên: hiển thị thông tin nhóm đã tham gia hoặc lời mời đang chờ.
 */
export default function StudentGroupsPage() {
  const groupState = usePendingGroupInvites();

  if (groupState.loading && !groupState.hasGroup && groupState.invites.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-200 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {groupState.hasGroup && groupState.activeGroup ? (
        <StudentGroupOverviewSection group={groupState.activeGroup} />
      ) : (
        <PendingGroupInvitesSection data={groupState} />
      )}
    </div>
  );
}
