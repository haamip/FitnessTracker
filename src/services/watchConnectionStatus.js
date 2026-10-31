import { getWearableBridge } from "./wearableBridge";

export function isTrackFitNativeApp() {
  if (typeof window === "undefined") return false;
  return typeof window.Capacitor?.isNativePlatform === "function" && window.Capacitor.isNativePlatform();
}

/** Permission/status diagnostics without requesting access or reading any activity records. */
export async function inspectWatchConnection({ native = isTrackFitNativeApp(), provider = getWearableBridge() } = {}) {
  if (!native) return { state: "browser", message: "You're using the TrackFit website. Open the installed TrackFit Android or iPhone app to sync steps." };
  if (!provider) return { state: "plugin-missing", message: "This installed TrackFit build can't find its health connector. Install the current native test build." };
  try {
    const status = await provider.bridge.getStatus();
    if (!status?.available) return { state: "unavailable", message: provider.platform === "ios"
      ? "Apple Health isn't available on this device."
      : "Health Connect isn't available on this phone. Check Android settings and Health Connect." };
    if (provider.platform === "ios") {
      if (status.authorizationRequested) return {
        state: "ready",
        message: "Apple Health setup was requested. Apple keeps read permission private; tap Sync my steps to check whether step data is available.",
      };
      return { state: "permission-needed", message: "Tap Sync my steps to request read-only Apple Health Steps access." };
    }
    if (!status.stepsGranted) return {
      state: "permission-needed",
      message: `${provider.name} is available, but TrackFit does not have permission to read steps. Tap Sync steps from watch to grant it.`,
    };
    return { state: "ready", message: `${provider.name} is connected and Steps permission is granted. Tap Sync steps from watch to load today's total.` };
  } catch {
    return { state: "connection-error", message: "TrackFit couldn't check health permissions. Close and reopen the app, then try again." };
  }
}
