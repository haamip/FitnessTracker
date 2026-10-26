# Nutrition v1 improvements — 26 October 2026

## What was confirmed
- Existing Supabase records before this release: seven `workout_sessions` in `active` status, none with `completed_at`; two workout templates; zero rows in `nutrition_entries`.
- The AI Coach correctly reported no **completed, cloud-synced** workout or meal history. Users must finish a workout using **Finish Workout** (or complete the last working set in the automatic flow) for it to appear in the AI Coach's 14-day completed history.
- Do **not** silently convert existing active sessions into completed history: their actual completion is unknown.

## Nutrition functionality
- On the Food tab, **Find food by name or barcode** allows explicit product-name searches using Open Food Facts. Results provide nutrients per 100g, brand, and name; the user selects a product and enters consumed grams before copying values to the editable meal form. Search only runs on button tap, never each keystroke. The Open Food Facts read/search usage quota is **10 search requests/minute per IP**. Users are told when nutrients are missing and to verify packaging. Full-text search uses the documented legacy v1 `/cgi/search.pl` endpoint; v2/v3 don't offer full-text search as of Oct 2026.
- **Log it again** shows up to eight recent distinct meals saved to the signed-in Supabase account (previous 30 days), allowing re-logging them with one tap to the current shift day.
- Calories and protein progress reflect authenticated profile targets rather than hard-coded defaults (fallback: 2500 kcal and 185g protein).
- The existing manual meal entry, barcode camera scanning, paste-a-meal and shift-day logic remain intact.
- All saved nutrition entries are written to `public.nutrition_entries`, scoped to the logged-in account, and appear in subsequent AI Coach summaries based on data synced in the last 14 days.
- The food database is strongest for barcoded/packaged items. Home-cooked meals can still be entered manually. Meal-photo analysis is a **separate unimplemented** AI feature and must not be presented as operational.

## Validation
- Search adapter tests cover normalisation, duplicate products, rate limiting and too-short searches.
- Regression check the end-to-end flow with signed-in test data: search oats; select food; enter grams; copy values; check nutrition form; save to cloud; reload Food and confirm entries; tap AI Coach; confirm it recognises logged meals rather than inventing values; repeat a prior meal on the next shift day.
- Mobile camera scanning requires a device with BarcodeDetector support or barcode entry fallback.
