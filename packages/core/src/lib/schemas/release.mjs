import { z } from "zod";

export const releaseEnvironmentSchema = z.object({
  PUBLIC_FIREBASE_API_KEY: z.string().trim().min(1),
  PUBLIC_FIREBASE_PROJECT_ID: z.literal("void-drift-alpha"),
  PUBLIC_FIREBASE_APP_ID: z.string().trim().min(1),
  PUBLIC_FIREBASE_EMULATORS: z.literal("false"),
});

export const sentryPublicDsnSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      /^[a-f0-9]+$/i.test(url.username) &&
      !url.password &&
      /^\/\d+$/.test(url.pathname) &&
      !url.search &&
      !url.hash
    );
  }, "Expected a public Sentry project DSN");

export const releaseSentryEnvironmentSchema = z.object({
  PUBLIC_SENTRY_DSN: sentryPublicDsnSchema,
  SENTRY_ORG: z
    .string()
    .trim()
    .regex(/^[\w-]+$/),
  SENTRY_PROJECT: z
    .string()
    .trim()
    .regex(/^[\w-]+$/),
  SENTRY_AUTH_TOKEN: z.string().trim().min(1),
});

// Copy only the deployment inputs this project supports; no rebuild hooks.
export const releaseFirebaseSchema = z.object({
  firestore: z
    .object({ rules: z.string().min(1), indexes: z.string().min(1) })
    .strict(),
  hosting: z
    .object({
      public: z.string().min(1),
      ignore: z.array(z.string()).optional(),
      cleanUrls: z.boolean().optional(),
      redirects: z
        .array(
          z
            .object({
              source: z.string().min(1),
              destination: z.string().min(1),
              type: z.literal(301),
            })
            .strict(),
        )
        .optional(),
    })
    .strict(),
});

const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const preparedReleaseSchema = z.object({
  status: z.literal("prepared"),
  createdAt: z.string().datetime(),
  revision: z.string().regex(/^[a-f0-9]{40}$/),
  workingTree: z.string(),
  sourceFingerprint: hash,
  sourceUnchanged: z.literal(true),
  version: z.string().min(1),
  project: z.literal("void-drift-alpha"),
  emulators: z.literal(false),
  node: z.string(),
  platform: z.string(),
  artifactFingerprint: hash,
  files: z.record(hash),
  sentry: z
    .object({
      release: z.string().min(1),
      environment: z.literal("production"),
    })
    .optional(),
  smoke: z.object({
    passed: z.literal(true),
    browser: z.string(),
    externalNetwork: z.literal("blocked"),
    liveBackendVerified: z.literal(false),
  }),
});
