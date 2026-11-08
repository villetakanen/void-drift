import { z } from "astro/zod";

type Issue = { path: (string | number)[]; message: string };
// Wraps a game schema (separate Zod instance) so its own rules still apply.
export function gameSchema<T>(schema: {
  safeParse(
    v: unknown,
  ):
    | { success: true; data: T }
    | { success: false; error: { issues: Issue[] } };
}) {
  return z.unknown().transform((value, ctx) => {
    const result = schema.safeParse(value);
    if (result.success) return result.data;
    for (const issue of result.error.issues)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: issue.path,
        message: issue.message,
      });
    return z.NEVER;
  });
}
