import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export function useAdminUrlQuerySync({
  query,
  setQuery,
  keys = [],
  numericKeys = ["page", "limit"],
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const patch = {};
    let hasAny = false;
    keys.forEach((key) => {
      const raw = searchParams.get(key);
      if (raw == null) return;
      patch[key] = numericKeys.includes(key) ? Number(raw) || 1 : raw;
      hasAny = true;
    });
    if (!hasAny) return;
    setQuery((prev) => ({ ...prev, ...patch }));
  }, [keys, numericKeys, searchParams, setQuery]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const next = new URLSearchParams(searchParams);
    keys.forEach((key) => {
      const value = query?.[key];
      if (value === "" || value == null) next.delete(key);
      else next.set(key, String(value));
    });
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [keys, query, searchParams, setSearchParams]);
}

