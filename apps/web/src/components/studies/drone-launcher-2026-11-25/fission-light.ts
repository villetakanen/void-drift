import type { FxPass } from "@void-drift/core";
import { z } from "astro/zod";

// Drone launcher 02.7: fission light, painted from what it has to say.
//
//   Nothing, then everything: a flash with no gathering.
//   A local flash frame: everything within reach is caught in that light.
//   Matter answers: what faced the flash keeps showing it.
//   The remains leave: a thin shell, the only part that travels.
//   The place stays wrong for as long as the surface holds it.
//
// The marks are the game's own kinds: soft cached stamps as plasma and ion use,
// a glow on a solid's facing side as atmospheric heat uses, a coloured band
// with a narrow bright core as the impact plume uses, and hard sparks whose
// trails are the surface's memory. Values are study data, not production tuning.

export const InkSchema = z.enum(["Body accent", "Greener"]);
export type Ink = z.infer<typeof InkSchema>;

export const FissionLightSchema = z
  .object({
    version: z.literal(1),
    ink: InkSchema,
    flash: z
      .object({
        /** Radius of the source's light, in world units. */
        size: z.number().min(4).max(40),
        ticks: z.number().int().min(1).max(6),
        strength: z.number().min(0).max(1.5),
      })
      .strict(),
    reach: z
      .object({
        /** Inside this distance a solid takes the flash at full strength. */
        fatal: z.number().min(10).max(120),
        /** Beyond this distance nothing is caught. */
        limit: z.number().min(60).max(400),
      })
      .strict(),
    /** The flash frame over the space within reach, apart from the solids. */
    frame: z.object({ strength: z.number().min(0).max(1) }).strict(),
    answer: z
      .object({
        strength: z.number().min(0).max(1.5),
        /** Ticks a lit face keeps glowing after the flash. */
        ticks: z.number().int().min(4).max(90),
        /** Sparks a fully lit solid throws back toward the source. */
        spall: z.number().int().min(0).max(24),
      })
      .strict(),
    shell: z
      .object({
        /** Ticks the shell takes from the source to the reach limit. */
        ticks: z.number().int().min(10).max(120),
        strength: z.number().min(0).max(2),
        /** Sparks that leave with the shell. */
        fragments: z.number().int().min(0).max(64),
        /** Whether a spark divides once into a faster and a slower one. */
        split: z.boolean(),
      })
      .strict(),
    residue: z
      .object({
        /** Ticks the source keeps feeding light into the surface. */
        ticks: z.number().int().min(0).max(180),
        strength: z.number().min(0).max(2),
      })
      .strict(),
  })
  .strict();
export type FissionLight = z.infer<typeof FissionLightSchema>;

export const DEFAULT_LIGHT = FissionLightSchema.parse({
  version: 1,
  ink: "Greener",
  flash: { size: 14, ticks: 2, strength: 1 },
  reach: { fatal: 40, limit: 180 },
  frame: { strength: 0.3 },
  answer: { strength: 1, ticks: 26, spall: 8 },
  shell: { ticks: 44, strength: 1, fragments: 12, split: true },
  residue: { ticks: 40, strength: 0.6 },
});

export interface Charge {
  x: number;
  y: number;
  /** Simulation tick it went off on. */
  tick: number;
  seed: number;
}
/** Something the light can fall on, as the painters need it. */
export interface Solid {
  name: string;
  x: number;
  y: number;
  radius: number;
}

/**
 * Share of the flash a solid at `distance` takes: full inside the fatal
 * radius, thinning with the square of distance, nothing beyond the limit.
 */
export function dose(light: FissionLight, distance: number) {
  const { fatal, limit } = light.reach;
  if (!(distance < limit)) return 0;
  const thinning = Math.min(1, (fatal / Math.max(distance, 1e-6)) ** 2);
  // The last tenth of the reach fades out, so the limit is not a visible step.
  return thinning * Math.min(1, (limit - distance) / (limit * 0.1));
}

/** The shell's radius `age` ticks after the flash; null once it has left. */
export function shellRadius(light: FissionLight, age: number) {
  if (age < 0 || age > light.shell.ticks) return null;
  const start = Math.min(light.flash.size, light.reach.limit);
  return start + (light.reach.limit - start) * (age / light.shell.ticks);
}

/** The first tick, counted from the flash, on which the shell has reached `distance`. */
export function shellArrival(light: FissionLight, distance: number) {
  const start = Math.min(light.flash.size, light.reach.limit);
  if (distance <= start) return 0;
  if (distance > light.reach.limit) return null;
  return Math.ceil(
    ((distance - start) / (light.reach.limit - start)) * light.shell.ticks,
  );
}

/** The last tick, counted from the flash, on which the charge paints anything. */
export function chargeLife(light: FissionLight) {
  return Math.max(
    light.flash.ticks + light.answer.ticks,
    light.shell.ticks + HIT_TICKS,
    light.residue.ticks,
  );
}

/** Ticks a solid shows the shell's arrival. */
const HIT_TICKS = 4;
const SPARK_SIZE = 1.5;

interface Spark {
  x: number;
  y: number;
  /** Where it was a tick ago, so its travel is stamped whole. */
  px: number;
  py: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  splits: boolean;
}

function random(seed: number) {
  let a = (seed * 2654435761 + 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Bounded hard sparks in the form the game's impacts use: small squares that
 * move, with their trails left to the light surface. A spark may divide once.
 */
export class FissionSparks {
  static readonly CAPACITY = 256;
  private readonly sparks: Spark[] = [];
  private next = random(1);
  get count() {
    return this.sparks.length;
  }
  seed(value: number) {
    this.next = random(value);
  }
  private add(spark: Spark) {
    if (this.sparks.length < FissionSparks.CAPACITY) this.sparks.push(spark);
  }
  /** `count` sparks from a point, within `spread` radians of `angle`. */
  emit(
    x: number,
    y: number,
    angle: number,
    spread: number,
    count: number,
    speed: readonly [number, number],
    life: readonly [number, number],
    splits: boolean,
  ) {
    for (let i = 0; i < count; i++) {
      // Even spacing with a little scatter, so a ring of sparks has no clumps.
      const along =
        count > 1
          ? (i + 0.5) / count - 0.5 + (this.next() - 0.5) / count
          : this.next() - 0.5;
      const direction = angle + along * spread * 2;
      const velocity = speed[0] + (speed[1] - speed[0]) * this.next();
      this.add({
        x,
        y,
        px: x,
        py: y,
        vx: Math.cos(direction) * velocity,
        vy: Math.sin(direction) * velocity,
        age: 0,
        life: life[0] + (life[1] - life[0]) * this.next(),
        splits,
      });
    }
  }
  step(dt: number) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const spark = this.sparks[i];
      spark.age += dt;
      if (spark.age >= spark.life) {
        this.sparks.splice(i, 1);
        continue;
      }
      spark.px = spark.x;
      spark.py = spark.y;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      if (!spark.splits || spark.age < spark.life * 0.45) continue;
      // One becomes a faster and a slower spark on diverging courses.
      spark.splits = false;
      const turn = 0.22 + 0.2 * this.next();
      const cos = Math.cos(turn),
        sin = Math.sin(turn);
      const { vx, vy } = spark;
      spark.vx = (vx * cos - vy * sin) * 1.05;
      spark.vy = (vx * sin + vy * cos) * 1.05;
      this.add({
        ...spark,
        vx: (vx * cos + vy * sin) * 0.6,
        vy: (-vx * sin + vy * cos) * 0.6,
        life: spark.age + (spark.life - spark.age) * 0.7,
      });
    }
  }
  /**
   * Fresh emission for one tick: the path each spark travelled, so a fast
   * spark leaves a streak and not a row of dots. Each spark counts against
   * the scene's decoration.
   */
  stamp(ctx: CanvasRenderingContext2D, pass: FxPass, colour: string) {
    ctx.beginPath();
    let any = false;
    for (const spark of this.sparks) {
      if (!pass.visible(spark.x, spark.y, 8) || !pass.budget.take()) continue;
      ctx.moveTo(spark.px, spark.py);
      ctx.lineTo(spark.x, spark.y);
      any = true;
    }
    if (!any) return;
    ctx.globalAlpha = Math.min(1, pass.opacity * 2.5);
    ctx.strokeStyle = colour;
    ctx.lineWidth = SPARK_SIZE;
    // Butt ends: consecutive ticks meet without doubling the light at the joint.
    ctx.lineCap = "butt";
    ctx.stroke();
  }
}

type Rgb = readonly [number, number, number];
const INKS: Record<Ink, { hot: Rgb; mid: Rgb; deep: Rgb }> = {
  // Fission light 02.1's working values: the engine body's yellow-green.
  "Body accent": {
    hot: [244, 255, 214],
    mid: [198, 255, 50],
    deep: [58, 196, 40],
  },
  // Authored greener so stacked FX light goes pale before it reaches lime.
  Greener: { hot: [200, 255, 190], mid: [96, 224, 72], deep: [30, 150, 48] },
};
const WHITE: Rgb = [255, 255, 255];
/** Hard-light shows a source channel s as 2s − 1 over the void, so live light
 * is painted pale: it displays as the ink and never darkens a hull. */
const pale = (c: Rgb): Rgb => [
  Math.round((c[0] + 255) / 2),
  Math.round((c[1] + 255) / 2),
  Math.round((c[2] + 255) / 2),
];
const css = (c: Rgb, alpha = 1) => `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;

type StampKind = "flash" | "glow" | "frame";
const STAMP_SIZE = 192;
const stamps = new Map<string, HTMLCanvasElement>();
/** Gradients run only here, once per kind, ink and layer. */
function stamp(kind: StampKind, ink: Ink, liveLight: boolean) {
  const key = `${kind}:${ink}:${liveLight}`;
  const cached = stamps.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = STAMP_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Fission light needs Canvas 2D");
  const half = STAMP_SIZE / 2;
  const tone = (c: Rgb) => (liveLight ? pale(c) : c);
  const { hot, mid, deep } = INKS[ink];
  const light = ctx.createRadialGradient(half, half, 0, half, half, half);
  if (kind === "flash") {
    // A point too bright to have a shape: white well past its centre.
    light.addColorStop(0, css(WHITE, 1));
    light.addColorStop(0.18, css(WHITE, 0.9));
    light.addColorStop(0.4, css(tone(hot), 0.55));
    light.addColorStop(0.7, css(tone(mid), 0.18));
    light.addColorStop(1, css(tone(mid), 0));
  } else if (kind === "glow") {
    light.addColorStop(0, css(tone(hot), 0.95));
    light.addColorStop(0.25, css(tone(mid), 0.7));
    light.addColorStop(0.65, css(tone(deep), 0.2));
    light.addColorStop(1, css(tone(deep), 0));
  } else {
    // The flash frame: even light across the reach, with a short soft edge.
    light.addColorStop(0, css(tone(hot), 1));
    light.addColorStop(0.55, css(tone(hot), 0.8));
    light.addColorStop(0.9, css(tone(mid), 0.35));
    light.addColorStop(1, css(tone(mid), 0));
  }
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, STAMP_SIZE, STAMP_SIZE);
  stamps.set(key, canvas);
  return canvas;
}

function disc(
  ctx: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  x: number,
  y: number,
  radius: number,
) {
  ctx.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
}

/** A glow on the side of a solid that faces the charge, as heat glow sits. */
function faceGlow(
  ctx: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  solid: Solid,
  charge: Charge,
  scale = 1,
) {
  const r = solid.radius * scale;
  ctx.save();
  ctx.translate(solid.x, solid.y);
  ctx.rotate(Math.atan2(charge.y - solid.y, charge.x - solid.x));
  ctx.drawImage(image, -r * 0.55, -r * 1.3, r * 1.9, r * 2.6);
  ctx.restore();
}

const distanceTo = (solid: Solid, charge: Charge) =>
  Math.hypot(solid.x - charge.x, solid.y - charge.y);
/** How brightly a lit face still answers `after` ticks past the flash. */
const cooling = (light: FissionLight, after: number) =>
  after < 0 ? 1 : Math.max(0, 1 - after / light.answer.ticks) ** 1.5;
const shellStroke = (
  ctx: CanvasRenderingContext2D,
  charge: Charge,
  radius: number,
) => {
  ctx.beginPath();
  ctx.arc(charge.x, charge.y, radius, 0, Math.PI * 2);
  ctx.stroke();
};

/** One tick of fresh emission into the persistent surface, in world units. */
export function stampCharge(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  charge: Charge,
  solids: readonly Solid[],
  light: FissionLight,
  tick: number,
) {
  const age = tick - charge.tick;
  if (age < 0 || age > chargeLife(light)) return;
  if (
    !pass.visible(charge.x, charge.y, light.reach.limit + 40) ||
    !pass.budget.take(true)
  )
    return;
  const ink = INKS[light.ink];
  const { flash, shell, residue, answer } = light;
  ctx.save();
  // The flash leaves its copy in the surface, as the rifle's eruption does.
  if (age < flash.ticks) {
    ctx.globalAlpha = Math.min(1, flash.strength * pass.opacity * 3);
    disc(
      ctx,
      stamp("flash", light.ink, false),
      charge.x,
      charge.y,
      flash.size * 1.8,
    );
  }
  // The place stays wrong: the source keeps feeding a cooling glow.
  if (age < residue.ticks && residue.strength > 0) {
    const t = age / residue.ticks;
    ctx.globalAlpha = Math.min(
      1,
      residue.strength * pass.opacity * (1 - t) ** 2,
    );
    disc(
      ctx,
      stamp("glow", light.ink, false),
      charge.x,
      charge.y,
      flash.size * (1.8 - 0.8 * t),
    );
  }
  // What faced the flash keeps glowing where it stands.
  for (const solid of solids) {
    const share = dose(light, distanceTo(solid, charge));
    const level = share * answer.strength * cooling(light, age - flash.ticks);
    if (!(level > 0.01)) continue;
    ctx.globalAlpha = Math.min(1, level * pass.opacity * 1.2);
    faceGlow(ctx, stamp("glow", light.ink, false), solid, charge);
  }
  // The shell's coloured band and its fading wake. Its narrow bright core is
  // live light, so the two together are drawn as the impact plume is.
  const radius = shellRadius(light, age);
  if (radius !== null && shell.strength > 0) {
    const t = age / shell.ticks;
    const travel = (light.reach.limit - flash.size) / shell.ticks;
    const thinning = Math.sqrt(flash.size / Math.max(radius, flash.size));
    ctx.globalAlpha = Math.min(
      1,
      shell.strength * thinning * (1 - 0.5 * t) * pass.opacity,
    );
    ctx.strokeStyle = css(t < 0.5 ? ink.mid : ink.deep);
    // The band covers the distance travelled this tick, so the wake is whole.
    ctx.lineWidth = Math.max(3, travel);
    shellStroke(ctx, charge, radius - ctx.lineWidth / 2);
  }
  ctx.restore();
}

/** The live light for the frame shown, redrawn from current state. */
export function drawCharge(
  ctx: CanvasRenderingContext2D,
  charge: Charge,
  solids: readonly Solid[],
  light: FissionLight,
  tick: number,
) {
  const age = tick - charge.tick;
  if (age < 0 || age > chargeLife(light)) return;
  const { flash, frame, answer, shell } = light;
  ctx.save();
  // The local flash frame: one hard tick, one softer, then gone.
  if (age < 2 && frame.strength > 0) {
    ctx.globalAlpha = frame.strength * (age === 0 ? 1 : 0.4);
    disc(
      ctx,
      stamp("frame", light.ink, true),
      charge.x,
      charge.y,
      light.reach.limit,
    );
  }
  for (const solid of solids) {
    const distance = distanceTo(solid, charge);
    const share = dose(light, distance);
    if (share > 0.01) {
      if (age < flash.ticks) {
        // Caught in the flash: the facing side goes to white.
        ctx.globalAlpha = Math.min(1, share * 1.8 * flash.strength);
        faceGlow(ctx, stamp("flash", light.ink, true), solid, charge, 1.15);
      } else {
        const level =
          share * answer.strength * cooling(light, age - flash.ticks);
        if (level > 0.01) {
          ctx.globalAlpha = Math.min(1, level);
          faceGlow(ctx, stamp("glow", light.ink, true), solid, charge);
        }
      }
    }
    // The shell's arrival: a short second answer on the same face.
    const arrival = shellArrival(light, distance);
    if (arrival === null || age < arrival || age >= arrival + HIT_TICKS)
      continue;
    const blow =
      shell.strength *
      Math.min(1, (light.reach.fatal / Math.max(distance, 1)) ** 2);
    ctx.globalAlpha = Math.min(1, blow * (1 - (age - arrival) / HIT_TICKS));
    faceGlow(ctx, stamp("flash", light.ink, true), solid, charge, 0.7);
  }
  if (age < flash.ticks) {
    ctx.globalAlpha = Math.min(1, flash.strength);
    disc(
      ctx,
      stamp("flash", light.ink, true),
      charge.x,
      charge.y,
      flash.size * (1 + 0.35 * age),
    );
  }
  // A thin live front on the shell, so its edge stays crisp while it travels.
  const radius = shellRadius(light, age);
  if (radius !== null && shell.strength > 0) {
    const t = age / shell.ticks;
    const thinning = Math.sqrt(flash.size / Math.max(radius, flash.size));
    ctx.globalAlpha = Math.min(1, shell.strength * thinning * 1.6 * (1 - t));
    ctx.strokeStyle = css(pale(INKS[light.ink].hot));
    ctx.lineWidth = 1.5;
    shellStroke(ctx, charge, radius);
  }
  ctx.restore();
}

/** The colour the family's sparks are stamped in. */
export const sparkColour = (ink: Ink) => css(INKS[ink].hot);

/** Sparks that leave with the shell and those a lit solid throws back. */
export function emitFlashSparks(
  sparks: FissionSparks,
  charge: Charge,
  solids: readonly Solid[],
  light: FissionLight,
) {
  const { shell, answer, flash, reach } = light;
  sparks.seed(charge.seed);
  const speed = ((reach.limit - flash.size) / shell.ticks) * 60;
  const seconds = shell.ticks / 60;
  sparks.emit(
    charge.x,
    charge.y,
    0,
    Math.PI,
    shell.fragments,
    [speed * 0.8, speed * 1.02],
    [seconds * 0.45, seconds * 0.95],
    shell.split,
  );
  for (const solid of solids) {
    const distance = distanceTo(solid, charge);
    const count = Math.round(answer.spall * dose(light, distance));
    if (!count) continue;
    const toward = Math.atan2(charge.y - solid.y, charge.x - solid.x);
    sparks.emit(
      solid.x + Math.cos(toward) * solid.radius * 0.6,
      solid.y + Math.sin(toward) * solid.radius * 0.6,
      toward,
      0.9,
      count,
      [30, 110],
      [0.25, 0.55],
      shell.split,
    );
  }
}

/** Sparks knocked off a solid as the shell passes it. */
export function emitShellSparks(
  sparks: FissionSparks,
  charge: Charge,
  solid: Solid,
  light: FissionLight,
) {
  const distance = distanceTo(solid, charge);
  const blow =
    light.shell.strength *
    Math.min(1, (light.reach.fatal / Math.max(distance, 1)) ** 2);
  const count = Math.round(8 * Math.min(1, blow));
  if (!count) return;
  const away = Math.atan2(solid.y - charge.y, solid.x - charge.x);
  sparks.emit(
    solid.x - Math.cos(away) * solid.radius * 0.5,
    solid.y - Math.sin(away) * solid.radius * 0.5,
    away,
    1.2,
    count,
    [50, 150],
    [0.2, 0.45],
    false,
  );
}
