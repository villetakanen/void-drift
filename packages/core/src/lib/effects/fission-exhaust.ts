import type { FxPass } from "./arcade-fx";
import { fxRetention } from "./fx-surface";

export interface FissionExhaustPose {
  readonly x: number;
  readonly y: number;
  readonly exhaustAngle: number;
}

export interface FissionExhaustContact {
  readonly x: number;
  readonly y: number;
  readonly ignition: FissionExhaustPose;
}

const STEP = 1 / 60;
const SPEED = 340 * STEP;
const radians = Math.PI / 180;
const HISTORY_TICKS = 60; // Bound unpresented emission, not painted history.
const MAX_SOURCES = 128;
const FLASH_ALPHA = [0.2, 0.12, 0.06];
const FLASH_HALF_HEIGHT = 180 * Math.sin(55 * radians);
const TICK_OPACITY = 2.2 * (1 - fxRetention(STEP));

// Local trails reused by all nozzles. Distances are cumulative along a spark.
interface Track {
  x: number;
  y: number;
  dx: number;
  dy: number;
  start: number;
  end: number;
}
const tracks: Track[] = [];
for (let i = 0; i < 7; i++) {
  const angle = ((i / 3 - 1) * 16 + (i % 2) * 1.5) * radians;
  const dx = Math.cos(angle),
    dy = Math.sin(angle);
  const variation = 0.8 + ((i * 3) % 7) / 15;
  const split = 50 * variation;
  tracks.push({ x: 0, y: 0, dx, dy, start: 0, end: split });
  for (const branch of [-1, 1]) {
    const direction = angle + branch * 5.5 * radians;
    tracks.push({
      x: dx * split,
      y: dy * split,
      dx: Math.cos(direction),
      dy: Math.sin(direction),
      start: split,
      end: split + (branch === (i % 2 ? 1 : -1) ? 115 : 29) * variation,
    });
  }
}
const MAX_TIP_DISTANCE = Math.max(...tracks.map((track) => track.end));
const EFFECT_RADIUS = Math.max(190, MAX_TIP_DISTANCE) + 3;
const LAST_TIP_TICK = Math.ceil(MAX_TIP_DISTANCE / SPEED);
const RETURN_SPEED = SPEED * 1.6;

interface Burst extends FissionExhaustPose {
  tick: number;
  cos: number;
  sin: number;
}
interface ReturnSpark extends Track {
  tick: number;
}

function segment(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  x: number,
  y: number,
  endX: number,
  endY: number,
  padding: number,
) {
  if (
    !pass.visible(
      (x + endX) / 2,
      (y + endY) / 2,
      Math.abs(endX - x) / 2 + padding,
      Math.abs(endY - y) / 2 + padding,
    )
  )
    return false;
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  return true;
}

function drawTracks(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  burst: Burst,
  from: number,
  to: number,
  live: boolean,
  opacity: number,
  essential = false,
) {
  let visible = false;
  ctx.beginPath();
  for (const track of tracks) {
    if (to <= track.start || (live ? to > track.end : from >= track.end))
      continue;
    const a = Math.max(from, track.start) - track.start;
    const b = Math.min(to, track.end) - track.start;
    const x = track.x + track.dx * a,
      y = track.y + track.dy * a;
    const endX = track.x + track.dx * b,
      endY = track.y + track.dy * b;
    visible =
      segment(
        ctx,
        pass,
        burst.x + x * burst.cos - y * burst.sin,
        burst.y + x * burst.sin + y * burst.cos,
        burst.x + endX * burst.cos - endY * burst.sin,
        burst.y + endX * burst.sin + endY * burst.cos,
        2,
      ) || visible;
  }
  if (!visible || !pass.budget.take(essential)) return;
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = live ? "#e1ffec" : "#46ef83";
  ctx.lineWidth = live ? 1.6 : 2.6;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawLance(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  burst: Burst,
  age: number,
  live: boolean,
  opacity: number,
  essential: boolean,
) {
  const length = 190 * (0.4 + age * 0.1);
  const halfWidth = (live ? 3 : 8) * (1 - age * 0.087);
  if (
    !pass.visible(
      burst.x + (burst.cos * length) / 2,
      burst.y + (burst.sin * length) / 2,
      (Math.abs(burst.cos) * length) / 2 + halfWidth,
      (Math.abs(burst.sin) * length) / 2 + halfWidth,
    ) ||
    !pass.budget.take(essential)
  )
    return false;
  ctx.save();
  ctx.translate(burst.x, burst.y);
  ctx.rotate(burst.exhaustAngle);
  ctx.globalAlpha = opacity;
  ctx.fillStyle = live ? "#f3fff8" : "#50ff91";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.07, halfWidth, length * 0.16, halfWidth);
  ctx.bezierCurveTo(
    length * 0.42,
    halfWidth * 0.75,
    length * 0.72,
    halfWidth * 0.07,
    length,
    0,
  );
  ctx.bezierCurveTo(
    length * 0.72,
    -halfWidth * 0.07,
    length * 0.42,
    -halfWidth * 0.75,
    length * 0.16,
    -halfWidth,
  );
  ctx.quadraticCurveTo(length * 0.07, -halfWidth, 0, 0);
  ctx.fill();
  ctx.restore();
  return true;
}

function drawTips(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  burst: Burst,
  age: number,
  essential: boolean,
) {
  if (age >= LAST_TIP_TICK || !pass.visible(burst.x, burst.y, EFFECT_RADIUS))
    return;
  const distance = (age + 1) * SPEED;
  drawTracks(
    ctx,
    pass,
    burst,
    Math.max(0, distance - 4),
    distance,
    true,
    0.92,
    essential,
  );
}

let flashStamp: HTMLCanvasElement | undefined;
function prepareFlash() {
  if (flashStamp) return flashStamp;
  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Fission flash requires Canvas 2D");
  ctx.translate(0, 180);
  const light = ctx.createRadialGradient(0, 0, 0, 0, 0, 180);
  light.addColorStop(0, "#fff");
  light.addColorStop(0.09, "#fff");
  light.addColorStop(26 / 180, "#eaffecbd");
  light.addColorStop(0.3, "#a8ffb933");
  light.addColorStop(1, "#a8ffb900");
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 180, -55 * radians, 55 * radians);
  ctx.fill();
  flashStamp = canvas;
  return canvas;
}

function drawFlash(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  burst: Burst,
  age: number,
) {
  if (
    age >= FLASH_ALPHA.length ||
    !pass.visible(
      burst.x + burst.cos * 90,
      burst.y + burst.sin * 90,
      Math.abs(burst.cos) * 90 + Math.abs(burst.sin) * FLASH_HALF_HEIGHT,
      Math.abs(burst.sin) * 90 + Math.abs(burst.cos) * FLASH_HALF_HEIGHT,
    ) ||
    !pass.budget.take(true)
  )
    return false;
  ctx.save();
  ctx.translate(burst.x, burst.y);
  ctx.rotate(burst.exhaustAngle);
  ctx.globalAlpha = FLASH_ALPHA[age];
  ctx.drawImage(prepareFlash(), 0, -180);
  ctx.restore();
  return true;
}

function drawReturn(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  spark: ReturnSpark,
  age: number,
  live: boolean,
  opacity: number,
) {
  if (age < 0 || age * RETURN_SPEED >= spark.end) return;
  const end = Math.min(spark.end, 2 + age * RETURN_SPEED);
  const start = Math.max(0, end - (live ? 6 : RETURN_SPEED));
  ctx.beginPath();
  if (
    !segment(
      ctx,
      pass,
      spark.x + spark.dx * start,
      spark.y + spark.dy * start,
      spark.x + spark.dx * end,
      spark.y + spark.dy * end,
      2,
    ) ||
    !pass.budget.take(live)
  )
    return;
  ctx.strokeStyle = live ? "#f5ffdc" : "#66f59a";
  ctx.globalAlpha = opacity * (1 - start / spark.end);
  ctx.lineWidth = live ? 1.8 : 2.6;
  ctx.stroke();
}

function appendBounded<T>(items: T[], item: T) {
  if (items.length === MAX_SOURCES) items.shift();
  items.push(item);
}

/** One painter per scene. Feed every completed 60 Hz tick, even without a draw.
 * Call stamp inside the shared FxSurface emission callback and live each frame
 * inside the shared LFX pass. The painter holds sources, never painted marks.
 */
export class FissionExhaust {
  private readonly bursts: Burst[] = [];
  private readonly returns: ReturnSpark[] = [];
  private captured = 0;
  private painted = 0;

  clear() {
    this.bursts.length = this.returns.length = 0;
    this.captured = this.painted = 0;
  }

  capture(
    tick: number,
    ignitions: readonly FissionExhaustPose[],
    contacts: readonly FissionExhaustContact[] = [],
  ) {
    if (tick <= this.captured) return;
    this.captured = tick;
    // Retire expired sources once their last stamp is painted (or the bounded
    // catch-up interval has passed). A pause changes neither lifetime nor paint.
    const oldest = Math.max(
      tick - HISTORY_TICKS,
      Math.min(tick - 1, this.painted),
    );
    let keep = 0;
    for (const burst of this.bursts)
      if (burst.tick + LAST_TIP_TICK - 1 > oldest) this.bursts[keep++] = burst;
    this.bursts.length = keep;
    keep = 0;
    for (const spark of this.returns)
      if (spark.tick + Math.ceil(spark.end / RETURN_SPEED) - 1 > oldest)
        this.returns[keep++] = spark;
    this.returns.length = keep;
    for (const pose of ignitions)
      appendBounded(this.bursts, {
        tick,
        x: pose.x,
        y: pose.y,
        exhaustAngle: pose.exhaustAngle,
        cos: Math.cos(pose.exhaustAngle),
        sin: Math.sin(pose.exhaustAngle),
      });
    for (const { x, y, ignition } of contacts) {
      const dx = ignition.x - x,
        dy = ignition.y - y;
      const length = Math.hypot(dx, dy);
      if (length > 0)
        appendBounded(this.returns, {
          tick,
          x,
          y,
          dx: dx / length,
          dy: dy / length,
          start: 0,
          end: Math.min(length, 55),
        });
    }
  }

  stamp(ctx: CanvasRenderingContext2D, pass: FxPass, tick = this.captured) {
    if (tick <= this.painted) return;
    const first = Math.max(this.painted + 1, tick - HISTORY_TICKS + 1);
    this.painted = tick;
    if (!this.bursts.length && !this.returns.length) return;
    ctx.save();
    for (let t = first; t <= tick; t++) {
      const opacity = TICK_OPACITY * fxRetention((tick - t) * STEP);
      for (const burst of this.bursts) {
        const age = t - burst.tick;
        if (
          age < 0 ||
          age >= LAST_TIP_TICK ||
          !pass.visible(burst.x, burst.y, EFFECT_RADIUS)
        )
          continue;
        // Reserve current nozzle light, not catch-up marks or green tracks.
        if (age < 7)
          drawLance(ctx, pass, burst, age, false, opacity * 0.85, t === tick);
        drawTracks(
          ctx,
          pass,
          burst,
          age * SPEED,
          (age + 1) * SPEED,
          false,
          opacity * 0.82,
        );
      }
      for (const spark of this.returns)
        drawReturn(ctx, pass, spark, t - spark.tick, false, opacity);
    }
    ctx.restore();
  }

  live(ctx: CanvasRenderingContext2D, pass: FxPass, tick = this.captured) {
    if (!this.bursts.length && !this.returns.length) return;
    ctx.save();
    // Reserve one live cue per visible ignition. A lance or tip that backs
    // up an already painted cue must not spend another essential slot.
    for (const burst of this.bursts) {
      const age = tick - burst.tick;
      if (age < 0 || age >= 7) continue;
      const flash = drawFlash(ctx, pass, burst, age);
      const lance = drawLance(
        ctx,
        pass,
        burst,
        age,
        true,
        1 - age * 0.115,
        !flash,
      );
      drawTips(ctx, pass, burst, age, !flash && !lance);
    }
    for (const spark of this.returns)
      drawReturn(ctx, pass, spark, tick - spark.tick, true, 0.95);
    // After the lance ends, the moving tips are the only live cue.
    for (const burst of this.bursts) {
      const age = tick - burst.tick;
      if (age >= 7) drawTips(ctx, pass, burst, age, true);
    }
    ctx.restore();
  }
}
