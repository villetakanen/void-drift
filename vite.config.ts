import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import pkg from "./package.json";

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte()],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
	},
});
