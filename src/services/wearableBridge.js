/**
 * Cross-platform health-source adapter used by TrackFit.
 *
 * Data sources are the phone's health data stores, not individual watch APIs:
 *  - Android: Health Connect, filled by Samsung Health, Garmin Connect, Polar Flow etc.
 *  - iOS: Apple Health / HealthKit, filled by Apple Watch and compatible third parties.
 *
 * Both native implementations MUST provide getStatus, requestPermissions and
 * readTodaySteps. Browser/PWA use manual steps; don't show a fake Connected state.
 * Native plugins are bundled in platform builds only, never in the website.
 */
import { getHealthConnectBridge, readAndroidHealthSteps } from "./healthConnectBridge";

function getNativeCapacitor() {
  if (typeof window === "undefined") return null;
  const native = window.Capacitor;
  if (typeof native?.isNativePlatform !== "function" || !native.isNativePlatform()) return null;
  return native;
}

export function getWearableBridge() {
  const capacitor = getNativeCapacitor();
  if (!capacitor) return null;
  const platform = typeof capacitor.getPlatform === "function" ? capacitor.getPlatform() : null;
  if (platform === "android" || platform === null) {
    const healthConnect = getHealthConnectBridge();
    if (healthConnect) return { platform: "android", name: "Health Connect", bridge: healthConnect };
  }
  if (platform === "ios" || platform === null) {
    const healthKit = capacitor.Plugins?.TrackFitHealthKit;
    if (
      typeof healthKit?.getStatus === "function" &&
      typeof healthKit?.requestPermissions === "function" &&
      typeof healthKit?.readTodaySteps === "function"
    ) {
      return { platform: "ios", name: "Apple Health", bridge: healthKit };
    }
  }
  return null;
}

export async function readWearableSteps(date, provider = getWearableBridge(), options = {}) {
  if (!provider) throw new Error("Step syncing needs the native TrackFit app. Enter steps manually for now.");
  if (provider.platform === "android") {
    return readAndroidHealthSteps(date, provider.bridge, options);
  }
  if (provider.platform !== "ios") throw new Error("Unsupported health provider.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid day requested.");
  const bridge = provider.bridge;
  const status = await bridge.getStatus();
  if (!status?.available) throw new Error("Apple Health isn't available on this device.");
  // Apple does not reveal read authorization status: authorizationRequested
  // means only that iOS displayed the prompt, never that access was granted.
  if (!status.authorizationRequested && !status.stepsGranted) {
    const permission = await bridge.requestPermissions({ dataTypes: ["steps"] });
    if (!permission?.authorizationRequested && !permission?.stepsGranted) {
      throw new Error("Apple Health setup wasn't completed. You can still enter steps manually.");
    }
  }
  const record = await bridge.readTodaySteps({ date });
  if (record?.date !== date || !Number.isSafeInteger(record.steps) || record.steps < 0 || record.steps > 150000) {
    throw new Error("Apple Health steps were unavailable or invalid.");
  }
  // HealthKit returns no data after a denied read request as a privacy measure.
  // Do not overwrite any existing saved steps with an empty or zero reading.
  if (record.dataPresent === false || record.steps === 0) {
    throw new Error("No readable Apple Health steps today. Check Health > Steps and TrackFit access in iPhone Settings. Your saved total is unchanged.");
  }
  return { steps: record.steps, stepsSource: "apple_health", stepsSyncedAt: new Date().toISOString() };
}
