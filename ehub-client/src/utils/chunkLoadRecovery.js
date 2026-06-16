const RELOAD_KEY = "ehub_chunk_reload_at";
const RELOAD_COOLDOWN_MS = 10_000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 600;

export const isChunkLoadError = (error) => {
  const text = String(error?.stack || error?.message || error || "");
  return (
    text.includes("Failed to fetch dynamically imported module") ||
    text.includes("Importing a module script failed") ||
    text.includes("error loading dynamically imported module") ||
    text.includes("ChunkLoadError") ||
    text.includes("Loading chunk") ||
    text.includes("Loading CSS chunk") ||
    text.includes("dynamically imported module")
  );
};

export const reloadOnceForChunkError = () => {
  const lastReload = sessionStorage.getItem(RELOAD_KEY);
  const now = Date.now();
  if (!lastReload || now - Number(lastReload) > RELOAD_COOLDOWN_MS) {
    sessionStorage.setItem(RELOAD_KEY, String(now));
    window.location.reload();
    return true;
  }
  return false;
};

export const retryDynamicImport = (
  importFn,
  { retries = DEFAULT_RETRIES, delayMs = DEFAULT_RETRY_DELAY_MS } = {},
) => {
  const attempt = (left) =>
    importFn().catch((error) => {
      if (!isChunkLoadError(error)) throw error;
      if (left <= 0) {
        if (reloadOnceForChunkError()) {
          return new Promise(() => {});
        }
        throw error;
      }
      return new Promise((resolve) => {
        window.setTimeout(resolve, delayMs);
      }).then(() => attempt(left - 1));
    });

  return attempt(retries);
};

export const registerChunkLoadRecoveryListeners = () => {
  const handle = (payload) => {
    if (isChunkLoadError(payload)) {
      reloadOnceForChunkError();
    }
  };

  window.addEventListener("error", (event) => {
    handle(event.error || event.message);
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    handle(event.reason);
  });

  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadOnceForChunkError();
  });
};
