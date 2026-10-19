import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeTrackFitLauncherIcons } from "../../native/android/trackfit-icons.mjs";

describe("TrackFit Android launcher branding", () => {
  it("replaces the placeholder Capacitor launcher with readable adaptive TF artwork", () => {
    const root = mkdtempSync(join(tmpdir(), "trackfit-icons-"));
    try {
      const source = join(root, "app", "src", "main");
      mkdirSync(source, { recursive: true });
      const manifest = join(source, "AndroidManifest.xml");
      writeFileSync(manifest, '<manifest><application android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher_round" /></manifest>');
      writeTrackFitLauncherIcons(root);

      const updatedManifest = readFileSync(manifest, "utf8");
      expect(updatedManifest).toContain('android:icon="@mipmap/trackfit_launcher"');
      expect(updatedManifest).toContain('android:roundIcon="@mipmap/trackfit_launcher"');

      const res = join(source, "res");
      const icon = readFileSync(join(res, "mipmap-anydpi-v26", "trackfit_launcher.xml"), "utf8");
      const foreground = readFileSync(join(res, "drawable", "trackfit_icon_foreground.xml"), "utf8");
      expect(icon).toContain("<adaptive-icon");
      expect(icon).toContain("@drawable/trackfit_icon_foreground");
      expect(foreground).toContain("#FFFFFFFF");
      expect(foreground).toContain("#FF47BFFF");
      expect((foreground.match(/android:pathData=/g) || []).length).toBe(2);
      expect(foreground).not.toMatch(/grid|capacitor/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps the browser icon clearly marked with both T and F", () => {
    const favicon = readFileSync(new URL("../../public/favicon.svg", import.meta.url), "utf8");
    expect(favicon).toContain('TrackFit TF icon');
    expect(favicon).toContain('M28 35H53V44H45V76H36V44H28Z');
    expect(favicon).toContain('M58 35H81V44H67V51H79V60H67V76H58Z');
    expect(favicon).not.toMatch(/capacitor|grid/i);
  });
});
