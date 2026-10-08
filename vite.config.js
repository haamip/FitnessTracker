import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // Route components are lazy loaded; a single CSS bundle keeps their styles
  // from being injected after the shared visual system on navigation.
  build: {
    cssCodeSplit: false,
  },

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    include: [
      "src/**/*.{test,spec}.{js,jsx,ts,tsx}"
    ],
    exclude: [
      "__tests__/**",
      "node_modules/**",
      "dist/**",
      "test-results/**",
      "playwright-report/**"
    ]
  },
});
