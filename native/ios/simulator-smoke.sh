#!/usr/bin/env bash
set -euo pipefail
mkdir -p ios-test-results

APP="ios-simulator-build/Build/Products/Debug-iphonesimulator/App.app"
test -d "$APP" || { echo "iOS Simulator build missing"; exit 1; }

# Choose an available iPhone rather than hardcoding a device name tied to Xcode.
SIM_ID="$(xcrun simctl list -j devices available | python3 -c '
import json, sys
data = json.load(sys.stdin)
phones = [device for group in data["devices"].values() for device in group
          if device.get("isAvailable") and device.get("name", "").startswith("iPhone")]
if not phones: raise SystemExit("No available iPhone simulators on this macOS runner")
print(phones[0]["udid"])
')"

echo "Selected iPhone simulator: $SIM_ID"
xcrun simctl boot "$SIM_ID"
xcrun simctl bootstatus "$SIM_ID" -b
xcrun simctl install "$SIM_ID" "$APP"
xcrun simctl launch "$SIM_ID" nz.hakt.trackfit
sleep 12
xcrun simctl io "$SIM_ID" screenshot ios-test-results/trackfit-iphone.png
printf 'iPhone simulator UUID: %s\nApp: nz.hakt.trackfit\n' "$SIM_ID" > ios-test-results/launch-result.txt
echo "TrackFit launched successfully on virtual iPhone"
