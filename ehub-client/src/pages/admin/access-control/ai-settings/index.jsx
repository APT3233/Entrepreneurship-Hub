import { useEffect, useMemo, useState } from "react";
import { KeyRound, MessageSquareText, RefreshCw, RotateCcw, Save, ServerCog, Wifi } from "lucide-react";
import aiEvaluationApi from "@/api/aiEvaluation";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import Dropdown from "@/components/ui/filter/DropDown";

const inputClass = "w-full rounded-lg border border-border px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-accent focus:ring-2 focus:ring-accent disabled:bg-gray-50 disabled:text-gray-400";
const THIRD_PARTY_PROVIDER_KEY = "third-party-api";
const LOCAL_9ROUTER_PROVIDER_KEY = "local-9router";
const LOCAL_OLLAMA_PROVIDER_KEY = "local-gemma";
const PROVIDERS_WITH_API_KEY = [THIRD_PARTY_PROVIDER_KEY, LOCAL_9ROUTER_PROVIDER_KEY];
const normalizeProviderKey = (key) => {
  if (["cmd-api", "cmd-local", "cmd-local-api"].includes(key)) return THIRD_PARTY_PROVIDER_KEY;
  if (["local-gateway", "9router", "ninerouter", "local-antigravity"].includes(key)) return LOCAL_9ROUTER_PROVIDER_KEY;
  return key;
};
const providerLabels = {
  "third-party-api": "Third-party API",
  "cmd-api": "Third-party API",
  "local-gemma": "Local Ollama",
  "local-9router": "Local 9Router",
};

const emptySettings = {
  enabled: false,
  active_provider: LOCAL_OLLAMA_PROVIDER_KEY,
  global: {
    max_tokens: 4096,
    temperature: 0.2,
    stream: true,
    allow_ai_score_suggestion: true,
    allow_ai_feedback_suggestion: true,
    allow_student_view_ai_feedback: false,
    data_retention_days: 180,
  },
  providers: [],
  secret_storage: {},
};

const defaultProviders = [
  {
    key: LOCAL_OLLAMA_PROVIDER_KEY,
    name: "Local Ollama",
    type: "openai-compatible",
    enabled: true,
    base_url: "http://ollama:11434/v1",
    model: "gemma3:4b",
    stream: true,
    api_key_required: false,
    api_key_status: "not_required",
    api_key_source: "none",
  },
  {
    key: LOCAL_9ROUTER_PROVIDER_KEY,
    name: "Local 9Router",
    type: "openai-compatible",
    enabled: true,
    base_url: "http://ninerouter:20128/v1",
    model: "antigravity/gemini-3-flash",
    stream: false,
    api_key_required: true,
    api_key_status: "not_configured",
    api_key_source: "none",
  },
  {
    key: THIRD_PARTY_PROVIDER_KEY,
    name: "Third-party API",
    type: "openai-compatible",
    enabled: true,
    base_url: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    stream: true,
    api_key_required: true,
    api_key_status: "not_configured",
    api_key_source: "none",
  },
];

const normalizeSettings = (payload) => {
  if (Array.isArray(payload)) {
    const rows = Object.fromEntries(payload.map((row) => [row.key, row.value]));
    return {
      ...emptySettings,
      enabled: Boolean(rows.ai_enabled),
      active_provider: normalizeProviderKey(rows.ai_provider || "local-gemma"),
      global: {
        ...emptySettings.global,
        max_tokens: Number(rows.max_tokens || 4096),
        temperature: Number(rows.temperature ?? 0.2),
        stream: Boolean(rows.stream),
        allow_ai_score_suggestion: Boolean(rows.allow_ai_score_suggestion),
        allow_ai_feedback_suggestion: Boolean(rows.allow_ai_feedback_suggestion),
        data_retention_days: Number(rows.data_retention_days || 180),
      },
      providers: [
        {
          key: THIRD_PARTY_PROVIDER_KEY,
          name: "Third-party API",
          type: "openai-compatible",
          enabled: true,
          base_url: rows.base_url || "http://localhost:20128/v1",
          model: rows.model_name || "cmc/MiniMaxAI/MiniMax-M2.5",
          stream: Boolean(rows.stream),
          api_key_required: true,
          api_key_status: rows.api_key_configured ? "configured" : "not_configured",
          api_key_source: rows.api_key_source || "none",
        },
      ],
      secret_storage: {
        third_party_api_key_configured: Boolean(rows.api_key_configured),
        third_party_api_key_source: rows.api_key_source || "none",
        storage_ready: Boolean(rows.api_key_storage_ready),
      },
    };
  }
  return {
    ...emptySettings,
    ...(payload || {}),
    global: { ...emptySettings.global, ...(payload?.global || {}) },
    providers: Array.isArray(payload?.providers) ? payload.providers.map((provider) => ({ ...provider, key: normalizeProviderKey(provider.key) })) : [],
    secret_storage: payload?.secret_storage || {},
  };
};

export default function AdminAiSettingsPage() {
  const toast = useToast();
  const { t } = useTranslation();
  const [form, setForm] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [promptTesting, setPromptTesting] = useState(false);
  const [error, setError] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [testPrompt, setTestPrompt] = useState('Reply with JSON: {"ok": true}');
  const [testOutput, setTestOutput] = useState("");
  const [configProviderKey, setConfigProviderKey] = useState(LOCAL_OLLAMA_PROVIDER_KEY);
  const [providerModels, setProviderModels] = useState({});
  const [modelLoadingKey, setModelLoadingKey] = useState("");
  const [modelErrors, setModelErrors] = useState({});

  const selectedProvider = useMemo(
    () => form.providers.find((provider) => provider.key === configProviderKey) || form.providers[0] || null,
    [configProviderKey, form.providers],
  );
  const selectedNeedsApiKey = PROVIDERS_WITH_API_KEY.includes(normalizeProviderKey(selectedProvider?.key));
  const storageReady = Boolean(form.secret_storage?.storage_ready);
  const selectedKeyConfigured = Boolean(
    (normalizeProviderKey(selectedProvider?.key) === LOCAL_9ROUTER_PROVIDER_KEY && (
      form.secret_storage?.local_9router_api_key_configured ||
      selectedProvider?.api_key_status === "configured"
    )) ||
    (normalizeProviderKey(selectedProvider?.key) === THIRD_PARTY_PROVIDER_KEY && (
      form.secret_storage?.third_party_api_key_configured ||
      form.secret_storage?.cmd_api_key_configured ||
      selectedProvider?.api_key_status === "configured"
    )),
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await aiEvaluationApi.getSettings();
      const nextForm = normalizeSettings(res?.data);
      setForm(nextForm);
      setConfigProviderKey(nextForm.active_provider || nextForm.providers[0]?.key || LOCAL_OLLAMA_PROVIDER_KEY);
    } catch (err) {
      setError(err.message || t("ai.settings.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRoot = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateGlobal = (key, value) => setForm((prev) => ({ ...prev, global: { ...prev.global, [key]: value } }));
  const updateProvider = (providerKey, key, value) => {
    setForm((prev) => ({
      ...prev,
      providers: prev.providers.map((provider) => (
        provider.key === providerKey ? { ...provider, [key]: value } : provider
      )),
    }));
  };

  const buildPayload = () => {
    const payload = {
      enabled: Boolean(form.enabled),
      active_provider: form.active_provider,
      max_tokens: Number(form.global.max_tokens),
      temperature: Number(form.global.temperature),
      stream: Boolean(form.global.stream),
      allow_ai_score_suggestion: Boolean(form.global.allow_ai_score_suggestion),
      allow_ai_feedback_suggestion: Boolean(form.global.allow_ai_feedback_suggestion),
      allow_student_view_ai_feedback: false,
      data_retention_days: Number(form.global.data_retention_days),
      providers: form.providers.map((provider) => ({
        key: provider.key,
        enabled: Boolean(provider.enabled),
        base_url: provider.base_url,
        model: provider.model,
        stream: Boolean(provider.stream),
        api_key_required: Boolean(provider.api_key_required),
      })),
    };
    if (apiKeyInput.trim() && PROVIDERS_WITH_API_KEY.includes(normalizeProviderKey(form.active_provider))) {
      payload.api_key = apiKeyInput.trim();
      payload.api_key_provider = normalizeProviderKey(form.active_provider);
    }
    return payload;
  };

  const buildProviderTestPayload = (providerOverride = null) => {
    const provider = providerOverride || selectedProvider || {};
    const providerKey = normalizeProviderKey(provider.key || form.active_provider);
    const payload = {
      provider_key: providerKey,
      base_url: provider.base_url,
      model: provider.model,
      stream: Boolean(provider.stream),
      api_key_required: Boolean(provider.api_key_required),
    };
    if (PROVIDERS_WITH_API_KEY.includes(providerKey) && apiKeyInput.trim()) payload.api_key = apiKeyInput.trim();
    return payload;
  };

  const loadProviderModels = async (providerKey = configProviderKey, providerOverride = null, { silent = false } = {}) => {
    const provider = providerOverride || form.providers.find((item) => item.key === providerKey);
    if (!provider?.key) return;

    setModelLoadingKey(provider.key);
    setModelErrors((prev) => ({ ...prev, [provider.key]: "" }));
    try {
      const res = await aiEvaluationApi.listModels(buildProviderTestPayload(provider));
      const models = Array.isArray(res?.data?.models) ? res.data.models : [];
      setProviderModels((prev) => ({ ...prev, [provider.key]: models }));
      if (!String(provider.model || "").trim() && models[0]?.id) {
        updateProvider(provider.key, "model", models[0].id);
      }
    } catch (err) {
      const isApiKeyMissing = err?.response?.data?.error_code === "ai_api_key_missing" || err?.message?.toLowerCase?.()?.includes("api key");
      const errorMsg = isApiKeyMissing
        ? t("ai.settings.apiKeyRequiredForModels")
        : (err.message || t("ai.settings.loadModelsFailed"));
      setModelErrors((prev) => ({ ...prev, [provider.key]: errorMsg }));
      if (!silent) toast.error(errorMsg);
    } finally {
      setModelLoadingKey((current) => (current === provider.key ? "" : current));
    }
  };

  const selectProvider = (providerKey) => {
    setConfigProviderKey(providerKey);
    setForm((prev) => ({ ...prev, active_provider: providerKey }));
    setTestOutput("");
    const provider = form.providers.find((item) => item.key === providerKey);
    if (provider && !providerModels[providerKey]) loadProviderModels(providerKey, provider, { silent: true });
  };

  useEffect(() => {
    if (!loading && selectedProvider?.key && providerModels[selectedProvider.key] === undefined && !modelLoadingKey) {
      loadProviderModels(selectedProvider.key, selectedProvider, { silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, selectedProvider?.key]);

  const resetDefaults = () => {
    setForm((prev) => ({
      ...emptySettings,
      enabled: true,
      active_provider: LOCAL_OLLAMA_PROVIDER_KEY,
      providers: defaultProviders.map((provider) => ({ ...provider })),
      secret_storage: prev.secret_storage,
    }));
    setConfigProviderKey(LOCAL_OLLAMA_PROVIDER_KEY);
    setProviderModels({});
    setModelErrors({});
    setApiKeyInput("");
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await aiEvaluationApi.updateSettings(buildPayload());
      const nextForm = normalizeSettings(res?.data);
      setForm(nextForm);
      setConfigProviderKey(nextForm.active_provider || nextForm.providers[0]?.key || LOCAL_OLLAMA_PROVIDER_KEY);
      setProviderModels({});
      setModelErrors({});
      setApiKeyInput("");
      toast.success(t("ai.settings.saveSuccess"));
    } catch (err) {
      toast.error(err.message || t("ai.settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await aiEvaluationApi.testConnection(buildProviderTestPayload());
      toast.success(`${res?.data?.message || t("ai.settings.testSuccess")} (${res?.data?.latency_ms || 0}ms)`);
    } catch (err) {
      toast.error(err.message || t("ai.settings.testFailed"));
    } finally {
      setTesting(false);
    }
  };

  const runTestPrompt = async () => {
    setPromptTesting(true);
    setTestOutput("");
    try {
      const res = await aiEvaluationApi.testPrompt({ ...buildProviderTestPayload(), prompt: testPrompt });
      setTestOutput(res?.data?.output || "");
      toast.success(`${t("ai.settings.testSuccess")} (${res?.data?.latency_ms || 0}ms)`);
    } catch (err) {
      toast.error(err.message || t("ai.settings.testFailed"));
    } finally {
      setPromptTesting(false);
    }
  };

  if (loading) return <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-gray-400">{t("ai.settings.loadingSettings")}</div>;
  if (error) return <div className="rounded-lg border border-red-100 bg-red-50 p-8 text-center text-sm font-semibold text-red-600">{error}</div>;

  const activeWarning = form.active_provider === LOCAL_OLLAMA_PROVIDER_KEY
    ? t("ai.settings.warningLocalOllama")
    : form.active_provider === LOCAL_9ROUTER_PROVIDER_KEY
      ? (t("ai.settings.warningLocal9Router") || "Local 9Router chạy trong Docker (ninerouter:20128). Dashboard vẫn mở tại gateway.apt3233.id.vn.")
      : t("ai.settings.warningThirdPartyApi");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{t("ai.settings.pageTitle")}</h1>
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${form.enabled ? "bg-emerald-400" : "bg-red-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${form.enabled ? "bg-emerald-500" : "bg-red-500"}`}></span>
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{activeWarning}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={form.enabled ? "green" : "gray"}>
            {form.enabled ? t("ai.settings.aiEnabled") : t("ai.settings.aiDisabled")}
          </Badge>
          {selectedNeedsApiKey && (
            <Badge tone={selectedKeyConfigured ? "green" : "red"}>
              {providerLabels[normalizeProviderKey(selectedProvider?.key)] || "API"}: {selectedKeyConfigured ? t("ai.settings.apiKeyConfigured") : t("ai.settings.apiKeyMissing")}
            </Badge>
          )}
        </div>
      </div>

      <form onSubmit={save} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: General Configuration */}
          <div className="lg:col-span-5 space-y-6">
            <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 border-b border-gray-50 pb-2">
                <ServerCog className="h-4.5 w-4.5 text-accent" />
                {t("ai.settings.titleGeneral")}
              </h3>
              <div className="space-y-4 pt-1">
                <Toggle label={t("ai.settings.enableAi")} checked={Boolean(form.enabled)} onChange={(value) => updateRoot("enabled", value)} />
                <Toggle label={t("ai.settings.allowScoreSuggestions")} checked={Boolean(form.global.allow_ai_score_suggestion)} onChange={(value) => updateGlobal("allow_ai_score_suggestion", value)} />
                <Toggle label={t("ai.settings.allowFeedbackSuggestions")} checked={Boolean(form.global.allow_ai_feedback_suggestion)} onChange={(value) => updateGlobal("allow_ai_feedback_suggestion", value)} />
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Field label={t("ai.settings.labelMaxTokens")}>
                    <input type="number" min="256" className={inputClass} value={form.global.max_tokens || 4096} onChange={(e) => updateGlobal("max_tokens", e.target.value)} />
                  </Field>
                  <Field label={t("ai.settings.labelTemperature")}>
                    <input type="number" min="0" max="2" step="0.1" className={inputClass} value={form.global.temperature ?? 0.2} onChange={(e) => updateGlobal("temperature", e.target.value)} />
                  </Field>
                </div>
                <Field label={t("ai.settings.settingRetention")}>
                  <input type="number" min="1" className={inputClass} value={form.global.data_retention_days || 180} onChange={(e) => updateGlobal("data_retention_days", e.target.value)} />
                </Field>
              </div>
            </section>
          </div>

          {/* Right Column: Provider settings & Testing */}
          <div className="lg:col-span-7 space-y-6">
            {/* Provider card */}
            <section className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
                <KeyRound className="h-4.5 w-4.5 text-accent" />
                {t("ai.settings.titleProvider")}
              </h3>
              
              <div className="mb-5 flex flex-wrap gap-1.5">
                {form.providers.map((provider) => (
                  <button
                    key={provider.key}
                    type="button"
                    onClick={() => selectProvider(provider.key)}
                    className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                      provider.key === configProviderKey
                        ? "border-accent-bg bg-accent-bg text-accent"
                        : "border-border bg-surface text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {provider.name || providerLabels[provider.key] || provider.key}
                  </button>
                ))}
              </div>

              {selectedProvider ? (
                <ProviderCard
                  provider={selectedProvider}
                  onChange={updateProvider}
                  models={providerModels[selectedProvider.key] || []}
                  isLoading={modelLoadingKey === selectedProvider.key}
                  modelError={modelErrors[selectedProvider.key] || ""}
                  onReloadModels={() => loadProviderModels(selectedProvider.key, selectedProvider)}
                />
              ) : null}

              {selectedNeedsApiKey && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-gray-700">
                      {normalizeProviderKey(selectedProvider?.key) === LOCAL_9ROUTER_PROVIDER_KEY
                        ? "9Router API Key"
                        : "Third-party API Key"}
                    </span>
                    <input
                      type="password"
                      className={inputClass}
                      value={apiKeyInput}
                      disabled={!storageReady}
                      placeholder={selectedKeyConfigured ? t("ai.settings.apiKeyPlaceholderConfigured") : t("ai.settings.apiKeyPlaceholderMissing")}
                      autoComplete="new-password"
                      onChange={(event) => setApiKeyInput(event.target.value)}
                    />
                  </label>
                  <p className={`text-xs ${storageReady ? "text-gray-500" : "font-semibold text-red-600"}`}>
                    {storageReady ? t("ai.settings.apiKeyStorageReady") : t("ai.settings.apiKeyStorageMissing")}
                  </p>
                </div>
              )}
            </section>

            {/* Diagnostic card */}
            <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
              <div className="border-b border-gray-50 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  {t("ai.settings.testProvider", { name: selectedProvider?.name || providerLabels[selectedProvider?.key] || "AI provider" })}
                </h3>
                <p className="mt-1 font-mono text-xs text-gray-400 truncate">{selectedProvider?.base_url || "—"}</p>
              </div>

              <div className="space-y-4">
                <Field label={t("ai.settings.labelTestPrompt")}>
                  <textarea className={`${inputClass} min-h-[72px] resize-y`} value={testPrompt} onChange={(event) => setTestPrompt(event.target.value)} />
                </Field>
                <div className="flex gap-3">
                  <button type="button" disabled={testing || saving} onClick={testConnection} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-accent-bg bg-surface py-2.5 text-xs font-semibold text-accent hover:bg-accent-bg disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
                    <Wifi size={14} /> {testing ? `${t("ai.settings.testing")}...` : t("ai.settings.btnTestConnection")}
                  </button>
                  <button type="button" disabled={promptTesting || saving || !testPrompt.trim()} onClick={runTestPrompt} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-gray-950 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
                    <MessageSquareText size={14} /> {promptTesting ? `${t("ai.settings.testing")}...` : t("ai.settings.btnTestPrompt")}
                  </button>
                </div>
                {testOutput && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{t("ai.settings.testResults")}</span>
                    <pre className="max-h-36 overflow-auto rounded-lg bg-gray-950 p-3 text-xs leading-5 text-gray-200 font-mono">{testOutput}</pre>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
          <button type="button" disabled={loading || saving} onClick={resetDefaults} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
            <RotateCcw size={14} /> {t("ai.settings.btnResetDefaults")}
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
            <Save size={14} /> {saving ? `${t("ai.settings.saving")}...` : t("ai.settings.btnSaveSettings")}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProviderCard({ provider, onChange, models = [], isLoading, modelError, onReloadModels }) {
  const { t } = useTranslation();
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    if (!isLoading && (!models || models.length === 0)) {
      setIsManual(true);
    } else if (models && models.length > 0) {
      setIsManual(false);
    }
  }, [models, isLoading]);

  const hasModels = Array.isArray(models) && models.length > 0;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">{provider.name || providerLabels[provider.key] || provider.key}</h3>
          <p className="mt-1 text-xs font-semibold uppercase text-gray-400">{provider.key}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("ai.settings.labelApiUrl")}>
          <input className={inputClass} value={provider.base_url || ""} placeholder="https://api.example.com/v1" onChange={(event) => onChange(provider.key, "base_url", event.target.value)} />
        </Field>
        
        <Field
          label={
            <div className="flex items-center justify-between w-full">
              <span>{t("ai.settings.labelModelName")}</span>
              {hasModels && !isLoading && (
                <button
                  type="button"
                  onClick={() => setIsManual(!isManual)}
                  className="text-xs text-accent hover:text-accent font-semibold"
                >
                  {isManual ? t("ai.settings.selectFromList") : t("ai.settings.enterManually")}
                </button>
              )}
            </div>
          }
        >
          {isLoading ? (
            <div className="flex h-[38px] items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-gray-400 bg-gray-50">
              <RefreshCw className="h-4 w-4 animate-spin text-accent" />
              <span>{t("ai.settings.loadingModels")}</span>
            </div>
          ) : !isManual && hasModels ? (
            <div className="flex gap-2">
              <div className="flex-1 min-w-0 [&>div]:w-full [&>div]:md:w-full [&>div]:md:flex-1 [&>div>button]:h-[38px] [&>div>button]:rounded-lg [&>div>button]:border-border [&>div>button]:text-gray-800">
                <Dropdown
                  label={t("ai.settings.selectModelPlaceholder")}
                  value={provider.model || ""}
                  onChange={(val) => onChange(provider.key, "model", val)}
                  options={models.map((m) => ({ value: m.id, label: m.id }))}
                />
              </div>
              <button
                type="button"
                onClick={onReloadModels}
                className="flex h-[38px] w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                title={t("ai.settings.reloadList")}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={provider.model || ""}
                onChange={(event) => onChange(provider.key, "model", event.target.value)}
                placeholder={t("ai.settings.placeholderEnterModel")}
              />
              <button
                type="button"
                onClick={onReloadModels}
                className="flex h-[38px] w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                title={t("ai.settings.loadList")}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          )}
        </Field>

      </div>
      {modelError && (
        <p className="mt-2 text-xs font-semibold text-amber-600">{modelError}</p>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>{children}</label>;
}

function Toggle({ label, checked, onChange }) {
  const { t } = useTranslation();
  return (
    <label className="block cursor-pointer">
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      <div className="flex h-[38px] items-center justify-between rounded-lg border border-border px-3 py-2 bg-surface hover:border-gray-300 transition-colors">
        <span className={`text-sm ${checked ? "text-accent font-semibold" : "text-gray-400"}`}>
          {checked ? t("ai.settings.aiEnabled") : t("ai.settings.aiDisabled")}
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4.5 w-4.5 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
        />
      </div>
    </label>
  );
}

function Badge({ tone = "gray", children }) {
  const classes = {
    gray: "border-border bg-gray-50 text-gray-600",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    red: "border-red-100 bg-red-50 text-red-600",
    indigo: "border-accent-bg bg-accent-bg text-accent",
  };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes[tone] || classes.gray}`}>{children}</span>;
}
