# TrackFit: Android-native-first delivery

TrackFit's **primary mobile product is the Android app** (Capacitor 8 + source-controlled Kotlin integrations). The React/Vite experience remains the same shared app across native and web; the website is a companion and works without device permissions. This avoids an expensive re-write in Kotlin and lets us grow a real native capability layer.

## Built in this milestone

- Android Native preview identity: `nz.hakt.trackfit.nativepreview`, launcher **TrackFit Native**. This intentionally installs separately from `.stepcompare` and older test APKs, so their existing local workout records are not overwritten.
- Native home starts with a clear Health Connect Watch & Steps module. **Sync watch** explicitly reads the day's steps and saves them into the signed-in TrackFit account's daily check-in; errors don't overwrite previous steps.
- Opt-in syncing on app open/foreground resume (at most once per 15 minutes, with already granted read-Steps access). No unrequested permission prompts or continual background collection.
- Installed-Android-only safe-area layout, keeping the browser design unchanged.
- The **TrackFit Native Android Preview** workflow now rebuilds an installable Android APK whenever the TrackFit source, public assets, native code or build configuration changes on `ui-app-shell`, as well as preview builds on PRs. Artifacts are retained for 30 days.
- The web uses the same Supabase account and check-in records. Refresh the browser after native cloud backup to see steps on the web Dashboard and Cardio.

## Data flow

`Galaxy Watch -> Samsung Health -> Health Connect -> TrackFit Native -> Supabase account -> TrackFit web`

Read Steps is the only requested Health Connect scope today. It does **not** import exercise sessions, heart rate or sleep, and does not watch your data in the background. Manual step entry remains available.

## Developer build

GitHub Actions -> **TrackFit Native Android Preview** -> the latest successful `ui-app-shell` run -> download artifact `trackfit-native-preview-apk` -> extract `app-debug.apk`.

The Android platform is generated per build using:
- `native/android/prepare-web.mjs` to register the native-only Capacitor bridge in the mobile bundle.
- `native/android/prepare-shell.mjs` to add Kotlin Health Connect plugin, permissions, safe package identity and launcher resources.
- `capacitor.config.json` and `native/android/src/*` as checked-in native source.

The web build and Vercel deployment remain independent. Do **not** add native bridge imports to the regular website bundle without a platform guard and matching dependencies.

**APK limitations:** This is a development debug build, not a Play Store release. CI-generated debug APKs may not share a stable signing certificate between runs, so updating an installed preview might require uninstalling it. Check that your account data is backed up before uninstalling anything; cached offline data in an older debug package may be lost. Use a stable, privately held signing key before releasing an updatable beta. Never commit a keystore.

## Next native release gates

1. **Stable signing and versioning:** persistent Android keystore in CI secrets, predictable `versionCode`/version name, Play internal-test track and store package `nz.hakt.trackfit`. Validate side-by-side migration before touching old test installations.
2. **Background/periodic watch syncing:** request explicit opt-in and `READ_HEALTH_DATA_IN_BACKGROUND` only where supported. Use WorkManager and feature availability checks; validate power use, offline storage and privacy. Current sync only runs in foreground.
3. **Health cardio imports:** separately implement `READ_EXERCISE` and deduplicate Health Connect sessions against manually logged cardio so totals aren't doubled. No claims until verified.
4. **Nutrition camera & photo:** camera barcode scan in the app, searchable database, and secure backend for AI photo analysis.
5. **Android behaviour:** deep links, back navigation, sharing, accessibility, test phones, performance, mobile offline strategy, and crash reports scrubbed of health records.
6. **Privacy and compliance:** consent screens, clear Health Connect scope rationale, privacy policy, Play Console health and data-safety declarations, revoke/delete account data flows.
7. **Release tests:** Galaxy Watch + Samsung Health step totals, read-permission denial, timezone changes, day rollover, airplane mode, account switch, restoration after reinstall and real Play Store install/update.

Capacitor makes native Android SDK functions available to the existing React app via plugins, but this remains a hybrid app with a native shell. A full Kotlin/Jetpack Compose rewrite is **not part of this milestone** and shouldn't be assumed to be necessary for a high-quality native app.

References:
- https://capacitorjs.com/docs
- https://developer.android.com/health-and-fitness/health-connect/read-data
