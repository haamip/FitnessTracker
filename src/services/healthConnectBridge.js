/**
 * Health Connect hand-off for a future native Android TrackFit build, regardless of watch brand.
 * Browser sessions deliberately cannot request Health Connect data.
 *
 * Native Capacitor plugin contract (not yet shipped):
 *   getStatus() -> { available: boolean, stepsGranted: boolean }
 *   requestPermissions({ dataTypes: ["steps"] }) -> { stepsGranted: boolean }
 *   readTodaySteps({ date: "YYYY-MM-DD" }) -> { date, steps: number }
 *
 * Native implementation MUST use HealthConnectClient.aggregate() with
 * StepsRecord.COUNT_TOTAL, not sum per-app records (avoid duplicates).
 * The date range must use the phone's local start/end of day.
 */

export function getHealthConnectBridge() {
  if (typeof window === "undefined") return null;
  const capacitor = window.Capacitor;
  if (typeof capacitor?.isNativePlatform !== "function" || !capacitor.isNativePlatform()) return null;
  const bridge = capacitor.Plugins?.TrackFitHealthConnect;
  if (
    typeof bridge?.getStatus !== "function" ||
    typeof bridge?.requestPermissions !== "function" ||
    typeof bridge?.readTodaySteps !== "function"
  ) return null;
  return bridge;
}

export function validateHealthConnectSteps(record, requestedDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) throw new Error("Invalid day requested.");
  if (!record || record.date !== requestedDate) throw new Error("Watch data was returned for the wrong date.");
  if (record?.dataPresent === false) {
    throw new Error(`Health Connect has no readable Steps records for ${requestedDate}. Check the date and confirm your health app shares Steps.`);
  }
  const steps = record.steps;
  if (steps === 0) {
    throw new Error(`Health Connect returned 0 steps for ${requestedDate}. Nothing was saved. Check the day's Steps sources in Health Connect.`);
  }
  if (!Number.isSafeInteger(steps) || steps < 0 || steps > 150000) {
    throw new Error("Watch steps were unavailable or invalid.");
  }
  return {
    steps,
    stepsSource: "health_connect",
    stepsSyncedAt: new Date().toISOString(),
  };
}

export async function readAndroidHealthSteps(date, bridge = getHealthConnectBridge()) {
  if (!bridge) throw new Error("Galaxy Watch sync needs the TrackFit Android app. Enter steps manually for now.");
  const status = await bridge.getStatus();
  if (!status?.available) throw new Error("Health Connect isn't available on this phone.");
  if (!status.stepsGranted) {
    const result = await bridge.requestPermissions({ dataTypes: ["steps"] });
    if (!result?.stepsGranted) throw new Error("Steps permission wasn't granted. You can still enter steps manually.");
  }
  const result = await bridge.readTodaySteps({ date });
  return validateHealthConnectSteps(result, date);
}

// Backward-compatible alias while existing Galaxy-specific callers transition.
export const readGalaxyDailySteps = readAndroidHealthSteps;
