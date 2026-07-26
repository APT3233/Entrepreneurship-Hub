import { useTranslation } from "@/context/TranslationContext";

export default function AnalyticsState({ loading, error, children }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-gray-400">
        {t("admin.analytics.loading")}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-card border border-red-100 bg-red-50 p-8 text-center text-sm font-medium text-red-600">
        {error}
      </div>
    );
  }
  return children;
}
