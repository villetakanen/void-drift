import type { FxPass } from "@void-drift/core";
import { z } from "astro/zod";

// Fission engine 02.4 and 02.5: the channel blast selected in 02.3, with each
// of its three parts adjustable. The charge goes off in the engine's reaction
// channel. The flash is the drone detonation's, and can be thrown aft as a
// cone. Particles leave through the nozzle and split once. The lance is the
// plume down the exhaust's line. Colours and the track brush are copied from
// the game's drone light (packages/mode-a/src/lib/drone-fx.ts). This file
// paints explosions it is told about; the flight rule that sets them off is in
// kick-flight.ts. Values are study data, not production tuning.

/** What is painted: everything, or one part alone. */
export const ShowSchema = z.enum(["Everything", "Flash", "Particles", "Lance"]);
export type Show = z.infer<typeof ShowSchema>;

export const FlashShapeSchema = z.enum(["Round", "Cone"]);

export const BlastSchema = z
  .object({
    version: z.literal(1),
    flash: z
      .object({
        /** Round lights all sides; Cone is thrown aft by a conical chamber. */
        shape: FlashShapeSchema,
        /** The cone's full opening, in degrees. */
        cone: z.number().min(20).max(180),
        /** Radius of the white core, in world units. */
        core: z.number().min(4).max(40),
        /** How far the pale light over space reaches, in world units. */
        reach: z.number().min(60).max(300),
        /** Strength of that pale light on its first tick. */
        light: z.number().min(0).max(1),
        ticks: z.number().int().min(1).max(6),
      })
      .strict(),
    particles: z
      .object({
        count: z.number().int().min(0).max(24),
        /** Degrees either side of the exhaust's line that particles leave in. */
        angle: z.number().min(0).max(60),
        /** World units a second, before the split. */
        speed: z.number().min(100).max(600),
        /** World units travelled before the split. */
        before: z.number().min(5).max(200),
        /** Degrees between the two branches. */
        split: z.number().min(10).max(60),
        /** World units the longer branch travels; 0 leaves one track. */
        after: z.number().min(0).max(300),
      })
      .strict(),
    lance: z
      .object({
        /** Full length and width in world units, to the edge of the glow. */
        length: z.number().min(40).max(400),
        width: z.number().min(4).max(60),
        /** Where the lance is widest and hottest, as a share of its length. */
        widest: z.number().min(0).max(90),
        /** How the lance closes at the nozzle: low is blunt, high is pointed. */
        start: z.number().min(0.15).max(2),
        /** How the lance closes at its far end: low is full, high is thin. */
        tail: z.number().min(0.5).max(3),
        /** Ticks the white lance lasts on LFX. */
        ticks: z.number().int().min(2).max(20),
        /** Ticks the lance feeds green into the FX surface; 0 feeds none. */
        green: z.number().int().min(0).max(30),
      })
      .strict(),
  })
  .strict();
export type Blast = z.infer<typeof BlastSchema>;

/** The channel blast as 02.3 showed it. */
export const DEFAULT_BLAST: Blast = BlastSchema.parse({
  version: 1,
  flash: {
    shape: "Round",
    cone: 90,
    core: 14,
    reach: 180,
    light: 0.3,
    ticks: 2,
  },
  particles: {
    count: 7,
    angle: 9,
    speed: 340,
    before: 50,
    split: 30,
    after: 115,
  },
  lance: {
    length: 180,
    width: 20,
    widest: 16,
    start: 0.5,
    tail: 0.5,
    ticks: 7,
    green: 10,
  },
});

/** The working assumption from 02.4, 26 November 2026. */
export const ASSUMED_BLAST: Blast = BlastSchema.parse({
  version: 1,
  flash: {
    shape: "Cone",
    cone: 110,
    core: 26,
    reach: 180,
    light: 0.2,
    ticks: 3,
  },
  particles: {
    count: 7,
    angle: 16,
    speed: 340,
    before: 50,
    split: 11,
    after: 115,
  },
  lance: {
    length: 190,
    width: 16,
    widest: 16,
    start: 0.7,
    tail: 2.7,
    ticks: 7,
    green: 7,
  },
});

const TRACK_WIDTH = 4.5;

type Stops = readonly (readonly [number, string])[];
type Ramp = "track" | "tip" | "flash" | "liveFlash" | "frame" | "green";
// Pale sources on LFX: hard-light shows them as the green ink over the void.
const stops: Record<Ramp, Stops> = {
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
  frame: [
    [0, "#e4ffdf"],
    [0.55, "#e4ffdfcc"],
    [0.9, "#b0f0a459"],
    [1, "#b0f0a400"],
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
  green: [
    [0, "#60e048f2"],
    [0.25, "#60e048b3"],
    [0.65, "#1e963033"],
    [1, "#1e963000"],
  ],
};

// Brushes are prepared here, once per shape, and never during a frame's
// drawing. A changed setting prepares a new brush before the burn is reflown.
const brushes = new Map<string, HTMLCanvasElement>();
function prepared(
  key: string,
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
) {
  let image = brushes.get(key);
  if (image) return image;
  if (brushes.size > 64) brushes.clear();
  image = document.createElement("canvas");
  image.width = width;
  image.height = height;
  const ctx = image.getContext("2d");
  if (!ctx) throw new Error("Channel blast light requires a 2D canvas");
  paint(ctx);
  brushes.set(key, image);
  return image;
}
/** A soft round stamp, or the track's cross-section. */
function brush(kind: Ramp) {
  return prepared(kind, kind === "track" ? 1 : 128, 128, (ctx) => {
    const ramp =
      kind === "track"
        ? ctx.createLinearGradient(0, 0, 0, 128)
        : ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [offset, color] of stops[kind]) ramp.addColorStop(offset, color);
    ctx.fillStyle = ramp;
    ctx.fillRect(0, 0, ctx.canvas.width, 128);
  });
}
/** A round stamp kept only inside a cone about +x, with soft sides. */
function coned(kind: Ramp, degrees: number) {
  return prepared(`${kind}:cone:${degrees}`, 128, 128, (ctx) => {
    ctx.drawImage(brush(kind), 0, 0);
    const half = (degrees * Math.PI) / 360;
    const feather = Math.min(half * 0.5, Math.max(0.06, half * 0.25));
    const at = (radians: number) => 0.5 + radians / (Math.PI * 2);
    // Offset 0.5 of a conic gradient that starts at -π points along +x.
    const mask = ctx.createConicGradient(-Math.PI, 64, 64);
    mask.addColorStop(0, "#0000");
    mask.addColorStop(at(-half - feather), "#0000");
    mask.addColorStop(at(-half + feather), "#000f");
    mask.addColorStop(at(half - feather), "#000f");
    mask.addColorStop(at(half + feather), "#0000");
    mask.addColorStop(1, "#0000");
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, 128, 128);
  });
}

/** A colour ramp sampled at 256 steps, as straight RGBA. */
function sampled(kind: Ramp) {
  const parsed = stops[kind].map(([offset, color]) => {
    const hex = color.slice(1).padEnd(8, "f");
    return [
      offset,
      ...[0, 2, 4, 6].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)),
    ];
  });
  const out = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    const d = i / 255;
    let k = 1;
    while (k < parsed.length - 1 && parsed[k][0] < d) k++;
    const [a, b] = [parsed[k - 1], parsed[k]];
    const t = Math.min(1, Math.max(0, (d - a[0]) / (b[0] - a[0] || 1)));
    for (let c = 0; c < 4; c++)
      out[i * 4 + c] = a[c + 1] + (b[c + 1] - a[c + 1]) * t;
  }
  return out;
}
const LANCE = { width: 256, height: 64 } as const;
/**
 * The lance's shape, with the nozzle at x = 0. Its half-width rises from the
 * nozzle to the widest point and closes again at the far end. The colour runs
 * from the ramp's centre on the spine at the widest point out to its edge, so
 * no side of the shape is hard.
 */
function lanceBrush(kind: "liveFlash" | "green", lance: Blast["lance"]) {
  const key = `${kind}:lance:${lance.widest}:${lance.start}:${lance.tail}`;
  return prepared(key, LANCE.width, LANCE.height, (ctx) => {
    const ramp = sampled(kind);
    const image = ctx.createImageData(LANCE.width, LANCE.height);
    const head = Math.min(0.98, Math.max(0.02, lance.widest / 100));
    for (let x = 0; x < LANCE.width; x++) {
      const s = (x + 0.5) / LANCE.width;
      const cap = s < head;
      // Distance from the widest point, 0 to 1, towards either end.
      const along = cap ? (head - s) / head : (s - head) / (1 - head);
      const half = (1 - along * along) ** (cap ? lance.start : lance.tail);
      if (!(half > 1e-4)) continue;
      // The start stays hot up to the nozzle; the far end cools.
      const cooling = (cap ? 0.35 : 0.8) * along;
      for (let y = 0; y < LANCE.height; y++) {
        const across = Math.abs(((y + 0.5) / LANCE.height) * 2 - 1) / half;
        const d = Math.hypot(across, cooling);
        if (d >= 1) continue;
        const from = Math.round(d * 255) * 4;
        const to = (y * LANCE.width + x) * 4;
        for (let c = 0; c < 4; c++) image.data[to + c] = ramp[from + c];
      }
    }
    ctx.putImageData(image, 0, 0);
  });
}

/** One explosion. It stays at this point in the world. */
export interface Charge {
  x: number;
  y: number;
  /** The direction the exhaust leaves in. */
  angle: number;
  tick: number;
}
/** One straight leg of a particle; positions come from flight time. */
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

/**
 * Paints the explosions it is given. One painter belongs to one flight: a
 * flight flown again from its start gets a fresh one.
 */
export function createBlastPainter(
  blastInput: unknown,
  showInput: unknown = "Everything",
) {
  const { flash, particles, lance } = BlastSchema.parse(blastInput);
  const show = ShowSchema.parse(showInput);
  /** Whether a part is painted. The explosions themselves do not change. */
  const shows = (part: Show) => show === "Everything" || show === part;
  const cone = flash.shape === "Cone";
  const charges: Charge[] = [];
  const legs: Leg[] = [];

  /** A stamp centred on the charge: round, or coned along the exhaust. */
  function burst(
    ctx: CanvasRenderingContext2D,
    kind: Ramp,
    charge: Charge,
    radius: number,
  ) {
    if (!cone) {
      const image = brush(kind);
      ctx.drawImage(
        image,
        charge.x - radius,
        charge.y - radius,
        radius * 2,
        radius * 2,
      );
      return;
    }
    ctx.save();
    ctx.translate(charge.x, charge.y);
    ctx.rotate(charge.angle);
    ctx.drawImage(
      coned(kind, flash.cone),
      -radius,
      -radius,
      radius * 2,
      radius * 2,
    );
    ctx.restore();
  }
  /** The lance from the nozzle along the exhaust. */
  function spear(
    ctx: CanvasRenderingContext2D,
    kind: "liveFlash" | "green",
    charge: Charge,
    length: number,
    width: number,
  ) {
    ctx.save();
    ctx.translate(charge.x, charge.y);
    ctx.rotate(charge.angle);
    ctx.drawImage(lanceBrush(kind, lance), 0, -width / 2, length, width);
    ctx.restore();
  }

  /** An explosion goes off: particles leave through the nozzle. */
  function ignite(charge: Charge, birth: number) {
    charges.push(charge);
    let state = Math.imul(charge.tick, 2654435761) >>> 0;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const spread = (particles.angle * Math.PI) / 180;
    const { count } = particles;
    for (let i = 0; i < count && legs.length + 3 <= 768; i++) {
      const dir = charge.angle + ((i + random()) / count - 0.5) * 2 * spread;
      const speed = particles.speed * (0.85 + 0.25 * random());
      const lead = particles.before * (0.8 + 0.4 * random());
      const reach = particles.after * (0.8 + 0.4 * random());
      const half =
        ((particles.split * Math.PI) / 360) * (0.85 + 0.3 * random());
      const side = random() < 0.5 ? 1 : -1;
      const forkAge = lead / speed;
      const fork = birth + forkAge;
      const branch = reach / (speed * 1.05);
      const life = forkAge + branch;
      const vx = Math.cos(dir) * speed;
      const vy = Math.sin(dir) * speed;
      const { x, y } = charge;
      legs.push({ x, y, vx, vy, birth, start: birth, end: fork, life });
      if (!(reach > 0)) continue;
      for (const slow of [false, true]) {
        const heading = dir + (slow ? -side : side) * half;
        const rate = speed * (slow ? 0.35 : 1.05);
        legs.push({
          x: x + vx * forkAge,
          y: y + vy * forkAge,
          vx: Math.cos(heading) * rate,
          vy: Math.sin(heading) * rate,
          birth,
          start: fork,
          end: fork + branch * (slow ? 0.7 : 1),
          life,
        });
      }
    }
  }

  /** Fresh light for the FX surface, once a tick, in order. */
  function fx(
    ctx: CanvasRenderingContext2D,
    pass: FxPass,
    tick: number,
    time: number,
  ) {
    const previous = time - 1 / 60;
    ctx.save();
    for (let i = charges.length - 1; i >= 0; i--) {
      const charge = charges[i];
      const age = tick - charge.tick;
      if (age > 40) {
        charges.splice(i, 1);
        continue;
      }
      if (!pass.visible(charge.x, charge.y, lance.length * 1.2 + 40)) continue;
      // The flash leaves its copy in the surface, as the drone's burst does.
      if (shows("Flash") && age === 0 && pass.budget.take(true)) {
        ctx.globalAlpha = pass.opacity;
        burst(ctx, "flash", charge, (flash.core * 25) / 14);
      }
      // The lance's green stays along the exhaust's line.
      if (shows("Lance") && age < lance.green && pass.budget.take(true)) {
        const t = age / lance.green;
        ctx.globalAlpha = Math.min(1, 1.6 * pass.opacity * (1 - t));
        spear(
          ctx,
          "green",
          charge,
          lance.length * (0.5 + 0.6 * t),
          lance.width * 0.9,
        );
      }
    }
    // Each particle's travel since the tick before, in green.
    for (let i = legs.length - 1; i >= 0; i--) {
      const leg = legs[i];
      const start = Math.max(leg.start, previous);
      const end = Math.min(leg.end, time);
      if (end > start && shows("Particles")) {
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

  /** Live light on LFX for the tick shown. */
  function lfx(
    ctx: CanvasRenderingContext2D,
    ship: { x: number; y: number; radius: number },
    tick: number,
    time: number,
  ) {
    ctx.save();
    for (const charge of charges) {
      const age = tick - charge.tick;
      if (age < 0) continue;
      if (shows("Flash") && age < flash.ticks) {
        // Each tick after the first is softer.
        const fade = 0.4 ** age;
        // Everything within reach is caught in the flash.
        ctx.globalAlpha = flash.light * fade;
        burst(ctx, "frame", charge, flash.reach);
        // A round flash lights the hull on the side that faces the charge. A
        // cone is thrown aft, and the hull is outside it.
        if (!cone) {
          const dx = charge.x - ship.x;
          const dy = charge.y - ship.y;
          const r = ship.radius * 1.15;
          ctx.save();
          ctx.translate(ship.x, ship.y);
          ctx.rotate(Math.atan2(dy, dx));
          ctx.globalAlpha =
            Math.min(
              1,
              1.8 * Math.min(1, (40 / Math.max(1, Math.hypot(dx, dy))) ** 2),
            ) * (age < 2 ? 1 : fade * 2.5);
          ctx.drawImage(
            brush("liveFlash"),
            -r * 0.55,
            -r * 1.3,
            r * 1.9,
            r * 2.6,
          );
          ctx.restore();
        }
        ctx.globalAlpha = age < 2 ? 1 : fade * 2.5;
        burst(ctx, "liveFlash", charge, flash.core * (1 + 0.35 * age));
      }
      // The white lance shoots out to its full length and thins as it goes.
      if (shows("Lance") && age < lance.ticks) {
        const t = age / lance.ticks;
        ctx.globalAlpha = (1 - t) ** 1.5;
        spear(
          ctx,
          "liveFlash",
          charge,
          lance.length * (0.4 + 0.6 * t),
          lance.width * (1 - 0.4 * t),
        );
      }
    }
    if (shows("Particles"))
      for (const leg of legs) {
        if (time < leg.start || time >= leg.end) continue;
        const elapsed = time - leg.start;
        const phase = (time - leg.birth) / leg.life;
        const radius = 0.7 * (1 + 1.6 * (1 - phase));
        ctx.globalAlpha = Math.max(0, 1 - phase ** 2);
        ctx.drawImage(
          brush("tip"),
          leg.x + leg.vx * elapsed - radius,
          leg.y + leg.vy * elapsed - radius,
          radius * 2,
          radius * 2,
        );
      }
    ctx.restore();
  }

  return { ignite, fx, lfx };
}
