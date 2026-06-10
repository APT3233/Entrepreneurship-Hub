import { useCallback, useEffect, useState } from "react";

export function useAdminList(fetcher, query, { enabled = true } = {}) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");

  const load = useCallback(async (isSilent = false) => {
    if (!enabled) return;
    if (!isSilent) {
      setLoading(true);
    }
    setError("");
    try {
      const res = await fetcher(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || "Không tải được dữ liệu.");
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, [enabled, fetcher, query]);

  useEffect(() => {
    if (!enabled) return;
    load(false);
  }, [enabled, load]);

  return { rows, meta, loading, error, refetch: load };
}
