import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
	...base,
	testDir: "./tests/firebase",
	timeout: 60000,
	outputDir: "test-results/firebase",
	reporter: [
		["list"],
		["html", { open: "never", outputFolder: "playwright-report/firebase" }],
	],
	use: { ...base.use, baseURL: "http://127.0.0.1:4323" },
	webServer: {
		command: "pnpm --filter web dev --host 127.0.0.1 --port 4323",
		url: "http://127.0.0.1:4323",
		reuseExistingServer: false,
		env: {
			PUBLIC_FIREBASE_API_KEY: "demo-key",
			PUBLIC_FIREBASE_PROJECT_ID: "demo-void-drift",
			PUBLIC_FIREBASE_APP_ID: "demo-app",
			PUBLIC_FIREBASE_EMULATORS: "true",
		},
	},
});
