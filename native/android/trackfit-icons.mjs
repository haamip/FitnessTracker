/* global process, console */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Replaces Capacitor's placeholder grid icon with a legible TF monogram.
 * Android 9+ is the app minimum, so every supported phone uses adaptive icons.
 * Match TF paths and fills to public/favicon.svg when making brand changes.
 */
export function writeTrackFitLauncherIcons(androidRoot) {
  const res = join(androidRoot, "app", "src", "main", "res");
  const manifest = join(androidRoot, "app", "src", "main", "AndroidManifest.xml");
  const foreground = join(res, "drawable");
  const adaptive = join(res, "mipmap-anydpi-v26");
  mkdirSync(foreground, { recursive: true });
  mkdirSync(adaptive, { recursive: true });

  writeFileSync(join(foreground, "trackfit_icon_background.xml"), `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#101F37"/>
</shape>
`);

  writeFileSync(join(foreground, "trackfit_icon_foreground.xml"), `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
    <path android:fillColor="#FFFFFFFF" android:pathData="M28,35 L53,35 L53,44 L45,44 L45,76 L36,76 L36,44 L28,44 Z"/>
    <path android:fillColor="#FF47BFFF" android:pathData="M58,35 L81,35 L81,44 L67,44 L67,51 L79,51 L79,60 L67,60 L67,76 L58,76 Z"/>
</vector>
`);

  writeFileSync(join(adaptive, "trackfit_launcher.xml"), `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/trackfit_icon_background" />
    <foreground android:drawable="@drawable/trackfit_icon_foreground" />
</adaptive-icon>
`);

  const old = readFileSync(manifest, "utf8");
  if (!old.includes('android:icon="@mipmap/ic_launcher"')) {
    throw new Error("Unexpected launcher icon reference in Android manifest.");
  }
  let updated = old.replace('android:icon="@mipmap/ic_launcher"', 'android:icon="@mipmap/trackfit_launcher"');
  if (updated.includes('android:roundIcon="@mipmap/ic_launcher_round"')) {
    updated = updated.replace('android:roundIcon="@mipmap/ic_launcher_round"', 'android:roundIcon="@mipmap/trackfit_launcher"');
  }
  writeFileSync(manifest, updated);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  writeTrackFitLauncherIcons(resolve(process.cwd(), "android"));
  console.log("TrackFit TF launcher icons installed.");
}
