import type { FxPass } from "@void-drift/core";
import { LoadoutSchema, STEP, starterLoadout } from "@void-drift/mode-a";
import { z } from "astro/zod";
import type { StudyLight, StudyLightState } from "../../../lib/flight-scene";

// Fission engine 02.3: three readings of one push, painted with the light the
// game gives the drone's fission burst (packages/mode-a/src/lib/drone-fx.ts):
// a white flash with no gathering, green that stays on the FX surface, and
// pale live tips on LFX. The engine's flight is the game's; only its light is
// the study's. Sizes and counts are study values, not production tuning.

export const BurnIdeaSchema = z.enum([
  "Thrown matter",
  "Burning path",
  "Marked place",
]);
export type BurnIdea = z.infer<typeof BurnIdeaSchema>;
export const GAME_LIGHT = "Game today";

/** The Fighter with Fission in its left aft slot and Service ions on its sides. */
export const BURN_SCENE = {
  loadout: LoadoutSchema.parse({
    ...starterLoadout("fighter"),
    side: "service-ion",
    aft: ["fusion", null],
  }),
  start: { x: 460, y: 540, rotation: -Math.PI / 2 },
  opening: { burn: "course", view: "2x", tick: 40 },
};

type Brush = "track" | "tip" | "flash" | "liveFlash" | "residue";
// The drone burst's colours. `tip` and `liveFlash` are pale because LFX
// hard-light shows a pale source as the green ink over the void.
const profile: Record<Brush, readonly (readonly [number, string])[]> = {
  track: [
    [0, "#1e963000"],
    [0.32, "#60e04873"],
    [0.5, "#60e048"],
    [0.68, "#60e04873"],
    [1, "#1e963000"],
  ],
  tip: [
    [0, "#e4ffdf"],
    [0.55, "#e4ffdf"],
    [1, "#e4ffdf00"],
  ],
  flash: [
    [0, "#ffffff"],
    [0.18, "#ffffffe6"],
    [0.4, "#c8ffbe8c"],
    [0.62, "#60e0483d"],
    [1, "#60e04800"],
  ],
  liveFlash: [
    [0, "#ffffff"],
    [0.18, "#ffffffe6"],
    [0.4, "#e4ffdf8c"],
    [0.62, "#b0f0a43d"],
    [1, "#b0f0a400"],
  ],
  residue: [
    [0, "#60e048f2"],
    [0.25, "#60e048b3"],
    [0.65, "#1e963033"],
    [1, "#1e963000"],
  ],
};
const brushes = new Map<Brush, HTMLCanvasElement>();
/** Gradients run only here, once per brush. */
function brush(kind: Brush) {
  let image = brushes.get(kind);
  if (image) return image;
  image = document.createElement("canvas");
  image.width = kind === "track" ? 1 : 128;
  image.height = 128;
  const ctx = image.getContext("2d");
  if (!ctx) throw new Error("Fission burn light requires a 2D canvas");
  const ramp =
    kind === "track"
      ? ctx.createLinearGradient(0, 0, 0, 128)
      : ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [offset, color] of profile[kind]) ramp.addColorStop(offset, color);
  ctx.fillStyle = ramp;
  ctx.fillRect(0, 0, image.width, image.height);
  brushes.set(kind, image);
  return image;
}
function disc(
  ctx: CanvasRenderingContext2D,
  kind: Brush,
  x: number,
  y: number,
  radius: number,
) {
  ctx.drawImage(brush(kind), x - radius, y - radius, radius * 2, radius * 2);
}

/** World units. A Fighter is about 31 long and 13 wide in flight. */
const FLASH_RADIUS = 7;
const FLASH_TICKS = 2;
const TRACK_WIDTH = 3;
const PATH_WIDTH = 6;
const SPARKS = 6;
const SPARK_CONE = 0.55;
const RESIDUE_TICKS = 45;
/** How far behind the nozzle a push goes off. */
const BACK = 3;

/** Where and when one push began. It stays at that point in the world. */
interface Push {
  x: number;
  y: number;
  /** The direction the exhaust leaves in. */
  angle: number;
  tick: number;
}
/** One straight leg of a spark; positions come from flight time. */
interface Leg {
  x: number;
  y: number;
  vx: number;
  vy: number;
  start: number;
  end: number;
  birth: number;
  life: number;
}

export function burnLight(ideaInput: unknown): StudyLight {
  const idea = BurnIdeaSchema.parse(ideaInput);
  const pushes: Push[] = [];
  const legs: Leg[] = [];
  /** Each engine's output and nozzle a tick ago; absent when unknown. */
  const before = new Map<string, { output: number; x: number; y: number }>();
  let last = -1;

  function throwSparks(push: Push) {
    let state = (push.tick * 2654435761) >>> 0;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const birth = push.tick * STEP;
    for (let i = 0; i < SPARKS; i++) {
      const dir = push.angle + ((i + random()) / SPARKS - 0.5) * 2 * SPARK_CONE;
      const speed = 110 + 50 * random();
      const life = 0.3 + 0.25 * random();
      // The drone burst's fork: one parent, then a fast and a slow daughter.
      const forkAge = life * 0.32;
      const fork = birth + forkAge;
      const vx = Math.cos(dir) * speed;
      const vy = Math.sin(dir) * speed;
      legs.push({ ...push, vx, vy, birth, start: birth, end: fork, life });
      const turn = (0.22 + 0.2 * random()) * 0.8;
      for (const slow of [false, true]) {
        const heading = dir + (slow ? -turn : turn);
        const rate = speed * (slow ? 0.35 : 1.05);
        legs.push({
          x: push.x + vx * forkAge,
          y: push.y + vy * forkAge,
          vx: Math.cos(heading) * rate,
          vy: Math.sin(heading) * rate,
          birth,
          start: fork,
          end: fork + (life - forkAge) * (slow ? 0.7 : 1),
          life,
        });
      }
    }
  }

  function fx(
    ctx: CanvasRenderingContext2D,
    pass: FxPass,
    { engines, tick, time }: StudyLightState,
  ) {
    // A backward jump flies the burn again; a gap loses the tick before.
    if (tick < last) {
      pushes.length = 0;
      legs.length = 0;
    }
    if (tick !== last + 1 && tick !== last) before.clear();
    const repeat = tick === last;
    const previous = repeat ? time : (last + 1) * STEP - STEP;
    last = tick;
    ctx.save();
    for (const engine of engines) {
      if (engine.part !== "fusion") continue;
      const was = before.get(engine.key);
      const exhaust = engine.angle + Math.PI;
      if (!repeat && was && was.output === 0 && engine.output > 0) {
        const push = {
          x: engine.x + Math.cos(exhaust) * BACK,
          y: engine.y + Math.sin(exhaust) * BACK,
          angle: exhaust,
          tick,
        };
        pushes.push(push);
        if (pushes.length > 16) pushes.shift();
        if (idea === "Thrown matter") throwSparks(push);
      }
      // Burning path: the nozzle's travel through this tick, laid down whole.
      if (idea === "Burning path" && engine.output > 0 && !repeat) {
        const from = was && was.output > 0 ? was : engine;
        const dx = engine.x - from.x;
        const dy = engine.y - from.y;
        const length = Math.hypot(dx, dy) + PATH_WIDTH;
        if (
          pass.visible(engine.x, engine.y, length) &&
          pass.budget.take(true)
        ) {
          ctx.save();
          ctx.translate((engine.x + from.x) / 2, (engine.y + from.y) / 2);
          ctx.rotate(length > PATH_WIDTH ? Math.atan2(dy, dx) : exhaust);
          ctx.globalAlpha = Math.min(1, pass.opacity * 2.5 * engine.output);
          ctx.drawImage(
            brush("track"),
            -length / 2,
            -PATH_WIDTH / 2,
            length,
            PATH_WIDTH,
          );
          ctx.restore();
        }
      }
      if (!repeat)
        before.set(engine.key, {
          output: engine.output,
          x: engine.x,
          y: engine.y,
        });
    }
    if (idea !== "Burning path")
      for (const push of pushes) {
        const age = tick - push.tick;
        if (age < 0 || !pass.visible(push.x, push.y, 40)) continue;
        // The flash leaves its copy in the surface, as the drone's burst does.
        if (age < FLASH_TICKS && pass.budget.take(true)) {
          ctx.globalAlpha = pass.opacity;
          disc(ctx, "flash", push.x, push.y, FLASH_RADIUS * 1.8);
        }
        // Marked place: the point keeps feeding a cooling glow.
        if (
          idea === "Marked place" &&
          age < RESIDUE_TICKS &&
          pass.budget.take(true)
        ) {
          const t = age / RESIDUE_TICKS;
          ctx.globalAlpha = Math.min(1, 0.6 * pass.opacity * (1 - t) ** 2);
          disc(ctx, "residue", push.x, push.y, FLASH_RADIUS * (1.8 - 0.8 * t));
        }
      }
    // Thrown matter: each spark's travel since the tick before, in green.
    for (let i = legs.length - 1; i >= 0; i--) {
      const leg = legs[i];
      const start = Math.max(leg.start, previous);
      const end = Math.min(leg.end, time);
      if (end > start) {
        const elapsed = end - leg.start;
        const x = leg.x + leg.vx * elapsed;
        const y = leg.y + leg.vy * elapsed;
        const length = Math.hypot(leg.vx, leg.vy) * (end - start);
        if (pass.visible(x, y, length + 3) && pass.budget.take()) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.atan2(leg.vy, leg.vx));
          ctx.globalAlpha = Math.min(
            1,
            pass.opacity * 2.5 * (1 - (0.4 * (end - leg.birth)) / leg.life),
          );
          ctx.drawImage(
            brush("track"),
            -length,
            -TRACK_WIDTH / 2,
            length,
            TRACK_WIDTH,
          );
          ctx.restore();
        }
      }
      if (time >= leg.end) legs.splice(i, 1);
    }
    ctx.restore();
  }

  function lfx(
    ctx: CanvasRenderingContext2D,
    { engines, tick, time }: StudyLightState,
  ) {
    ctx.save();
    if (idea === "Burning path") {
      // A white-hot core at the nozzle for as long as the push lasts.
      for (const engine of engines) {
        if (engine.part !== "fusion" || !(engine.output > 0)) continue;
        ctx.save();
        ctx.translate(engine.x, engine.y);
        ctx.rotate(engine.angle + Math.PI);
        ctx.globalAlpha = Math.min(1, engine.output);
        ctx.drawImage(brush("liveFlash"), -4, -5, 18, 10);
        ctx.restore();
      }
    } else {
      for (const push of pushes) {
        const age = tick - push.tick;
        if (age < 0 || age >= FLASH_TICKS) continue;
        ctx.globalAlpha = 1;
        disc(ctx, "liveFlash", push.x, push.y, FLASH_RADIUS * (1 + 0.35 * age));
      }
    }
    for (const leg of legs) {
      if (time < leg.start || time >= leg.end) continue;
      const elapsed = time - leg.start;
      const phase = (time - leg.birth) / leg.life;
      ctx.globalAlpha = 1 - phase ** 2;
      disc(
        ctx,
        "tip",
        leg.x + leg.vx * elapsed,
        leg.y + leg.vy * elapsed,
        0.6 * (1 + 1.6 * (1 - phase)),
      );
    }
    ctx.restore();
  }

  return { label: `02.3 ${idea}`, replaces: ["fusion"], fx, lfx };
}
