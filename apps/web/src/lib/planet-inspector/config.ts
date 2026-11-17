import { z } from "astro/zod";

const degrees = z.number().finite().min(0).max(360).default(0);
export const PlanetInspectorDocumentSchema = z
  .object({
    planet: z
      .discriminatedUnion("kind", [
        z
          .object({
            kind: z.literal("named"),
            name: z.enum(["mercury", "venus", "cradle", "earth"]),
          })
          .strict(),
      ])
      .default({ kind: "named", name: "mercury" }),
    opening: z
      .object({
        rotationDegrees: degrees,
        orbitDegrees: z.number().finite().min(0).max(360).optional(),
        zoom: z
          .union([
            z.literal(1),
            z.literal(2),
            z.literal(4),
            z.literal(8),
            z.literal(16),
          ])
          .default(1),
        playing: z.boolean().default(false),
      })
      .strict()
      .default({}),
  })
  .strict();
export type PlanetInspectorDocument = z.infer<
  typeof PlanetInspectorDocumentSchema
>;
