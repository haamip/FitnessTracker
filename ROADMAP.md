# TrackFit Roadmap

## Shipped foundation (v0.4–v0.7)
- Searchable exercise library and exercise picker
- Workout logging, history, timers, PRs and progression engine
- AI Workout Builder and readiness/coach intelligence foundation
- Copy/paste and PDF workout imports

## Review branch: easy workout builder (PR #19)
- Rename, edit, duplicate and reuse saved workouts
- Pick exercises directly from the library to build your own routine
- Free public-domain exercise instructions and image catalogue
- No paid exercise API

## Review branch: check-ins + weekly coaching (PR #20)
- Daily quick check-in: steps, feeling, workout/cardio/both/rest
- Optional detailed sleep, water, weight and notes
- Weekly questions on nutrition, steps, cardio, strength progression and recovery
- Evidence-based weekly recap from actual logs and prior-week lifts
- Weekly front/side/back comparison photos in local private device storage
- Sunday in-app weekly review prompt
- Note: weekly feedback is currently rules-based, not LLM text generation
- Note: photos and weekly questionnaire are local-only, not yet cross-device cloud synced

## Next: Multi-brand watch syncing (Android & iPhone)
- Build native Android and iOS application wrappers; browser/PWA cannot access health stores
- Android Health Connect: Galaxy Watch/Samsung Health, Pixel/Fitbit, Garmin Connect, Polar Flow and other apps that actually share data
- Apple HealthKit: Apple Watch, Garmin/Polar and other watches whose companion apps share compatible metrics
- Shared wearable adapter contract drafted in PR #21; **native plugins not yet implemented**
- Start with opt-in total daily steps; then import exercise/cardio with stable IDs and deduplication
- Sync only consented aggregates/dates; do not double-count watch, phone and workout steps
- Separate Wear OS/watchOS companion apps for on-watch check-in only if demand justifies it
- Support permission denial, missing data, offline devices and multiple account isolation
- Privacy: no watch data access until permissions are explicitly granted

## After watch and review stabilise: Nutrition
- Food library / barcode reliability and serving adjustments
- Repeat meals and quick logging, built for FIFO meals
- Link actual intake to weekly coach feedback; missing entries are not zero intake

## Public beta release readiness
- Review/resolve npm dependency security audit findings
- Finish cross-device backups for reviews and private photo storage
- Verify mobile UX, accessibility, user isolation and account sync
- Native watch integration must pass device-specific testing
- Play Store permissions and disclosure / safety compliance

## Engineering rule
Daily logging should take under one minute. Show users their real data, never demo measurements in production. Watch and health integrations must be genuinely wired before showing Connected.
