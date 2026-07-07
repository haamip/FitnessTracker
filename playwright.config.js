import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./__tests__",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    viewport: {
      width: 390,
      height: 844,
    },
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 60000,
  },
});