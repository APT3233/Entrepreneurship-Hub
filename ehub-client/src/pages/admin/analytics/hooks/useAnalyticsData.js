import { useEffect, useState } from "react";
import { useTranslation } from "@/context/TranslationContext";

export default function useAnalyticsData(fetcher, query) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    fetcher(query)
      .then((res) => {
        if (mounted) setData(res?.data || null);
      })
      .catch((err) => {
        if (mounted) setError(err.message || t("admin.analytics.loadError"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [fetcher, query, t]);

  return { data, loading, error };
}
