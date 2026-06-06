import { useTranslation } from "@/context/TranslationContext";

export default function ScorePreview({ criteria = [], totalScore }) {
  const { t } = useTranslation();
  const actualTotal = criteria.reduce((sum, item) => sum + Number(item.max_score || 0), 0);
  const expectedTotal = Number(totalScore || 0);
  const hasMismatch = expectedTotal > 0 && criteria.length > 0 && actualTotal !== expectedTotal;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-gray-900">{t("admin.rubric.preview.title")}</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${hasMismatch ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
          {actualTotal || 0} / {expectedTotal || "—"}
        </span>
      </div>
      {criteria.length ? (
        <div className="space-y-3">
          {criteria.map((item) => (
            <label key={item.id || item.order_index} className="block rounded-xl border border-gray-100 p-3">
              <span className="text-sm font-semibold text-gray-900">{item.name || item.criteria_name}</span>
              <input
                type="number"
                min="0"
                max={item.max_score}
                disabled
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500"
                placeholder={t("admin.rubric.preview.scoreRange", { max: item.max_score })}
              />
            </label>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400">
          {t("admin.rubric.preview.empty")}
        </div>
      )}
      {hasMismatch ? (
        <p className="mt-3 text-xs font-semibold text-amber-700">{t("admin.rubric.preview.scoreMismatch")}</p>
      ) : null}
    </div>
  );
}
