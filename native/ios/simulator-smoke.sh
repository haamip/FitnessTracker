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
# macOS hosted runners can hang booting a fresh simulator. Bound each operation
# so CI reports an actionable failure instead of consuming the full job timeout.
python3 - "$SIM_ID" "$APP" <<'PY'
import subprocess
import sys

udid, app = sys.argv[1], sys.argv[2]
steps = [
    ("boot", ["xcrun", "simctl", "boot", udid], 60),
    ("boot readiness", ["xcrun", "simctl", "bootstatus", udid, "-b"], 210),
    ("install", ["xcrun", "simctl", "install", udid, app], 90),
    ("launch", ["xcrun", "simctl", "launch", udid, "nz.hakt.trackfit"], 60),
]
for title, args, seconds in steps:
    print(f"iPhone simulator: {title}", flush=True)
    try:
        subprocess.run(args, check=True, timeout=seconds)
    except subprocess.TimeoutExpired:
        sys.exit(f"iPhone simulator {title} timed out after {seconds} seconds")
PY
sleep 12
xcrun simctl io "$SIM_ID" screenshot ios-test-results/trackfit-iphone.png
printf 'iPhone simulator UUID: %s\nApp: nz.hakt.trackfit\n' "$SIM_ID" > ios-test-results/launch-result.txt
echo "TrackFit launched successfully on virtual iPhone"
