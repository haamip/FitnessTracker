# TrackFit Dinner Test — AI photos, homemade meal descriptions and food barcodes

## New (2026-10-26)
- Food tab now surfaces two top shortcuts: **Photo or homemade AI estimate**, and **Search or scan a barcode**.
- On `/nutrition/scan`, choose **Photo of meal** (camera/image upload) or **Homemade / describe** (ingredients and approximate cooked portions).
- The signed-in, JWT-protected `trackfit-meal-estimate` Supabase Edge Function uses OpenAI Responses API with image input and strict structured JSON; its key stays in Supabase Secrets. Users must tap Estimate. `store: false` and no photo database/storage writes. Photo is resized locally to at most 1100 pixels and compressed until it meets a ~1.65MB data-URL limit.
- The new function uses the shared `consume_trackfit_ai_allowance` (20/day per authenticated user, alongside Daily Coach). Images are accepted as JPEG/PNG/WebP, original max 15MB; HEIC requires converting before upload. The browser also rejects unknown formats.
- Result includes approximate calories, protein, carbs, fat, up to five identified foods, confidence and caveats. Low-confidence / invalid models can return `canEstimate:false`, which disables copying to the food log.
- Estimates **never autosave**. **Review and save in Food** transfers the draft into the existing editable Food quick log. User checks actual portions and taps **Add meal** to write to `nutrition_entries`; the AI Coach then sees the cloud record as part of the last 14 days.
- Barcode and food-name searches still use Open Food Facts, which is community-entered and may be incomplete. Camera barcode scanning requires browser `BarcodeDetector` support. Manual barcode entry is the reliable fallback.

## Dinner test script
1. Sign into https://fitness-tracker-rosy-nu.vercel.app and open **Food**.
2. For a packaged item, tap **Search or scan a barcode**; start camera, or type 8–14 digits. Confirm it finds the correct brand, calories per 100g and serving size.
3. For a homemade meal, tap **Photo or homemade AI estimate**. Try **Homemade / describe**, including quantities, oil and sauces; tap **Estimate calories and macros**. Review the estimate, choose meal type, then **Review and save in Food**. Adjust any incorrect quantities/macros and tap **Add meal**.
4. Optionally try the **Photo** tab with a clear JPG from the plate. This sends a resized photo to OpenAI only after pressing Estimate; the raw photo is not saved.
5. Refresh Food after save to confirm the entry was stored in the cloud; then on Home request daily AI feedback and check it recognises the newly logged meal. Incomplete food logs must not be mistaken for zero intake.
6. Check account privacy and quotas before external beta. Image recognition accuracy must be validated with real meals; tests passing only confirms application code and compilation.

## Limitations
- Visual food AI cannot know exact grams, hidden oil, sauces or precise cooking methods. Estimates are not nutrition label values and shouldn't be used as clinical measurement.
- An AI meal output is an editable **estimate** only, never an automatic food log.
- Open Food Facts' free database and barcode scanning are distinct from OpenAI meal-photo inference.
