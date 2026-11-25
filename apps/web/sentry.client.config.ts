import * as Sentry from "@sentry/astro";
import {
  installScoreFailureReporter,
  ScoreFailureOperationSchema,
} from "@void-drift/mode-a";
import { z } from "zod";
import {
  FlightErrorContextSchema,
  FlightEventSchema,
  installFlightReporter,
} from "./src/lib/flight-reporting";

const exceptionTypes = z.enum([
  "Error",
  "TypeError",
  "ReferenceError",
  "SyntaxError",
  "RangeError",
  "URIError",
  "EvalError",
  "AggregateError",
  "FirebaseError",
  "ZodError",
]);
const scoreErrorCodes = z.enum([
  "permission-denied",
  "unauthenticated",
  "failed-precondition",
  "invalid-argument",
  "internal",
  "not-found",
  "resource-exhausted",
  "auth/operation-not-allowed",
  "auth/invalid-api-key",
  "auth/too-many-requests",
]);
const debugIdPattern = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

function browserContext() {
  const userAgent = navigator.userAgent;
  const browsers = [
    ["Edge", /\bEdg(?:A|iOS)?\/(\d{1,4})\./],
    ["Opera", /\bOPR\/(\d{1,4})\./],
    ["Firefox", /\b(?:Firefox|FxiOS)\/(\d{1,4})\./],
    ["Chrome", /\b(?:HeadlessChrome|Chrome|Chromium|CriOS)\/(\d{1,4})\./],
    ["Safari", /\bVersion\/(\d{1,4})\.[^ ]* Safari\//],
  ] as const;
  const operatingSystems = [
    ["Windows", /\bWindows NT\b/],
    ["Android", /\bAndroid\b/],
    ["iOS", /\b(?:iPhone|iPad|iPod)\b/],
    ["macOS", /\bMac OS X\b/],
    ["ChromeOS", /\bCrOS\b/],
    ["Linux", /\bLinux\b/],
  ] as const;
  const browser = browsers.find(([, pattern]) => pattern.test(userAgent));
  const version = browser?.[1].exec(userAgent)?.[1];
  const os = operatingSystems.find(([, pattern]) => pattern.test(userAgent));
  return {
    browser: browser ? { name: browser[0], version } : undefined,
    os: os ? { name: os[0] } : undefined,
  };
}

function assetUrl(raw: string | undefined) {
  if (!raw) return undefined;
  try {
    const url = new URL(raw, `${window.location.origin}/`);
    if (
      url.origin === window.location.origin &&
      /^\/_astro\/[\w.-]+\.js$/.test(url.pathname)
    )
      return `${url.origin}${url.pathname}`;
  } catch {
    // Non-URL stack frames have no published source map.
  }
  return undefined;
}

function scrubEvent(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): Sentry.ErrorEvent {
  const flight = FlightErrorContextSchema.safeParse(event.contexts?.flight);
  const operation = ScoreFailureOperationSchema.safeParse(
    event.tags?.score_operation,
  );
  const original = hint.originalException;
  const code = scoreErrorCodes.safeParse(
    operation.success && original instanceof Error && "code" in original
      ? original.code
      : undefined,
  );
  const exceptions = event.exception?.values?.map((exception) => {
    const type = exceptionTypes.safeParse(exception.type);
    const frames = exception.stacktrace?.frames?.flatMap((frame) => {
      const filename = assetUrl(frame.abs_path ?? frame.filename);
      return filename
        ? [
            {
              filename,
              abs_path: filename,
              lineno: frame.lineno,
              colno: frame.colno,
            },
          ]
        : [];
    });
    return {
      type: type.success ? type.data : "Error",
      // Messages may contain player input or Firestore paths. Keep codes and source frames.
      value: operation.success
        ? `Shared scores: ${operation.data}${code.success ? ` (${code.data})` : ""}`
        : "Uncaught browser error",
      mechanism: {
        type: operation.success ? "generic" : "browser",
        handled: operation.success,
      },
      stacktrace: frames?.length ? { frames } : undefined,
    };
  });
  const debugImages = event.debug_meta?.images?.flatMap((image) => {
    const codeFile = assetUrl(image.code_file);
    return image.type === "sourcemap" &&
      codeFile &&
      debugIdPattern.test(image.debug_id)
      ? [{ type: image.type, code_file: codeFile, debug_id: image.debug_id }]
      : [];
  });
  hint.attachments = [];
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: "javascript",
    level: "error",
    release: __SENTRY_BROWSER_CONFIG__.release,
    environment: __SENTRY_BROWSER_CONFIG__.environment,
    exception: exceptions?.length ? { values: exceptions } : undefined,
    debug_meta: debugImages?.length ? { images: debugImages } : undefined,
    tags: {
      version: __APP_VERSION__,
      score_operation: operation.data,
      firebase_code: code.data,
    },
    contexts: { ...browserContext(), flight: flight.data },
    breadcrumbs: event.breadcrumbs?.flatMap((breadcrumb) => {
      const label = FlightEventSchema.safeParse(breadcrumb.message);
      return breadcrumb.category === "flight" && label.success
        ? [
            {
              category: "flight",
              message: label.data,
              timestamp: breadcrumb.timestamp,
            },
          ]
        : [];
    }),
  };
}

try {
  if (import.meta.env.PROD && !Sentry.getClient()) {
    const client = Sentry.init({
      ...__SENTRY_BROWSER_CONFIG__,
      defaultIntegrations: false,
      integrations: [
        Sentry.globalHandlersIntegration(),
        Sentry.dedupeIntegration(),
      ],
      dataCollection: { userInfo: false },
      maxBreadcrumbs: 12,
      sendClientReports: false,
      beforeSend: scrubEvent,
    });
    if (client) {
      installFlightReporter((event, context) => {
        Sentry.setContext("flight", event === "left" ? null : context);
        Sentry.addBreadcrumb({ category: "flight", message: event });
      });
      installScoreFailureReporter((operation, error) => {
        Sentry.captureException(error, {
          tags: { score_operation: operation },
        });
      });
    }
  }
} catch {
  // Reporting setup is best-effort and independent of the game.
}
