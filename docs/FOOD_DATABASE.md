# TrackFit Nutrition: barcode scanning and food lookup

TrackFit supports two ways to look up packaged foods:

1. **Camera scan** — tap Scan barcode, grant permission, point the phone at an EAN/UPC product barcode. Detection runs on-device using the browser's native `BarcodeDetector` API. When a code is read, the existing Open Food Facts lookup starts automatically.
2. **Manual barcode entry** — type the 8–14 digit barcode and tap Find food by number. This works as a fallback when native camera scanning is not supported or permission is denied.

## Data source

Open Food Facts (https://world.openfoodfacts.org), ODbL. Users see the name, brand, per-100g values, and source link, then choose the serving amount in grams and **explicitly copy values into the editable meal form**. Missing nutrients remain blank, not invented; review the packaging before saving.

## Device requirements and limitations

- Barcode camera capture needs HTTPS, camera permission, a working rear camera, and native `BarcodeDetector` support for EAN/UPC/ITF formats.
- `BarcodeDetector` isn't supported on every Android browser or WebView. In those cases, users receive a clear explanation and can type the code manually. No third-party barcode image service or camera feed upload is used.
- The photo-to-macros feature is **not live** without `VITE_TRACKFIT_AI_ENDPOINT`, a secure server endpoint. The app must not record demo-generated estimates as real nutrition data.
- Cameras are stopped after a successful scan, when the user stops scanning, when the page is backgrounded, and when the component unmounts.

## Commercial release considerations

- Test actual supermarket products sold in Australia and Aotearoa/New Zealand.
- Review ODbL attribution/share-alike obligations if combining community and proprietary databases.
- Respect Open Food Facts fair-use guidance, identify requests through an approved backend/user-agent approach, and cache/rate-limit high-volume lookups before scaling.
- Test camera operation in installed Android app, Samsung Internet and Chrome. The native scanner feature is experimental and not universal.
- For true AI meal recognition, connect a server-side service with privacy controls, authenticated usage limits, and real image analysis. Never expose an AI provider key in the mobile client.
