# TrackFit dinner testing — 26 October 2026

## What is implemented
- **Food → Estimate homemade meal or scan a dinner photo** is visible without expanding the barcode panel.
- **Meal photo**: user explicitly takes/chooses JPEG, PNG or WebP (<8 MB) and optionally types sauces, ingredients and portions. Browser resizes it to <=1100 px JPEG quality .72 and sends the compressed image only after they tap Estimate. No permanent image storage; OpenAI receives it solely for the requested estimate with `store:false`. No original photo saved.
- **Homemade meal**: user describes ingredients and approximate portions in text; the same signed-in Edge Function estimates total calories and macros. Missing values remain unknown and require manual input, not fictitious zeros.
- **Review**: estimates clearly labelled approximate; up to 6 ingredient estimates and assumptions shown; user chooses shift meal, taps Review and save in Food, edits name/portions/macros, and deliberately saves to their Supabase nutrition log. No auto-saving.
- **Backend**: `trackfit-meal-estimate` Edge Function deployed with `verify_jwt=true`, separate from `trackfit-coach`. Uses the existing private Supabase `OPENAI_API_KEY`; defaults to `gpt-4.1-mini` (optional `OPENAI_MEAL_MODEL`). Shared existing 20-call/person/day UTC AI allowance limits cost, including photo calls. No public Vite secret, storage bucket, photo history or provider raw logs.
- **Barcode**: the existing camera BarcodeDetector, typed barcode, branded Open Food Facts lookup, grams scaling and Save remain unchanged. Camera support depends on the browser; typed number is always available.
- **Fallback**: manual entry and text food paste still work if the AI, camera or external food database is unavailable.

## Mobile smoke test before public launch
1. Open https://fitness-tracker-rosy-nu.vercel.app/ and sign in.
2. Food → scan a barcode from dinner packaging (or type the digits) → Find food → choose amount (grams) → Use values → review macros → Add meal → reload Food → check saved history.
3. Food → Estimate homemade meal or scan a dinner photo → photograph plate and add portions/oil if needed → Estimate → review uncertain portions/macros → Review and save in Food → edit → Add meal → confirm new total and AI Coach meal count.
4. Food → Homemade meal → type “200 g cooked chicken, 1 cup rice, veg, 1 tbsp oil” → Estimate → review totals → save. Avoid treating the output as exact measurements.
5. Test camera permission denied and manual barcode fallback; HEIC/oversize image warning; missing macro null rather than zero; signed-out AI refusal; 20/day quota; account switching/data isolation.

## Caveats
Photo calorie estimates are **approximate**, particularly for hidden oils/sauces and portions. Open Food Facts is community maintained. No clinician-grade claims. Real-device and authenticated photo/text AI smoke tests remain necessary before calling the feature fully validated.
