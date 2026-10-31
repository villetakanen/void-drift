import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/browser",
	snapshotPathTemplate: "{testDir}/baselines/{arg}{ext}",
	fullyParallel: false,
	forbidOnly: true,
	retries: 0,
	workers: 1,
	reporter: [["list"], ["html", { open: "never" }]],
	use: {
		baseURL: "http://127.0.0.1:4322",
		viewport: { width: 1280, height: 720 },
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [{ name: "chromium", use: { browserName: "chromium" } }],
	webServer: {
		command: "pnpm --filter web dev --host 127.0.0.1 --port 4322",
		url: "http://127.0.0.1:4322",
		reuseExistingServer: false,
		env: {
			PUBLIC_FIREBASE_PROJECT_ID: "",
			PUBLIC_FIREBASE_API_KEY: "",
			PUBLIC_FIREBASE_APP_ID: "",
			PUBLIC_FIREBASE_EMULATORS: "false",
		},
	},
});
