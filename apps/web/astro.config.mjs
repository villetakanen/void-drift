import { readFileSync } from "node:fs";
import path from "node:path";
import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";

const rootPackage = JSON.parse(
  readFileSync(path.resolve("../../package.json"), "utf-8"),
);

const verificationPort = process.env.VOID_DRIFT_VERIFY_PORT;

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  envDir: "../../",
  integrations: [svelte()],
  vite: {
    // Verification owns a stable candidate; other local servers must not reload it.
    cacheDir: verificationPort
      ? path.resolve(
          "../../node_modules/.cache/void-drift-vite",
          verificationPort,
        )
      : undefined,
    server: verificationPort ? { hmr: false } : undefined,
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
