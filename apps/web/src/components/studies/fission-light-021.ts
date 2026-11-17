import { defaultLoadout, STEP } from "@void-drift/mode-a";
import type { StudyLight } from "../../lib/flight-scene";

// Fission light 02.1: each push is a detonation behind the ship. The blast is
// stamped into the persistent FX surface at the point where it went off and
// stays there while the ship is thrown away from it: a flash, a shock ring
// that steps outward, and hard sparks. The wait between pushes paints nothing.

/** Cache resolution per world unit, as ion's stamp uses. */
const SCALE = 4;
/** The flash's diameter in world units at full thrust; a Wasp is about 32 long. */
const FLASH = 72;
/** Ticks a blast is painted for; the persistent surface holds it after that. */
const LIFE = 14;
/** Ticks the flash itself lasts. */
const FLASH_TICKS = 6;
/** How far behind the nozzle the blast goes off, in world units. */
const BACK = 12;
const SPARKS = 14;
const HOT = "244,255,214";
/** The yellow-green of the fission engine's body. */
const GREEN = "198,255,50";
const DEEP = "58,196,40";

/** A cheap repeatable scatter. */
const scatter = (a: number, b: number) =>
  ((Math.imul((a * 73856093) ^ (b * 19349663), 2654435761) >>> 0) % 1000) /
  1000;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

let flash: HTMLCanvasElement | undefined;
/** The gradient runs only here, once. */
function flashSprite() {
  if (flash) return flash;
  const size = FLASH * SCALE;
  flash = document.createElement("canvas");
  flash.width = flash.height = size;
  const ctx = flash.getContext("2d");
  if (!ctx) throw new Error("The fission flash needs Canvas 2D");
  const mid = size / 2;
  const light = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
  light.addColorStop(0, `rgba(${HOT},1)`);
  light.addColorStop(0.2, `rgba(${HOT},0.9)`);
  light.addColorStop(0.42, `rgba(${GREEN},0.6)`);
  light.addColorStop(0.72, `rgba(${DEEP},0.2)`);
  light.addColorStop(1, `rgba(${DEEP},0)`);
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, size, size);
  return flash;
}

interface Blast {
  x: number;
  y: number;
  /** The direction the exhaust leaves in. */
  angle: number;
  tick: number;
  size: number;
}

export function fissionLight021(): StudyLight {
  // Where each engine's latest push went off. A blast belongs to the world,
  // so it is remembered here and not recomputed from the ship.
  const blasts = new Map<string, Blast>();
  return {
    label: "02.1 Detonation left behind",
    replaces: ["fusion"],
    fx(ctx, pass, { engines, tick }) {
      for (const engine of engines) {
        if (engine.part !== "fusion") continue;
        // A pulsed engine's held time is its place in the cycle: a push
        // begins when it starts again from zero with output.
        if (engine.output > 0 && engine.held <= STEP * 1.5)
          blasts.set(engine.key, {
            x: engine.x - Math.cos(engine.angle) * BACK,
            y: engine.y - Math.sin(engine.angle) * BACK,
            angle: engine.angle + Math.PI,
            tick,
            size: Math.sqrt(Math.min(1, engine.output)),
          });
      }
      for (const blast of blasts.values()) {
        const age = tick - blast.tick;
        if (age < 0 || age > LIFE) continue;
        if (!pass.visible(blast.x, blast.y, 96) || !pass.budget.take(true))
          continue;
        const t = age / LIFE;
        ctx.save();
        ctx.translate(blast.x, blast.y);
        if (age < FLASH_TICKS) {
          const diameter = FLASH * blast.size * (1 - 0.15 * age);
          ctx.globalAlpha = pass.opacity * (1 - (age / FLASH_TICKS) ** 2);
          ctx.drawImage(
            flashSprite(),
            -diameter / 2,
            -diameter / 2,
            diameter,
            diameter,
          );
        }
        // The shock ring is stamped on every second tick, so the persistent
        // light keeps separate rings and not a smooth disc.
        if (age % 2 === 0) {
          ctx.globalAlpha = pass.opacity * (1 - t) ** 1.5;
          ctx.strokeStyle = `rgb(${age < FLASH_TICKS ? HOT : GREEN})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, (8 + 50 * easeOut(t)) * blast.size, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = pass.opacity * (1 - t);
        ctx.fillStyle = `rgb(${age < FLASH_TICKS + 2 ? HOT : GREEN})`;
        for (let i = 0; i < SPARKS; i++) {
          const angle = blast.angle + (scatter(blast.tick, i) - 0.5) * 2.6;
          const reach =
            (10 + 62 * scatter(blast.tick, i + 40)) * blast.size * easeOut(t);
          ctx.fillRect(
            Math.cos(angle) * reach,
            Math.sin(angle) * reach,
            1.5,
            1.5,
          );
        }
        ctx.restore();
      }
    },
  };
}

/** The game's rhythm, and the slower one the engine is expected to move to. */
export const FISSION_PERIOD_021 = { game: 0.45, opening: 0.9 } as const;

/** A Wasp with a Fission main engine, opening inside the first push. */
export const FISSION_SCENE_021 = {
  loadout: { ...defaultLoadout("wasp"), side: "fusion" },
  start: { x: 460, y: 540, rotation: -Math.PI / 2 },
  opening: { burn: "course", view: "follow", tick: 8 },
};
