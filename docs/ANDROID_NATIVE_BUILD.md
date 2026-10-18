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

The debug build uses the project's public Supabase URL and RLS-restricted publishable key by default, so sign-in can work without extra repository settings. You can override them using the two GitHub Actions secrets above. These are public client credentials, not administrator credentials. Never package a Supabase secret or service-role key in a mobile app.

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

## Health Connect diagnostic test build

The debug APK is labelled **TrackFit Test** and uses the Android package suffix `.testing`. It installs alongside the previous test build, so you do not have to uninstall that app or erase its local workout/check-in cache.

If Health Connect shows steps but TrackFit has a blank count:

1. Launch the installed **TrackFit Test** app (not the website or old TrackFit icon), then sign in.
2. Open **Daily check-in** and tap **Check watch connection**. Read the exact status.
3. If permission is missing, tap **Sync steps from watch**, and allow TrackFit Test to **read Steps**.
4. If TrackFit Test says **Health Connect returned 32 steps**, confirm the input says 32, then tap **Save daily check-in**. The coach needs this saved record.
5. If Health Connect has steps but TrackFit returns zero or an error, report the diagnostic text and check local day / source priority. Do not assume records are available to this app until read permission is granted.
6. Test the data again after restarting TrackFit Test. Leave the old app installed until the new one is confirmed working.

Native builds contain a public, RLS-restricted Supabase client key, not any service-role credential.
