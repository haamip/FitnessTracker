# TrackFit Store Release Audit — 2026-11-12

Base branch: `ui-app-shell`. Audit branch: `audit/store-release-cleanup-2026-11`.

## Verified observations
- Repository tree contains 654 tracked blobs at the inspected revision.
- `package.json` has version `0.0.0` and scripts for lint, build, Vitest and Playwright. It does not declare Capacitor packages as project dependencies; native CI uses its own setup.
- `capacitor.config.json` uses `nz.hakt.trackfit` and `dist`.
- Native Android CI, signing scripts, Kotlin Health Connect plugin, and iOS simulator smoke workflow exist.
- `src/main.jsx` imports three global design layers: `modern-refresh.css`, `modern-v4.css`, and `trackfit-overhaul.css`. Inspect cascade before removing.
- `src/App.jsx` has a development-only gate for `/dev-tools` and `/dev-tools/ai`, while `/dev-tools/testing` is routed unconditionally. `TestingDashboard.jsx` separately checks `app_metadata.trackfit_admin` before querying data. Verify server-side RLS before release; a route alone is not an authorization boundary.
- `public/exercise-images/back-fly-with-band.png` and `back-flyes-with-bands.png` share the same blob SHA. Confirm whether both names are referenced before deleting either.

## Next verification steps (not yet executed)
1. Run `npm ci && npm run check && npm run test:e2e` on the audit branch.
2. Run static import and asset-reference analysis; identify orphaned files and unused exports, manually verify dynamic imports and string references.
3. Review CSS cascade and remove only proven unused styles.
4. Review dependency usage, including dynamically imported and CI-only packages.
5. Inspect production source maps, environment variables, Supabase RLS and AI monitoring authorization.
6. Confirm Android release AAB and iOS archive workflows, permissions, privacy declarations, deep links and subscription readiness.
7. Submit tested cleanup via PR; do not delete user data, migrations or production assets without evidence.

## Safety
No source code or production configuration has been removed during this initial inspection. Preserve the existing deployed app until test results and PR review are complete.
