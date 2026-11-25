/// <reference types="svelte" />
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __SENTRY_BROWSER_CONFIG__: NonNullable<
  ReturnType<typeof import("./lib/sentry-build-config.mjs").sentryBrowserConfig>
>;
