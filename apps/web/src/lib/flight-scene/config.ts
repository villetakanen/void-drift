import { type Loadout, LoadoutSchema } from "@void-drift/mode-a";
import { z } from "astro/zod";
import { BURN_IDS, TOTAL_TICKS } from "../instrument/burns";
import { gameSchema } from "../instrument/external-schema";

// The Flight scene instrument's configuration document: what an agent writes
// and a study embeds. The designer's changes (targets, layers, time) are view
// state in the component and are not written back.

const Point = z
  .object({ x: z.number().finite(), y: z.number().finite() })
  .strict();

export const FLIGHT_VIEWS = ["game", "follow", "follow-far"] as const;
export type FlightView = (typeof FLIGHT_VIEWS)[number];

export const FlightSceneDocumentSchema = z
  .object({
    /** One game loadout; it should carry a forward weapon to have something to show. */
    loadout: gameSchema<Loadout>(LoadoutSchema),
    /** Where the ship starts, at rest; absent means where a run starts. */
    start: z
      .object({
        x: z.number().finite(),
        y: z.number().finite(),
        rotation: z.number().finite(),
      })
      .strict()
      .optional(),
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
  .strict();
export type FlightSceneDocument = z.infer<typeof FlightSceneDocumentSchema>;
