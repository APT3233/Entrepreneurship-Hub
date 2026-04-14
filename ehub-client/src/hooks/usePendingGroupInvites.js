import { useState, useEffect, useCallback } from "react";
import GroupInviteApi from "@/api/groupInvite";

/**
 * Danh sách lời mời nhóm đang pending của sinh viên đăng nhập.
 */
export function usePendingGroupInvites() {
  const [invites, setInvites] = useState([]);
  const [hasGroup, setHasGroup] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GroupInviteApi.listPending();
      const payload = res?.data;
      const list = payload?.invites;
      setInvites(Array.isArray(list) ? list : []);
      const nextHasGroup = Boolean(payload?.hasGroup);
      setHasGroup(nextHasGroup);
      setActiveGroup(payload?.activeGroup || null);
      window.dispatchEvent(
        new CustomEvent("student-group-gate", {
          detail: { hasGroup: nextHasGroup },
        }),
      );
      setError(null);
    } catch (e) {
      setError(e);
      setInvites([]);
      setHasGroup(false);
      setActiveGroup(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { invites, hasGroup, activeGroup, loading, error, refresh };
}
