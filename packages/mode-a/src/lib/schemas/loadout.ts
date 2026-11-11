export const LIFE_SUPPORT_DRAIN = 0.8;
/** Light ion draw; Heavy ion draws 2× and full-duty stabilizers 0.25× this. */
export const LIGHT_ION_DRAW = 1.75;

import { z } from "zod";
import { CRUISER } from "../cruiser";
import { FIDDLER } from "../fiddler";
import { FIGHTER } from "../fighter";
import { SCOUT } from "../scout";
import { lhiStabilizers, stabilizerMount } from "../stabilizers";
import { WASP } from "../wasp";
import {
  ION_DEFAULTS,
  ION_REFERENCE_MASS,
  STABILIZER_ENERGY,
  STABILIZER_STRENGTH,
} from "./ion";
import { ShipProfileIdSchema } from "./ship-profile";

export const EngineIdSchema = z.enum(["ion", "heavy-ion", "fusion", "plasma"]);
export const ReleaseClassSchema = z.enum(["scored", "preview"]);
export const PartIdSchema = z.enum([
  "light-ion-cannon",
  "ion-point-defence",
  "rail",
  "laser",
  "battery",
  "heavy-well",
  "coil",
  "gravity-coil",
  "ion",
  "heavy-ion",
  "fusion",
  "plasma",
]);
export type PartId = z.infer<typeof PartIdSchema>;
export const PartSchema = z.object({
  id: PartIdSchema,
  releaseClass: ReleaseClassSchema,
  description: z.string().max(220).default(""),
  capacity: z.number().nonnegative().default(0),
  name: z.string(),
  category: z.enum(["G", "U", "E"]),
  mass: z.number().positive(),
  thrust: z.number().nonnegative(),
  speedContribution: z.number().finite().nonnegative().default(0),
  limit: z.number().nonnegative(),
  draw: z.number().nonnegative(),
  response: z.enum(["steady", "pulse", "delayed"]).default("steady"),
  chargeSeconds: z.number().nonnegative().default(0),
  pulsePeriod: z.number().positive().default(0.45),
  pulseOn: z.number().positive().default(0.18),
});
export const SlotTypeSchema = z.enum([
  "engine",
  "weapon",
  "equipment",
  "support",
  "universal",
]);
export type SlotType = z.infer<typeof SlotTypeSchema>;
export const SLOT_TYPES = {
  engine: { symbol: "E", label: "Engines" },
  weapon: { symbol: "W", label: "Weapons" },
  support: { symbol: "S", label: "Support" },
  equipment: { symbol: "Q", label: "Equipment" },
  universal: { symbol: "+", label: "Universal" },
} as const;
export function slotAccepts(type: SlotType, category: "E" | "G" | "U") {
  return (
    type === "universal" ||
    (type === "equipment" && category !== "E") ||
    (type === "support" && category === "U") ||
    (type === "weapon" && category === "G") ||
    (type === "engine" && category === "E")
  );
}
export const ChassisSchema = z.object({
  releaseClass: ReleaseClassSchema,
  mass: z.number().positive(),
  baseSpeed: z.number().finite().positive(),
  hull: z.number().int().positive(),
  aft: z.number().int().nonnegative(),
  angle: z.number().nonnegative(),
  arm: z.number().nonnegative(),
  sideX: z.number().default(0),
  turnResponse: z.number().positive().default(1),
  length: z.number().positive(),
  width: z.number().positive(),
});
export const CHASSIS = {
  fiddler: ChassisSchema.parse({
    ...FIDDLER,
    releaseClass: "preview",
    hull: 5,
    aft: 2,
    baseSpeed: 280,
  }),
  wasp: ChassisSchema.parse({
    releaseClass: "scored",
    mass: WASP.mass,
    baseSpeed: 420,
    hull: 2,
    aft: 0,
    angle: WASP.angle,
    arm: WASP.arm,
    sideX: WASP.sideX,
    turnResponse: WASP.turnResponse,
    length: WASP.length,
    width: WASP.width,
  }),
  scout: ChassisSchema.parse({
    releaseClass: "scored",
    mass: SCOUT.mass,
    baseSpeed: 370,
    hull: 1,
    aft: 1,
    angle: SCOUT.angle,
    arm: SCOUT.arm,
    sideX: SCOUT.sideX,
    turnResponse: SCOUT.turnResponse,
    length: SCOUT.length,
    width: SCOUT.width,
  }),
  fighter: ChassisSchema.parse({
    releaseClass: "scored",
    mass: 95,
    baseSpeed: 330,
    hull: 2,
    aft: 2,
    angle: (FIGHTER.angle * 180) / Math.PI,
    arm: FIGHTER.arm,
    sideX: FIGHTER.sideX,
    turnResponse: FIGHTER.turnResponse,
    length: FIGHTER.length,
    width: FIGHTER.width,
  }),
  corvette: ChassisSchema.parse({
    releaseClass: "preview",
    mass: 140,
    baseSpeed: 240,
    hull: 3,
    aft: 3,
    angle: CRUISER.angle,
    arm: CRUISER.arm,
    sideX: CRUISER.sideX,
    length: CRUISER.length,
    width: 25,
  }),
};
export const PARTS = {
  "light-ion-cannon": PartSchema.parse({
    id: "light-ion-cannon",
    releaseClass: "scored",
    name: "Light Ion Cannon",
    description:
      "12–48 damage/s · 3 shots/s · 200-unit reach · 0.2p/shot (0.6p/s sustained). Ship-width forward acquisition; offset cannons may miss.",
    category: "G",
    mass: 9,
    thrust: 0,
    limit: 0,
    draw: 0,
  }),
  "ion-point-defence": PartSchema.parse({
    id: "ion-point-defence",
    releaseClass: "scored",
    name: "Ion Point Defence",
    description:
      "8–24 damage/s · 3 shots/s · 100-unit reach · 0.1p/shot (0.3p/s sustained). Turns at 180°/s towards the closest target within 200 units.",
    category: "G",
    mass: 10,
    thrust: 0,
    limit: 0,
    draw: 0,
  }),
  rail: PartSchema.parse({
    id: "rail",
    releaseClass: "preview",
    name: "Rail gun",
    description:
      "Automatically fires along the slot when a target approaches its firing line. Heavy hits and recoil; shots can miss. Active in Test flight; fires only while energy is at least 10% of capacity.",
    category: "G",
    mass: 15,
    thrust: 0,
    limit: 0,
    draw: 0,
  }),
  laser: PartSchema.parse({
    id: "laser",
    releaseClass: "preview",
    name: "Laser",
    description:
      "Short-range rotating pulse laser. Prioritizes incoming debris, then derelicts. Active in Test flight; fires only while energy is at least 10% of capacity.",
    category: "G",
    mass: 9,
    thrust: 0,
    limit: 0,
    draw: 0,
  }),
  battery: PartSchema.parse({
    id: "battery",
    releaseClass: "scored",
    name: "Potential Well",
    description:
      "A bank of well containment units stores potential in subspace, ready to supply the ship with matter and energy as needed.",
    capacity: 85,
    category: "U",
    mass: 18,
    thrust: 0,
    limit: 0,
    draw: 0,
  }),
  "heavy-well": PartSchema.parse({
    id: "heavy-well",
    releaseClass: "scored",
    name: "Heavy Potential Well",
    description:
      "A bank of well containment units stores potential in subspace, ready to supply the ship with matter and energy as needed.",
    category: "U",
    capacity: 140,
    mass: 36,
    thrust: 0,
    limit: 0,
    draw: 0,
  }),
  coil: PartSchema.parse({
    id: "coil",
    releaseClass: "preview",
    name: "Loading coil",
    category: "U",
    mass: 10,
    thrust: 0,
    limit: 0,
    draw: 0,
  }),
  "gravity-coil": PartSchema.parse({
    id: "gravity-coil",
    releaseClass: "scored",
    name: "Gravity coil",
    description:
      "Generates 1 energy/s inside a planet’s gravity well, up to storage capacity.",
    category: "U",
    // Fitting mass matches Loading coil.
    mass: 10,
    thrust: 0,
    limit: 0,
    draw: 0,
  }),
  ion: PartSchema.parse({
    id: "ion",
    releaseClass: "scored",
    name: "Light ion",
    description: "+8 u/s to ship cruise ceiling.",
    category: "E",
    mass: 10,
    thrust: ION_DEFAULTS.acceleration * ION_REFERENCE_MASS,
    speedContribution: 8,
    limit: ION_DEFAULTS.maxSpeed,
    draw: LIGHT_ION_DRAW,
  }),

  "heavy-ion": PartSchema.parse({
    id: "heavy-ion",
    releaseClass: "scored",
    name: "Heavy ion",
    description: "+11 u/s to ship cruise ceiling.",
    category: "E",
    mass: 20,
    thrust: ION_DEFAULTS.acceleration * ION_REFERENCE_MASS * 1.75,
    speedContribution: 11,
    limit:
      ION_DEFAULTS.maxSpeed *
      (1 + ION_DEFAULTS.bonus * (1 - Math.exp(-ION_DEFAULTS.falloff * 0.75))),
    draw: 2 * LIGHT_ION_DRAW,
    response: "steady",
    chargeSeconds: 0,
  }),
  fusion: PartSchema.parse({
    id: "fusion",
    releaseClass: "preview",
    name: "Fission",
    description: "+17 u/s to ship cruise ceiling.",
    category: "E",
    mass: 16,
    thrust: 48000,
    speedContribution: 17,
    limit: 550,
    draw: 3,
    response: "pulse",
    chargeSeconds: 0,
  }),
  plasma: PartSchema.parse({
    id: "plasma",
    releaseClass: "preview",
    name: "Plasma",
    description: "+9 u/s to ship cruise ceiling.",
    category: "E",
    mass: 24,
    thrust: 38000,
    speedContribution: 9,
    limit: 700,
    draw: 5,
    response: "delayed",
    chargeSeconds: 0.2,
  }),
};
export const LoadoutSchema = z
  .object({
    version: z.literal(2),
    chassis: ShipProfileIdSchema,
    side: EngineIdSchema,
    stabilizers: z.boolean().default(true),
    linkedEngines: z.boolean().optional(),
    hull: z.array(PartIdSchema.nullable()).max(5),
    aft: z.array(PartIdSchema.nullable()).max(3),
  })
  .strict()
  .superRefine((build, ctx) => {
    const chassis = CHASSIS[build.chassis];
    if (
      build.chassis === "fiddler" &&
      (build.aft.some((id) => !id || !EngineIdSchema.safeParse(id).success) ||
        build.aft[0] !== build.aft[1] ||
        [2, 3].some((index) => {
          const id = build.hull[index];
          return id && PARTS[id].category !== "U";
        }))
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Fiddler requires matching rear engines and support-only aft pincer slots",
      });
    if (
      build.hull.length !== chassis.hull ||
      build.aft.length !== chassis.aft ||
      build.hull.some(
        (id) => id && !slotAccepts("equipment", PARTS[id].category),
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Parts must fit this chassis's fixed slots",
      });
    }
  })
  .transform((build) =>
    lhiStabilizers(build.chassis) ? { ...build, stabilizers: true } : build,
  );
export type Loadout = z.infer<typeof LoadoutSchema>;
export function defaultLoadout(chassis: Loadout["chassis"]): Loadout {
  return LoadoutSchema.parse({
    version: 2,
    chassis,
    side: "ion",
    stabilizers: true,
    linkedEngines: false,
    hull: Array(CHASSIS[chassis].hull).fill(null),
    aft: Array(CHASSIS[chassis].aft).fill(chassis === "fiddler" ? "ion" : null),
  });
}
/** Fixed main-game fleet; builder saves and isolated Lab fixtures stay independent. */
export function starterLoadout(chassis: Loadout["chassis"]): Loadout {
  const build = defaultLoadout(chassis);
  build.stabilizers = true;
  build.aft.fill("ion");
  if (chassis === "wasp")
    build.hull = ["ion-point-defence", "light-ion-cannon"];
  if (chassis === "fiddler")
    build.hull = [null, null, "battery", "battery", "gravity-coil"];
  const packs = chassis === "fighter" ? 1 : chassis === "corvette" ? 2 : 0;
  for (let i = 0; i < packs; i++) build.hull[i] = "battery";
  return LoadoutSchema.parse(build);
}
export const BuildStoreSchema = z
  .object({
    activeChassis: ShipProfileIdSchema.default("wasp"),
    fiddler: LoadoutSchema.default(() => starterLoadout("fiddler")),
    wasp: LoadoutSchema.default(() => starterLoadout("wasp")),
    scout: LoadoutSchema,
    fighter: LoadoutSchema,
    corvette: LoadoutSchema,
  })
  .strict()
  .refine(
    (builds) =>
      builds.fiddler.chassis === "fiddler" &&
      builds.wasp.chassis === "wasp" &&
      builds.scout.chassis === "scout" &&
      builds.fighter.chassis === "fighter" &&
      builds.corvette.chassis === "corvette",
  );
export function defaultBuilds() {
  return {
    fiddler: starterLoadout("fiddler"),
    wasp: starterLoadout("wasp"),
    scout: defaultLoadout("scout"),
    fighter: defaultLoadout("fighter"),
    corvette: defaultLoadout("corvette"),
  };
}
export function defaultBuildStore(): z.infer<typeof BuildStoreSchema> {
  return { ...defaultBuilds(), activeChassis: "wasp" as const };
}
/** Every fitted part, one entry per mount: the Wasp has one side mount, other chassis two. */
export function fittedParts(build: Loadout): PartId[] {
  const ids =
    build.chassis === "wasp"
      ? [build.side, ...build.hull]
      : [build.side, build.side, ...build.hull, ...build.aft];
  return ids.filter((id): id is PartId => id !== null);
}
/** Whether this complete fitting uses only catalog entries eligible for scored play. */
export function isScoredEligible(build: Loadout): boolean {
  return (
    CHASSIS[build.chassis].releaseClass === "scored" &&
    fittedParts(build).every((id) => PARTS[id].releaseClass === "scored")
  );
}
export function buildStats(build: Loadout, parts: typeof PARTS = PARTS) {
  const chassis = CHASSIS[build.chassis];
  const isWasp = build.chassis === "wasp";
  const lhi = lhiStabilizers(build.chassis);
  const ids = fittedParts(build);
  let mass = chassis.mass,
    capacity = 100,
    coils = 1,
    engineDraw = 0;
  let installedEngineContribution = 0;
  const engineCounts = new Map<PartId, number>();
  for (const id of ids) {
    if (!id) continue;
    mass += parts[id].mass;
    capacity += parts[id].capacity;
    if (id === "coil") coils++;
    engineDraw += parts[id].draw;
    if (parts[id].category === "E") {
      installedEngineContribution += parts[id].speedContribution;
      engineCounts.set(id, (engineCounts.get(id) ?? 0) + 1);
    }
  }
  const engineBreakdown = [...engineCounts].map(([id, count]) => ({
    id,
    count,
    contribution: count * parts[id].speedContribution,
  }));
  if (lhi || build.stabilizers)
    engineDraw += PARTS.ion.draw * STABILIZER_ENERGY;
  const side = parts[build.side];
  const angle = (chassis.angle * Math.PI) / 180;
  const aftThrust = build.aft.reduce(
    (sum, id) => sum + (id ? parts[id].thrust : 0),
    0,
  );
  const acceleration = isWasp
    ? side.thrust / mass
    : (2 * side.thrust * Math.cos(angle) + aftThrust) / mass;
  const turnRate = lhi
    ? (PARTS.ion.thrust * STABILIZER_STRENGTH * lhi.coupledLever) /
      (mass * lhi.inertiaPerMass)
    : (side.thrust *
        (Math.cos(angle) * chassis.arm + Math.sin(angle) * chassis.sideX)) /
      (mass * stabilizerMount(build.chassis).inertiaPerMass);
  return {
    poweredCruiseCeiling: chassis.baseSpeed + installedEngineContribution,
    hullBaseSpeed: chassis.baseSpeed,
    installedEngineContribution,
    engineBreakdown,
    mass,
    capacity,
    coils,
    engineDraw,
    drain: LIFE_SUPPORT_DRAIN + engineDraw,
    acceleration,
    turnRate,
    endurance: capacity / LIFE_SUPPORT_DRAIN,
    fullEndurance: capacity / (LIFE_SUPPORT_DRAIN + engineDraw),
  };
}
