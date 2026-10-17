# Galaxy Watch → TrackFit (Android)

## What is implemented now
- Android Health Connect bridge contract and explicit user-initiated step import UI.
- The sync control is hidden in a normal browser/PWA; users can always enter steps manually.
- Validation protects the daily entry from empty, negative, implausibly large, or wrong-date totals.
- Imported steps are tagged `health_connect` and **replace**, rather than add to, daily step totals.
- No health records are accessed without a future native bridge and the user's permission.
- No Android plugin is bundled yet. This work is a **foundation**, not a working Galaxy Watch connection.

## Samsung Health setup on the phone
1. Make sure Galaxy Watch is syncing with Samsung Health on the phone.
2. Samsung Health → Settings → Health Connect → App permissions → Samsung Health.
3. Allow **write** access to Steps and Exercise only if you choose to share them.
4. Open Samsung Health / pull to sync; verify actual records in Health Connect.
5. When a TrackFit Android app becomes available, users will need to grant it separate **read** permission.

Samsung's official FAQ: https://developer.samsung.com/health/health-connect-faq.html

## Native implementation remaining (required)
1. Package the existing React/Vite site as a real Android application (e.g. Capacitor). Add and lock native dependencies, package ID and Android project; do not hand-edit `package-lock.json` without npm verification.
2. Implement `TrackFitHealthConnect` Android plugin methods matching `src/services/healthConnectBridge.js`:
   - `getStatus(): { available, stepsGranted }`
   - `requestPermissions({dataTypes:["steps"]}): {stepsGranted}`
   - `readTodaySteps({date}): {date,steps}`
3. Declare only `android.permission.health.READ_STEPS`, use `HealthConnectClient.getSdkStatus()`, request via `PermissionController.createRequestPermissionResultContract`; provide a clear permissions rationale and privacy policy.
4. Use **`aggregate(StepsRecord.COUNT_TOTAL)`** for the local calendar day, with user/device timezone. Do not sum `StepsRecord` values across Samsung Health and phone providers; aggregated totals handle duplicates and source priority.
5. Never display Connected until Health Connect is present and permission is granted.
6. For exercise/cardio import add `READ_EXERCISE` when a real user-facing workout feature is ready. Use `ExerciseSessionRecord` stable IDs and deduplicate against saved cardio sessions; do not count cardio steps separately if the daily step aggregate includes them.
7. For on-watch quick check-ins, a Galaxy Watch 4 or newer Wear OS companion app can be investigated separately. Health Connect runs on the **phone**, not the watch, so it cannot by itself give a watch-side screen.
8. Keep import opt-in. If later enabling background sync, request and justify additional permissions separately. Offline and revoked-permission flows must not overwrite a valid manually logged day.
9. Protect optional health data, implement account-specific sync only with consent, and fulfil Play Console Health Apps and data safety declarations before public release.
10. Test on real Galaxy Watch + Samsung phone, comparing Health Connect daily aggregates to Samsung Health for local midnight boundaries, paused watch pairing, missed steps and exercise sessions.

## Source
- Samsung Health / Health Connect FAQ: https://developer.samsung.com/health/health-connect-faq.html
- Google Health Connect read steps and aggregates: https://developer.android.com/health-and-fitness/health-connect/read-data
- Android exercise sessions: https://developer.android.com/health-and-fitness/health-connect/experiences/workouts

## Shipping policy
The TrackFit PWA **does not** directly access Health Connect. Do not claim Galaxy Watch steps or cardio are syncing until a signed Android build with a real native plugin has been tested. Do not block the quick daily check-in while users wait.
