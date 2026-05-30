import { useEffect, useId } from "react";
import { useTranslation } from "@/context/TranslationContext";

/** @type {Map<string, { full: string, priority: number }>} */
const registry = new Map();
let savedBrowserTitle = null;

function syncTitle() {
  if (registry.size === 0) {
    if (savedBrowserTitle !== null) {
      document.title = savedBrowserTitle;
      savedBrowserTitle = null;
    }
    return;
  }

  if (savedBrowserTitle === null) {
    savedBrowserTitle = document.title;
  }

  const active = [...registry.values()].reduce((best, entry) =>
    entry.priority > best.priority ? entry : best,
  );

  document.title = active.full;
}

/**
 * Sets browser tab title: "{pageTitle} | {appName}".
 * Higher `priority` wins (detail pages should use 1, layout 0).
 */
export default function useDocumentTitle(pageTitle, priority = 0) {
  const id = useId();
  const { t, language } = useTranslation();
  const appName = t("app.title");

  useEffect(() => {
    if (!pageTitle) {
      registry.delete(id);
      syncTitle();
      return undefined;
    }

    registry.set(id, {
      full: `${pageTitle} | ${appName}`,
      priority,
    });
    syncTitle();

    return () => {
      registry.delete(id);
      syncTitle();
    };
  }, [pageTitle, appName, language, id, priority]);
}
