import { getWearableBridge } from "./wearableBridge";

/** Human-readable, on-device-only comparison. Never used as a step total. */
export function formatStepSourceComparison(data, expectedDay) {
  if (!data || data.date !== expectedDay || !Number.isSafeInteger(data.aggregatedSteps) || data.aggregatedSteps < 0) {
    throw new Error("The health data diagnostic did not return a valid result for today.");
  }
  const sources = Array.isArray(data.sources) ? data.sources : [];
  const formatName = (app) => {
    if (typeof app !== "string" || !app) return "Unknown app";
    if (app === "com.sec.android.app.shealth") return "Samsung Health";
    if (app === "com.google.android.apps.fitness") return "Google Fit";
    if (app === "android" || app.startsWith("com.android.healthconnect.phone.")) return "Your phone";
    return app.slice(0, 80);
  };
  return {
    date: data.date,
    timezone: typeof data.zone === "string" ? data.zone : "Local",
    total: data.aggregatedSteps,
    samsungTotal: Number.isSafeInteger(data.samsungAggregatedSteps) && data.samsungAggregatedSteps >= 0 ? data.samsungAggregatedSteps : null,
    until: typeof data.through === "string" ? data.through : "",
    truncated: data.truncated === true,
    sources: sources.slice(0, 12).filter((x) => x && Number.isSafeInteger(x.records) && Number.isSafeInteger(x.rawSteps)).map((x) => ({
      label: formatName(x.source),
      records: x.records,
      rawSteps: x.rawSteps,
    })),
  };
}

export async function inspectStepSources(date, provider = getWearableBridge()) {
  if (provider?.platform !== "android" || typeof provider.bridge?.diagnoseTodaySteps !== "function") {
    throw new Error("Source comparison needs TrackFit Native on Android with the Health Connect connector.");
  }
  const result = await provider.bridge.diagnoseTodaySteps({ date });
  return formatStepSourceComparison(result, date);
}
