import {
  type BrowserContext,
  type BrowserContextOptions,
  test as base,
  expect,
} from "@playwright/test";

type LocalFixtures = {
  localHosts: string[];
  localOrigins: string[];
  newLocalContext: (options?: BrowserContextOptions) => Promise<BrowserContext>;
};

async function guard(
  context: BrowserContext,
  hosts: string[],
  origins: string[],
  errors: string[],
) {
  await context.route("**/*", (route) =>
    (
      origins.length
        ? origins.includes(new URL(route.request().url()).origin)
        : hosts.includes(new URL(route.request().url()).hostname)
    )
      ? route.continue()
      : route.abort(),
  );
  const watch = (page: import("@playwright/test").Page) =>
    page.on("pageerror", (error) =>
      errors.push(`${page.url()}: ${error.message}`),
    );
  for (const page of context.pages()) watch(page);
  context.on("page", watch);
}

export const test = base.extend<LocalFixtures>({
  localHosts: [["127.0.0.1"], { option: true }],
  localOrigins: [[], { option: true }],
  context: async ({ context, localHosts, localOrigins }, use) => {
    const errors: string[] = [];
    await guard(context, localHosts, localOrigins, errors);
    await use(context);
    expect(errors, "uncaught browser errors").toEqual([]);
  },
  newLocalContext: async ({ browser, localHosts, localOrigins }, use) => {
    const contexts: BrowserContext[] = [];
    const errors: string[] = [];
    await use(async (options) => {
      const context = await browser.newContext(options);
      contexts.push(context);
      await guard(context, localHosts, localOrigins, errors);
      return context;
    });
    for (const context of contexts) await context.close();
    expect(errors, "uncaught browser errors").toEqual([]);
  },
});
export { expect };
