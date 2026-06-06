import { useTranslation } from "@/context/TranslationContext";

export default function AnalyticsState({ loading, error, children }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">
        {t("admin.analytics.loading")}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm font-medium text-red-600">
        {error}
      </div>
    );
  }
  return children;
}
