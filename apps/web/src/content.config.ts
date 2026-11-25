import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

import { parseTimestamp } from "./lib/timestamp";

const timestamp = z
  .string()
  .refine(
    (value) => parseTimestamp(value) !== null,
    "Invalid RFC 3339 timestamp",
  );
const source = glob({
  base: "./src",
  pattern: "content/field-guide/**/*.mdx",
  generateId: ({ entry }) => entry,
});
const producer = z.string().regex(/^(?:human:[^\s:]+|[^\s/]+\/[^\s/]+)$/);

const fieldGuide = defineCollection({
  loader: {
    ...source,
    load: async (context) => {
      context.store.clear();
      await source.load(context);
    },
  },
  schema: z.object({
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    generated: z.object({ by: producer, at: timestamp }),
    verified: z
      .array(
        z.object({ by: z.string().regex(/^human:[^\s:]+$/), at: timestamp }),
      )
      .max(1),
  }),
});

export const collections = { fieldGuide };
