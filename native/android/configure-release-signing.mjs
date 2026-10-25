/* global process, console */
/**
 * Configure a generated Capacitor Android project for signed release builds.
 * Run only inside the manually-triggered beta build after secret validation.
 * Release signing secrets are injected through CI environment variables.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const required = [
  "TRACKFIT_ANDROID_STORE_PASSWORD",
  "TRACKFIT_ANDROID_KEY_ALIAS",
  "TRACKFIT_ANDROID_KEY_PASSWORD",
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing GitHub Actions secret: ${key}`);
}
const run = Number.parseInt(process.env.TRACKFIT_ANDROID_BUILD_NUMBER || "", 10);
if (!Number.isSafeInteger(run) || run < 1) {
  throw new Error("A positive TRACKFIT_ANDROID_BUILD_NUMBER is required for Play versioning.");
}
const gradleFile = resolve("android/app/build.gradle");
const keyFile = resolve("android/app/trackfit-release.keystore");
if (!existsSync(gradleFile) || !existsSync(keyFile)) {
  throw new Error("Generated Android app or signed-beta keystore missing.");
}
const gradle = readFileSync(gradleFile, "utf8");
const marker = "    buildTypes {";
if (!gradle.includes(marker) || gradle.includes("trackfitRelease {")) {
  throw new Error("Unexpected Gradle file or signing already configured.");
}
const signer = `    signingConfigs {
        trackfitRelease {
            storeFile file("trackfit-release.keystore")
            storePassword System.getenv("TRACKFIT_ANDROID_STORE_PASSWORD")
            keyAlias System.getenv("TRACKFIT_ANDROID_KEY_ALIAS")
            keyPassword System.getenv("TRACKFIT_ANDROID_KEY_PASSWORD")
        }
    }
`;
let patched = gradle.replace(marker, signer + marker);
const releaseMarker = "        release {";
if (!patched.includes(releaseMarker)) throw new Error("Expected release build type missing.");
patched = patched.replace(releaseMarker, releaseMarker + "\n            signingConfig signingConfigs.trackfitRelease");
if (!/versionCode\s+\d+/.test(patched) || !/versionName\s+"[^"]+"/.test(patched)) {
  throw new Error("Expected Capacitor Android app version fields missing.");
}
patched = patched.replace(/versionCode\s+\d+/, "versionCode " + (100000 + run))
  .replace(/versionName\s+"[^"]+"/, 'versionName "1.0.' + run + '"');
writeFileSync(gradleFile, patched);
console.log("TrackFit signed beta Gradle configuration prepared; no private key values written to source.");
