# TrackFit wearable compatibility strategy

## Goal
Let people use TrackFit with watches from multiple manufacturers without building a separate vendor-specific integration for every model. The phone's health platform is the aggregator; the watch itself is not connected directly to the TrackFit website.

## Platform-first integrations
**Android — Health Connect (native TrackFit Android application, not PWA)**
- Samsung Galaxy Watch via Samsung Health
- Garmin watches via Garmin Connect: Android 14+ Health Connect exporting is documented by Garmin
- Polar watches via Polar Flow: steps, exercise, heart rate, sleep and more shared with Health Connect
- Google Pixel Watch and Fitbit via supported Google/Fitbit health services, subject to actual data availability
- Other brands only when their official apps genuinely write the requested data into Health Connect; never claim blanket compatibility

**iPhone — Apple Health / HealthKit (native TrackFit iOS app)**
- Apple Watch via Apple Health
- Garmin and Polar watches when their companion apps share permitted metrics to Apple Health
- Other Apple Health sharing watches may work, but verify each data type and supported device

## Planned progression
1. Start with read-only steps from both health platforms. Request access only when the user explicitly opts in. Save a single daily total with a source and sync timestamp.
2. Import exercise sessions (type, start/end, duration, distance) after testing native read permissions and deduplication. Do not sum duplicate exercises or add cardio step records onto aggregated daily steps.
3. Optionally use sleep, heart rate/resting heart rate as coach inputs only when user expressly enables them, with sensible missing-data behaviour and no medical claims.
4. Build *on-watch* check-in separately for Wear OS and watchOS. A phone-side connection cannot display an interface on the watch.
5. Direct vendor integrations only for useful metrics that the hubs cannot expose and only if legal/permission/costs justify it.

## Provider contract and current code
- `src/services/wearableBridge.js`: cross-platform provider selection, phone-native only.
- `src/services/healthConnectBridge.js`: Android Health Connect plugin interface.
- Native plugin `TrackFitHealthKit`: **contract only**, iOS HealthKit implementation is not yet supplied.
- `src/pages/DailyCheckIn.jsx`: the button to import is visible only with a functioning native bridge.
- **Neither plugin nor Android/iOS native app is built yet. Nothing syncs from watches in the existing TrackFit website or production build.**

## Reliability and privacy
- Aggregate steps within the user's local-day boundaries; don't add multiple sources blindly.
- For Android, use Health Connect `StepsRecord.COUNT_TOTAL` aggregate.
- For iOS, use HealthKit cumulative steps with normal app permissions and Apple Health data-source handling.
- User controls access; never upload raw health sensor data without separate authorisation.
- Preserve manual entries when permissions are denied or health sources are empty.
- Verify individual watch/app access and data type on physical devices.
- Show data source and last-updated time; never fake "connected" state.
- Plan cross-account/cloud sync and privacy compliance before public release.

## Official references
- Samsung: https://developer.samsung.com/health/health-connect-faq.html
- Garmin Android: https://support.garmin.com/en-AU/?faq=JToBEy0jfe6pIygark2Ui5
- Garmin Apple Health: https://support.garmin.com/en-HK/?faq=lK5FPB9iPF5PXFkIpFlFPA
- Polar Android: https://support.polar.com/au-en/flow-app-health-connect
- Apple HealthKit: https://developer.apple.com/documentation/healthkit
- Google Health Connect: https://developer.android.com/health-and-fitness/health-connect
