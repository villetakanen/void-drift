import { readFileSync } from "node:fs";
import path from "node:path";
import mdx from "@astrojs/mdx";
import svelte from "@astrojs/svelte";
import sentry from "@sentry/astro/integration";
import { sentryVitePlugin } from "@sentry/bundler-plugins/vite";
import { defineConfig } from "astro/config";
import { sentryBrowserConfig } from "./src/lib/sentry-build-config.mjs";

const rootPackage = JSON.parse(
  readFileSync(path.resolve("../../package.json"), "utf-8"),
);

const verificationPort = process.env.VOID_DRIFT_VERIFY_PORT;
const sentryStampOnly = {
  authToken: "",
  telemetry: false,
  release: { name: "", inject: false, create: false, finalize: false },
  sourcemaps: { upload: false, injectDebugIds: true, delete: false },
};
const preserveWorkerSourceMaps = {
  name: "void-drift-worker-source-maps",
  generateBundle: {
    order: "post",
    handler(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk" || !chunk.map) continue;
        const map = bundle[chunk.sourcemapFileName ?? `${chunk.fileName}.map`];
        if (map?.type !== "asset" || typeof map.source !== "string") continue;
        // Vite emits the worker map from the chunk after Sentry stamps the map asset.
        const stampedMap = map.source;
        chunk.map.toString = () => stampedMap;
      }
    },
  },
};
const browserReporting = {
  name: "void-drift-browser-reporting",
  hooks: {
    "astro:config:setup": async (options) => {
      if (options.command !== "build") return;
      const config = sentryBrowserConfig(process.env);
      if (!config) return;
      options.updateConfig({
        vite: {
          define: { __SENTRY_BROWSER_CONFIG__: JSON.stringify(config) },
          worker: {
            plugins: () => [
              sentryVitePlugin(sentryStampOnly),
              preserveWorkerSourceMaps,
            ],
          },
        },
      });
      await sentry({
        ...sentryStampOnly,
        enabled: { client: true, server: false },
        bundleSizeOptimizations: { excludeTracing: true },
      }).hooks["astro:config:setup"]?.(options);
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: "https://void-drift-alpha.web.app",
  devToolbar: { enabled: false },
  envDir: "../../",
  integrations: [svelte(), mdx(), browserReporting],
  redirects: {
    "/lab/entities/ship": { destination: "/lab/mount-planner", status: 302 },
  },
  vite: {
    // Release preparation uploads the maps and removes them before hosting.
    build: {
      sourcemap:
        process.env.PUBLIC_SENTRY_ENABLED === "true" ? "hidden" : false,
    },
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
