import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

import { captureRunDirectory as runDir } from "./tests/helpers/capture-run.mjs";

export default defineConfig({
  ...base,
  testDir: "./tests/review",
  outputDir: `${runDir}/results`,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: `${runDir}/report` }],
  ],
});
