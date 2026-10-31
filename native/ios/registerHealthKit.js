// Bundled ONLY for native iOS builds. The Vercel web app has no HealthKit access.
import { Capacitor, registerPlugin } from "@capacitor/core";

const healthKit = registerPlugin("TrackFitHealthKit");
if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
  const bridge = window.Capacitor || Capacitor;
  if (!bridge.Plugins) bridge.Plugins = {};
  bridge.Plugins.TrackFitHealthKit = healthKit;
}
