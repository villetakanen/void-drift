import { readFileSync } from "node:fs";
import path from "node:path";
import mdx from "@astrojs/mdx";
import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";

const rootPackage = JSON.parse(
  readFileSync(path.resolve("../../package.json"), "utf-8"),
);

const verificationPort = process.env.VOID_DRIFT_VERIFY_PORT;

// https://astro.build/config
export default defineConfig({
  site: "https://void-drift-alpha.web.app",
  devToolbar: { enabled: false },
  envDir: "../../",
  integrations: [svelte(), mdx()],
  redirects: {
    "/lab/entities/ship": { destination: "/lab/mount-planner", status: 302 },
  },
  vite: {
    // Verification owns a stable candidate; other local servers must not reload it.
    cacheDir: verificationPort
      ? path.resolve(
          "../../node_modules/.cache/void-drift-vite",
          verificationPort,
        )
      : undefined,
    server: {
      strictPort: process.env.VOID_DRIFT_SHARED_PREVIEW === "1",
      ...(verificationPort && { hmr: false }),
    },
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
