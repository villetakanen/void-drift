import { type Simulation, STEP } from "@void-drift/mode-a";
import { z } from "astro/zod";
import {
  type FlightExperiment,
  type FlightExperimentRun,
  FlightSceneDocumentSchema,
  STARTER_FLIGHT_SCENE,
} from "../../../lib/flight-scene";
import { paintPlasma } from "./round023-paint";

export const OptionsSchema = z
  .object({
    check: z.number().min(0).max(120).default(65),
    timing: z.enum(["Preparation", "Release"]).default("Preparation"),
  })
  .strict();
export type Options = z.infer<typeof OptionsSchema>;
export const config = FlightSceneDocumentSchema.parse({
  ...STARTER_FLIGHT_SCENE,
  loadout: {
    ...STARTER_FLIGHT_SCENE.loadout,
    hull: STARTER_FLIGHT_SCENE.loadout.hull.map(() => null),
  },
  start: { x: 460, y: 540, rotation: -Math.PI / 2 },
  targets: [
    { x: 450, y: 220 },
    { x: 560, y: 220 },
    { x: 360, y: 350 },
  ],
  held: undefined,
  opening: { burn: "course", view: "follow", tick: 0 },
});
export interface Parcel {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  side: number;
  angle: number;
  fork: boolean;
  seed: number;
}
export interface Contact {
  tick: number;
  source: "eruption" | "exhaust";
  kind: string;
  id: number;
  damage: number;
}
export interface Evidence {
  chargeTick: number;
  spent: number;
  powerBefore: number;
  powerAfter: number;
  strikeTick: number;
  target: number;
  vents: number[];
  contacts: Contact[];
  maxParcels: number;
}
export interface PlasmaRun extends FlightExperimentRun {
  evidence: Evidence;
}
const VENTS = [12, 39, 72, 102];
export interface Readout {
  phase: string;
  power: number;
  spent: number;
  contacts: number;
  vents: number;
}
export function makeExperiment(
  input: unknown = {},
  report?: (value: Readout) => void,
): FlightExperiment {
  const options = OptionsSchema.parse(input);
  return {
    label: "02.3 · paid charge / close eruption / cooling exhaust",
    create(sim) {
      let tick = 0,
        age = -1,
        fired = -1;
      let blast = { x: 0, y: 0, angle: 0 };
      const particles: Parcel[] = [];
      const evidence: Evidence = {
        chargeTick: -1,
        spent: 0,
        powerBefore: 0,
        powerAfter: 0,
        strikeTick: -1,
        target: -1,
        vents: [],
        contacts: [],
        maxParcels: 0,
      };
      const nose = () => ({
        x: sim.ship.pos.x + Math.cos(sim.ship.rotation) * 22,
        y: sim.ship.pos.y + Math.sin(sim.ship.rotation) * 22,
      });
      function hit(
        x: number,
        y: number,
        r: number,
        amount: number,
        source: Contact["source"],
      ) {
        const salvage = sim.salvage;
        if (!salvage) return;
        // Snapshot lets the next fixed tick contact newly released production fragments.
        for (const b of [...salvage.bodies]) {
          if (
            b.hull <= 0 ||
            b.kind === "cell" ||
            Math.hypot(b.x - x, b.y - y) > r + b.radius
          )
            continue;
          evidence.contacts.push({
            tick,
            source,
            kind: b.kind,
            id: b.id,
            damage: Math.min(b.hull, amount),
          });
          salvage.applyDamage(b, amount);
        }
      }
      function vent(begin = true) {
        if (begin) evidence.vents.push(tick);
        const n = nose(),
          a = sim.ship.rotation;
        for (const side of [-1, 1])
          for (let i = 0; i < 4; i++) {
            const f = 70 + i * 12,
              s = side * (85 + i * 17);
            if (particles.length >= 128) continue;
            particles.push({
              x: n.x,
              y: n.y,
              vx: Math.cos(a) * f - Math.sin(a) * s + sim.ship.vel.x * 0.16,
              vy: Math.sin(a) * f + Math.cos(a) * s + sim.ship.vel.y * 0.16,
              age: 0,
              side,
              angle: a,
              fork: false,
              seed: i + evidence.vents.length * 11,
            });
          }
      }
      function response() {
        const d = options.check / 24;
        sim.ship.vel.x -= Math.cos(sim.ship.rotation) * d;
        sim.ship.vel.y -= Math.sin(sim.ship.rotation) * d;
      }
      const readout = () =>
        report?.({
          phase:
            age < 0
              ? "Approach"
              : fired >= 0
                ? tick - fired < 16
                  ? "Close eruption"
                  : age < 172
                    ? "Cooling after strike"
                    : "Flight continues"
                : age < 54
                  ? "Charging"
                  : age <= 81
                    ? "Charged · seeking close target"
                    : age < 172
                      ? "Missed opportunity · cooling"
                      : "Flight continues",
          power: sim.state.resources.power,
          spent: evidence.spent,
          contacts: evidence.contacts.length,
          vents: evidence.vents.length,
        });
      readout();
      const run: PlasmaRun = {
        evidence,
        step(_sim: Simulation, t: number) {
          tick = t;
          // One staged trigger at 0.5 s; release below is a spatial query, never a timer.
          if (t === 30 && sim.state.resources.power >= 18) {
            evidence.powerBefore = sim.state.resources.power;
            sim.state.resources.power -= 18;
            evidence.powerAfter = sim.state.resources.power;
            evidence.spent = 18;
            evidence.chargeTick = t;
            age = 0;
          }
          if (age < 0) {
            readout();
            return;
          }
          age = t - evidence.chargeTick;
          if (options.timing === "Preparation" && age >= 12 && age < 36)
            response();
          if (options.timing === "Release" && fired >= 0 && t - fired <= 24)
            response();
          if (VENTS.includes(age)) vent();
          else if (
            VENTS.some((v) => age > v && age - v <= 6 && (age - v) % 3 === 0)
          )
            vent(false);
          // Ready after 0.9 s, then a 0.45 s acquisition window. Empty space never fires.
          if (fired < 0 && age >= 54 && age <= 81) {
            const c = Math.cos(sim.ship.rotation),
              s = Math.sin(sim.ship.rotation);
            const target = sim.salvage?.bodies.find((b) => {
              const dx = b.x - sim.ship.pos.x,
                dy = b.y - sim.ship.pos.y;
              const forward = dx * c + dy * s,
                side = -dx * s + dy * c;
              return (
                b.hull > 0 &&
                b.kind !== "cell" &&
                forward >= 28 &&
                forward <= 108 &&
                Math.abs(side) < 30 + b.radius
              );
            });
            if (target) {
              fired = t;
              evidence.strikeTick = t;
              evidence.target = target.id;
              blast = {
                x: sim.ship.pos.x + c * 68,
                y: sim.ship.pos.y + s * 68,
                angle: sim.ship.rotation,
              };
            }
          }
          if (fired >= 0 && t - fired < 16)
            hit(blast.x, blast.y, 46, 420 * STEP, "eruption");
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.age += STEP;
            if (p.age > 1.05) {
              particles.splice(i, 1);
              continue;
            }
            // Cooling parcels peel outward; forks carry matter, not a drawn antler outline.
            p.vx += (-Math.sin(p.angle) * p.side * 70 - p.vx * 0.35) * STEP;
            p.vy += (Math.cos(p.angle) * p.side * 70 - p.vy * 0.35) * STEP;
            p.x += p.vx * STEP;
            p.y += p.vy * STEP;
            if (!p.fork && p.age > 0.32) {
              p.fork = true;
              if (p.seed % 2 === 0 && particles.length < 128)
                particles.push({
                  ...p,
                  vx: p.vx + Math.cos(p.angle) * 65,
                  vy: p.vy + Math.sin(p.angle) * 65,
                  seed: p.seed + 100,
                });
            }
            hit(p.x, p.y, 5 + p.age * 5, 2.4 * STEP, "exhaust");
          }
          evidence.maxParcels = Math.max(evidence.maxParcels, particles.length);
          readout();
        },
        fx(ctx, pass) {
          paintPlasma(ctx, pass, {
            tick,
            age,
            fired,
            blast,
            nose: nose(),
            angle: sim.ship.rotation,
            particles,
          });
        },
      };
      return run;
    },
  };
}
