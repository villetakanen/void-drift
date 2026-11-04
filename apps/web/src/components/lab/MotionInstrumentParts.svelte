<script lang="ts">
import "./catalog.css";
import { SHIP_IDENTITY } from "@void-drift/mode-a";
import {
	type BurnId,
	SECONDS,
	TICK_RATE,
	TRACK_COLORS,
	type Track,
} from "../../lib/instrument";
import RingSlider from "../inputs/RingSlider.svelte";
import BurnRow from "./instrument/BurnRow.svelte";
import Legend from "./instrument/Legend.svelte";
import OverlayPane from "./instrument/OverlayPane.svelte";

// Reference for the instrument's own components: the burn row, the legend and
// the pane overlay.
let { label = "Motion instrument parts" }: { label?: string } = $props();

let burn = $state<BurnId>("course");
let time = $state(7);
const tick = $derived(Math.round(time * TICK_RATE));
// The legend only reads labels and colours.
const named = (labels: string[]): Track[] =>
	labels.map((l, i) => ({
		label: l,
		color: TRACK_COLORS[i],
		samples: [],
		traces: { speed: [], acceleration: [], turn: [] },
	}));
const three = named(["Ion aft", "Plasma aft", "Plasma aft, more thrust"]);
const six = named([
	SHIP_IDENTITY.scout.shortName,
	SHIP_IDENTITY.fighter.shortName,
	SHIP_IDENTITY.corvette.shortName,
	"Ion",
	"Fusion",
	"Plasma",
]);
</script>

<section class="catalog" aria-label={label}>
	<section>
		<h2>Burn row</h2>
		<p>
			The compact B1–B3 switcher, then the chosen burn's input lanes: the left
			engine above, the right below, lit soft white (white at 70%). The input
			firing at the current time is full white, and a line marks that time. It
			is 44px tall, the height of a control.
			<a href="/lab/studies/lab-instrument-2026-11-01#burns">Study →</a>
		</p>
		<div class="example" style="justify-items: stretch">
			<div style="max-width: 672px; width: 100%">
				<BurnRow bind:burn {tick} />
			</div>
			<div style="max-width: 672px; width: 100%">
				<RingSlider
					label="Time for the example"
					unit="s"
					digits={2}
					min={0}
					max={SECONDS}
					step={1 / TICK_RATE}
					bind:value={time}
				/>
			</div>
		</div>
		<p>
			<code>BurnRow</code>: bindable <code>burn</code> (course, turn or weave)
			and <code>tick</code>. Each burn is 14 s; B1 Course, B2 Turn, B3 Weave.
		</p>
	</section>

	<section>
		<h2>Legend</h2>
		<p>
			One row naming two to six vehicles, each with a short line in its colour.
			The colours are fixed in order, so a vehicle keeps its colour in every
			diagram.
		</p>
		<div class="example">
			<Legend tracks={three} />
			<Legend tracks={six} />
		</div>
	</section>

	<section>
		<h2>Pane overlay</h2>
		<p>
			Placed on its container, unscaled. A menu button in the top-right corner
			opens it; its close button takes that corner; Escape closes it and returns
			focus to the menu. It is elevation 3, 45% of the container wide, over an
			11% backdrop. What it holds is up to the host; the instrument fills it
			with the values under investigation and the document.
			<a href="/lab/studies/lab-instrument-2026-11-01#readiness">Study →</a>
		</p>
		<div class="example overlay-demo">
			<p class="caption">The container: open the pane from its corner.</p>
			<OverlayPane>
				<p>Pane content, filled by the host.</p>
			</OverlayPane>
		</div>
		<p>
			<code>OverlayPane</code>: <code>title</code>, <code>label</code> for
			assistive technology, and its content as children. The host must be
			positioned.
		</p>
	</section>
</section>

<style>
.overlay-demo {
	position: relative;
	height: 360px;
	max-width: 840px;
	box-sizing: border-box;
}
</style>
