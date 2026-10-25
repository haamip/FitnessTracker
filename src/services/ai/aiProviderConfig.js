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
      hasKey: false,
      status: "Secret key is server-managed, never included in Vite.",
    },
    {
      id: AI_PROVIDER_MODE.GEMINI,
      label: "Gemini",
      enabled: requestedProvider === AI_PROVIDER_MODE.GEMINI,
      hasKey: false,
      status: "Not configured for server-side coaching.",
    },
    {
      id: AI_PROVIDER_MODE.CLAUDE,
      label: "Claude",
      enabled: requestedProvider === AI_PROVIDER_MODE.CLAUDE,
      hasKey: false,
      status: "Not configured for server-side coaching.",
    },
  ];

  const activeProvider =
    providers.find((provider) => provider.id === requestedProvider) ||
    providers[0];

  // The frontend playground cannot validate private server-side secrets.
  const canUseLiveProvider = false;

  return {
    requestedProvider,
    activeProvider: canUseLiveProvider ? activeProvider : providers[0],
    canUseLiveProvider,
    providers,
    safetyMode: canUseLiveProvider ? "live-ready" : "mock-safe",
  };
}
