import { defineConfig, devices } from "@playwright/test";

/**
 * Browser-level emulation: Android Chrome-sized screens, iPhone WebKit/Safari
 * engine and generic handsets/tablet. This is NOT an iOS/Android OS simulator.
 * No personal data, live accounts or production Supabase credentials are used.
 */
const androidPhone = devices["Pixel 5"];
const iphone = devices["iPhone 13"];

export default defineConfig({
  testDir: "./tests/device-matrix",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  outputDir: "test-results/device-matrix",
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "generic-small-320", use: { browserName: "chromium", viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
    { name: "generic-android-360", use: { ...androidPhone, browserName: "chromium", viewport: { width: 360, height: 780 } } },
    { name: "android-pixel-393", use: { ...androidPhone, browserName: "chromium", viewport: { width: 393, height: 851 } } },
    { name: "android-large-412", use: { ...androidPhone, browserName: "chromium", viewport: { width: 412, height: 915 } } },
    { name: "iphone-small-375", use: { ...iphone, browserName: "webkit", viewport: { width: 375, height: 812 } } },
    { name: "iphone-standard-390", use: { ...iphone, browserName: "webkit", viewport: { width: 390, height: 844 } } },
    { name: "iphone-large-430", use: { ...iphone, browserName: "webkit", viewport: { width: 430, height: 932 } } },
    { name: "generic-tablet-768", use: { browserName: "chromium", viewport: { width: 768, height: 1024 }, hasTouch: true, deviceScaleFactor: 1 } },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Trigger the sign-in UI without contacting a real Supabase account.
    env: {
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: "ci-device-matrix-placeholder",
    },
  },
});
