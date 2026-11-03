import {defineConfig} from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";
export default defineConfig({
  testDir: "./tests",
  testMatch: ["e2e/**/*.spec.ts", "visual/**/*.spec.ts"],
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  globalTimeout: 10 * 60_000,
  expect: {timeout: 10_000, toHaveScreenshot: {animations: "disabled", caret: "hide", threshold: 0.15, maxDiffPixels: 40}},
  snapshotPathTemplate: "{testDir}/visual/baselines/{platform}/{projectName}/{arg}{ext}",
  reporter: [["list"], ["html", {outputFolder: "playwright-report", open: "never"}]],
  use: {baseURL, browserName: "chromium", locale: "ru-RU", timezoneId: "Europe/Moscow", deviceScaleFactor: 1,
    reducedMotion: "reduce", trace: "retain-on-failure", screenshot: "only-on-failure"},
  projects: [
    {name: "desktop-light", use: {viewport: {width: 1440, height: 1000}, colorScheme: "light"}},
    {name: "desktop-dark", use: {viewport: {width: 1440, height: 1000}, colorScheme: "dark"}},
    {name: "mobile-light", use: {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, colorScheme: "light"}},
    {name: "mobile-dark", use: {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, colorScheme: "dark"}},
  ],
  webServer: {command: "npm run test:serve", url: baseURL, reuseExistingServer: !process.env.CI, timeout: 60_000},
});
