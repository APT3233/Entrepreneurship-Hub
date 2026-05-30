import { useCallback, useEffect, useState } from "react";

export function useAdminList(fetcher, query) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (isSilent = false) => {
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
  }, [fetcher, query]);

  useEffect(() => {
    load(false);
  }, [load]);

  return { rows, meta, loading, error, refetch: load };
}
