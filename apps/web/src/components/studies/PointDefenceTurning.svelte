<script lang="ts">
import { COLOR, CONFIG } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  type BuildMount,
  buildCollisionRadius,
  buildMounts,
  drawBuild,
  LoadoutSchema,
  type ShipProfileId,
  slotAccepts,
  starterLoadout,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { studyStarterWasp } from "./starter-wasp-fixture";
import "@void-drift/core/styles/buttons.css";

/**
 * Study fixture: three turret forms traced from the supplied concept, fitted to
 * a real hull weapon mount through drawBuild's painter hook. The target path is
 * scripted and deterministic; nothing collides or deals damage.
 * "form" and "speed" are the retained 02.1 and 02.2 comparisons; "shot" adds a
 * fixture ray drawn with the production Light Ion Cannon light profile;
 * "fitting" shows the selected turret under production mount layering.
 */
type Mode = "form" | "speed" | "shot" | "fitting";
type Variant = "A" | "B" | "C";
type Column = {
  variant: Variant;
  turn: number;
  label: string;
  rate?: number;
};
const DEG = Math.PI / 180;
const COLUMNS: Record<Mode, Column[]> = {
  form: [
    { variant: "A", turn: 180, label: "A / Supplied: base lit with the ship" },
    { variant: "B", turn: 180, label: "B / Base carries turning marks" },
    { variant: "C", turn: 180, label: "C / No base" },
  ],
  speed: [
    { variant: "B", turn: 90, label: "90°/s" },
    { variant: "B", turn: 180, label: "180°/s" },
    { variant: "B", turn: 360, label: "360°/s" },
  ],
  shot: [
    { variant: "B", turn: 180, rate: 1.5, label: "1.5 shots/s" },
    { variant: "B", turn: 180, rate: 3, label: "3 shots/s" },
    { variant: "B", turn: 180, rate: 6, label: "6 shots/s" },
  ],
  fitting: [
    {
      variant: "B",
      turn: 180,
      rate: 3,
      label: "Production mount layering",
    },
  ],
};
let {
  mode = "form",
  label = "Three point-defence turret forms tracking a scripted target on a real ship mount, enlarged and at flight scale",
}: { mode?: Mode; label?: string } = $props();
const columns = $derived(COLUMNS[mode]);
const firing = $derived(mode === "shot" || mode === "fitting");
const ships: ShipProfileId[] = [
  "scout",
  "wasp",
  "fighter",
  "corvette",
  "fiddler",
];
const sizes = [6, 8, 10];
const STEP = 1 / 120;
const PHASE = 1.6;
// Target bearings in world degrees relative to the ship's nose.
const BEARINGS = [30, 160, 250, 340, 100, 210];
// 02.1 and 02.2 keep 55 units; the shot round varies range across the reach.
const SHOT_RANGES = [55, 85, 120, 40, 95, 70];
const TARGET_RANGE = 55;
// Half the Light Ion Cannon's reach; production 80 ms flash and 65% dispersal.
const REACH = 100;
const FLASH = 0.08;
const DISPERSAL = 0.65;
const HALF_LIFE = 0.1;
const ALIGNED = 2 * DEG;
const TARGET_RADIUS = 3;
const LOOP = PHASE * BEARINGS.length;
// Ship turn script: [direction, seconds] at the base production turn rate.
// Sums to one loop with no net rotation, so replay starts from the same pose.
const SHIP_TURNS: [number, number][] = [
  [1, 1.2],
  [0, 0.4],
  [-1, 2],
  [0, 0.8],
  [1, 1.6],
  [0, 0.6],
  [-1, 0.8],
  [0, 2.2],
];

let ship = $state<ShipProfileId>("fighter");
let size = $state(8);
let playing = $state(true);
let withCannon = $state(true);
let shipTurns = $state(false);
let canvas: HTMLCanvasElement;
let t = 0;
let aims = [0, 0, 0];
let heading = 0;
let simT = 0;
type Shot = {
  time: number;
  x: number;
  y: number;
  angle: number;
  length: number;
};
let shots: Shot[][] = [[], [], []];
let ready = [0, 0, 0];

// Concept pixels: pivot at the base centre, forward = up, lateral = right.
const PX = { x: 810, y: 530, base: 115 };
const barrel: [number, number, number, number] = [784, 322, 836, 679];
const channel: [number, number, number, number] = [808, 322, 815, 508];
const housingL = [
  [754, 485],
  [784, 468],
  [784, 636],
  [754, 620],
];
const crossbar: [number, number, number, number] = [784, 529, 866, 571];

function local([px, py]: readonly number[]): [number, number] {
  return [PX.y - py, px - PX.x];
}
function rect(
  ctx: CanvasRenderingContext2D,
  [x0, y0, x1, y1]: readonly number[],
  color: string,
) {
  poly(
    ctx,
    [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ],
    color,
  );
}
function poly(
  ctx: CanvasRenderingContext2D,
  points: readonly (readonly number[])[],
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach((p, i) => {
    const [x, y] = local(p);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

function fitted() {
  const build = ship === "wasp" ? studyStarterWasp() : starterLoadout(ship);
  // Prefer free weapon-capable mounts; the cannon may replace a starter part.
  const candidates = buildMounts(build).filter(
    (m) => m.group === "hull" && slotAccepts(m.type, "G"),
  );
  const mount = candidates.find((m) => !m.part) ?? candidates[0];
  const cannon = candidates.find((m) => m !== mount);
  if (mount) build.hull[mount.index] = "laser";
  if (cannon && withCannon) build.hull[cannon.index] = "light-ion-cannon";
  return { build: LoadoutSchema.parse(build), mount };
}

function shipTurn(time: number) {
  if (!shipTurns) return 0;
  let at = time % LOOP;
  for (const [direction, seconds] of SHIP_TURNS) {
    if (at < seconds) return direction * CONFIG.ROTATION_SPEED;
    at -= seconds;
  }
  return 0;
}

/** Target in world units, relative to the ship centre; −y is the initial nose. */
function targetWorld(time: number) {
  const phase = Math.floor(time / PHASE) % BEARINGS.length;
  const drift = ((time % PHASE) / PHASE) * 24;
  const bearing = (BEARINGS[phase] + drift) * DEG - Math.PI / 2;
  const range = firing ? SHOT_RANGES[phase] : TARGET_RANGE;
  return { x: Math.cos(bearing) * range, y: Math.sin(bearing) * range };
}

/** Mount offset from the ship centre in world units for a screen rotation. */
function mountWorld(mount: BuildMount, rotation: number) {
  return {
    x:
      (mount.x * Math.cos(rotation) - mount.y * Math.sin(rotation)) *
      BUILD_FLIGHT_SCALE,
    y:
      (mount.x * Math.sin(rotation) + mount.y * Math.cos(rotation)) *
      BUILD_FLIGHT_SCALE,
  };
}

/** Channel tip, forward of the pivot on the turret's barrel. */
function muzzle(mount: BuildMount, aim: number) {
  const base = mountWorld(mount, ROTATION + heading);
  const angle = ROTATION + heading + aim;
  const length = ((PX.y - barrel[1]) / PX.base) * (size / 2);
  return {
    x: base.x + Math.cos(angle) * length,
    y: base.y + Math.sin(angle) * length,
    angle,
  };
}

/** World offset into the hull frame: +x is the nose, +y the ship's right. */
function toHull({ x, y }: { x: number; y: number }) {
  const r = -(ROTATION + heading);
  return {
    x: (x * Math.cos(r) - y * Math.sin(r)) / BUILD_FLIGHT_SCALE,
    y: (x * Math.sin(r) + y * Math.cos(r)) / BUILD_FLIGHT_SCALE,
  };
}

function advance(mount: BuildMount, to: number) {
  if (to < simT) {
    simT = 0;
    heading = 0;
    aims = columns.map(() => mount.angle);
    shots = [[], [], []];
    ready = [0, 0, 0];
  }
  while (simT + STEP <= to) {
    simT += STEP;
    heading += shipTurn(simT) * STEP;
    const target = toHull(targetWorld(simT));
    const want = Math.atan2(target.y - mount.y, target.x - mount.x);
    aims = columns.map((column, index) => {
      const aim = aims[index] ?? mount.angle;
      const turn = column.turn * DEG * STEP;
      const delta = Math.atan2(Math.sin(want - aim), Math.cos(want - aim));
      return aim + Math.max(-turn, Math.min(turn, delta));
    });
    if (firing) fire(mount);
  }
}

/** Fire when aligned, ready and the target lies within reach of the muzzle. */
function fire(mount: BuildMount) {
  const target = targetWorld(simT);
  columns.forEach(({ rate = 0 }, index) => {
    shots[index] = shots[index].filter((shot) => simT - shot.time < 0.6);
    if (simT < ready[index]) return;
    const m = muzzle(mount, aims[index]);
    const dx = target.x - m.x,
      dy = target.y - m.y;
    const along = dx * Math.cos(m.angle) + dy * Math.sin(m.angle);
    const across = -dx * Math.sin(m.angle) + dy * Math.cos(m.angle);
    const off = Math.abs(Math.atan2(across, along));
    const length = along - TARGET_RADIUS;
    if (off > ALIGNED || length > REACH || length <= 0) return;
    shots[index].push({ time: simT, x: m.x, y: m.y, angle: m.angle, length });
    ready[index] = simT + 1 / rate;
  });
}

/** The production ion profile over 100 units, clipped at contact. */
function ray(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  alpha: number,
  dispersal: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createLinearGradient(0, 0, REACH, 0);
  g.addColorStop(0, dispersal ? "#8cddff" : "#eafaff");
  g.addColorStop(0.25, "#8cddff");
  g.addColorStop(0.65, "#29baff");
  g.addColorStop(1, "#29baff00");
  ctx.strokeStyle = g;
  for (const [width, a] of [
    [3, 0.09],
    [1.333, 0.24],
    [0.4, dispersal ? DISPERSAL : 1],
  ]) {
    ctx.lineWidth = width;
    ctx.globalAlpha = a * alpha;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.min(length, REACH), 0);
    ctx.stroke();
  }
  ctx.restore();
}

/** Flash follows the current muzzle; dispersal stays where it was fired. */
function drawShots(
  ctx: CanvasRenderingContext2D,
  mount: BuildMount,
  index: number,
  originX: number,
  originY: number,
  unit: number,
) {
  ctx.save();
  ctx.translate(originX, originY);
  ctx.scale(unit, unit);
  for (const shot of shots[index]) {
    const age = simT - shot.time;
    const fade = 2 ** (-age / HALF_LIFE);
    if (fade > 0.02)
      ray(ctx, shot.x, shot.y, shot.angle, shot.length, fade, true);
    if (age < FLASH) {
      const m = muzzle(mount, aims[index]);
      ray(ctx, m.x, m.y, m.angle, shot.length, 1, false);
    }
  }
  ctx.restore();
}

function drawTurret(
  ctx: CanvasRenderingContext2D,
  mount: BuildMount,
  variant: Variant,
  aim: number,
) {
  const k = ((size / 2 / PX.base) * 1) / BUILD_FLIGHT_SCALE;
  const r = PX.base;
  ctx.save();
  ctx.scale(k, k);
  if (variant !== "C") {
    // Light from the ship's left (hull −y) stays fixed while the turret turns.
    ctx.save();
    ctx.rotate(-mount.angle);
    const outer = ctx.createLinearGradient(0, -r, 0, r);
    outer.addColorStop(0, "#4a4e55");
    outer.addColorStop(1, "#202227");
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    const inner = ctx.createLinearGradient(-30, -92, 30, 92);
    inner.addColorStop(0, "#5f656e");
    inner.addColorStop(1, "#2a2d33");
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(0, 0, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.rotate(aim - mount.angle);
  if (variant === "B") {
    ctx.fillStyle = "#121519";
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3 + Math.PI / 6);
      ctx.fillRect(94, -6, 19, 12);
      ctx.restore();
    }
    ctx.fillStyle = "#83c7d0";
    ctx.fillRect(-113, -7, 21, 14);
  }
  rect(ctx, barrel, "#1b1d1f");
  rect(ctx, [784, 322, 796, 679], "#52575f");
  poly(
    ctx,
    [
      [836, 322],
      [796, 679],
      [836, 679],
    ],
    "#12171e",
  );
  rect(ctx, channel, "#29baff");
  poly(ctx, housingL, "#c8f4f0");
  poly(
    ctx,
    housingL.map(([x, y]) => [2 * PX.x - x, y]),
    "#437e99",
  );
  rect(ctx, crossbar, "#83c7d0");
  ctx.restore();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(simT * 2);
  ctx.scale(scale, scale);
  // Neutral stand-in for a fragment; not production artwork.
  ctx.fillStyle = "#c9d2db";
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-2, 3);
  ctx.lineTo(-3, -2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLOR.void;
  ctx.lineWidth = 1 / scale;
  ctx.stroke();
  ctx.restore();
}

const HEIGHT = 820;
const ROTATION = -Math.PI / 2;

onMount(() => {
  // The fitting round starts on the ship it concerns most.
  if (mode === "fitting") ship = "scout";
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let last = performance.now();
  let frame = 0;
  const draw = (now: number) => {
    if (playing) t = (t + (now - last) / 1000) % LOOP;
    last = now;
    // Lay out in CSS pixels so the flight view is a true 1 px per unit.
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    if (canvas.width !== Math.round(width * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(HEIGHT * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, HEIGHT);
    const { build, mount } = fitted();
    if (!mount) {
      frame = requestAnimationFrame(draw);
      return;
    }
    advance(mount, t);
    const rotation = ROTATION + heading;
    const target = targetWorld(simT);
    const mountAt = mountWorld(mount, rotation);
    const bearing = Math.atan2(target.y - mountAt.y, target.x - mountAt.x);
    const column = width / columns.length;
    columns.forEach(({ variant, label }, index) => {
      const left = index * column + 12;
      const cx = index * column + column / 2;
      const painter = (c: CanvasRenderingContext2D, m: BuildMount) => {
        if (m.key !== mount.key) return false;
        drawTurret(c, m, variant, aims[index]);
        return true;
      };
      const view = (
        x: number,
        y: number,
        w: number,
        h: number,
        scale: number,
        originX: number,
        originY: number,
      ) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        drawBuild(
          ctx,
          build,
          originX,
          originY,
          rotation,
          scale,
          "",
          undefined,
          undefined,
          undefined,
          true,
          painter,
        );
        ctx.restore();
      };
      const w = column - 24;
      ctx.fillStyle = COLOR.text;
      ctx.font = "14px monospace";
      ctx.fillText(label, left, 20);

      // Close-up centred on the mount; the ring marks the target's bearing.
      ctx.fillStyle = COLOR.textMuted;
      ctx.fillText("Close-up · builder ×14", left, 48);
      const zoom = 14,
        by = 200;
      const k = zoom / BUILD_FLIGHT_SCALE;
      view(left, 60, w, 280, zoom, cx - mountAt.x * k, by - mountAt.y * k);
      if (firing) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(left, 60, w, 280);
        ctx.clip();
        drawShots(ctx, mount, index, cx - mountAt.x * k, by - mountAt.y * k, k);
        ctx.restore();
      }
      ctx.strokeStyle = COLOR.border;
      ctx.beginPath();
      ctx.arc(cx, by, 130, 0, Math.PI * 2);
      ctx.stroke();
      drawTarget(
        ctx,
        cx + Math.cos(bearing) * 130,
        by + Math.sin(bearing) * 130,
        2.5,
      );

      if (firing) {
        // Flight scale only, tall enough for the whole 100-unit reach.
        ctx.fillStyle = COLOR.textMuted;
        ctx.fillText("Flight · 1 px/unit, true range and reach", left, 372);
        const fy = 595;
        ctx.save();
        ctx.beginPath();
        ctx.rect(left, 380, w, 430);
        ctx.clip();
        ctx.strokeStyle = COLOR.borderSubtle;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(cx + mountAt.x, fy + mountAt.y, REACH, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        drawTarget(ctx, cx + target.x, fy + target.y);
        view(left, 380, w, 430, BUILD_FLIGHT_SCALE, cx, fy);
        ctx.save();
        ctx.beginPath();
        ctx.rect(left, 380, w, 430);
        ctx.clip();
        drawShots(ctx, mount, index, cx, fy, 1);
        ctx.restore();
        return;
      }
      ctx.fillStyle = COLOR.textMuted;
      ctx.fillText("Builder · whole ship", left, 372);
      // Fit the whole fitted ship, including both weapons.
      const fit = Math.min(
        3.6,
        (110 * BUILD_FLIGHT_SCALE) / buildCollisionRadius(build),
      );
      view(left, 380, w, 230, fit, cx, 495);

      ctx.fillStyle = COLOR.textMuted;
      ctx.fillText("Flight · 1 px/unit, true range", left, 640);
      const fy = 730;
      drawTarget(ctx, cx + target.x, fy + target.y);
      view(left, 650, w, 160, BUILD_FLIGHT_SCALE, cx, fy);
    });
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frame);
});
</script>

<div class="controls">
  {#each ships as id}
    <button
      type="button"
      class="btn"
      aria-pressed={ship === id}
      onclick={() => (ship = id)}
    >
      {id}
    </button>
  {/each}
</div>
<div class="controls">
  {#if mode === "form"}
    <span>Base diameter</span>
    {#each sizes as value}
      <button
        type="button"
        class="btn"
        aria-pressed={size === value}
        onclick={() => (size = value)}
      >
        {value}
        u
      </button>
    {/each}
  {/if}
  {#if mode !== "form"}
    <label
      ><input type="checkbox" bind:checked={shipTurns}>
      Ship turns at 129°/s</label
    >
  {/if}
  <button type="button" class="btn" onclick={() => (playing = !playing)}>
    {playing ? "Pause" : "Play"}
  </button>
  <button type="button" class="btn" onclick={() => (t = 0)}>Replay</button>
  <label
    ><input type="checkbox" bind:checked={withCannon}>
    Light Ion Cannon for size</label
  >
</div>
<canvas height="820" bind:this={canvas} aria-label={label}></canvas>

<style>
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md);
  margin-block: var(--spacing-md);
  font-family: var(--font-family-ui);
}
label {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}
canvas {
  display: block;
  width: 100%;
  height: 820px;
  background: var(--color-void);
}
</style>
