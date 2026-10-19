# TrackFit launcher icon

The TrackFit launcher must show a recognisable **T** and **F**, rather than the default blue Capacitor placeholder logo and alignment grid.

- `public/favicon.svg` is the web brand mark: white **T**, cyan-blue **F**, dark navy background.
- `public/site.webmanifest` uses the same mark for installable web shortcuts.
- `native/android/trackfit-icons.mjs` generates Android adaptive launcher resources during `native/android/prepare-shell.mjs`. These are produced for every Android build, with white T/blue F centred in the system launcher mask's safe area.
- Icon colours and the glyph shape should stay visually matched between the web and Android variants.
- Existing installed APKs retain their old icon until updated/reinstalled with a build signed by the same key. Merely merging the icon source or deploying the website will not change already-installed Android icons.
- The debug builds currently use runner-generated signatures and separate test package names. Do not remove an installed app with unsynchronised local data just to change the icon.
- Public release should use stable signing, a single app package identity, and confirmed on-device launcher mask testing.

Verification: CI builds web app, unit tests assert TF branding and XML resources, and the Android debug workflow compiles the generated icon resources into a test APK.
