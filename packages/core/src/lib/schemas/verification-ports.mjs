import { z } from "zod";

const port = z
  .string()
  .regex(/^[0-9]+$/, "Expected a decimal TCP port")
  .transform(Number)
  .pipe(z.number().int().min(1).max(65535));

export const verificationPortsSchema = z
  .object({
    PLAYWRIGHT_PORT: port.default("4322"),
    PLAYWRIGHT_FIREBASE_PORT: port.default("4323"),
  })
  .refine(
    (value) => value.PLAYWRIGHT_PORT !== value.PLAYWRIGHT_FIREBASE_PORT,
    "Browser and competition ports must differ",
  );

export function verificationUrls(env = process.env) {
  const ports = verificationPortsSchema.parse(env);
  return {
    browser: `http://127.0.0.1:${ports.PLAYWRIGHT_PORT}`,
    competition: `http://127.0.0.1:${ports.PLAYWRIGHT_FIREBASE_PORT}`,
  };
}
