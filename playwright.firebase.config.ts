import { defineConfig } from "@playwright/test";
import { verificationUrls } from "./packages/core/src/lib/schemas/verification-ports.mjs";
import base from "./playwright.config";

const baseURL = verificationUrls().competition;
export default defineConfig({
  ...base,
  testDir: "./tests/firebase",
  timeout: 60000,
  outputDir: "artifacts/competition/results",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "artifacts/competition/report" }],
  ],
  use: { ...base.use, baseURL },
  webServer: {
    command: `pnpm --filter web dev --host 127.0.0.1 --port ${new URL(baseURL).port}`,
    url: baseURL,
    reuseExistingServer: false,
    env: {
      VOID_DRIFT_VERIFY_PORT: new URL(baseURL).port,
      PUBLIC_FIREBASE_API_KEY: "demo-key",
      PUBLIC_FIREBASE_PROJECT_ID: "demo-void-drift",
      PUBLIC_FIREBASE_APP_ID: "demo-app",
      PUBLIC_FIREBASE_EMULATORS: "true",
    },
  },
});
