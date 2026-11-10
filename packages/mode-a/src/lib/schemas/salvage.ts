import { z } from "zod";

const EventFields = {
  id: z.number().int(),
  x: z.number(),
  y: z.number(),
  endX: z.number(),
  endY: z.number(),
  time: z.number(),
};
export const WeaponEventSchema = z.discriminatedUnion("kind", [
  z.object({
    ...EventFields,
    kind: z.literal("ion-cannon"),
    mountKey: z.string(),
    distance: z.number().min(0).max(200),
  }),
  z.object({
    ...EventFields,
    kind: z.literal("point-defence"),
    mountKey: z.string(),
    distance: z.number().min(0).max(100),
  }),
  z.object({ ...EventFields, kind: z.literal("rail") }),
  z.object({ ...EventFields, kind: z.literal("laser") }),
  z.object({ ...EventFields, kind: z.literal("collision") }),
  z.object({ ...EventFields, kind: z.literal("impact") }),
  z.object({ ...EventFields, kind: z.literal("break") }),
  z.object({ ...EventFields, kind: z.literal("collect") }),
  z.object({ ...EventFields, kind: z.literal("energy-release") }),
]);
export type WeaponEvent = z.infer<typeof WeaponEventSchema>;

export const SalvagePhysicalStateSchema = z.object({
  initialHull: z.number().positive().optional(),
  releasedMask: z.number().int().min(0).max(255).optional(),
  shardIndex: z.number().int().min(0).max(7).optional(),
  previousRotation: z.number().optional(),
  /** A wreck's signed spin in radians per second; absent means the shared default. */
  spin: z.number().optional(),
  suppressShipContact: z.boolean().optional(),
});
export type SalvagePhysicalState = z.infer<typeof SalvagePhysicalStateSchema>;
export const SalvageBodySchema = SalvagePhysicalStateSchema.extend({
  id: z.number().int(),
  group: z.number().int(),
  kind: z.enum(["wreck", "fragment", "cell"]),
  x: z.number(),
  y: z.number(),
  previousX: z.number(),
  previousY: z.number(),
  vx: z.number(),
  vy: z.number(),
  radius: z.number().positive(),
  hull: z.number(),
  /** Seconds left; required for a wreck and a cell, absent for a shard. */
  life: z.number().optional(),
  rotation: z.number(),
}).refine((body) => body.kind === "fragment" || body.life !== undefined, {
  message: "A wreck and a cell need a life",
  path: ["life"],
});

export const DestructionCauseSchema = z.enum([
  "player-weapon",
  "player-ram",
  "environment",
  "expiry",
  "exit",
]);
export type DestructionCause = z.infer<typeof DestructionCauseSchema>;

export const DerelictsResultSchema = z
  .object({
    seconds: z.number().nonnegative(),
    playerKills: z.number().int().nonnegative(),
    score: z.number().nonnegative(),
  })
  .refine(
    (result) => result.score === result.seconds + 10 * result.playerKills,
    {
      message:
        "Derelicts score must equal gameplay seconds plus ten per player kill",
    },
  );
export type DerelictsResult = z.infer<typeof DerelictsResultSchema>;

const ShotSchema = z.object({
  damage: z.number().positive(),
  energy: z.number().positive(),
  cooldown: z.number().positive(),
  range: z.number().positive(),
});
export const IonCannonSchema = z.object({
  trigger: z.literal("ship-width-rectangle"),
  range: z.literal(200),
  cooldown: z.number().positive(),
  energy: z.literal(0.2),
  bands: z.tuple([z.literal(16), z.literal(12), z.literal(8), z.literal(4)]),
  flashSeconds: z.literal(0.08),
  dispersal: z.literal(0.65),
});
export const ION_CANNON = IonCannonSchema.parse({
  trigger: "ship-width-rectangle",
  range: 200,
  cooldown: 1 / 3,
  energy: 0.2,
  bands: [16, 12, 8, 4],
  flashSeconds: 0.08,
  dispersal: 0.65,
});
export function ionCannonDamage(distance: number) {
  if (!Number.isFinite(distance) || distance < 0 || distance > ION_CANNON.range)
    return 0;
  return ION_CANNON.bands[Math.min(3, Math.floor(distance / 50))];
}
/** Ion Point Defence: closest-target turret with the cannon's instant ray family. */
export const PointDefenceSchema = z.object({
  reach: z.literal(100),
  trackingRange: z.literal(200),
  /** Radians per second. */
  turnRate: z.literal(Math.PI),
  /** Radians either side of the aim point's bearing. */
  tolerance: z.literal((2 * Math.PI) / 180),
  cooldown: z.literal(1 / 3),
  energy: z.literal(0.1),
  bands: z.tuple([z.literal(8), z.literal(6), z.literal(4), z.literal(2)]),
  retention: z.literal(10),
  flashSeconds: z.literal(ION_CANNON.flashSeconds),
  dispersal: z.literal(ION_CANNON.dispersal),
});
export const POINT_DEFENCE = PointDefenceSchema.parse({
  reach: 100,
  trackingRange: 200,
  turnRate: Math.PI,
  tolerance: (2 * Math.PI) / 180,
  cooldown: 1 / 3,
  energy: 0.1,
  bands: [8, 6, 4, 2],
  retention: 10,
  flashSeconds: 0.08,
  dispersal: 0.65,
});
/** Muzzle-to-first-contact damage; internal boundaries take the lower band. */
export function pointDefenceDamage(distance: number) {
  if (
    !Number.isFinite(distance) ||
    distance < 0 ||
    distance > POINT_DEFENCE.reach
  )
    return 0;
  const band = POINT_DEFENCE.reach / POINT_DEFENCE.bands.length;
  return POINT_DEFENCE.bands[Math.min(3, Math.floor(distance / band))];
}
export const WeaponConfigSchema = z.object({
  /** Fraction of energy capacity below which no weapon fires. */
  energyFloor: z.number().min(0).max(1),
  rail: ShotSchema.extend({
    speed: z.number().positive(),
    recoilStrength: z.number().nonnegative(),
    recoilDuration: z.number().positive(),
    arc: z
      .number()
      .positive()
      .max(Math.PI / 2),
  }),
  laser: ShotSchema.extend({
    turnSpeed: z.number().positive(),
    tolerance: z.number().positive(),
    threatHorizon: z.number().positive(),
  }),
});
/** Trial tuning, separate from engine draw and saved fittings. Angles are radians. */
export const WEAPONS = WeaponConfigSchema.parse({
  energyFloor: 0.1,
  rail: {
    damage: 100,
    energy: 3,
    cooldown: 0.6,
    speed: 600,
    range: 600, // Acquisition only; rounds travel until collision or system exit.
    arc: (8 * Math.PI) / 180, // Half-angle around the fixed barrel.
    recoilStrength: 0.34, // Fraction of one Light ion engine's force.
    recoilDuration: 0.22,
  },
  laser: {
    damage: 5,
    energy: 0.5,
    cooldown: 0.25,
    range: 160,
    turnSpeed: Math.PI * 2,
    tolerance: Math.PI / 90,
    threatHorizon: 3,
  },
});
/** A wreck's spin: a rate in radians per second, one way or a side drawn per wreck. */
const WreckSpinSchema = z.object({
  rate: z.number().nonnegative(),
  direction: z.enum(["fixed", "random"]),
});
export const EncounterConfigSchema = z
  .object({
    /** The first arrival falls at a seeded time in this window. */
    firstPass: z
      .object({
        min: z.number().nonnegative(),
        max: z.number().nonnegative(),
      })
      .refine((window) => window.max >= window.min),
    intervalMin: z.number().positive(),
    intervalMax: z.number().positive(),
    groups: z.number().int().positive(),
    centerX: z.number(),
    centerY: z.number(),
    radius: z.number().positive(),
    speedMin: z.number().positive(),
    speedMax: z.number().positive(),
    /** Entry heading within this many radians either side of the inward radial. */
    headingSpread: z
      .number()
      .positive()
      .lt(Math.PI / 2)
      .optional(),
    /** Entry heading between these radians off the inward radial, either side. */
    entryAngle: z
      .object({
        min: z.number().nonnegative(),
        max: z
          .number()
          .positive()
          .lt(Math.PI / 2),
      })
      .refine((band) => band.max >= band.min)
      .optional(),
    /** A wreck enters turned at random, or narrow tip first along its velocity. */
    orientation: z.enum(["random", "tip-first"]),
    wreckSpin: WreckSpinSchema,
  })
  .refine(
    (c) =>
      c.intervalMax >= c.intervalMin &&
      c.speedMax >= c.speedMin &&
      (c.headingSpread === undefined) !== (c.entryAngle === undefined),
  );
export type EncounterConfig = z.infer<typeof EncounterConfigSchema>;
/** Derelicts mode: more and faster derelicts, for development and fun. */
export const ENCOUNTER = EncounterConfigSchema.parse({
  firstPass: { min: 3, max: 3 },
  intervalMin: 6,
  intervalMax: 12,
  groups: 16,
  centerX: 960,
  centerY: 540,
  radius: 1200,
  speedMin: 100,
  speedMax: 500,
  headingSpread: Math.PI / 3,
  orientation: "random",
  wreckSpin: { rate: 0.3, direction: "fixed" },
});
/** Survival's own encounter: rare, slow derelicts, one at a time, entering tip first. */
export const SURVIVAL_ENCOUNTER = EncounterConfigSchema.parse({
  firstPass: { min: 3, max: 50 },
  intervalMin: 60,
  intervalMax: 120,
  groups: 1,
  centerX: 960,
  centerY: 540,
  radius: 1200,
  speedMin: 50,
  speedMax: 150,
  entryAngle: { min: (40 * Math.PI) / 180, max: (50 * Math.PI) / 180 },
  orientation: "tip-first",
  wreckSpin: { rate: (1 * Math.PI) / 180, direction: "random" },
});
export const SalvageConfigSchema = z.object({
  wreck: z.object({
    hull: z.number().positive(),
    radius: z.number().positive(),
    life: z.number().positive(),
    contact: z.number().positive(),
  }),
  fragment: z.object({
    count: z.literal(8),
    hull: z.number().positive(),
    radius: z.number().positive(),
    contact: z.number().positive(),
    speed: z.number().positive(),
  }),
  cell: z.object({
    energy: z.number().positive(),
    radius: z.number().positive(),
    life: z.number().positive(),
  }),
});
export const SALVAGE = SalvageConfigSchema.parse({
  wreck: { hull: 85, radius: 18, life: 30, contact: 30 },
  fragment: { count: 8, hull: 12, radius: 5, contact: 5, speed: 60 },
  cell: { energy: 30, radius: 6, life: 20 },
});
