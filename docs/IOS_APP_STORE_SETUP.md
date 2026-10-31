# TrackFit for iPhone — HAKT Industries release checklist

**Current code branch:** `feature/apple-healthkit-step-sync-20261031` (draft PR #74).
**App name:** TrackFit
**iOS bundle ID:** `nz.hakt.trackfit`
**Company:** HAKT Industries Ltd
**Backend/auth:** Existing Supabase project — not Firebase.
**Native integration:** Capacitor iOS + read-only Apple Health / HealthKit step count.
**Distribution:** TestFlight first, App Store after real-device checks.

## Tonight: Apple Developer enrolment

1. Use [Apple Developer enrollment](https://developer.apple.com/programs/enroll/).
2. Choose **Organisation** for HAKT Industries Ltd, if Apple's verification requirements can be met.
3. Confirm company's legal name, address, authorised contact and D-U-N-S number; Apple may take time to verify.
4. Membership is required to sign and distribute iPhone apps with TestFlight. An ordinary free Apple Account is enough only for limited development.
5. After approval, in **Certificates, Identifiers & Profiles**, register the explicit App ID `nz.hakt.trackfit`, enable **HealthKit**, and create an Apple Distribution certificate and an App Store provisioning profile for this App ID.
6. In [App Store Connect](https://appstoreconnect.apple.com/), create **TrackFit** as an iOS app record, choosing the same bundle ID. Configure the app's privacy and beta-test information. Do not submit to public review yet.

You can sign up without owning an iPhone or Mac, but **actual step integration needs to be checked on a real iPhone before we invite public testers**. HealthKit read-permission status cannot be inspected directly: iOS may report no steps if permission is denied.

## After enrollment: prepare GitHub TestFlight workflow

The repository has **TrackFit iPhone TestFlight Beta (Manual)** at
`.github/workflows/iphone-testflight-beta.yml`. This runs only when explicitly
started from the approved `ui-app-shell` branch after the PR is merged, and requires
these encrypted GitHub Actions secrets:

| Secret | What it contains |
| --- | --- |
| `TRACKFIT_IOS_TEAM_ID` | Apple Developer Team ID |
| `TRACKFIT_IOS_DISTRIBUTION_P12_BASE64` | Base64 of Apple Distribution .p12 signing certificate **and private key** |
| `TRACKFIT_IOS_DISTRIBUTION_P12_PASSWORD` | Password for the .p12 |
| `TRACKFIT_IOS_PROFILE_BASE64` | Base64 of the App Store provisioning profile for `nz.hakt.trackfit` with HealthKit enabled |
| `TRACKFIT_ASC_API_KEY_ID` | App Store Connect API key ID |
| `TRACKFIT_ASC_API_ISSUER_ID` | App Store Connect API issuer ID |
| `TRACKFIT_ASC_API_PRIVATE_KEY` | The entire private `.p8` key text from App Store Connect |
| `TRACKFIT_SUPABASE_URL` | TrackFit project's existing public Supabase URL |
| `TRACKFIT_SUPABASE_ANON_KEY` | TrackFit project's existing **publishable/anon** key (never the service-role key) |

**Never** send the signing private key, .p12, .p8 or their passwords in chat,
commit them to the repository, store them in Vercel `VITE_*` variables, or send
them to testers. Use GitHub repository encrypted Actions secrets.

Apple Developer account credentials alone are **not** sufficient to run the
workflow: signing material and the App Store Connect API key must exist.

## What the workflow does

- Runs on Apple's macOS GitHub Actions runner; you don't need a Mac for CI.
- Builds the React TrackFit interface for iOS and generates a real Capacitor app.
- Adds the read-only HealthKit plugin, native privacy strings and HealthKit entitlement.
- Applies the correct App Store signing profile and archive version.
- Exports an App Store IPA and uploads it to TestFlight using App Store Connect.
- **Does not automatically invite testers, submit to public App Review or publish to the store.**

The iPhone simulator smoke workflow is separate, unsigned and can run without
Apple membership. It verifies the native code builds and the app launches on an
iPhone simulator; it cannot validate real step data.

## Testing checklist before external beta

- iPhone without Apple Watch: Health app has Steps -> TrackFit reads today after an opt-in permission request
- iPhone with Apple Watch: both supply eligible step data; compare totals and check source duplicates
- Permission declined/revoked: no misleading "connected" claim; existing check-in steps not overwritten
- Zero or missing steps: leave existing check-in unchanged, manual entry still works
- Check date rollover and timezone, local-day steps, app restart and foreground resync
- Log in with two separate TrackFit accounts: verify steps belong to the correct account only
- Verify workout save, nutrition, meal photos, barcode camera permissions and AI Coach on iPhone
- Make sure Apple privacy policy, TestFlight description, support contact and data declarations match actual data handling
- Only then enable external TestFlight testing (the first external beta may need Apple review)

## Project references

- Apple enrolment: https://developer.apple.com/programs/enroll/
- App Store Connect: https://appstoreconnect.apple.com/
- Apple HealthKit: https://developer.apple.com/documentation/healthkit/
- TestFlight: https://developer.apple.com/testflight/
- Native setup details: `docs/IOS_HEALTHKIT_TESTING.md`
