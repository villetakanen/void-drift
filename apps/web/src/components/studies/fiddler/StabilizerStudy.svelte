<script lang="ts">
import "@void-drift/core/styles/buttons.css";
import { onMount } from "svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import Toggle from "../../inputs/Toggle.svelte";
import {
	FOUR_ENGINE_FIT,
	type FourEngineFit,
	FourEngineFitSchema,
} from "./engine-placement";
import StabilizerEditor from "./StabilizerEditor.svelte";
import {
	adjustStabilizer,
	type PairPlacement,
	STABILIZER_DECIDED,
	type StabilizerPair,
	type StabilizerPlacement,
	StabilizerPlacementSchema,
} from "./stabilizer-placement";

let { label = "Turning-thruster placement" }: { label?: string } = $props();
const storageKey = "void-drift:study:lhi-fiddler-stabilizers:decided-v2";
let placement = $state<StabilizerPlacement>(
	StabilizerPlacementSchema.parse(STABILIZER_DECIDED),
);
let fit = $state<FourEngineFit>({ ...FOUR_ENGINE_FIT });
let selected = $state("Front");
let view = $state("Engines");
let ready = $state(false);
let saved = $state(false);
const pair = $derived<StabilizerPair>(selected === "Front" ? "front" : "rear");
function change(pair: StabilizerPair, values: Partial<PairPlacement>) {
	placement[pair] = adjustStabilizer(placement[pair], values);
}
function readEngineFit() {
	try {
		const raw = localStorage.getItem(
			"void-drift:study:lhi-fiddler-four-engines:v1",
		);
		if (raw) {
			const parsed = FourEngineFitSchema.safeParse(JSON.parse(raw));
			if (parsed.success) fit = parsed.data;
		}
	} catch {
		/* Keep the current clearance reference when storage is unavailable. */
	}
}
onMount(() => {
	readEngineFit();
	try {
		const raw = localStorage.getItem(storageKey);
		if (raw) {
			const parsed = StabilizerPlacementSchema.safeParse(JSON.parse(raw));
			if (parsed.success) placement = parsed.data;
		}
	} catch {
		/* Placement still works without browser storage. */
	}
	ready = true;
});
$effect(() => {
	if (!ready) return;
	try {
		localStorage.setItem(storageKey, JSON.stringify(placement));
		saved = true;
	} catch {
		saved = false;
	}
});
</script>

<p>
	Drag any of the four blue-edged slits. Its partner mirrors the move. Choose a
	pair below to adjust its position and tilt precisely.
</p>
<div class="toolbar">
	<Toggle
		label="Stabilizer placement view"
		compact
		options={["Hull", "Engines", "Fitted"]}
		bind:value={view}
	/>
	<button
		type="button"
		class="btn btn-ghost"
		onclick={() =>
			(placement = StabilizerPlacementSchema.parse(STABILIZER_DECIDED))}
	>
		Reset to decision
	</button>
</div>
<fieldset class="workbench" aria-label={label} onfocusin={readEngineFit}>
	<div class="drawing">
		<StabilizerEditor
			{placement}
			{fit}
			{view}
			onchange={change}
			onselect={(pair) => (selected = pair === "front" ? "Front" : "Rear")}
		/>
	</div>
	<div class="adjustments">
		<div class="pair-selector">
			<Toggle
				label="Turning-thruster pair"
				compact
				options={["Front", "Rear"]}
				bind:value={selected}
			/>
		</div>
		<RingSlider
			label={`${selected} pair spacing`}
			min={2}
			max={60}
			step={0.2}
			digits={1}
			unit="u"
			bind:value={
				() => placement[pair].halfSpan * 2,
				(value) => change(pair, { halfSpan: value / 2 })
			}
		/>
		<RingSlider
			label={`${selected} fore–aft position`}
			min={-62}
			max={62}
			step={0.1}
			digits={1}
			unit="u"
			bind:value={
				() => placement[pair].y,
				(value) => change(pair, { y: value })
			}
		/>
		<div class="tilt">
			<RingSlider
				label={`${selected} slit tilt`}
				min={-90}
				max={90}
				step={0.5}
				digits={1}
				unit="°"
				bind:value={
					() => placement[pair].angle,
					(value) => change(pair, { angle: value })
				}
			/>
		</div>
		<p class="caption">
			Negative fore–aft values move toward the nose. Tilt 0° faces exhaust
			sideways; positive tilts it toward the nose, negative toward the tail.
		</p>
		<p class="caption">
			Arrow keys move a focused slit; Shift makes larger moves. Hull hides
			fittings, while all four turning thrusters stay visible. They are
			permanently fitted and enabled.
		</p>
		<p class="caption" role="status">
			{saved
				? "Your placement is saved in this browser."
				: "Placement stays in this page while you edit."}
		</p>
	</div>
</fieldset>
<div class="readout">
	<p>
		<strong>Front pair</strong><br>Spacing
		{(placement.front.halfSpan * 2).toFixed(1)}
		· fore–aft
		{placement.front.y.toFixed(1)}
		· tilt {placement.front.angle.toFixed(1)}°
	</p>
	<p>
		<strong>Rear pair</strong><br>Spacing
		{(placement.rear.halfSpan * 2).toFixed(1)}
		· fore–aft
		{placement.rear.y.toFixed(1)}
		· tilt {placement.rear.angle.toFixed(1)}°
	</p>
</div>
<p class="caption">
	Uses Wasp’s actual turning-thruster artwork and your saved engine choices from
	02.12. Free placement is for visual review; hull support, exhaust clearance
	and turning strength are not automatically validated.
</p>

<style>
fieldset {
	border: 0;
	padding: 0;
	margin: 0;
	min-width: 0;
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
.drawing {
	width: min(100%, 340px);
	margin-inline: auto;
}
.adjustments {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	align-content: center;
	gap: var(--spacing-md) var(--spacing-lg);
}
.pair-selector,
.tilt,
.adjustments p {
	grid-column: 1 / -1;
}
.adjustments p {
	margin: 0;
}
.readout {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--spacing-lg);
	font-size: var(--font-size-caption);
}
.caption {
	color: var(--color-text-muted);
	font-size: var(--font-size-caption);
	max-width: var(--measure-prose);
}
@media (min-width: 850px) {
	.workbench {
		grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
	}
}
</style>
