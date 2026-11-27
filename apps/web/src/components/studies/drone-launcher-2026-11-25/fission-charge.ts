import {
  applyYellowFamilyProfile,
  BUILD_FLIGHT_SCALE,
  buildCollisionRadius,
  defaultLoadout,
  drawBuild,
  GRAVITY_TUNING,
  STEP,
  starterLoadout,
  YELLOW_FAMILY_RADIUS,
} from "@void-drift/mode-a";
import { z } from "zod";
import {
  type FlightExperiment,
  FlightSceneDocumentSchema,
} from "../../../lib/flight-scene";
import { TOTAL_TICKS } from "../../../lib/instrument/burns";
import {
  type Charge,
  chargeLife,
  dose,
  drawCharge,
  emitFlashSparks,
  emitShellSparks,
  type FissionLight,
  FissionLightSchema,
  FissionSparks,
  type Solid,
  SparkSettingsSchema,
  shellArrival,
  stampCharge,
} from "./fission-light";

// Drone launcher 02.7: a bare fission charge going off at a fixed point in
// space, beside three ships at rest. There is no drone, launcher or engine in
// the scene: it exists to judge the light. Nothing takes damage.

export const SparkTreatment = z.enum(["02.7 strokes", "Green tracks"]);
export const StagingSchema = z
  .object({
    /** Dashed guides at the fatal radius and the reach limit. */
    guides: z.boolean(),
    sparkTreatment: SparkTreatment.optional(),
    sparkSettings: SparkSettingsSchema.optional(),
  })
  .strict();
export const DEFAULT_STAGING = StagingSchema.parse({ guides: true });

/** Ticks before the first charge, and between charges. */
export const FIRST_CHARGE = 60;
export const CHARGE_EVERY = 150;

const ship = starterLoadout("fighter");
const START = { x: 1460, y: 1040 };
/** The charge sits west of the ship, clear of the values menu on the right. */
const CHARGE_AT = { x: START.x - 78, y: START.y + 6 };
const NEAR = {
  name: "Scout",
  loadout: defaultLoadout("scout"),
  x: CHARGE_AT.x - 30,
  y: CHARGE_AT.y - 18,
  rotation: 0.6,
};
const FAR = {
  name: "Wasp",
  loadout: defaultLoadout("wasp"),
  x: CHARGE_AT.x - 40,
  y: CHARGE_AT.y + 118,
  rotation: -2.2,
};

export const CHARGE_SCENE = FlightSceneDocumentSchema.parse({
  loadout: ship,
  start: { ...START, rotation: -Math.PI / 2 },
  encounter: { restTicks: TOTAL_TICKS },
  opening: { burn: "course", view: "4x", tick: FIRST_CHARGE + 6 },
});

export const HullTimingSchema = z.enum([
  "At detonation",
  "After the flash",
  "Keep hull visible",
]);
export type HullTiming = z.infer<typeof HullTimingSchema>;

export function chargeExperiment(
  lightInput: unknown,
  stagingInput: unknown = DEFAULT_STAGING,
  report: (text: string) => void = () => {},
  drone?: { timing: HullTiming; draw: (ctx: CanvasRenderingContext2D) => void },
): FlightExperiment {
  const light: FissionLight = FissionLightSchema.parse(lightInput);
  const staging = StagingSchema.parse(stagingInput);
  const life = chargeLife(light);
  const greenTracks = staging.sparkTreatment === "Green tracks";
  return {
    label: staging.sparkTreatment
      ? "02.9 · outgoing sparks"
      : drone
        ? "Drone detonation 02.8 · sparks and radiation"
        : "Fission light 02.7 · a bare charge beside three ships",
    create(sim) {
      applyYellowFamilyProfile(
        sim.star,
        YELLOW_FAMILY_RADIUS.min,
        GRAVITY_TUNING,
      );
      sim.planets.length = 0;
      const staged: Solid[] = [NEAR, FAR].map((body) => ({
        name: body.name,
        x: body.x,
        y: body.y,
        radius: buildCollisionRadius(body.loadout),
      }));
      const solids = (): Solid[] => [
        ...staged,
        {
          name: "Fighter",
          x: sim.ship.pos.x,
          y: sim.ship.pos.y,
          radius: sim.ship.radius,
        },
      ];
      const charges: Charge[] = [];
      const sparks = new FissionSparks(
        greenTracks ? staging.sparkSettings : undefined,
      );
      let now = 0;
      let current = solids();
      report("Dark · first charge at 1.00 s");
      return {
        step(_, tick) {
          now = tick;
          current = solids();
          if (
            tick >= FIRST_CHARGE &&
            (!drone || tick === FIRST_CHARGE) &&
            (tick - FIRST_CHARGE) % CHARGE_EVERY === 0
          ) {
            const charge = {
              ...CHARGE_AT,
              tick,
              seed: charges.length + 1,
            };
            charges.push(charge);
            emitFlashSparks(
              sparks,
              charge,
              staging.sparkTreatment ? [] : current,
              light,
            );
          }
          sparks.step(STEP);
          const latest = charges.at(-1);
          if (!latest) {
            report("Dark · first charge at 1.00 s");
            return;
          }
          const age = tick - latest.tick;
          for (const solid of current) {
            const distance = Math.hypot(solid.x - latest.x, solid.y - latest.y);
            if (shellArrival(light, distance) === age)
              emitShellSparks(
                sparks,
                latest,
                solid,
                light,
                !!staging.sparkTreatment,
              );
          }
          const caught = current
            .map((solid) => {
              const distance = Math.hypot(
                solid.x - latest.x,
                solid.y - latest.y,
              );
              return `${solid.name} ${distance.toFixed(0)} u · ${(dose(light, distance) * 100).toFixed(0)}%`;
            })
            .join("   ");
          report(
            `Charge ${charges.length} · ${age <= life ? `tick ${age} of ${life}` : "dark"} · went off at ${(latest.tick * STEP).toFixed(2)} s\nFlash taken: ${caught}\n${sparks.count} sparks alive`,
          );
        },
        passes: [
          {
            id: "study-charge-world",
            name: "Staged ships and reach guides",
            layer: "world",
            space: "world",
            draws: "A Scout and a Wasp at rest, and dashed study radii",
            source: "study/drone-launcher/fission-charge.ts",
            draw(frame, ctx) {
              for (const body of [NEAR, FAR])
                drawBuild(
                  ctx,
                  body.loadout,
                  body.x,
                  body.y,
                  body.rotation,
                  BUILD_FLIGHT_SCALE,
                );
              if (drone) {
                const age = now - FIRST_CHARGE;
                const visible =
                  age < 0 ||
                  drone.timing === "Keep hull visible" ||
                  (drone.timing === "After the flash" &&
                    age < light.flash.ticks);
                const x = CHARGE_AT.x + Math.min(0, age) * 1.5;
                const y = CHARGE_AT.y;
                const view = frame.camera.getViewRect();
                if (
                  visible &&
                  x + 8 >= view.x &&
                  x - 8 <= view.x + view.width &&
                  y + 8 >= view.y &&
                  y - 8 <= view.y + view.height
                ) {
                  ctx.save();
                  ctx.translate(x, y);
                  drone.draw(ctx);
                  ctx.restore();
                }
              }
              if (!staging.guides) return;
              const zoom = frame.camera.zoom;
              ctx.save();
              ctx.lineWidth = 1 / zoom;
              ctx.setLineDash([4 / zoom, 5 / zoom]);
              ctx.strokeStyle = "rgba(225,205,150,0.4)";
              ctx.beginPath();
              ctx.arc(
                CHARGE_AT.x,
                CHARGE_AT.y,
                light.reach.fatal,
                0,
                Math.PI * 2,
              );
              ctx.stroke();
              ctx.strokeStyle = "rgba(140,180,205,0.28)";
              ctx.beginPath();
              ctx.arc(
                CHARGE_AT.x,
                CHARGE_AT.y,
                light.reach.limit,
                0,
                Math.PI * 2,
              );
              ctx.stroke();
              ctx.restore();
            },
          },
          {
            id: "study-charge-live",
            name: "Fission live light",
            layer: "lfx",
            space: "world",
            draws: "The flash, lit faces and radiation pulse of each charge",
            source: "study/drone-launcher/fission-light.ts",
            draw(frame, ctx) {
              const view = frame.camera.getViewRect();
              const reach = light.reach.limit;
              for (const charge of charges) {
                if (
                  charge.x + reach < view.x ||
                  charge.x - reach > view.x + view.width ||
                  charge.y + reach < view.y ||
                  charge.y - reach > view.y + view.height
                )
                  continue;
                drawCharge(ctx, charge, current, light, now, !!drone);
              }
              if (drone || greenTracks)
                sparks.drawHeads(ctx, light.ink, view, greenTracks);
            },
          },
        ],
        fx(ctx, pass) {
          for (const charge of charges)
            stampCharge(ctx, pass, charge, current, light, now);
          ctx.save();
          if (drone) sparks.stampGlints(ctx, pass, light.ink);
          else sparks.stamp(ctx, pass, light.ink, greenTracks);
          ctx.restore();
        },
      };
    },
  };
}
