<script lang="ts">
import CapacityDrawing from "./CapacityDrawing.svelte";
import {
	FOUR_ENGINE_LAYOUT,
	type FourEngineFit,
	pairMounts,
} from "./engine-placement";
import PlacementHandles from "./PlacementHandles.svelte";
import type {
	PairPlacement,
	StabilizerPair,
	StabilizerPlacement,
} from "./stabilizer-placement";
import { WINDOW_DEFAULT } from "./window-placement";

let {
	placement,
	fit,
	view,
	onchange,
	onselect,
}: {
	placement: StabilizerPlacement;
	fit: FourEngineFit;
	view: string;
	onchange: (pair: StabilizerPair, change: Partial<PairPlacement>) => void;
	onselect: (pair: StabilizerPair) => void;
} = $props();
const roots = pairMounts(FOUR_ENGINE_LAYOUT.roots);
const rear = pairMounts(FOUR_ENGINE_LAYOUT.rear);
const pairs = ["front", "rear"] as const;
const handles = $derived(
	pairs.flatMap((pair) =>
		[-1, 1].map((side) => ({
			id: `${pair}:${side}`,
			pair,
			side,
			x: side * placement[pair].halfSpan,
			y: placement[pair].y,
			label: `${pair === "front" ? "Front" : "Rear"} ${side === -1 ? "left" : "right"} turning thruster: drag or use arrow keys`,
		})),
	),
);
</script>

<div class="editor">
	<CapacityDrawing
		ship="fiddler"
		hullScale={1.35}
		{view}
		windowDraft={WINDOW_DEFAULT}
		engineMounts={rear}
		underwingEngineMounts={roots}
		engineType={fit.rear}
		underwingEngineType={fit.roots}
		stabilizers={placement}
		label={`Fiddler turning-thruster placement, ${view.toLowerCase()} view`}
	/>
	<PlacementHandles
		{handles}
		label="Turning thruster drag controls"
		onselect={(id) => {
			const handle = handles.find((h) => h.id === id);
			if (handle) onselect(handle.pair);
		}}
		onmove={(id, x, y) => {
			const handle = handles.find((h) => h.id === id);
			if (handle) onchange(handle.pair, { halfSpan: handle.side * x, y });
		}}
	/>
</div>

<style>
.editor {
	position: relative;
}
</style>
