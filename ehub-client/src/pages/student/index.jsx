import PendingGroupInvitesSection from "@/components/form/student/PendingGroupInvitesSection";
import StudentGroupOverviewSection from "@/components/ui/student/StudentGroupOverviewSection";
import { usePendingGroupInvites } from "@/hooks/usePendingGroupInvites";

const StudentDashboard = () => {
  const groupState = usePendingGroupInvites();
  return (
    <div className="mx-auto max-w-6xl">
      {groupState.hasGroup && groupState.activeGroup ? (
        <StudentGroupOverviewSection group={groupState.activeGroup} />
      ) : (
        <PendingGroupInvitesSection data={groupState} />
      )}
    </div>
  );
};

export default StudentDashboard;
