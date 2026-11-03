<script lang="ts">
import "@void-drift/core/styles/buttons.css";
import { onMount } from "svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import Toggle from "../../inputs/Toggle.svelte";
import CapacityDrawing from "./CapacityDrawing.svelte";
import WindowEditor from "./WindowEditor.svelte";
import {
	adjustWindow,
	WINDOW_DEFAULT,
	WINDOW_LENGTH,
	WINDOW_LIMITS,
	WINDOW_WIDTH,
	type WindowDraft,
	WindowDraftSchema,
} from "./window-placement";

const storageKey = "void-drift:study:lhi-fiddler-window:v1";
let { label = "Fiddler window tool" }: { label?: string } = $props();
let draft = $state<WindowDraft>({ ...WINDOW_DEFAULT });
let view = $state("Fitted");
let ready = $state(false);
let saved = $state(false);
function change(values: Partial<WindowDraft>) {
	draft = adjustWindow(draft, values);
}
onMount(() => {
	try {
		const raw = localStorage.getItem(storageKey);
		if (raw) {
			const result = WindowDraftSchema.safeParse(JSON.parse(raw));
			if (result.success) draft = result.data;
		}
	} catch {
		// Editing still works when browser storage is unavailable.
	}
	ready = true;
});
$effect(() => {
	if (!ready) return;
	try {
		localStorage.setItem(storageKey, JSON.stringify(draft));
		saved = true;
	} catch {
		saved = false;
	}
});
</script>

<p class="instruction">
	Drag the black window to move it. Adjust its size below; the Wasp proportions
	stay locked.
</p>
<div class="toolbar">
	<Toggle
		label="Window study view"
		compact
		options={["Fitted", "Hull"]}
		bind:value={view}
	/>
	<button
		type="button"
		class="btn btn-ghost"
		onclick={() => (draft = { ...WINDOW_DEFAULT })}
	>
		Reset window
	</button>
</div>
<section class="workbench" aria-label={label}>
	<div class="drawing">
		<WindowEditor {draft} {view} onmove={(x, y) => change({ x, y })} />
	</div>
	<div class="adjustments">
		<div class="size">
			<RingSlider
				label="Window size"
				min={WINDOW_LIMITS.scale[0] * 100}
				max={WINDOW_LIMITS.scale[1] * 100}
				step={1}
				unit="% of Wasp"
				bind:value={
					() => draft.scale * 100,
					(value) => change({ scale: value / 100 })
				}
			/>
		</div>
		<RingSlider
			label="Left–right"
			min={WINDOW_LIMITS.x[0]}
			max={WINDOW_LIMITS.x[1]}
			step={0.1}
			digits={1}
			bind:value={() => draft.x, (value) => change({ x: value })}
		/>
		<RingSlider
			label="Fore–aft"
			min={WINDOW_LIMITS.y[0]}
			max={WINDOW_LIMITS.y[1]}
			step={0.1}
			digits={1}
			bind:value={() => draft.y, (value) => change({ y: value })}
		/>
		<p class="readout">
			Glass: {(WINDOW_LENGTH * draft.scale).toFixed(1)} ×
			{(WINDOW_WIDTH * draft.scale).toFixed(1)}
			units. 100% matches Wasp’s actual window size.
		</p>
		<p class="caption">
			Negative values move left / forward. Focus the window and use arrow keys
			for small moves; Shift moves farther.
		</p>
		<p class="caption" role="status">
			{saved
				? "Your window settings are saved in this browser."
				: "Window settings stay in this page while you edit."}
		</p>
	</div>
</section>
<details class="detail">
	<summary>Compare with the enlarged window from 02.9</summary>
	<div class="reference">
		<CapacityDrawing
			ship="fiddler"
			hullScale={1.35}
			{view}
			label={`Previous enlarged window, ${view.toLowerCase()} view`}
		/>
	</div>
	<p class="caption">
		Same hull and drawing scale. The old glass is 26.3 × 8.3 units; it grew with
		the hull.
	</p>
</details>
<p class="caption">
	The hull and ten trial items stay fixed. Framing edges follow the glass. This
	is a placement tool: extreme positions can pull the framing out of shape, and
	equipment clearance still needs review.
</p>

<style>
.instruction {
	max-width: var(--measure-prose);
}
.toolbar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: var(--spacing-md);
	margin-block: var(--spacing-lg);
}
.workbench {
	display: grid;
	gap: var(--spacing-lg);
}
.drawing,
.reference {
	width: min(100%, 320px);
	margin-inline: auto;
}
.adjustments {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--spacing-md) var(--spacing-lg);
	align-content: center;
}
.size,
.readout,
.caption {
	grid-column: 1 / -1;
}
.adjustments p {
	margin: 0;
}
.caption {
	color: var(--color-text-muted);
	font-size: var(--font-size-caption);
}
.detail {
	margin-block: var(--spacing-lg);
}
.detail summary {
	cursor: pointer;
	font-weight: var(--font-weight-bold);
}
@media (min-width: 850px) {
	.workbench {
		grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
	}
	.reference {
		margin-inline: 0;
	}
}
</style>
