<script lang="ts">
import { STEP } from "@void-drift/mode-a";
import { z } from "astro/zod";
import { onMount } from "svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import SegmentedControl from "../../inputs/SegmentedControl.svelte";
import FlightSceneInstrument from "../../lab/flight-scene/FlightSceneInstrument.svelte";
import {
  ASSUMED_BLAST,
  type Blast,
  BlastSchema,
  FlashShapeSchema,
  type Show,
  ShowSchema,
} from "./channel-blast";
import {
  ASSUMED_KICK,
  CEILING,
  CeilingSchema,
  ENGINES,
  HoldingSchema,
  INERT_FISSION,
  KICK_SCENE,
  type Kick,
  type KickReadout,
  KickSchema,
  kickExperiment,
  kickSpeeds,
  READ_AT,
  type ReferenceEngine,
  referenceSpeeds,
  TODAY_KICK,
} from "./kick-flight";

// Fission engine 02.5 in the Flight scene instrument: a single-engine Wasp
// whose fission engine kicks by a study rule. The flight dials are at the top
// of the menu; 02.4's light controls are folded away at the bottom.
const _props: { "client:visible"?: boolean } = $props();
let scene: FlightSceneInstrument;
let kick = $state<Kick>(structuredClone(ASSUMED_KICK));
let blast = $state<Blast>(structuredClone(ASSUMED_BLAST));
let show = $state<Show>("Everything");
let readout = $state<KickReadout>({ speed: 0, kicks: 0 });
let ready = $state(false);
let references = $state<Record<ReferenceEngine, number[]> | null>(null);
let today = $state<number[]>([]);

const Saved = z.object({ kick: KickSchema, blast: BlastSchema }).strict();
const key = "void-drift:fission-engine:02-5-kick";
onMount(() => {
  try {
    const saved = Saved.safeParse(
      JSON.parse(localStorage.getItem(key) ?? "null"),
    );
    if (saved.success) ({ kick, blast } = saved.data);
  } catch {
    /* Browser storage is optional. */
  }
  // The game's four other engines, each alone on the Wasp, flown once.
  references = Object.fromEntries(
    ENGINES.map((engine) => [engine, referenceSpeeds(engine)]),
  ) as Record<ReferenceEngine, number[]>;
  today = kickSpeeds(TODAY_KICK);
  ready = true;
});
$effect(() => {
  const value = JSON.stringify({ kick, blast });
  if (!ready) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Browser storage is optional. */
  }
});

const light = { label: "02.5 fission kick", replaces: ["fusion" as const] };
const experiment = $derived(
  kickExperiment(
    $state.snapshot(kick),
    $state.snapshot(blast),
    show,
    (value) => (readout = value),
  ),
);
/** The dialled engine held from rest for 6 s, as the chart and readout show it. */
const curve = $derived(ready ? kickSpeeds($state.snapshot(kick)) : []);
const changed = $derived(JSON.stringify(kick) !== JSON.stringify(TODAY_KICK));
const assumedLight = $derived(
  JSON.stringify(blast) === JSON.stringify(ASSUMED_BLAST),
);

const summary = $derived.by(() => {
  const ceiling =
    kick.ceiling === "Tapers"
      ? "tapers at the ceiling"
      : kick.ceiling === "Overshoots"
        ? `overshoots the ceiling, excess halves in ${kick.bleed.toFixed(2)} s`
        : "holds fire unless the whole kick fits";
  const held = curve.length
    ? READ_AT.map(
        (s) => `${s} s ${Math.round(curve[Math.round(s / STEP)])}`,
      ).join(" · ")
    : "";
  const { flash, particles: p, lance: l } = blast;
  const shape =
    flash.shape === "Cone" ? `cone ${flash.cone}° aft` : "round, hull lit";
  return [
    `Wasp · Fission alone · no gravity · ceiling ${CEILING} u/s`,
    `Kick: +${kick.gain} u/s over ${kick.ticks} ${kick.ticks === 1 ? "tick" : "ticks"} · wait ${kick.wait.toFixed(2)} s · ${kick.holding.toLowerCase()} · ${ceiling}`,
    `Held from rest: ${held} u/s`,
    ...(assumedLight
      ? [`Light: 02.4 assumption · showing ${show.toLowerCase()}`]
      : [
          `Light changed · showing ${show.toLowerCase()}`,
          `Flash: ${shape} · core ${flash.core} u · reach ${flash.reach} u · light ${flash.light.toFixed(2)} · ${flash.ticks} ticks`,
          `Particles: ${p.count} · ±${p.angle}° · ${p.speed} u/s · ${p.before} u, split ${p.split}°, then ${p.after} u`,
          `Lance: ${l.length} × ${l.width} u · widest at ${l.widest}% · start ${l.start.toFixed(2)} · tail ${l.tail.toFixed(2)} · white ${l.ticks} ticks · green ${l.green} ticks`,
        ]),
  ].join("\n");
});
// A kick against the direction of travel slows the ship, so the sign is shown.
const lastKick = $derived.by(() => {
  if (readout.lastGain === undefined) return "";
  const gain = Math.round(readout.lastGain);
  return ` · last kick ${gain < 0 ? "−" : "+"}${Math.abs(gain)} u/s`;
});
const measurements = $derived(
  `Speed ${Math.round(readout.speed)} u/s · ${readout.kicks} ${readout.kicks === 1 ? "kick" : "kicks"}${lastKick}`,
);

// The chart: speed against time for 6 s with both pads held.
const W = 300;
const H = 150;
const M = { left: 30, right: 8, top: 8, bottom: 20 };
const top = $derived(Math.ceil(Math.max(500, CEILING, ...curve) / 100) * 100);
const x = (seconds: number) => M.left + (seconds / 6) * (W - M.left - M.right);
const y = (speed: number) =>
  H - M.bottom - (speed / top) * (H - M.top - M.bottom);
const path = (speeds: number[]) =>
  speeds
    .map(
      (v, tick) =>
        `${tick ? "L" : "M"}${x(tick * STEP).toFixed(1)} ${y(v).toFixed(1)}`,
    )
    .join("");
const LINES: Record<
  ReferenceEngine,
  { name: string; color: string; dash?: string }
> = {
  "service-ion": { name: "Service ion", color: "#70ffe2", dash: "2 3" },
  ion: { name: "Light ion", color: "#70ffe2" },
  "heavy-ion": { name: "Heavy ion", color: "#70e2ff" },
  plasma: { name: "Plasma", color: "#ffb340" },
};
const FISSION = "#c6ff32";
/** Ticks from a kick to the particles' split, at the set speed. */
const splitTick = $derived(
  Math.round((blast.particles.before / blast.particles.speed) * 60) + 2,
);
const ceilingNote: Record<Kick["ceiling"], string> = {
  Tapers:
    "The game’s rule for every engine: thrust along the direction of travel shrinks to nothing at the ceiling. Kicks get weaker as the ship gains speed, and even a first kick lands a little short.",
  Overshoots:
    "Every kick lands whole, and the ship can pass its ceiling. Speed above the ceiling then drains away between kicks.",
  "Holds fire":
    "A kick goes off only when the whole of it fits under the ceiling. Every kick is whole; near the ceiling the engine stays silent.",
};
</script>

<FlightSceneInstrument
  bind:this={scene}
  config={KICK_SCENE}
  label="Fission engine 02.5: the kick"
  tuning={INERT_FISSION}
  {summary}
  {measurements}
  {light}
  {experiment}
>
  {#snippet screenReadout()}
    {#if references}
      <figure class="chart">
        <figcaption>
          Speed with both pads held from rest, u/s over 6 s
        </figcaption>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          role="img"
          aria-label={`Speed over six seconds for the Wasp with each engine. The dialled fission engine reaches ${Math.round(curve[60] ?? 0)} u/s at one second and ${Math.round(curve[360] ?? 0)} at six.`}
        >
          {#each [0, 100, 200, 300, 400, 500, 600, 700, 800].filter(
            (v) => v <= top,
          ) as speed}
            <line
              class="grid"
              x1={x(0)}
              x2={x(6)}
              y1={y(speed)}
              y2={y(speed)}
            />
            {#if speed % 200 === 0}
              <text
                class="tick"
                x={M.left - 4}
                y={y(speed) + 3}
                text-anchor="end"
              >
                {speed}
              </text>
            {/if}
          {/each}
          {#each [0, 2, 4, 6] as seconds}
            <text class="tick" x={x(seconds)} y={H - 6} text-anchor="middle">
              {seconds}
              s
            </text>
          {/each}
          <line
            class="ceiling"
            x1={x(0)}
            x2={x(6)}
            y1={y(CEILING)}
            y2={y(CEILING)}
          />
          {#each ENGINES as engine}
            <path
              d={path(references[engine])}
              stroke={LINES[engine].color}
              stroke-dasharray={LINES[engine].dash}
            />
          {/each}
          {#if changed}
            <path d={path(today)} stroke={FISSION} stroke-dasharray="1 3" />
          {/if}
          <path class="dialled" d={path(curve)} stroke={FISSION} />
        </svg>
        <ul>
          <li>
            <span class="key dialled" style={`--c:${FISSION}`}></span>Fission,
            as dialled
          </li>
          {#if changed}
            <li>
              <span class="key dotted" style={`--c:${FISSION}`}></span>Fission
              today
            </li>
          {/if}
          {#each ENGINES as engine}
            <li>
              <span
                class="key"
                class:dashed={!!LINES[engine].dash}
                style={`--c:${LINES[engine].color}`}
              ></span>{LINES[engine].name}
            </li>
          {/each}
          <li><span class="key ceiling"></span>Ceiling, {CEILING} u/s</li>
        </ul>
      </figure>
    {/if}
  {/snippet}
  {#snippet pane()}
    <h3>Kick</h3>
    <p>
      Each kick sets off one explosion. A kick starts on the tick both pads go
      down.
    </p>
    <div class="group">
      <RingSlider
        label="Speed one kick adds"
        min={20}
        max={300}
        step={2}
        unit="u/s"
        bind:value={kick.gain}
      />
      <RingSlider
        label="Kick delivered over"
        min={1}
        max={11}
        step={1}
        unit="ticks"
        bind:value={kick.ticks}
      />
      <RingSlider
        label="Wait from one kick to the next"
        min={0.3}
        max={2}
        step={0.05}
        digits={2}
        unit="s"
        bind:value={kick.wait}
      />
      <p>The wait runs from the kick whatever the pads do.</p>
    </div>

    <h3>Holding the pads</h3>
    <div class="group">
      <SegmentedControl
        label="Holding the pads"
        options={HoldingSchema.options}
        bind:value={kick.holding}
        stretch
      />
      <p>
        {kick.holding === "One per press"
          ? "One kick each time both pads go down. A press made during the wait fires when the wait ends, if the pads are still down."
          : "Kicks repeat, one after each wait, for as long as both pads are down."}
      </p>
    </div>

    <h3>At the ceiling</h3>
    <div class="group">
      <SegmentedControl
        label="At the ceiling"
        options={CeilingSchema.options}
        bind:value={kick.ceiling}
        stretch
      />
      <p>{ceilingNote[kick.ceiling]}</p>
      {#if kick.ceiling === "Overshoots"}
        <RingSlider
          label="Speed above the ceiling halves in"
          min={0.1}
          max={3}
          step={0.05}
          digits={2}
          unit="s"
          bind:value={kick.bleed}
        />
      {/if}
    </div>

    <div class="row">
      <button
        type="button"
        class="btn"
        onclick={() => (kick = structuredClone(ASSUMED_KICK))}
      >
        Reset to the assumption
      </button>
      <button
        type="button"
        class="btn"
        onclick={() => (kick = structuredClone(TODAY_KICK))}
      >
        Today’s engine
      </button>
    </div>
    <p>Your settings are saved in this browser.</p>

    <details>
      <summary>Light: the 02.4 channel blast</summary>
      <div class="group">
        <SegmentedControl
          label="Show"
          options={ShowSchema.options}
          bind:value={show}
          stretch
        />
        <p>
          Shows one part of the explosion alone. The kicks and the flight are
          the same; only what is painted changes.
        </p>
        <div class="row">
          <button
            type="button"
            class="btn"
            onclick={() => scene.inspectTick(1)}
          >
            Pause on the flash
          </button>
          <button
            type="button"
            class="btn"
            onclick={() => scene.inspectTick(4)}
          >
            Pause on the lance
          </button>
          <button
            type="button"
            class="btn"
            onclick={() => scene.inspectTick(1 + splitTick)}
          >
            Pause on the split
          </button>
        </div>

        <details>
          <summary>Flash</summary>
          <div class="group">
            <SegmentedControl
              label="Flash shape"
              options={FlashShapeSchema.options}
              bind:value={blast.flash.shape}
              stretch
            />
            {#if blast.flash.shape === "Cone"}
              <RingSlider
                label="Cone opening"
                min={20}
                max={180}
                step={5}
                unit="°"
                bind:value={blast.flash.cone}
              />
            {/if}
            <RingSlider
              label="White core radius"
              min={4}
              max={40}
              step={1}
              unit="u"
              bind:value={blast.flash.core}
            />
            <RingSlider
              label="Reach of the pale light"
              min={60}
              max={300}
              step={10}
              unit="u"
              bind:value={blast.flash.reach}
            />
            <RingSlider
              label="Pale light brightness"
              min={0}
              max={1}
              step={0.05}
              digits={2}
              bind:value={blast.flash.light}
            />
            <RingSlider
              label="Flash length"
              min={1}
              max={6}
              step={1}
              unit="ticks"
              bind:value={blast.flash.ticks}
            />
          </div>
        </details>

        <details>
          <summary>Particles</summary>
          <div class="group">
            <RingSlider
              label="Particles in each explosion"
              min={0}
              max={24}
              step={1}
              bind:value={blast.particles.count}
            />
            <RingSlider
              label="Leaving angle, either side of the exhaust"
              min={0}
              max={60}
              step={1}
              unit="°"
              bind:value={blast.particles.angle}
            />
            <RingSlider
              label="Length before the split"
              min={5}
              max={200}
              step={5}
              unit="u"
              bind:value={blast.particles.before}
            />
            <RingSlider
              label="Angle between the branches"
              min={10}
              max={60}
              step={1}
              unit="°"
              bind:value={blast.particles.split}
            />
            <RingSlider
              label="Length after the split, longer branch"
              min={0}
              max={300}
              step={5}
              unit="u"
              bind:value={blast.particles.after}
            />
            <RingSlider
              label="Speed"
              min={100}
              max={600}
              step={10}
              unit="u/s"
              bind:value={blast.particles.speed}
            />
          </div>
        </details>

        <details>
          <summary>Lance</summary>
          <div class="group">
            <RingSlider
              label="Length"
              min={40}
              max={400}
              step={10}
              unit="u"
              bind:value={blast.lance.length}
            />
            <RingSlider
              label="Width"
              min={4}
              max={60}
              step={1}
              unit="u"
              bind:value={blast.lance.width}
            />
            <RingSlider
              label="Widest point, along the length"
              min={0}
              max={90}
              step={2}
              unit="%"
              bind:value={blast.lance.widest}
            />
            <RingSlider
              label="Start: blunt to pointed"
              min={0.15}
              max={2}
              step={0.05}
              digits={2}
              bind:value={blast.lance.start}
            />
            <RingSlider
              label="Far end: full to thin"
              min={0.5}
              max={3}
              step={0.05}
              digits={2}
              bind:value={blast.lance.tail}
            />
            <RingSlider
              label="White lance lasts"
              min={2}
              max={20}
              step={1}
              unit="ticks"
              bind:value={blast.lance.ticks}
            />
            <RingSlider
              label="Green is fed for"
              min={0}
              max={30}
              step={1}
              unit="ticks"
              bind:value={blast.lance.green}
            />
          </div>
        </details>

        <button
          type="button"
          class="btn"
          onclick={() => (blast = structuredClone(ASSUMED_BLAST))}
        >
          Reset light to the 02.4 assumption
        </button>
      </div>
    </details>
  {/snippet}
</FlightSceneInstrument>

<style>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
.group {
  display: grid;
  gap: var(--spacing-md);
}
.group p {
  margin: 0;
}
details {
  margin-top: var(--spacing-lg);
}
summary {
  cursor: pointer;
  margin-bottom: var(--spacing-md);
}
.chart {
  width: max-content;
  margin: var(--spacing-sm) 0 0;
  padding: var(--spacing-sm);
  background: color-mix(in lch, var(--color-elev-1) 78%, transparent);
  color: var(--color-text-muted);
  font-family: var(--font-family-ui);
  font-size: var(--font-size-caption);
}
.chart figcaption {
  margin-bottom: var(--spacing-xs);
}
.chart svg {
  display: block;
}
.chart path {
  fill: none;
  stroke-width: 1.25;
}
.chart path.dialled {
  stroke-width: 2.25;
}
.chart .grid {
  stroke: var(--color-text-muted);
  stroke-opacity: 0.18;
}
.chart line.ceiling {
  stroke: var(--color-text);
  stroke-opacity: 0.55;
  stroke-dasharray: 5 4;
}
.chart .tick {
  fill: var(--color-text-muted);
  font-size: 10px;
}
.chart ul {
  display: grid;
  grid-template-columns: repeat(2, max-content);
  gap: 2px var(--spacing-md);
  margin: var(--spacing-xs) 0 0;
  padding: 0;
  list-style: none;
}
.chart li {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
.key {
  width: 18px;
  border-top: 1.5px solid var(--c);
}
.key.dialled {
  border-top-width: 3px;
}
.key.dashed {
  border-top-style: dashed;
}
.key.dotted {
  border-top-style: dotted;
}
.key.ceiling {
  border-top: 1.5px dashed var(--color-text);
  opacity: 0.55;
}
</style>
