<script lang="ts">
import { EnergyAnalysis } from "../../../lib/instrument/energy";

let { energy = $bindable() }: { energy: EnergyAnalysis | undefined } = $props();
let error = $state("");
function edit(change: (draft: EnergyAnalysis) => void) {
	if (!energy) return;
	const draft = $state.snapshot(energy);
	change(draft);
	const result = EnergyAnalysis.safeParse(draft);
	if (result.success) {
		energy = result.data;
		error = "";
	} else error = result.error.issues.map((i) => i.message).join("; ");
}
const keys = ["x", "y", "reach", "shoulder", "peak", "outerFraction"] as const;
</script>
<section aria-label="Energy fields">
	<h4>Collection fields</h4>
	<label
		><input
			type="checkbox"
			checked={!!energy}
			onchange={(e) =>
				(energy = e.currentTarget.checked
					? EnergyAnalysis.parse({
							fields: [
								{
									x: 400,
									y: 0,
									reach: 324,
									shoulder: 55,
									peak: 7.5,
									outerFraction: 0.1,
								},
							],
						})
					: undefined)}
		>
		Energy analysis</label
	>
	{#if energy}
		<p>
			Gross collection and consumption in E/s. Battery change is an unclamped
			integral; capacity and starvation do not affect these paths.
		</p>
		{#each ["lifeSupport", "ionDraw"] as key}
			{@const name = key as "lifeSupport" | "ionDraw"}
			<label
				>{name === "lifeSupport"
					? "Life support (E/s)"
					: "Light ion draw (E/s)"}<input
					type="number"
					step="any"
					value={energy[name]}
					onchange={(e) =>
						edit((d) => {
							d[name] = Number(e.currentTarget.value);
						})}
				></label
			>
		{/each}
		{#each energy.fields as field, i}
			<fieldset>
				<legend>Collection {i + 1}</legend>
				{#each keys as key}
					<label
						>{key}<input
							type="number"
							step="any"
							value={field[key]}
							onchange={(e) =>
								edit((d) => {
									d.fields[i][key] = Number(e.currentTarget.value);
								})}
						></label
					>
				{/each}
				<button
					class="btn btn-ghost"
					type="button"
					onclick={() =>
						edit((d) => {
							d.fields.splice(i, 1);
						})}
				>
					Remove field
				</button>
			</fieldset>
		{/each}
		<button
			class="btn btn-ghost"
			type="button"
			onclick={() =>
				edit((d) => {
					d.fields.push({
						x: 400,
						y: 0,
						reach: 324,
						shoulder: 55,
						peak: 7.5,
						outerFraction: 0.1,
					});
				})}
		>
			Add collection field
		</button>
	{/if}
	{#if error}
		<p role="alert">{error}</p>
	{/if}
</section>
<style>
section {
	display: grid;
	gap: 12px;
}
label {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
}
fieldset {
	display: grid;
	gap: 8px;
	border: 1px solid var(--color-border);
}
input[type="number"] {
	width: 100px;
	color: var(--color-text);
	background: var(--color-elev-1);
	border: 1px solid var(--color-border);
	padding: 4px;
}
p {
	color: var(--color-text-muted);
}
</style>
