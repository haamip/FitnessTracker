# TrackFit AI Coach – release and audit notes

## What is built (2026-10-25)
- Home: user-initiated **Get today's AI advice** plus existing deterministic Coach Brain.
- Weekly check-in: save the five answers, then optionally **Generate AI weekly feedback** for the current week; the pre-existing deterministic review remains the offline default.
- AI Suite: **Review my training** and **AI Coach Chat** now use live Supabase Edge Function, not fabricated demo replies.
- Back end: `trackfit-coach` authenticates each user's JWT and selects only their own cloud records via RLS; exposes daily/weekly/chat modes. No uploaded progress photos, raw workout notes, health diagnoses, or service-role credentials are used.
- Database: atomic 20-request-per-account/day quota, no prompts/fitness data written by the usage tracker. `OPENAI_API_KEY` must be set **only in Supabase Edge Function secrets**, never in Vite or Vercel public environment variables.
- Exercise Details: fix mojibake bullet and no-value dash in `src/pages/ExerciseDetail.jsx`.

## Launch configuration – required before real AI answers
1. In **Supabase → FitnessTracker → Edge Functions → Secrets**, set `OPENAI_API_KEY` to the server-owned HAKT OpenAI API key. Optionally set `OPENAI_COACH_MODEL` (default `gpt-4.1-mini`). **Never add any key prefixed VITE_ or share the value in client code.**
2. Verify `trackfit-coach` exists, deployed with `verify_jwt=true`, and a signed-in user can use Home daily feedback and chat. Unsigned requests should fail at the auth gateway; a valid signed-in user receives a clear 503 until the key is set.
3. Verify with a **real** user account, plus test with a second account to ensure no cross-user records. Check missing logs, offline, expired auth, empty chat, request quota and provider failure.
4. AI reads **cloud-synced** records from the past 14 days, not browser-local-only workouts. Confirm sync and timezone behavior. Weekly AI is only available for the current week; historical reviews continue to use the deterministic engine.
5. Review usage and per-user quotas before monetising. OpenAI API is billed independently of ChatGPT. The server defaults to a 20/day cap (UTC), 450 output tokens, max 20 sessions / 150 meals / 50 cardio entries, and a 14-day lookback; confirm actual dollar spend and actual model billing in the provider console.
6. Publish clear user-facing privacy disclosure and Terms before public availability; explicit button tap initiates processing by the AI provider. Existing health and recovery readings are informational, not medical advice.

## Code audit findings / follow-ups
- Prior weekly review and photos remain device-local; AI never sees the photos and will not imply that it has.
- Existing workout, meal and cardio components may hold **local-only pending data**, not yet reflected by AI. Need a reliable per-user sync status and cloud reconciliation for production-grade coaching.
- `src/services/ai/aiProviderConfig.js` and AI Playground still expose mock *diagnostic* output; do not treat the developer playground as a live provider setup. Public Coach Chat no longer uses that mock.
- AI video technique/form analysis and meal camera scanning are **not** live AI just because Coach is deployed; they still have demo routes and require separate secure implementations.
- A signed-in user executing the purpose-built `consume_trackfit_ai_allowance()` SECURITY DEFINER RPC is an intentional database security-advisor warning. The function accepts no input and uses `auth.uid()` to update only the requester's quota. Continue reviewing this authorization during changes.
- Supabase's older advisor warnings for leaked-password protection and index/policy tuning remain separate platform maintenance work.
- Validate native Android APK build independently, not just web CI, and sign beta builds consistently before Play testing.

## Simple post-audit fixes (2026-10-25)
- Coach Chat keeps at most 8 recent messages **in memory**, capped at 300 characters each for AI context. Users can clear the conversation. Switching accounts clears the in-memory chat; nothing is saved to the database. There is no cross-device conversation history.
- The AI backend accepts only user/coach history and treats prior replies as unverified conversation context, not as authoritative logs or instructions.
- Form checker is explicitly labelled **demo only**: no video pose scoring is connected and demo text no longer claims a video was analysed.
- Added non-destructive B-tree indexes to the account-scoped cardio, nutrition, workout, plan and foreign-key access paths. Check with Supabase advisors after migration.
- Leaked-password protection is a Supabase Auth project setting, **not an application-code setting**; enable it manually in the project's Auth settings, then rerun the security advisor.
- Live AI still requires the private server-side `OPENAI_API_KEY` and an authenticated end-to-end test. Never put the provider key in public Vite/Vercel variables.

## 2026-10-25 Supabase and signed-beta hardening
- Applied `202610250003_optimize_ownership_rls.sql`: rewrote 18 slow ownership policy expressions using cached scalar `(select auth.uid())` and dropped two exact-duplicate profile policies (the equivalent ALL policy remains). Live Supabase performance advisor no longer reports `auth_rls_initplan` or `multiple_permissive_policies`.
- Added separate manually triggered `TrackFit Signed Android Beta` workflow and `native/android/configure-release-signing.mjs` to create signed release APK/AAB when a long-term keystore and four GitHub encrypted secrets are provided. See `docs/SIGNED_ANDROID_BETA.md`. Debug APKs are still signed with ephemeral keys; user must provision/backup the release keystore.
- Supabase Management Auth password protection is not adjustable through the currently connected Supabase admin functions. **Still required manually:** Authentication → Sign In / Providers → Email → Prevent use of leaked passwords (Pro plan required) and rerun security advisor. Do not try to implement this via SQL.
- **Still required before real AI can be tested:** provide a HAKT-owned OpenAI API key as `OPENAI_API_KEY` in Supabase Edge Function Secrets, not GitHub or public Vite variables. The connected Supabase tools can deploy functions but cannot create that secret. Do not pretend AI responds live until tested with a real signed-in account.
- The protected quota RPC security-definer warning is intentional for per-user usage limiting; the `trackfit_ai_daily_usage` table has RLS enabled and no direct user data access.
