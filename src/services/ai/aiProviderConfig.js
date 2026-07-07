export const AI_PROVIDER_MODE = {
  MOCK: "mock",
  OPENAI: "openai",
  GEMINI: "gemini",
  CLAUDE: "claude",
};

function getEnvValue(key) {
  return import.meta.env?.[key] || "";
}

export function getAIProviderConfig() {
  const requestedProvider =
    getEnvValue("VITE_TRACKFIT_AI_PROVIDER") || AI_PROVIDER_MODE.MOCK;

  const providers = [
    {
      id: AI_PROVIDER_MODE.MOCK,
      label: "Mock Provider",
      enabled: true,
      hasKey: true,
      status: "Ready - local only, costs $0.",
    },
    {
      id: AI_PROVIDER_MODE.OPENAI,
      label: "OpenAI",
      enabled: requestedProvider === AI_PROVIDER_MODE.OPENAI,
      hasKey: Boolean(getEnvValue("VITE_OPENAI_API_KEY")),
      status: "Requires VITE_OPENAI_API_KEY.",
    },
    {
      id: AI_PROVIDER_MODE.GEMINI,
      label: "Gemini",
      enabled: requestedProvider === AI_PROVIDER_MODE.GEMINI,
      hasKey: Boolean(getEnvValue("VITE_GEMINI_API_KEY")),
      status: "Requires VITE_GEMINI_API_KEY.",
    },
    {
      id: AI_PROVIDER_MODE.CLAUDE,
      label: "Claude",
      enabled: requestedProvider === AI_PROVIDER_MODE.CLAUDE,
      hasKey: Boolean(getEnvValue("VITE_CLAUDE_API_KEY")),
      status: "Requires VITE_CLAUDE_API_KEY.",
    },
  ];

  const activeProvider =
    providers.find((provider) => provider.id === requestedProvider) ||
    providers[0];

  const canUseLiveProvider =
    activeProvider.id !== AI_PROVIDER_MODE.MOCK &&
    activeProvider.enabled &&
    activeProvider.hasKey;

  return {
    requestedProvider,
    activeProvider: canUseLiveProvider ? activeProvider : providers[0],
    canUseLiveProvider,
    providers,
    safetyMode: canUseLiveProvider ? "live-ready" : "mock-safe",
  };
}
