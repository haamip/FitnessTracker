# TrackFit Android stable beta signing

TrackFit's automatically generated **debug preview APK** is signed with a temporary Android debug key. That signature can change between GitHub Actions runners, which explains occasional failed installs or update collisions. Debug artifacts are **not** suitable for store distribution.

## New supported path
The GitHub Actions workflow **TrackFit Signed Android Beta** (`.github/workflows/android-signed-beta.yml`) can be run manually after setting the four encrypted repository Actions secrets. It generates the Capacitor Android project, registers the native Health Connect bridge, configures **release** signing on the generated Gradle project, builds an APK and AAB, verifies the APK signature and uploads both as private GitHub Actions artifacts. Builds never automatically publish to Google Play.

**Required GitHub repository Actions secrets:**

- `TRACKFIT_ANDROID_KEYSTORE_BASE64`: base64 encoding of the **binary** Android signing keystore. Encode on a trusted local device. Never check the keystore into Git or place it in a public website environment variable.
- `TRACKFIT_ANDROID_STORE_PASSWORD`: keystore password.
- `TRACKFIT_ANDROID_KEY_ALIAS`: signing-key alias.
- `TRACKFIT_ANDROID_KEY_PASSWORD`: signing-key password.

Use one **long-term, backed-up** release keystore for all future TrackFit release builds. If you lose the key, signed APK updates are affected; use Google Play App Signing and store its upload key securely when enrolling in Google Play. Set the above secrets in GitHub under Settings → Secrets and variables → Actions. The user must supply and preserve the keystore and passwords; they cannot be guessed or recovered from the repo.

The script `native/android/configure-release-signing.mjs` reads environment variables without writing passwords to Git. It sets the release app version code to 100000 + the GitHub Actions workflow run number, and version name to `1.0.<run number>`. The APK's release package uses the app ID `nz.hakt.trackfit`; the older test/debug build uses `nz.hakt.trackfit.nativepreview` and may install separately. Do not uninstall older test versions until check-in and workout records have safely synced or been exported.

## Launch checklist
1. Owner creates and privately backs up keystore; saves four GitHub encrypted secrets.
2. Run Actions → **TrackFit Signed Android Beta** → Run workflow.
3. Verify signature, install signed beta on a test Android phone, grant Health Connect permissions, test steps and app updates using two successive signed builds.
4. Verify privacy/data isolation across accounts, working AI with server-side `OPENAI_API_KEY`, and fully synced workouts/nutrition/cardio.
5. Enroll in Google Play App Signing and upload the signed AAB only after store listing, policies, health-data declaration and feature tests are complete.

This workflow is not runnable without the actual signing key; it deliberately fails early instead of producing a misleading or inconsistent "release" build.
