<script lang="ts">
import { FLIGHT_PASSES, type FlightLayerId, STEP } from "@void-drift/mode-a";
import { onMount } from "svelte";
import FlightLayers from "../FlightLayers.svelte";
import { RenderModelScene } from "./render-model-scene";

// Page elements that stack over the canvas, lowest first. Values are read
// from the tokens on mount.
const ABOVE = [
  {
    token: "--layer-hud",
    name: "Deck",
    holds: "Instruments, thrust pads, deck buttons and info rows",
    source: "packages/core/src/lib/styles/flight.css",
  },
  {
    token: "--layer-overlay",
    name: "Dialogs",
    holds: "Pause, run complete and rotate dialogs with their scrim",
    source: "packages/core/src/lib/styles/surfaces.css",
  },
  {
    token: "--layer-toast",
    name: "Status message",
    holds: "The flight message over everything",
    source: "packages/core/src/lib/styles/flight.css",
  },
];

let { label = "Render model" }: { label?: string } = $props();
let canvases = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>>({});
let running = $state(true);
let hidden = $state<string[]>([]);
let solo = $state<string | null>(null);
let upTo = $state(FLIGHT_PASSES.length);
let ticks = $state(0);
let drawn = $state<string[]>([]);
let times = $state<Record<string, number>>({});
let layers = $state<Record<string, string>>({});
let step = () => {},
  restart = () => {};

const included = $derived(
  FLIGHT_PASSES.filter((pass, index) =>
    solo ? pass.id === solo : index < upTo && !hidden.includes(pass.id),
  ).map((pass) => pass.id),
);
function toggle(id: string) {
  hidden = hidden.includes(id)
    ? hidden.filter((other) => other !== id)
    : [...hidden, id];
}

onMount(() => {
  const css = getComputedStyle(document.documentElement);
  layers = Object.fromEntries(
    ABOVE.map(({ token }) => [token, css.getPropertyValue(token).trim()]),
  );
  const world = canvases.world?.getContext("2d"),
    fx = canvases.fx?.getContext("2d"),
    lfx = canvases.lfx?.getContext("2d");
  if (!world || !fx || !lfx) return;
  const scene = new RenderModelScene({ world, fx, lfx });
  step = () => scene.step();
  restart = () => scene.restart();
  let last = performance.now(),
    carry = 0,
    frame = 0,
    frames = 0;
  const smoothed = new Map<string, number>();
  const draw = (now: number) => {
    if (running) {
      carry += Math.min(0.1, (now - last) / 1000);
      while (carry >= STEP) {
        scene.step();
        carry -= STEP;
      }
    } else carry = 0;
    last = now;
    const visible = included;
    const passes: string[] = [];
    scene.draw(
      {
        include: (pass) => visible.includes(pass.id),
        observe: (pass, ms) => {
          passes.push(pass.id);
          const before = smoothed.get(pass.id);
          smoothed.set(
            pass.id,
            before === undefined ? ms : before * 0.9 + ms * 0.1,
          );
        },
      },
      solo !== null,
    );
    for (const id of smoothed.keys())
      if (!passes.includes(id)) smoothed.delete(id);
    ticks = scene.ticks;
    if (passes.join() !== drawn.join()) drawn = passes;
    if (frames++ % 15 === 0) times = Object.fromEntries(smoothed);
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frame);
});
</script>

<section
  class="render-model"
  aria-label={label}
  data-ticks={ticks}
  data-drawn={drawn.join(" ")}
>
  <div class="bench">
    <div class="frame">
      <div class="stage">
        <FlightLayers
          bind:canvases
          label="The running flight frame, drawn from the selected passes"
        />
      </div>
      <div class="transport">
        <button
          type="button"
          class="btn btn-ghost"
          onclick={() => (running = !running)}
        >
          {running ? "Pause" : "Run"}
        </button>
        <button
          type="button"
          class="btn btn-ghost"
          disabled={running}
          onclick={() => step()}
        >
          Step
        </button>
        <button type="button" class="btn btn-ghost" onclick={() => restart()}>
          Restart
        </button>
        <span class="reading"
          >tick {ticks} · {(ticks * STEP).toFixed(2)} s</span
        >
      </div>
    </div>

    <div class="passes">
      <h2>Canvas passes, first drawn at the top</h2>
      <label class="build-up">
        <span> Build up: {upTo} of {FLIGHT_PASSES.length} </span>
        <input
          type="range"
          min="1"
          max={FLIGHT_PASSES.length}
          step="1"
          bind:value={upTo}
          disabled={solo !== null}
        >
      </label>
      <ol>
        {#each FLIGHT_PASSES as pass, index (pass.id)}
          <li
            data-pass={pass.id}
            class:off={!included.includes(pass.id)}
            class:solo={solo === pass.id}
          >
            <span class="order">{index + 1}</span>
            <label>
              <input
                type="checkbox"
                checked={!hidden.includes(pass.id)}
                onchange={() => toggle(pass.id)}
              >
              {pass.name}
            </label>
            <span class="time">
              {times[pass.id] === undefined
                ? "–"
                : `${times[pass.id].toFixed(2)} ms`}
            </span>
            <button
              type="button"
              class="solo-button"
              aria-pressed={solo === pass.id}
              aria-label={`Solo ${pass.name}`}
              onclick={() => (solo = solo === pass.id ? null : pass.id)}
            >
              Solo
            </button>
            <p>
              <span class="tag">{pass.layer}</span>
              <span class="tag">{pass.space}</span>
              {pass.draws}
              <small>{pass.source}</small>
            </p>
          </li>
        {/each}
      </ol>
      <p class="note">
        Draw times are smoothed measurements on this machine, for comparing
        passes with each other. Hiding a pass changes only what is drawn; the
        simulation runs on.
      </p>
    </div>
  </div>

  <div class="notes">
    <h2>Frame loop</h2>
    <ol class="loop">
      <li>
        <strong>Input.</strong>
        Keyboard and thrust pads are read into one control state. This page
        flies a fixed input program instead.
      </li>
      <li>
        <strong>Simulation.</strong>
        Frame time accumulates and the simulation advances in fixed steps of
        1/60 s. Rendering never changes simulation state.
      </li>
      <li>
        <strong>Camera.</strong>
        Each step reframes the camera on the ship; the result is one world to
        screen transform for the frame.
      </li>
      <li>
        <strong>Canvas passes.</strong>
        The {FLIGHT_PASSES.length}
        passes draw in order onto one 1920 by 1080 logical canvas. Screen passes
        draw untransformed, world passes under the camera transform.
      </li>
      <li>
        <strong>Page elements.</strong>
        The browser stacks the deck, dialogs and messages over the canvas by
        their layer tokens. They are outside the camera transform.
      </li>
    </ol>

    <h2>Above the canvas</h2>
    <table>
      <thead>
        <tr>
          <th>Layer</th>
          <th>Token</th>
          <th>Value</th>
          <th>Holds</th>
        </tr>
      </thead>
      <tbody>
        {#each ABOVE as layer (layer.token)}
          <tr data-layer={layer.token}>
            <td>{layer.name}</td>
            <td><code>{layer.token}</code></td>
            <td class="value">{layers[layer.token] ?? ""}</td>
            <td>
              {layer.holds}
              <small>{layer.source}</small>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<style>
.render-model {
  width: 100%;
  padding: var(--spacing-lg);
  box-sizing: border-box;
}
.bench {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: var(--spacing-lg);
  align-items: start;
}
.stage {
  border: 1px solid var(--color-border);
}
.frame {
  position: sticky;
  top: var(--spacing-lg);
}
.transport {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
  margin-top: var(--spacing-md);
}
.reading,
.time,
.value {
  font-variant-numeric: tabular-nums;
}
.reading {
  margin-left: var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-label);
}
h2 {
  margin: var(--spacing-lg) 0 var(--spacing-sm);
  font-size: var(--font-size-label);
  font-weight: normal;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
}
.passes h2 {
  margin-top: 0;
}
.loop {
  margin: 0;
  padding-left: var(--spacing-lg);
  max-width: 75ch;
  font-family: var(--font-family-prose);
  font-size: var(--font-size-body);
  line-height: 1.5;
}
.loop li {
  margin-bottom: var(--spacing-xs);
}
table {
  width: 100%;
  max-width: 75ch;
  border-collapse: collapse;
  font-size: var(--font-size-label);
}
th,
td {
  padding: var(--spacing-sm);
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--color-border-subtle);
}
th {
  font-weight: normal;
  color: var(--color-text-muted);
}
small {
  display: block;
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  overflow-wrap: anywhere;
}
.build-up {
  display: grid;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-label);
}
input[type="range"],
input[type="checkbox"] {
  accent-color: var(--color-action);
}
.passes ol {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border-subtle);
}
.passes li {
  display: grid;
  grid-template-columns: 2ch minmax(0, 1fr) auto auto;
  column-gap: var(--spacing-sm);
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: var(--font-size-label);
}
.passes li.off > :not(.solo-button) {
  opacity: var(--state-disabled-opacity);
}
.order,
.time {
  color: var(--color-text-muted);
}
.passes li label {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}
.passes li p {
  grid-column: 2 / -1;
  margin: var(--spacing-xs) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  line-height: 1.5;
}
.tag {
  margin-right: var(--spacing-xs);
  padding: 0 var(--spacing-xs);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}
.solo-button {
  padding: var(--spacing-xs) var(--spacing-sm);
  font: inherit;
  color: var(--color-text);
  background: none;
  border: 1px solid var(--color-border);
  cursor: pointer;
}
.solo-button:hover {
  background: var(--color-surface-hover);
}
.solo-button[aria-pressed="true"] {
  color: var(--color-on-brand);
  background: var(--color-selected);
  border-color: var(--color-selected);
}
.solo-button:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: 2px;
}
.note {
  margin-top: var(--spacing-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  line-height: 1.5;
}
</style>
