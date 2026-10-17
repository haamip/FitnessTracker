// Bundled ONLY for the native debug APK build. No impact on the PWA.
import { Capacitor, registerPlugin } from "@capacitor/core";

const native = registerPlugin("TrackFitHealthConnect");
if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
  const bridge = window.Capacitor || Capacitor;
  if (!bridge.Plugins) bridge.Plugins = {};
  bridge.Plugins.TrackFitHealthConnect = native;
}
