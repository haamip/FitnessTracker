# TrackFit Android Debug Build — Health Connect

## Included

- Capacitor v8 Android shell generated in CI from TrackFit's React application (not a webview pointing at production).
- Native Kotlin TrackFitHealthConnect plugin: getStatus, requestPermissions, readTodaySteps.
- The official Health Connect permission dialog requests read-only Steps access on demand.
- Aggregated daily steps (StepsRecord.COUNT_TOTAL), using the phone's local-day boundaries rather than adding Samsung/phone records together.
- Android privacy rationale screen.
- No permission to write health records, read heart rate or sleep, or collect in the background.
- GitHub Actions generates a debug APK, not a store-ready signed release.

## Build / test

Open GitHub Actions → TrackFit Android Debug APK → open the PR workflow run.
If the build succeeds, the artifact is named trackfit-android-debug-apk.

The workflow installs Capacitor 8.3.0, Health Connect SDK 1.1.0 stable, Java 21 and Android SDK 36. It runs Gradle assembleDebug.

### Credentials

For a usable debug APK sign-in, set GitHub Actions repository secrets:

- TRACKFIT_SUPABASE_URL: the TrackFit Supabase project URL
- TRACKFIT_SUPABASE_ANON_KEY: TrackFit's public/anon key (never use service-role credentials)

If these secrets are absent, the APK can compile but the signed-in app will display a setup error. Never package privileged Supabase keys into a mobile app.

### Physical device smoke test

1. Install the debug APK on an Android 9+ phone with Health Connect available (Android 13 or older may need to install it).
2. Make sure Galaxy Watch steps appear in Samsung Health, and Samsung Health shares Steps with Health Connect.
3. Sign in to TrackFit and open Daily Check-in.
4. Tap Sync steps from watch. Verify the phone shows READ_STEPS and no other health permission.
5. Deny access, then confirm manual check-ins still work.
6. Grant access; compare the displayed count to Health Connect; tap Save.
7. Reload, revoke permission and confirm the app doesn't pretend to be connected.
8. Check multiple sources, local midnight/DST, offline use and another supported watch.
9. Confirm no raw health data appears in logs or crash reports.

## Release gates

- Android debug build must compile and upload a usable APK.
- Real Galaxy phone/watch testing remains necessary.
- Publish a full privacy policy, Play Store Health Apps declaration, data safety information and obtain user consent before any store release.
- Automatic/background sync and Wear OS on-watch controls are separate milestones.

References:
- https://developer.android.com/health-and-fitness/health-connect/get-started
- https://developer.android.com/health-and-fitness/health-connect/read-data
- https://capacitorjs.com/docs/android/custom-code
