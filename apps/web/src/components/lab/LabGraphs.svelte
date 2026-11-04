<script lang="ts">
import "./catalog.css";
import {
	documentTracks,
	InstrumentConfig,
	SECONDS,
	TICK_RATE,
} from "../../lib/instrument";
import { FIELD_DOCUMENT, STARTER_DOCUMENT } from "../../lib/instrument/starter";
import RingSlider from "../inputs/RingSlider.svelte";
import PathPane from "./instrument/PathPane.svelte";
import TimeGraph from "./instrument/TimeGraph.svelte";

// Reference for the instrument's graphs, drawn 1:1 in their logical pixels
// from the starting document, with one time control driving both.
let { label = "Graphs design system" }: { label?: string } = $props();

const tracks = documentTracks(InstrumentConfig.parse(STARTER_DOCUMENT));
// Field mode: the same diagrams in the world frame, from the field document.
const fieldTracks = documentTracks(InstrumentConfig.parse(FIELD_DOCUMENT));
const bodies = fieldTracks
	.map((t) => t.run)
	.filter((run) => run !== undefined)
	.sort((a, b) => b.samples.length - a.samples.length)[0]?.bodies;
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
			<code>TimeGraph</code>: <code>measure</code> (speed, acceleration, turn,
			gravity or surface),
			<code>tracks</code>, <code>tick</code>, <code>width</code> and
			<code>height</code>
			(672 × 208 in the instrument). Its plot margins are exported as
			<code>GRAPH_MARGIN</code>
			so controls can line up with the time axis.
		</p>
	</section>

	<section>
		<h2>Field mode</h2>
		<p>
			A document with a field draws in the world frame. Under the paths: the sun
			and planets as their surfaces with dashed reach rings, and Lab wells as a
			cross and reach ring in caution yellow, since they have no surface. A
			diamond marks each planet contact; a wrap breaks the path line. Each path
			ends in its outcome: a cross for a run that ended (sun, hull or power), a
			square for bound, an arrowhead for free. The graphs become speed, gravity
			and distance to the nearest surface; a run that ended holds its last
			value. These four probes coast past frozen planets.
			<a href="/lab/instrument">The composed instrument →</a>
		</p>
		<div class="example">
			<PathPane tracks={fieldTracks} bodies={bodies ?? []} {tick} size={672} />
			<span class="caption"
				>Gravity: summed pull of every body and Lab well</span
			>
			<TimeGraph measure="gravity" tracks={fieldTracks} {tick} />
			<span class="caption">Nearest surface: Lab wells count by centre</span>
			<TimeGraph measure="surface" tracks={fieldTracks} {tick} />
		</div>
		<p>
			<code>PathPane</code>
			takes the field's <code>bodies</code> (from the longest run);
			<code>documentTracks</code>
			calculates either kind of document.
		</p>
	</section>
</section>
