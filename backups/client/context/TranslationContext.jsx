import { useCallback } from "react";
import { useTranslation as useI18nTranslation } from "react-i18next";

export function useTranslation() {
  const { i18n } = useI18nTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "vi";

  // Re-bind when language changes so useMemo(..., [t]) recomputes translated labels.
  const t = useCallback(
    (key, options) => i18n.t(key, options),
    [i18n, language],
  );

  const changeLanguage = (lang) => {
    if (lang === "vi" || lang === "en") {
      i18n.changeLanguage(lang);
      localStorage.setItem("ehub_lang", lang);
    }
  };

  return { language, isVi: language === "vi", changeLanguage, t, i18n };
}
