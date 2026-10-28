# TrackFit virtual-device test plan

This adds three independent test lanes to the **ui-app-shell** branch:

| Workflow | Trigger | What it verifies | Limits |
| --- | --- | --- | --- |
| **TrackFit General Phones + iPhone Safari Matrix** | Automatically on relevant PRs/pushes + manual | Browser sign-in responsiveness and input on 320/360/393/412px generic Android screens, 375/390/430px iPhone Safari-engine views, and 768px tablet | Playwright emulates touch, viewport and user agent. It is NOT a real phone or iOS Simulator. No signed-in workout tests yet. |
| **TrackFit Android Emulator Smoke (Manual)** | Actions > Run workflow | Builds an unsigned native debug APK, boots Android API 29 or 35 virtual device, installs and launches TrackFit, captures screenshot | Does not test a real Samsung watch, Health Connect sensor sync, payment flows or real login. |
| **TrackFit iPhone Simulator Smoke (Manual)** | Actions > Run workflow | Generates Capacitor iOS shell on macOS, unsigned Xcode simulator build, boots available iPhone simulator, installs and launches the app, captures screenshot | This is an iOS simulator smoke test, NOT a TestFlight-ready app or HealthKit integration. Requires a compatible Xcode version and available macOS runner. |

## Running

1. Open GitHub > **haamip/FitnessTracker** > **Actions**.
2. Choose the Android or iPhone Simulator workflow, click **Run workflow**, and select the branch `ui-app-shell` (once this PR is merged). Android offers older API 29 and modern API 35.
3. For broad browser testing, look at the **TrackFit General Phones + iPhone Safari Matrix** check on the PR, or run it manually.
4. Check the uploaded screenshots and evidence under the corresponding workflow run's **Artifacts**.

Browser results use **dummy Supabase settings** to load the sign-in UI. They do not use customer login credentials or send fitness data to production.

Emulator workflows are opt-in to avoid consuming substantial GitHub runner minutes on every commit. These should be run as release checks until a reliable baseline is established.

## Future coverage

- Add a dedicated non-production Supabase test account and safe fixtures to exercise authenticated workout timers, barcode/AI import, nutrition and weekly reviews.
- Add native iOS HealthKit access separately before claiming parity with Android Health Connect.
- Add real physical-device checks (e.g. Firebase Test Lab) for watch integrations, camera, Bluetooth, performance and OS-specific behaviour.
- Add accessibility checks and visual regression snapshots once the auth and app screens are stable.

**Release caveat:** a passing simulator smoke test proves only that the app built and opened, not that every feature works on that OS.
