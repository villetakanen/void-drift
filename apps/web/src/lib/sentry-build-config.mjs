import { z } from "zod";
import { sentryPublicDsnSchema } from "../../../../packages/core/src/lib/schemas/release.mjs";

const SentryBrowserConfigSchema = z.object({
  dsn: sentryPublicDsnSchema,
  environment: z.enum(["production", "preview"]),
  release: z
    .string()
    .regex(/^void-drift@[A-Za-z0-9.+_-]+$/)
    .max(200),
});

/** @param {Record<string, string | undefined>} env */
export function sentryBrowserConfig(env) {
  if (env.PUBLIC_SENTRY_ENABLED !== "true") return null;
  const result = SentryBrowserConfigSchema.safeParse({
    dsn: env.PUBLIC_SENTRY_DSN,
    environment: env.PUBLIC_SENTRY_ENVIRONMENT,
    release: env.PUBLIC_SENTRY_RELEASE,
  });
  if (result.success) return result.data;
  const fields = result.error.issues
    .map(({ path }) => path.join("."))
    .join(", ");
  throw new Error(`Invalid browser error reporting configuration (${fields})`);
}
