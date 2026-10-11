import {defineConfig} from "@playwright/test";
export default defineConfig({
  testDir: "./e2e", timeout: 60_000, fullyParallel: false, workers: 1,
  forbidOnly: !!process.env.CI, retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", {open: "never"}]],
  use: {baseURL: "http://localhost:13000", trace: "retain-on-failure", screenshot: "only-on-failure"},
  webServer: {command: process.env.E2E_SKIP_BUILD === "true" ? "npm run start -- -p 13000" : "npm run build && npm run start -- -p 13000",
    url: "http://localhost:13000/health", reuseExistingServer: false, timeout: 180_000,
    env: {BACKEND_INTERNAL_URL: process.env.BACKEND_INTERNAL_URL || "http://localhost:18081"}},
});
