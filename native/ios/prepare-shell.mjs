/* global console */
import { existsSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const app = "ios/App/App";
if (!existsSync(join(app, "Info.plist"))) throw new Error("Generate Capacitor iOS first: npx cap add ios");
for (const file of ["TrackFitHealthKitPlugin.swift", "TrackFitViewController.swift"]) {
  copyFileSync(join("native/ios", file), join(app, file));
}

const scenePath = join(app, "SceneDelegate.swift");
const storyboardPath = join(app, "Base.lproj/Main.storyboard");
let wired = false;
if (existsSync(scenePath)) {
  const original = readFileSync(scenePath, "utf8");
  // Capacitor 8's UIScene template can create its own bridge controller.
  if (original.includes("CAPBridgeViewController()") || original.includes("TrackFitViewController()")) {
    writeFileSync(scenePath, original.replaceAll("CAPBridgeViewController()", "TrackFitViewController()"));
    wired = true;
  }
}
if (existsSync(storyboardPath)) {
  const original = readFileSync(storyboardPath, "utf8");
  if (original.includes('customClass="CAPBridgeViewController"')) {
    writeFileSync(storyboardPath, original.replace(
      /customClass="CAPBridgeViewController"(?: customModule="Capacitor")?/g,
      'customClass="TrackFitViewController" customModule="App"'));
    wired = true;
  } else if (original.includes('customClass="TrackFitViewController"')) wired = true;
}
if (!wired) throw new Error("Capacitor iOS template changed: could not register TrackFitViewController.");

const plistPath = join(app, "Info.plist");
let plist = readFileSync(plistPath, "utf8");
const key = "<key>NSHealthShareUsageDescription</key>";
if (!plist.includes(key)) {
  plist = plist.replace("<dict>", '<dict>\n\t' + key +
    '\n\t<string>TrackFit reads your daily step count from Apple Health when you choose to sync. We never change your Apple Health records.</string>');
  writeFileSync(plistPath, plist);
}
const entitlements = join(app, "TrackFit.entitlements");
writeFileSync(entitlements, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict><key>com.apple.developer.healthkit</key><true/></dict></plist>
`);
console.log("iOS HealthKit permissions, sources and controller prepared.");
