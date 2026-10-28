#!/usr/bin/env bash
set -euo pipefail

# Unsigned preview has a separate package; never install over the user's app.
PACKAGE="nz.hakt.trackfit.nativepreview"
APK="android/app/build/outputs/apk/debug/app-debug.apk"

mkdir -p emulator-results
test -f "$APK" || { echo "Preview APK missing"; exit 1; }
adb devices -l
adb install -r "$APK"
adb shell pm path "$PACKAGE" | grep -q 'package:' || {
  echo "TrackFit package not installed on virtual Android"; exit 1;
}
adb shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1
sleep 12
adb exec-out screencap -p > emulator-results/trackfit-launch.png || true

PID="$(adb shell pidof "$PACKAGE" | tr -d '\r')"
if [ -z "$PID" ]; then
  echo "TrackFit exited unexpectedly after launch"
  exit 1
fi
printf 'Package: %s\nPID: %s\n' "$PACKAGE" "$PID" > emulator-results/launch-result.txt
echo "TrackFit launched on Android emulator with PID $PID"
