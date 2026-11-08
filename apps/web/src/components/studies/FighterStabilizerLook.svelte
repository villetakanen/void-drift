<script lang="ts">
import { EnginePlume, Vec2 } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  buildPlumeEmitters,
  defaultLoadout,
  drawBuild,
  LoadoutSchema,
} from "@void-drift/mode-a";
import { onMount, untrack } from "svelte";
import { CRUISER } from "../../../../../packages/mode-a/src/lib/cruiser";
import { SCOUT } from "../../../../../packages/mode-a/src/lib/scout";
import { stabilizerGeometry } from "./rotation-bench";
import { drawStabilizerSlits } from "./stabilizer-art";
import "@void-drift/core/styles/buttons.css";

let {
  label = "Fighter stabilizer appearance",
  scout = false,
  cruiser = false,
}: { label?: string; scout?: boolean; cruiser?: boolean } = $props();
const isScout = untrack(() => scout);
const isCruiser = untrack(() => cruiser);
const otherHull = isScout || isCruiser;
let fitting = $state(isScout ? "light" : "heavy");
const name = isScout ? "Scout" : isCruiser ? "Cruiser" : "Fighter";
const build = $derived(
  LoadoutSchema.parse({
    ...defaultLoadout(isScout ? "scout" : isCruiser ? "corvette" : "fighter"),
    side: fitting === "light" ? "ion" : "heavy-ion",
    aft: Array(isScout ? 1 : isCruiser ? 3 : 2).fill(
      fitting === "light" ? null : "heavy-ion",
    ),
  }),
);
let back = $state(isScout ? 67 : isCruiser ? 76 : 77),
  inset = $state(isScout ? 38 : isCruiser ? 23 : 10),
  angle = $state(isScout ? 67 : isCruiser ? 63 : 37.7);
let left = $state(false);
let right = $state(false);
let look: HTMLDivElement;
const outputs = $derived([
  left ? 1 : 0,
  right ? 1 : 0,
  ...build.aft.filter(Boolean).map(() => (left && right ? 1 : 0)),
]);
const command = $derived(Number(left) - Number(right));
let canvas: HTMLCanvasElement;
const geometry = $derived.by(() => {
  if (!otherHull) return stabilizerGeometry(back, inset, angle);
  const hull = (isScout ? SCOUT : CRUISER).facets.flatMap((f) => f.points);
  const nose = Math.max(...hull.map((p) => p[0])),
    stern = Math.min(...hull.map((p) => p[0]));
  const width =
    Math.max(...hull.map((p) => p[1])) - Math.min(...hull.map((p) => p[1]));
  const x = nose - ((nose - stern) * back) / 100,
    y = width * (0.5 - inset / 100);
  const radians = (angle * Math.PI) / 180,
    fx = -Math.cos(radians),
    fy = Math.sin(radians);
  return { x, y, fx, fy, lever: x * fy + y * fx, hull };
});
function render() {
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, 1000, 1050);
  function ship(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    scale: number,
  ) {
    const plumes = new EnginePlume();
    const emitters = buildPlumeEmitters(build).map((emitter, index) => ({
      ...emitter,
      output: outputs[index],
    }));
    for (const side of [-1, 1]) {
      if (
        command === 0 ||
        Math.abs(geometry.lever) < 1e-9 ||
        side !== -command * Math.sign(geometry.lever)
      )
        continue;
      const direction = Math.atan2(-side * geometry.fy, geometry.fx);
      emitters.push({
        style: "ion-light",
        x: (geometry.x - Math.cos(direction)) * BUILD_FLIGHT_SCALE,
        y: (side * geometry.y - Math.sin(direction)) * BUILD_FLIGHT_SCALE,
        angle: direction,
        output: 0.22,
      });
    }
    const fixture = {
      pos: new Vec2(0, 0),
      vel: new Vec2(0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 1,
    };
    // Fixed one-second emission history: inspect the real painter without moving the ship.
    for (let tick = 0; tick < 60; tick++)
      plumes.stepMounted(1 / 60, fixture, emitters);

    drawBuild(ctx, build, cx, cy, -Math.PI / 2, scale);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.scale(scale, scale);
    drawStabilizerSlits(ctx, geometry);
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.scale(scale / BUILD_FLIGHT_SCALE, scale / BUILD_FLIGHT_SCALE);
    plumes.draw(ctx);
    ctx.restore();
  }
  ship(ctx, 340, 280, 3.8);
  ship(ctx, 800, 280, 0.65);
  ctx.fillStyle = "#dce6ed";
  ctx.font = "16px sans-serif";
  ctx.fillText(`${name} · enlarged flight appearance`, 50, 35);
  ctx.fillText("Game drawing scale · 0.65×", 680, 220);
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#a7b2c4";
  ctx.fillText(
    fitting === "light"
      ? "Light-ion side pair · empty aft"
      : isScout
        ? "Heavy-ion side pair + one Heavy aft"
        : isCruiser
          ? "Heavy-ion side pair + three Heavy aft engines"
          : "Heavy-ion side pair + Heavy-ion aft pair",
    50,
    1030,
  );
}
$effect(() => {
  back;
  inset;
  angle;
  left;
  right;
  fitting;
  render();
});
onMount(() => {
  render();
  const key = (event: KeyboardEvent, held: boolean) => {
    if (
      !look.contains(document.activeElement) ||
      (event.target instanceof HTMLInputElement &&
        event.target.type === "range")
    )
      return;
    if (["KeyA", "ArrowLeft", "KeyL"].includes(event.code)) {
      event.preventDefault();
      left = held;
    }
    if (["KeyD", "ArrowRight", "KeyR"].includes(event.code)) {
      event.preventDefault();
      right = held;
    }
  };
  const down = (event: KeyboardEvent) => key(event, true);
  const up = (event: KeyboardEvent) => key(event, false);
  const clear = () => {
    left = false;
    right = false;
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", clear);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", clear);
  };
});
</script>
<div
  class="look"
  bind:this={look}
  data-left={left}
  data-right={right}
  data-outputs={outputs.join(",")}
  data-stabilizer={command === 0
    ? "off"
    : -command * Math.sign(geometry.lever) === -1
      ? "left"
      : "right"}
>
  <div class="controls">
    {#if otherHull}
      <label
        >{name}
        fitting<select bind:value={fitting}>
          <option value="light">Light-ion side pair · Lab baseline</option>
          <option value="heavy">
            {isCruiser
              ? "Heavy ions · 2 side + 3 aft"
              : "Heavy ions · side pair + aft"}
          </option>
        </select></label
      >
      <button
        type="button"
        class="btn btn-ghost"
        onclick={() => {
          back = isCruiser ? 60 : 65;
          inset = isCruiser ? 22 : 24;
          angle = 37.7;
        }}
      >
        {isCruiser ? "Mid flanks" : "Wing roots"}
      </button>
      <button
        type="button"
        class="btn btn-ghost"
        onclick={() => {
          back = isCruiser ? 72 : 80;
          inset = isCruiser ? 15 : 16;
          angle = 37.7;
        }}
      >
        {isCruiser ? "Aft shoulders" : "Swept blades"}
      </button>
      <button
        type="button"
        class="btn btn-ghost"
        onclick={() => {
          back = isCruiser ? 88 : 75;
          inset = isCruiser ? 10 : 43;
          angle = 37.7;
        }}
      >
        {isCruiser ? "Stern edges" : "Central keel"}
      </button>
    {/if}

    <button
      type="button"
      class="btn btn-ghost"
      aria-pressed={left}
      onclick={() => (left = !left)}
    >
      L
    </button>
    <button
      type="button"
      class="btn btn-ghost"
      aria-pressed={right}
      onclick={() => (right = !right)}
    >
      R
    </button>
    <button
      type="button"
      class="btn btn-ghost"
      onclick={() => {
        left = true;
        right = true;
      }}
    >
      LR
    </button>
    <button
      type="button"
      class="btn btn-ghost"
      onclick={() => {
        left = false;
        right = false;
      }}
    >
      Release
    </button>

    <label
      >Back from nose: {back}%<input
        type="range"
        min="55"
        max="100"
        step="1"
        bind:value={back}
      ></label
    >
    <label
      >Across hull: {inset}% / {100 - inset}%<input
        type="range"
        min="0"
        max="45"
        step="1"
        bind:value={inset}
      ></label
    >
    <label
      >Outward exhaust angle: {angle.toFixed(1)}°<input
        type="range"
        min="-90"
        max="180"
        step="0.1"
        bind:value={angle}
      ></label
    >

    <button
      type="button"
      class="btn btn-ghost"
      onclick={() => {
        back = isScout ? 67 : isCruiser ? 76 : 77;
        inset = isScout ? 38 : isCruiser ? 23 : 10;
        angle = isScout ? 67 : isCruiser ? 63 : 37.7;
        left = right = false;
      }}
    >
      Reset placement
    </button>
  </div>
  <canvas
    bind:this={canvas}
    width="1000"
    height="1050"
    aria-label={label}
  ></canvas>
  <p>
    Placement: {back}% back, {inset}% / {100 - inset}% across,
    {angle.toFixed(1)}° outward exhaust angle. Turning lever:
    {Math.abs(geometry.lever).toFixed(2)}
    units. The exhaust points opposite the force direction.
  </p>
  <p>
    L and R select the complete input state. L lights the left main ion and the
    right stabilizer; R lights the right main ion and the left stabilizer. LR
    lights both side engines and any fitted aft engines. Release turns emission
    off. Click a control, then hold A/D, left/right arrows or L/R keys to
    inspect keyboard input. This stationary one-second emission snapshot has no
    residual spin, so LR and release need no counter-spin flame. Main engines
    use full output; stabilizers use 0.22 Light output.
  </p>
</div>
<style>
.look {
  border: 1px solid var(--color-text-dim);
  padding: var(--spacing-md);
}
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--spacing-md);
}
label {
  display: grid;
  gap: var(--spacing-sm);
}
input,
select {
  min-height: 44px;
  background: var(--color-void);
  color: var(--color-text);
}
canvas {
  display: block;
  width: 100%;
  margin-block: var(--spacing-md);
}
p {
  line-height: 1.6;
  margin-block: var(--spacing-md);
}
</style>
