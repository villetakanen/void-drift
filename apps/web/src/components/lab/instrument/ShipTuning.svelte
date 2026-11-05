<script lang="ts">
import { type Snippet, untrack } from "svelte";
import {
	calculate,
	FLIGHT_MEASURES,
	InstrumentConfig,
	TRACK_COLORS,
	type Track,
	traces,
} from "../../../lib/instrument";
import DocumentPanel from "./DocumentPanel.svelte";
import MotionInstrumentScreen from "./MotionInstrumentScreen.svelte";

// Ship tuning, the Motion instrument without gravity (study lab-instrument-2026-11-01): compares
// two to six vehicles from one configuration document on the shared
// instrument screen. The pane holds the values under investigation.
let {
	config,
	label = "Ship tuning",
	pane,
}: {
	/** The configuration document; parsed here, so it may come from anywhere. */
	config: unknown;
	label?: string;
	/** Pane content; by default the values editor and the document. */
	pane?: Snippet<[InstrumentConfig]>;
} = $props();

// The document is read once, as the starting point; edits happen in the pane.
const parsed = untrack(() => InstrumentConfig.safeParse(config));
const issues = parsed.success ? [] : parsed.error.issues;
let doc = $state(parsed.success ? parsed.data : null);
const tracks = $derived.by((): Track[] => {
	if (!doc) return [];
	const plain = $state.snapshot(doc);
	return plain.vehicles.map((v, i) => {
		const samples = calculate(v, plain.burn, {}, plain.properties);
		return {
			label: v.label,
			color: TRACK_COLORS[i],
			samples,
			traces: traces(samples),
		};
	});
});
</script>

{#if doc}
	<MotionInstrumentScreen
		{tracks}
		bind:burn={doc.burn}
		measures={FLIGHT_MEASURES}
		{label}
	>
		{#if pane}
			{@render pane(doc)}
		{:else}
			<DocumentPanel bind:config={doc} />
		{/if}
	</MotionInstrumentScreen>
{:else}
	<MotionInstrumentScreen
		tracks={[]}
		burn="course"
		measures={FLIGHT_MEASURES}
		{label}
		{issues}
	>
		{""}
	</MotionInstrumentScreen>
{/if}
