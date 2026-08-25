import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  webServer: {
    command: "npm run e2e:server",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
