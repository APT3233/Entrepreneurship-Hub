import { useState, useEffect, useCallback } from "react";
import GroupInviteApi from "@/api/groupInvite";

// Biến global để de-duplicate các request đồng thời
let activePromise = null;

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
      // Nếu đang có một request chạy, dùng chung promise đó
      if (!activePromise) {
        activePromise = GroupInviteApi.listPending().finally(() => {
          // Xóa promise sau 500ms để cho phép các lần gọi sau (ví dụ khi có action cụ thể)
          setTimeout(() => { activePromise = null; }, 500);
        });
      }
      
      const res = await activePromise;
      const payload = res?.data;
      const list = payload?.invites;
      setInvites(Array.isArray(list) ? list : []);
      const nextHasGroup = Boolean(payload?.hasGroup);
      setHasGroup(nextHasGroup);
      setActiveGroup(payload?.activeGroup || null);
      
      // Phát sự kiện để đồng bộ trạng thái "gate" (ẩn/hiện menu sidebar)
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
