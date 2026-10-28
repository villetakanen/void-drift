import { readFileSync } from "node:fs";
import path from "node:path";
import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";

const rootPackage = JSON.parse(
	readFileSync(path.resolve("../../package.json"), "utf-8"),
);

// https://astro.build/config
export default defineConfig({
	devToolbar: { enabled: false },
	envDir: "../../",
	integrations: [svelte()],
	vite: {
		resolve: {
			alias: {
				"@void-drift/core/styles": path.resolve(
					"../../packages/core/src/lib/styles",
				),
				"@void-drift/core": path.resolve("../../packages/core/src"),
				"@void-drift/mode-a": path.resolve("../../packages/mode-a/src"),
			},
		},
		define: {
			__APP_VERSION__: JSON.stringify(rootPackage.version),
		},
		ssr: {
			noExternal: ["@void-drift/mode-a"],
		},
	},
	server: {
		port: 4321,
		host: true,
	},
});
