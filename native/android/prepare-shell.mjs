/* global process, console */
/**
 * Finish "npx cap add android" with TrackFit's Kotlin Health Connect plugin.
 * Checks all expected structure and fails instead of silently dropping permissions.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { writeTrackFitLauncherIcons } from "./trackfit-icons.mjs";

const root = resolve(process.cwd());
const base = join(root, "android");
if (!existsSync(join(base, "app", "build.gradle"))) {
  throw new Error("Missing generated Android app: run npx cap add android first.");
}
function modify(path, change) {
  const original = readFileSync(path, "utf8");
  const edited = change(original);
  if (edited === original) throw new Error("Expected change not applied: " + path);
  writeFileSync(path, edited);
}

modify(join(base, "build.gradle"), text => {
  const marker = /classpath ['"]com\.android\.tools\.build:gradle:[^'"]+['"]/;
  if (!marker.test(text)) throw new Error("Unexpected Gradle root structure");
  return text.replace(marker, match =>
    match + "\n        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:2.2.20'");
});

modify(join(base, "app", "build.gradle"), text => {
  const marker = "apply plugin: 'com.android.application'";
  if (!text.includes(marker)) throw new Error("Unexpected Gradle app structure");
  if (!text.includes("buildTypes {")) throw new Error("Unexpected Gradle build type structure");
  return text.replace(marker, marker + "\napply plugin: 'kotlin-android'")
    .replace("buildTypes {", "buildTypes {\n        debug {\n            applicationIdSuffix '.nativepreview'\n            versionNameSuffix '-native-preview'\n        }") +
    "\n\nkotlin {\n  jvmToolchain(21)\n}\n\n" +
    "dependencies {\n" +
    '  implementation "androidx.health.connect:connect-client:1.1.0"\n' +
    '  implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2"\n' +
    "}\n";
});

modify(join(base, "app", "src", "main", "AndroidManifest.xml"), text => {
  if (!text.includes("</manifest>") || !text.includes("</application>")) {
    throw new Error("Unexpected AndroidManifest structure");
  }
  const permission = [
    '    <uses-permission android:name="android.permission.health.READ_STEPS" />',
    '    <queries><package android:name="com.google.android.apps.healthdata" /></queries>'
  ].join("\n");
  const activities = [
    '        <activity android:name=".HealthPermissionsActivity" android:exported="false" />',
    '        <activity android:name=".PermissionsRationaleActivity" android:exported="true">',
    '          <intent-filter><action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" /></intent-filter>',
    '        </activity>',
    '        <activity-alias android:name="ViewPermissionUsageActivity"',
    '            android:exported="true" android:targetActivity=".PermissionsRationaleActivity"',
    '            android:permission="android.permission.START_VIEW_PERMISSION_USAGE">',
    '          <intent-filter>',
    '            <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />',
    '            <category android:name="android.intent.category.HEALTH_PERMISSIONS" />',
    '          </intent-filter>',
    '        </activity-alias>'
  ].join("\n");
  return text.replace("</application>", activities + "\n    </application>")
    .replace("</manifest>", permission + "\n</manifest>");
});

modify(join(base, "variables.gradle"), text => {
  if (!/minSdkVersion\s*=\s*24/.test(text)) throw new Error("Unexpected minSdkVersion");
  return text.replace(/minSdkVersion\s*=\s*24/, "minSdkVersion = 28");
});

// Use a dedicated native-preview package so older .stepcompare test builds and their\n// local caches remain untouched. The store package remains nz.hakt.trackfit.
const stringsFile = join(base, "app", "src", "main", "res", "values", "strings.xml");
modify(stringsFile, text => {
  const oldLabel = '<string name="app_name">TrackFit</string>';
  if (!text.includes(oldLabel)) throw new Error("Unexpected Android app name resource");
  return text.replace(oldLabel, '<string name="app_name">TrackFit Native</string>');
});

const sourcePackage = join(base, "app", "src", "main", "java", "nz", "hakt", "trackfit");
mkdirSync(sourcePackage, { recursive: true });
const javaFile = join(sourcePackage, "MainActivity.java");
if (existsSync(javaFile)) rmSync(javaFile);
for (const name of [
  "MainActivity.kt",
  "TrackFitHealthConnectPlugin.kt",
  "HealthPermissionsActivity.kt",
  "PermissionsRationaleActivity.kt"
]) {
  copyFileSync(join(root, "native", "android", "src", name), join(sourcePackage, name));
}
writeTrackFitLauncherIcons(base);
console.log("TrackFit Android native shell and Health Connect source prepared.");
