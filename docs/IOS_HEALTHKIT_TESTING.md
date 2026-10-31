# TrackFit native iPhone / Apple Health steps (first beta)

The Vercel website and ordinary iPhone Safari do **not** access HealthKit. TrackFit
already uses Supabase for its own accounts; Firebase is **not** required.

## What is wired

- Capacitor 8 iOS shell + Swift **TrackFitHealthKit** plugin.
- One user-initiated read-only authorization request for the Steps type.
- Local-day cumulative step count from Apple Health, including iPhone-only data
  and Apple Watch data (when actually present in Apple Health).
- Positive, validated step totals save to the same account-scoped daily
  check-in used by Android and the website. No duplicate addition to cardio.
- Manual entry remains available. Zero/missing readings never replace
  an existing check-in.
- Optional foreground auto-sync after a manual request, at most every 15 minutes.
  No always-on/background health collection.

**Important Apple privacy rule:** HealthKit does not expose whether the user
approved read authorization. The plugin's `authorizationRequested` means only
that the OS request completed. Do not label it "permission granted". If steps
are zero after the prompt, ask the user to check Health permissions/data.

## Generate and simulate (Mac/Xcode required)

1. `npm ci`
2. `npm install --no-save --package-lock=false @capacitor/core@8.3.0 @capacitor/ios@8.3.0 @capacitor/cli@8.3.0`
3. `node native/ios/prepare-web.mjs && npm run build`
4. `npx cap add ios`
5. `node native/ios/prepare-shell.mjs`
6. `gem install xcodeproj --no-document && ruby native/ios/configure-xcode.rb`
7. `npx cap sync ios`
8. Build from `ios/App/App.xcodeproj` in Xcode or run GitHub Actions workflow **TrackFit iPhone Simulator Smoke**.

The simulator validates launching and native compilation, **not live step
tracking**. Live verification requires an iPhone; no Apple Watch is required.

## Test on a real iPhone

1. Enrol in the Apple Developer Program to distribute builds through TestFlight
   (an Apple Account alone is free, but not enough for TestFlight).
2. Set up the correct App ID (`nz.hakt.trackfit`) with the HealthKit capability,
   signing certificate, provisioning and App Store Connect listing.
3. Archive a signed build on macOS/Xcode, upload to App Store Connect and invite
   a private tester in TestFlight. External testers may require beta review.
4. Test first with iPhone only: walk and confirm Apple Health Steps has data.
5. Sign in with a dedicated **TrackFit (Supabase)** account, open **Steps & devices**,
   choose **No watch — phone steps**, and tap **Sync my steps**.
6. Approve Steps access in the iOS prompt. Compare TrackFit with Apple Health
   Steps for the same local day. Confirm web account sync, app relaunch,
   permission denial, missing records, day rollover and different accounts.
7. Repeat using an Apple Watch after its data appears in Apple Health.

### Apple Health privacy / support

Apple Health lets a user revoke access in iOS settings; the app cannot detect
read access denial directly. No reading without user action first. We request
**read Steps only**, not heart rate, sleep or write access. Do not claim the
app is public/TestFlight-ready until a signed build is tested on hardware.

The iPhone simulator workflow uses dummy Supabase values and is only a launch
smoke test. To do full integration testing on hardware, use actual environment
settings in the signed build (do not commit private keys/certificates).
