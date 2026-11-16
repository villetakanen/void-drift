import { type Loadout, LoadoutSchema } from "@void-drift/mode-a";
import { z } from "astro/zod";
import { BURN_IDS, TOTAL_TICKS } from "../instrument/burns";
import { gameSchema } from "../instrument/external-schema";

// The Flight scene instrument's configuration document: what an agent writes
// and a study embeds. The designer's changes (targets, layers, time) are view
// state in the component and are not written back.

/** Presentation only: no stellar physics or gameplay retuning. */
export const StarAppearanceSchema = z
  .object({
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    glowColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  })
  .strict();
export type StarAppearance = z.infer<typeof StarAppearanceSchema>;

const Point = z
  .object({ x: z.number().finite(), y: z.number().finite() })
  .strict();

export const StagedPlanetSchema = z
  .object({
    reference: z.literal("practice-venus"),
    orbitAngle: z.number().finite().default(0),
    atmosphere: z
      .object({
        depth: z.number().finite().positive(),
        dragRate: z.number().finite().nonnegative(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type StagedPlanet = z.infer<typeof StagedPlanetSchema>;

export const FLIGHT_VIEWS = ["game", "follow", "follow-far"] as const;
export type FlightView = (typeof FLIGHT_VIEWS)[number];

export const StagedStartSchema = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
    rotation: z.number().finite(),
    velocity: Point.optional(),
  })
  .strict();

export const FlightSceneDocumentSchema = z
  .object({
    planet: StagedPlanetSchema.optional(),
    /** One game loadout; it should carry a forward weapon to have something to show. */
    loadout: gameSchema<Loadout>(LoadoutSchema),
    /** Staged study impulses, applied once at a tick boundary, never during drawing. */
    impulses: z
      .array(
        z
          .object({
            tick: z.number().int().min(1).max(TOTAL_TICKS),
            backwardMomentum: z.number().finite().nonnegative(),
          })
          .strict(),
      )
      .max(16)
      .default([]),
    /** Where the ship starts, at rest; absent means where a run starts. */
    start: StagedStartSchema.optional(),
    /** Wrecks placed in the arena, in world units. */
    targets: z.array(Point).max(16).default([]),
    /** A wreck held ahead of the ship, replaced when it breaks; absent offers none. */
    held: z
      .object({
        distance: z.number().finite().positive().default(140),
        shardLife: z.number().finite().positive().default(2),
      })
      .strict()
      .optional(),
    /** Zoom of the two follow views. */
    follow: z
      .object({
        near: z.number().finite().positive().default(1.6),
        far: z.number().finite().positive().default(4),
      })
      .strict()
      .default({})
      .refine(({ near, far }) => near < far, {
        message: "near must be smaller than far",
      }),
    /** What the scene shows when it opens. */
    opening: z
      .object({
        burn: z.enum(BURN_IDS).default("course"),
        view: z.enum(FLIGHT_VIEWS).default("follow"),
        tick: z.number().int().min(0).max(TOTAL_TICKS).default(180),
      })
      .strict()
      .default({}),
  })
  .strict()
  .refine((doc) => !doc.planet || (!doc.targets.length && !doc.held), {
    message: "Planet encounters and wreck staging are separate scene modes",
    path: ["planet"],
  });
export type FlightSceneDocument = z.infer<typeof FlightSceneDocumentSchema>;
