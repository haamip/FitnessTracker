/* global console */
/**
 * Add Health Connect bridge registration to the native-only Vite entrypoint.
 * CI runs this after npm ci and installing Capacitor dependencies, before build.
 * Never run against the production website unless making an Android APK.
 */
import { readFileSync, writeFileSync } from "node:fs";
const entry = "src/main.jsx";
const original = readFileSync(entry, "utf8");
const registration = 'import "../native/android/registerHealthConnect.js";\n';
if (!original.includes(registration)) {
  writeFileSync(entry, registration + original);
}
console.log("Native-only Health Connect JavaScript registration prepared.");
