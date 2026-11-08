import { randomUUID } from "node:crypto";
import { z } from "zod";

// Playwright reloads configuration in workers. Inherit the parent's run ID so
// images and the report stay together while separate invocations remain unique.
process.env.VOID_DRIFT_CAPTURE_ID ??= `${new Date().toISOString().replaceAll(":", "-")}-${randomUUID()}`;
const runId = z
  .string()
  .regex(/^[A-Za-z0-9][\w.-]*$/)
  .parse(process.env.VOID_DRIFT_CAPTURE_ID);
export const captureRunDirectory = `artifacts/review/${runId}`;
