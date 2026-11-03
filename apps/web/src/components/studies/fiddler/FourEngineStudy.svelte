<script lang="ts">
import {
	buildMounts,
	defaultLoadout,
	EngineIdSchema,
	PARTS,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import Toggle from "../../inputs/Toggle.svelte";
import CapacityDrawing from "./CapacityDrawing.svelte";
import { CAPACITY_VIEW } from "./connected-form";
import {
	FOUR_ENGINE_FIT,
	FOUR_ENGINE_LAYOUT,
	type FourEngineFit,
	FourEngineFitSchema,
	pairMounts,
	TRIAL_EQUIPMENT_MASS,
	TRIAL_HULL_MASS,
} from "./engine-placement";
import { WINDOW_DEFAULT } from "./window-placement";

let { label = "Four-engine Fiddler view" }: { label?: string } = $props();
let view = $state("Slots");
let fit = $state<FourEngineFit>({ ...FOUR_ENGINE_FIT });
let ready = $state(false);
let saved = $state(false);
const storageKey = "void-drift:study:lhi-fiddler-four-engines:v1";
const engineChoices = EngineIdSchema.options.map((id) => ({
	id,
	name: PARTS[id].name,
}));
const fittedEngineMass = $derived(
	2 * (PARTS[fit.roots].mass + PARTS[fit.rear].mass),
);
function choose(pair: "roots" | "rear", name: string) {
	const engine = engineChoices.find((option) => option.name === name);
	if (!engine) return;
	fit[pair] = engine.id;
	if (view === "Hull" || view === "Slots") view = "Engines";
}
onMount(() => {
	try {
		const raw = localStorage.getItem(storageKey);
		if (raw) {
			const parsed = FourEngineFitSchema.safeParse(JSON.parse(raw));
			if (parsed.success) fit = parsed.data;
		}
	} catch {
		/* The fitting tool also works without browser storage. */
	}
	ready = true;
});
$effect(() => {
	if (!ready) return;
	try {
		localStorage.setItem(storageKey, JSON.stringify(fit));
		saved = true;
	} catch {
		saved = false;
	}
});
const { width, height, zoom } = CAPACITY_VIEW;
const roots = pairMounts(FOUR_ENGINE_LAYOUT.roots);
const rear = pairMounts(FOUR_ENGINE_LAYOUT.rear);
// Reuse current production engine-slot guide dimensions; these are not an
// automatically checked fitting or a new production chassis definition.
const slot = buildMounts(defaultLoadout("corvette")).find(
	(mount) => mount.type === "engine",
);
const mounts = [
	...roots.map((at, i) => ({ at, underwing: true, name: `E${i + 1}` })),
	...rear.map((at, i) => ({ at, underwing: false, name: `E${i + 3}` })),
];
</script>

<div class="toolbar">
	<Toggle
		{label}
		compact
		options={["Hull", "Slots", "Engines", "Fitted"]}
		bind:value={view}
	/>
</div>
<div class="drawing">
	<CapacityDrawing
		ship="fiddler"
		hullScale={1.35}
		{view}
		windowDraft={WINDOW_DEFAULT}
		engineMounts={rear}
		underwingEngineMounts={roots}
		engineType={fit.rear}
		underwingEngineType={fit.roots}
		label={`Four-engine Fiddler, ${view.toLowerCase()} view, blade-root engines below the wings`}
	/>
	{#if view !== "Hull"}
		<svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
			<g transform={`translate(${width / 2} ${height / 2}) scale(${zoom})`}>
				{#each mounts as { at: [x, y], underwing, name }}
					{#if view === "Slots" && slot}
						<rect
							class:underwing
							x={x - slot.height / 2}
							y={y - slot.width / 2}
							width={slot.height}
							height={slot.width}
						/>
						<text {x} {y}>{name}</text>
					{/if}
					<path d={`M ${x} ${y + 13} v 12 m -1.4 -1.8 l 1.4 1.8 l 1.4 -1.8`} />
				{/each}
			</g>
		</svg>
	{/if}
</div>
<div class="positions">
	<p>
		<strong>Blade roots · E1 + E2</strong><br>Spacing
		{FOUR_ENGINE_LAYOUT.roots.spacing}
		· fore–aft +{FOUR_ENGINE_LAYOUT.roots.y}<br>Below the wings
	</p>
	<p>
		<strong>Rear pair · E3 + E4</strong><br>Spacing
		{FOUR_ENGINE_LAYOUT.rear.spacing}
		· fore–aft +{FOUR_ENGINE_LAYOUT.rear.y}<br>On the rear body
	</p>
</div>
<div class="pair-choices">
	<p><strong>E1 + E2 · linked blade-root engines</strong></p>
	<Toggle
		label="E1 and E2 engine type"
		compact
		options={engineChoices.map((option) => option.name)}
		bind:value={() => PARTS[fit.roots].name, (name) => choose("roots", name)}
	/>
	<p><strong>E3 + E4 · linked rear engines</strong></p>
	<Toggle
		label="E3 and E4 engine type"
		compact
		options={engineChoices.map((option) => option.name)}
		bind:value={() => PARTS[fit.rear].name, (name) => choose("rear", name)}
	/>
	<p class="caption">
		Engine-only slots. Each choice fits both slots in that pair; the two pairs
		may differ. Current engine mass: {fittedEngineMass}. With the trial
		equipment:
		{TRIAL_HULL_MASS + TRIAL_EQUIPMENT_MASS + fittedEngineMass}
		total.
	</p>
	<p class="caption" role="status">
		{saved
			? "Pair choices are saved in this browser."
			: "Pair choices stay in this page while you edit."}
	</p>
</div>
<p class="caption">
	Slots shows the four mount guides; dashed boxes mark the underwing pair.
	Engines shows the selected pairs, with the wings covering the root engines.
	Fitted adds the eight trial equipment items. Arrows indicate exhaust direction
	only.
</p>
<p class="caption">
	The four main engines share one forward-drive command. Four built-in turning
	stabilizers are separate; their placement remains open.
</p>

<style>
.toolbar {
	margin-block: var(--spacing-lg);
}
.pair-choices {
	margin-block: var(--spacing-lg);
}
.pair-choices > p {
	margin-block: var(--spacing-md) var(--spacing-sm);
}
.drawing {
	position: relative;
	width: min(100%, 360px);
	margin-inline: auto;
}
svg {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
}
rect {
	fill: var(--color-void);
	fill-opacity: 0.55;
	stroke: var(--color-text);
	stroke-width: 0.35;
}
rect.underwing {
	stroke-dasharray: 1.3 0.8;
}
text {
	fill: var(--color-text);
	text-anchor: middle;
	dominant-baseline: central;
	font-family: var(--font-family-ui);
	font-size: 3.2px;
}
path {
	fill: none;
	stroke: var(--color-text-muted);
	stroke-width: 0.35;
	stroke-dasharray: 1.1 1;
}
.positions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--spacing-lg);
	font-size: var(--font-size-caption);
}
.positions p {
	margin-block: var(--spacing-md);
}
.caption {
	color: var(--color-text-muted);
	font-size: var(--font-size-caption);
	max-width: var(--measure-prose);
}
</style>
