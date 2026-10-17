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

## Next: Wearable/Health Connect (Android)
- Choose target watches and make a native Android app wrapper
- Read permitted steps and exercise sessions through Health Connect (user opt-in)
- Prevent double counting total daily steps with recorded cardio sessions
- Sync only the user-approved aggregates and dates with their TrackFit account
- Handle missing permission, device offline and watch-not-connected gracefully
- On-watch short check-in requires a separate Wear OS companion; not in the web build
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
