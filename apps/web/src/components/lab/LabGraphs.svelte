<script lang="ts">
import "./catalog.css";
import {
	calculate,
	InstrumentConfig,
	SECONDS,
	TICK_RATE,
	TRACK_COLORS,
	traces,
} from "../../lib/instrument";
import { STARTER_DOCUMENT } from "../../lib/instrument/starter";
import RingSlider from "../inputs/RingSlider.svelte";
import PathPane from "./instrument/PathPane.svelte";
import TimeGraph from "./instrument/TimeGraph.svelte";

// Reference for the instrument's graphs, drawn 1:1 in their logical pixels
// from the starting document, with one time control driving both.
let { label = "Graphs design system" }: { label?: string } = $props();

const doc = InstrumentConfig.parse(STARTER_DOCUMENT);
const tracks = doc.vehicles.map((v, i) => {
	const samples = calculate(v, doc.burn);
	return {
		label: v.label,
		color: TRACK_COLORS[i],
		samples,
		traces: traces(samples),
	};
});
let time = $state(7);
const tick = $derived(Math.round(time * TICK_RATE));
</script>

<section class="catalog" aria-label={label}>
	<p>
		The instrument's two diagrams. Both are displays in the instrument display
		material on the console, elevation 1, and draw in logical pixels that their
		host scales.
		<a href="/lab/instrument">The composed instrument →</a>
	</p>
	<div style="max-width: 672px">
		<RingSlider
			label="Time for the examples"
			unit="s"
			digits={2}
			min={0}
			max={SECONDS}
			step={1 / TICK_RATE}
			bind:value={time}
		/>
	</div>

	<section>
		<h2>Path pane</h2>
		<p>
			A square plan view of every vehicle's path. At the current time each path
			has a marker and a short tick across it. The scale switch sits top right:
			fit all paths, or the default scale (0.2 px/u), which pans by dragging.
			The name, the area shown, the grid and the scale read on one line, bottom
			right.
			<a href="/lab/studies/lab-instrument-2026-11-01#readout">Study →</a>
		</p>
		<div class="example">
			<PathPane {tracks} {tick} size={672} />
		</div>
		<p>
			<code>PathPane</code>: <code>tracks</code>, <code>tick</code>,
			<code>size</code>
			of the square, and the host's <code>scale</code> so dragging follows the
			pointer.
		</p>
	</section>

	<section>
		<h2>Time graph</h2>
		<p>
			One measure for every vehicle against 0–14 s. The value axis scales to fit
			the data, one tick step above the peak; a measure that can go negative
			stays symmetric about zero. The title row names the measure and unit and
			gives each vehicle's value at the cursor in its colour. Every label sits
			outside the data. The instrument shows it three times.
			<a href="/lab/studies/lab-instrument-2026-11-01#composed">Study →</a>
		</p>
		<div class="example">
			<span class="caption">Speed: starts at zero</span>
			<TimeGraph measure="speed" {tracks} {tick} />
			<span class="caption"
				>Turn acceleration: signed, symmetric about zero</span
			>
			<TimeGraph measure="turn" {tracks} {tick} />
		</div>
		<p>
			<code>TimeGraph</code>: <code>measure</code> (speed, acceleration or turn;
			gravity or distance to well on the Gravity tuning bench),
			<code>tracks</code>, <code>tick</code>, <code>width</code> and
			<code>height</code>
			(672 × 208 in the instrument). Its plot margins are exported as
			<code>GRAPH_MARGIN</code>
			so controls can line up with the time axis.
		</p>
	</section>
</section>
