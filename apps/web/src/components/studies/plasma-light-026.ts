import { defaultLoadout } from "@void-drift/mode-a";
import type { EngineLight, StudyLight } from "../../lib/flight-scene";

// Plasma light 02.6: the model of 02.5 with another stamp. The ball is still a
// few cached frames stamped into the persistent FX surface each tick, but each
// frame is smooth luminous light, built as ion's stamp is: gradients drawn once
// into a cache, a white-hot core, an amber body and a transparent edge. Several
// lobes drift between frames, so the ball churns without a hard pixel. The
// charge is a smooth bead that tightens and whitens, live at the nozzle.
// Working values for a first look, not tuned ones.

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
) {
  const radius = 8 - 4 * engine.charge;
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

export const PLASMA_LIGHT_026: StudyLight = {
  label: "02.6 Luminous ball",
  replaces: ["plasma"],
  lfx(ctx, { engines }) {
    for (const engine of engines) {
      if (!held(engine) || engine.charge >= 1) continue;
      ctx.save();
      ctx.translate(engine.x, engine.y);
      ctx.rotate(engine.angle);
      bead(ctx, engine, 1);
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
        const size =
          DIAMETER *
          Math.sqrt(Math.min(1, engine.output)) *
          (1 + 1.2 * flare(engine));
        ball(ctx, tick, size, size * 0.5, pass.opacity);
        sparks(ctx, tick, size, pass.opacity);
      } else bead(ctx, engine, 0.2 * pass.opacity);
      ctx.restore();
    }
  },
};

/**
 * The charge this example was made and described with. The game's plasma has
 * since changed to the value accepted in 02.7; this scene keeps its own.
 */
export const PLASMA_TUNING_026 = { plasma: { chargeSeconds: 0.6 } };

/** A Wasp with a Plasma main engine, opening just after the first release. */
export const PLASMA_SCENE_026 = {
  loadout: { ...defaultLoadout("wasp"), side: "plasma" },
  start: { x: 460, y: 540, rotation: -Math.PI / 2 },
  opening: { burn: "course", view: "follow", tick: 45 },
};
