<script lang="ts">
import { onMount } from "svelte";
import "./instrument-display.css";
import { exampleSeries, exampleTick, SCREEN } from "./instrument-example";
import TraceGraph010 from "./TraceGraph010.svelte";

let { label = "The three time graphs" }: { label?: string } = $props();

// One 672px column. The three graphs, then the input lanes and the time
// slider (not drawn here), fill the path tool's 672px height: 3 × 176 graphs
// with 16px gaps leave 112px for the lanes and slider below.
const W = 672;
const GRAPH = 176;
const GAP = 16;
const H = 3 * GRAPH + 2 * GAP;
const measures = ["speed", "acceleration", "turn"] as const;

let scale = $state(0.8);
function measure() {
  scale = Math.min(innerWidth / SCREEN.w, innerHeight / SCREEN.h);
}
onMount(() => {
  measure();
  addEventListener("resize", measure);
  return () => removeEventListener("resize", measure);
});
</script>

<section class="area instrument-display" aria-label={label}>
  <div class="host" style={`width:${W * scale}px;height:${H * scale}px`}>
    <div class="scaled" style={`transform:scale(${scale})`}>
      {#each measures as m, i}
        <div style={`position:absolute;top:${i * (GRAPH + GAP)}px`}>
          <TraceGraph010
            measure={m}
            series={exampleSeries}
            tick={exampleTick}
            width={W}
            height={GRAPH}
          />
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
/* The console: elevation 1 from the shared display material. */
.area {
  display: grid;
  justify-items: center;
  margin-block: var(--spacing-lg);
  padding: var(--spacing-xl) var(--spacing-lg);
  background: var(--_elev-1);
}
.host {
  position: relative;
}
.scaled {
  position: relative;
  transform-origin: top left;
  color: var(--color-text);
}
</style>
