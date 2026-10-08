# TrackFit branded food lookup (first increment)

The nutrition page supports manual barcode entry using Open Food Facts. This is
**not** a camera barcode scanner or full food-name search.

## Behaviour
- User submits an 8–14 digit barcode; TrackFit fetches only required product fields.
- Shows the name, brand and available nutrients per 100g.
- User chooses grams and explicitly copies scaled values into the editable meal form.
- Missing nutrient values remain blank, not estimated or assumed to be zero.
- User must review entries before saving to their own food log.
- Failed, unknown or unavailable lookups fall back to manual logging.

## Data source
Open Food Facts (https://world.openfoodfacts.org), Open Database License (ODbL).
We link to the original product record in the user interface. Branded entries
are community-maintained and may not match the local package label.

## Release checks
- Verify client-side network and CORS behaviour on Android/iOS browsers.
- Respect provider fair-use requirements; add caching, rate limiting and a
  provider-compliant user agent or an approved proxy for scale.
- Review ODbL attribution/share-alike obligations before commercial launch.
- Check regional coverage (Australia and Aotearoa/New Zealand) with real labels.
- Do not claim camera barcode scanning is present until camera integration works.
- Keep the existing critical dependency audit as a store-release blocker.
