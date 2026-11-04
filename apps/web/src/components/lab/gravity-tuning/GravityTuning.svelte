<script lang="ts">
import { massWellReach } from "@void-drift/core";
import { untrack } from "svelte";
import {
	editGravityTuning,
	flyBench,
	GravityTuningConfig,
} from "../../../lib/gravity-tuning";
import {
	type FieldBody,
	TRACK_COLORS,
	type Track,
} from "../../../lib/instrument";
import InstrumentScreen from "../instrument/InstrumentScreen.svelte";
import GravityPanel from "./GravityPanel.svelte";

// Gravity tuning (docs/specs/gravity-tuning.md): one well in empty space and
// the four given ships on the instrument's burns, on the shared instrument
// screen, each ship's unaffected path dotted and its thrust dashed on the
// gravity graph. The pane holds the settings and the document.
let {
	config,
	label = "Gravity tuning",
}: {
	/** The bench document; parsed here, so it may come from anywhere. */
	config: unknown;
	label?: string;
} = $props();

const MEASURES = ["speed", "gravity", "distance"] as const;
const parsed = untrack(() => GravityTuningConfig.safeParse(config));
const issues = parsed.success ? [] : parsed.error.issues;
let doc = $state(parsed.success ? parsed.data : null);

const tracks = $derived.by((): Track[] =>
	doc
		? flyBench($state.snapshot(doc)).map((run, i) => ({
				label: run.label,
				color: TRACK_COLORS[i],
				samples: run.samples,
				unaffected: run.unaffected,
				contacts: run.contacts,
				references: { gravity: run.thrust },
				traces: {
					speed: run.samples.map((s) => Math.hypot(s.vx, s.vy)),
					gravity: run.gravity,
					distance: run.distance,
				},
			}))
		: [],
);
const bodies = $derived.by((): FieldBody[] =>
	doc
		? [
				{
					kind: "well",
					label: "Well",
					color: "",
					radius: doc.well.radius,
					reach: massWellReach(doc.well.strength, doc.well.sizeMultiplier),
					path: [{ x: doc.well.x, y: doc.well.y }],
				},
			]
		: [],
);
function moveWell(_index: number, x: number, y: number) {
	if (!doc) return;
	const result = editGravityTuning($state.snapshot(doc), (draft) => {
		draft.well.x = x;
		draft.well.y = y;
	});
	if (result.ok) doc = result.doc;
}
</script>

{#if doc}
	<InstrumentScreen
		{tracks}
		{bodies}
		bind:burn={doc.burn}
		measures={MEASURES}
		onmovewell={moveWell}
		{label}
	>
		<GravityPanel bind:config={doc} />
	</InstrumentScreen>
{:else}
	<InstrumentScreen
		tracks={[]}
		burn="course"
		measures={MEASURES}
		{label}
		{issues}
	>
		{""}
	</InstrumentScreen>
{/if}
