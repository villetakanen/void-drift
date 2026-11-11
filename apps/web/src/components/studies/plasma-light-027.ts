import { defaultLoadout } from "@void-drift/mode-a";
import type { EngineLight, StudyLight } from "../../lib/flight-scene";

// Plasma light 02.7: the luminous ball of 02.6 with its charge made adjustable.
// The stamp, the sparks and the release are 02.6's. The bead that shows the
// charge takes a size and an intensity, and the release is timed from the
// flight's own charge length, so the delay can be changed too.

const FRAMES = 8;
/** Cache resolution per world unit, as ion's stamp uses. */
const SCALE = 4;
/** The ball's diameter in world units at full thrust; a Wasp is about 32 long. */
const DIAMETER = 26;
/** Seconds the release takes to settle into steady thrust. */
const FLARE = 0.22;
const HOT = "255,244,214";
const AMBER = "255,181,46";
const EMBER = "255,112,30";

let frames: HTMLCanvasElement[] | undefined;
/** A cheap repeatable scatter. */
const scatter = (a: number, b: number) =>
  ((Math.imul((a * 73856093) ^ (b * 19349663), 2654435761) >>> 0) % 1000) /
  1000;

function lobe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  heat: number,
) {
  const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
  light.addColorStop(0, `rgba(${HOT},${0.85 * heat})`);
  light.addColorStop(0.3, `rgba(${AMBER},${0.6 * heat})`);
  light.addColorStop(0.65, `rgba(${EMBER},${0.22 * heat})`);
  light.addColorStop(1, `rgba(${EMBER},0)`);
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** Gradients run only here, once per frame of the cache. */
function sprites() {
  if (frames) return frames;
  const size = DIAMETER * SCALE;
  frames = Array.from({ length: FRAMES }, (_, f) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("The plasma stamp needs Canvas 2D");
    const t = (f / FRAMES) * Math.PI * 2;
    const mid = size / 2;
    ctx.globalCompositeOperation = "lighter";
    // Five lobes drift round the centre at their own rates: a lumpy, restless ball.
    for (let i = 0; i < 5; i++) {
      const angle = t * (i % 2 ? -1 : 1) + i * 1.9 + scatter(i, 7) * 2;
      const reach =
        size * (0.14 + 0.14 * scatter(i, 3)) * (1 + 0.3 * Math.sin(t * 2 + i));
      const radius = size * (0.16 + 0.08 * scatter(i, 5));
      lobe(
        ctx,
        mid + Math.cos(angle) * reach,
        mid + Math.sin(angle) * reach,
        radius,
        0.8,
      );
    }
    lobe(ctx, mid, mid, size * 0.22, 1);
    return canvas;
  });
  return frames;
}

/** One frame of the ball, stretched along the exhaust, `back` units behind the nozzle. */
function ball(
  ctx: CanvasRenderingContext2D,
  tick: number,
  diameter: number,
  back: number,
  strength: number,
) {
  if (!(diameter > 0)) return;
  ctx.save();
  ctx.translate(-back, 0);
  ctx.scale(1.3, 1);
  // A frame and its angle hold for three ticks, so the lumps are seen before
  // the persistent light averages them away.
  const beat = Math.floor(tick / 3);
  ctx.rotate(scatter(beat, 11) * Math.PI * 2);
  ctx.globalAlpha = strength;
  ctx.drawImage(
    sprites()[beat % FRAMES],
    -diameter / 2,
    -diameter / 2,
    diameter,
    diameter,
  );
  ctx.restore();
}
/** Two hard sparks a tick, flung from the ball: the game's own spark size. */
function sparks(
  ctx: CanvasRenderingContext2D,
  tick: number,
  diameter: number,
  strength: number,
) {
  ctx.fillStyle = `rgb(${HOT})`;
  ctx.globalAlpha = strength;
  for (let i = 0; i < 2; i++) {
    const angle = Math.PI + (scatter(tick, i) - 0.5) * 2.2;
    const reach = diameter * (0.5 + 0.7 * scatter(tick, i + 20));
    ctx.fillRect(
      -diameter * 0.45 + Math.cos(angle) * reach,
      Math.sin(angle) * reach,
      1.5,
      1.5,
    );
  }
}
/** The charge: a smooth bead that tightens and whitens as the charge fills. */
function bead(
  ctx: CanvasRenderingContext2D,
  engine: EngineLight,
  strength: number,
  size: number,
) {
  const radius = (8 - 4 * engine.charge) * size;
  const light = ctx.createRadialGradient(-1, 0, 0, -1, 0, radius);
  light.addColorStop(0, `rgba(${HOT},${0.35 + 0.65 * engine.charge})`);
  light.addColorStop(0.25 + 0.2 * engine.charge, `rgba(${AMBER},0.55)`);
  light.addColorStop(1, `rgba(${EMBER},0)`);
  ctx.globalAlpha = strength;
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(-1, 0, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** 1 at the instant of release, 0 once the flare has settled. */
const flare = (engine: EngineLight) =>
  Math.max(0, 1 - (engine.held - engine.chargeSeconds) / FLARE);
const held = (engine: EngineLight) =>
  engine.part === "plasma" && engine.held > 0;

/** What the charge indicator can be set to. */
export interface ChargeIndicator {
  /** Scale of the bead; 1 is 02.6's. */
  size: number;
  /** Strength of the bead's light, live and as residue; 1 is 02.6's. */
  intensity: number;
}

export function plasmaLight027({
  size,
  intensity,
}: ChargeIndicator): StudyLight {
  return {
    label: "02.7 Adjustable charge",
    replaces: ["plasma"],
    lfx(ctx, { engines }) {
      for (const engine of engines) {
        if (!held(engine) || engine.charge >= 1) continue;
        ctx.save();
        ctx.translate(engine.x, engine.y);
        ctx.rotate(engine.angle);
        bead(ctx, engine, Math.min(1, intensity), size);
        ctx.restore();
      }
    },
    fx(ctx, pass, { engines, tick }) {
      for (const engine of engines) {
        if (!held(engine)) continue;
        const thrust = engine.charge >= 1;
        if (thrust && !(engine.output > 0)) continue;
        if (!pass.visible(engine.x, engine.y, 96) || !pass.budget.take(true))
          continue;
        ctx.save();
        ctx.translate(engine.x, engine.y);
        ctx.rotate(engine.angle);
        if (thrust) {
          const diameter =
            DIAMETER *
            Math.sqrt(Math.min(1, engine.output)) *
            (1 + 1.2 * flare(engine));
          ball(ctx, tick, diameter, diameter * 0.5, pass.opacity);
          sparks(ctx, tick, diameter, pass.opacity);
        } else
          bead(ctx, engine, Math.min(1, 0.2 * intensity) * pass.opacity, size);
        ctx.restore();
      }
    },
  };
}

/** The values accepted on 11 November 2026: the scene opens with them. */
export const PLASMA_ACCEPTED_027 = {
  chargeSeconds: 0.2,
  size: 4,
  intensity: 2,
} as const;

/** A Wasp with a Plasma main engine, opening at the first press. */
export const PLASMA_SCENE_027 = {
  loadout: { ...defaultLoadout("wasp"), side: "plasma" },
  start: { x: 460, y: 540, rotation: -Math.PI / 2 },
  opening: { burn: "course", view: "follow", tick: 6 },
};
