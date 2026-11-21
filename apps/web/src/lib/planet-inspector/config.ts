import { HabitableAppearanceSchema } from "@void-drift/core";
import { HABITABLE_RADIUS, MERCURIAL_ROCK_RADIUS } from "@void-drift/mode-a";
import { z } from "astro/zod";

export const MercurialInspectorPlanetSchema = z
  .object({
    kind: z.literal("family"),
    name: z.enum(["mercurial", "outer-mercurial"]),
    radius: z
      .number()
      .finite()
      .min(MERCURIAL_ROCK_RADIUS.min)
      .max(MERCURIAL_ROCK_RADIUS.max)
      .default(MERCURIAL_ROCK_RADIUS.practice),
  })
  .strict();

export const HabitableInspectorPlanetSchema = HabitableAppearanceSchema.extend({
  kind: z.literal("family"),
  name: z.literal("habitable"),
  radius: z
    .number()
    .finite()
    .min(HABITABLE_RADIUS.min)
    .max(HABITABLE_RADIUS.max)
    .default(HABITABLE_RADIUS.reference),
}).strict();

const degrees = z.number().finite().min(0).max(360).default(0);
export const PlanetInspectorDocumentSchema = z
  .object({
    planet: z
      .union([
        MercurialInspectorPlanetSchema,
        HabitableInspectorPlanetSchema.extend({
          ground: HabitableAppearanceSchema.shape.ground.default("archipelago"),
          clouds: HabitableAppearanceSchema.shape.clouds.default("fronts"),
        }),
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
