import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuthUser } from "@/store/slices/authSlice";
import PendingGroupInvitesSection from "@/components/form/student/PendingGroupInvitesSection";
import StudentDashboardOverview from "@/components/ui/student/StudentDashboardOverview";
import { usePendingGroupInvites } from "@/hooks/usePendingGroupInvites";
import ClassApi from "@/api/class";

const StudentDashboard = () => {
  const groupState = usePendingGroupInvites();
  const user = useSelector(selectAuthUser);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (groupState.hasGroup) {
      const fetchStats = async () => {
        setStatsLoading(true);
        try {
          const res = await ClassApi.getStudentStats();
          if (res?.data) {
            setStats(res.data);
          }
        } catch (error) {
          console.error("Failed to fetch student stats:", error);
        } finally {
          setStatsLoading(false);
        }
      };
      fetchStats();
    }
  }, [groupState.hasGroup]);

  if (groupState.loading && !groupState.hasGroup && groupState.invites.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {groupState.hasGroup && groupState.activeGroup ? (
        <StudentDashboardOverview 
          group={groupState.activeGroup} 
          user={user} 
          statsData={stats}
          loading={statsLoading}
        />
      ) : (
        <PendingGroupInvitesSection data={groupState} />
      )}
    </div>
  );
};

export default StudentDashboard;
