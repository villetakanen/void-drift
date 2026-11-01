<script lang="ts">
// Frozen: the 02.7 example, drawing the frozen 02.7 instrument.
import LabInstrument027 from "./LabInstrument027.svelte";
import {
	calculate,
	describeChanges,
	describeLoadout,
	type Family,
	familiesOf,
	InstrumentConfig,
	PARAMETERS,
	stockValue,
} from "./lab-instrument-config";

let { label = "Lab instrument with an editable configuration" } = $props();

const COLORS = [
	"#5ce5e7",
	"#ffbd69",
	"#ff7aa8",
	"#c8fa64",
	"#c49bff",
	"#83a9ff",
];
const fighter = (aft: [string | null, string | null]) => ({
	version: 2,
	chassis: "balanced",
	side: "ion",
	stabilizers: true,
	hull: [null, null],
	aft,
});
// The document as an agent would write it into a study: only what differs.
const written = {
	version: 1,
	vehicles: [
		{ label: "Ion aft", loadout: fighter(["ion", "ion"]) },
		{ label: "Plasma aft", loadout: fighter(["plasma", "plasma"]) },
		{
			label: "Plasma aft, more thrust",
			loadout: fighter(["plasma", "plasma"]),
			changes: { plasma: { thrust: 46000 } },
		},
	],
};

let doc = $state(InstrumentConfig.parse(written));
let copied = $state(false);
let draft = $state("");
let loadError = $state("");

// The burn belongs to the document, so switching it changes what is copied back.
const burn = $derived(doc.burn);
const vehicles = $derived(
	$state.snapshot(doc).vehicles.map((v, i) => {
		const changes = describeChanges(v.changes);
		return {
			id: `v${i}`,
			series: { label: v.label, color: COLORS[i], samples: calculate(v, burn) },
			config: `${describeLoadout(v.loadout)}${changes ? ` · ${changes}` : ""}`,
		};
	}),
);

// Empty change groups are left out, so the document names only what differs.
const text = $derived.by(() => {
	const plain = $state.snapshot(doc);
	return JSON.stringify(
		{
			...plain,
			vehicles: plain.vehicles.map(({ changes, ...rest }) => {
				const kept = Object.fromEntries(
					Object.entries(changes).filter(
						([, values]) => values && Object.keys(values).length > 0,
					),
				);
				return Object.keys(kept).length ? { ...rest, changes: kept } : rest;
			}),
		},
		null,
		2,
	);
});

function current(i: number, family: Family, key: string): number | undefined {
	const group = doc.vehicles[i].changes[family] as
		| Record<string, number>
		| undefined;
	return group?.[key];
}
function setValue(i: number, family: Family, key: string, raw: string) {
	const changes = doc.vehicles[i].changes as Record<
		string,
		Record<string, number> | undefined
	>;
	const value = Number(raw);
	const group = { ...(changes[family] ?? {}) };
	if (
		raw === "" ||
		!Number.isFinite(value) ||
		value === stockValue(family, key)
	)
		delete group[key];
	else group[key] = value;
	const next = { ...changes, [family]: group };
	const parsed = InstrumentConfig.safeParse({
		...$state.snapshot(doc),
		vehicles: doc.vehicles.map((v, j) =>
			j === i ? { ...$state.snapshot(v), changes: next } : $state.snapshot(v),
		),
	});
	// Out-of-range values are refused rather than drawn.
	if (parsed.success) doc = parsed.data;
	return parsed.success;
}
async function copy() {
	await navigator.clipboard.writeText(text);
	copied = true;
	setTimeout(() => (copied = false), 1500);
}
function load() {
	try {
		const parsed = InstrumentConfig.safeParse(JSON.parse(draft));
		if (!parsed.success) {
			loadError = parsed.error.issues
				.map(
					(issue) => `${issue.path.join(".") || "document"}: ${issue.message}`,
				)
				.join("; ");
			return;
		}
		doc = parsed.data;
		loadError = "";
		draft = "";
	} catch {
		loadError = "Not valid JSON.";
	}
}
</script>

{#snippet editor()}
	<section class="editor">
		{#each doc.vehicles as vehicle, i}
			<fieldset>
				<legend>
					<i style={`background:${COLORS[i]}`}></i>{vehicle.label}
				</legend>
				{#each familiesOf(vehicle.loadout) as family}
					<p class="family">{family}</p>
					{#each PARAMETERS[family] as param}
						{@const value = current(i, family, param.key)}
						{@const stock = stockValue(family, param.key)}
						<div class="param" class:changed={value !== undefined}>
							<label for={`p-${i}-${family}-${param.key}`}>{param.label}</label>
							<input
								id={`p-${i}-${family}-${param.key}`}
								type="number"
								step="any"
								value={value ?? stock}
								onchange={(e) => {
									const field = e.currentTarget;
									if (!setValue(i, family, param.key, field.value))
										field.value = String(value ?? stock);
								}}
							>
							{#if value !== undefined}
								<button
									type="button"
									class="reset"
									aria-label={`Reset ${param.label} to ${stock}`}
									onclick={() => setValue(i, family, param.key, "")}
								>
									↺
								</button>
							{/if}
							<span class="unit">
								{param.unit}{value !== undefined ? ` · stock ${stock}` : ""}
							</span>
						</div>
					{/each}
				{/each}
			</fieldset>
		{/each}
	</section>

	<section class="editor">
		<h4>Document</h4>
		<div class="row">
			<button type="button" onclick={copy}>
				{copied ? "Copied" : "Copy JSON"}
			</button>
		</div>
		<pre data-instrument-config>{text}</pre>
		<details>
			<summary>Load a document</summary>
			<textarea
				bind:value={draft}
				rows="6"
				aria-label="Configuration document to load"
				placeholder="Paste JSON from the agent"
			></textarea>
			<div class="row">
				<button type="button" onclick={load} disabled={!draft.trim()}>
					Load
				</button>
			</div>
			{#if loadError}
				<p class="error" role="alert">{loadError}</p>
			{/if}
		</details>
	</section>
{/snippet}

<LabInstrument027
	{label}
	{vehicles}
	bind:burn={() => doc.burn, (b) => (doc.burn = b)}
	sourceLabel="Configuration v1"
	{editor}
/>

<style>
/* Pane styles are scoped to the instrument; the editor repeats the few it uses. */
.editor {
	margin-top: 18px;
}
h4 {
	margin: 0 0 8px;
	color: var(--color-text-dim);
	font-size: 14px;
	font-weight: normal;
	letter-spacing: 0.1em;
	text-transform: uppercase;
}
.row {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}
button {
	min-height: 40px;
	padding: 4px 14px;
	background: transparent;
	color: var(--color-text);
	border: 1px solid var(--color-text-dim);
	font: 15px var(--font-flight);
	cursor: pointer;
}
button:disabled {
	opacity: var(--state-disabled-opacity);
	cursor: default;
}
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
summary:focus-visible {
	outline: 2px solid var(--color-focus-ring);
	outline-offset: 2px;
}
.editor fieldset {
	margin: 0 0 var(--spacing-md);
	padding: 0;
	border: 0;
}
.editor legend {
	padding: 0;
	margin-bottom: var(--spacing-xs);
}
.family {
	margin: var(--spacing-sm) 0 var(--spacing-xs);
	color: var(--color-text-dim);
	font-size: 13px;
	text-transform: uppercase;
	letter-spacing: 0.08em;
}
.param {
	display: grid;
	grid-template-columns: 1fr 6.5rem 2rem;
	align-items: center;
	gap: 2px var(--spacing-xs);
	padding: 2px 0 2px var(--spacing-xs);
	border-left: 3px solid transparent;
}
.param.changed {
	border-left-color: var(--color-acid-lime);
}
.param input {
	min-height: 36px;
	width: 100%;
	box-sizing: border-box;
	padding: 2px 6px;
	background: var(--color-void);
	color: var(--color-text);
	border: 1px solid var(--color-text-dim);
	font: inherit;
	text-align: right;
}
.param.changed input {
	border-color: var(--color-acid-lime);
	color: var(--color-acid-lime);
}
.reset {
	min-height: 36px;
	padding: 0;
}
.unit {
	grid-column: 1 / -1;
	color: var(--color-text-dim);
	font-size: 13px;
}
pre {
	max-height: 16rem;
	overflow: auto;
	margin: var(--spacing-sm) 0;
	padding: var(--spacing-sm);
	background: var(--color-void);
	border: 1px solid var(--color-flight-trail);
	font-size: 12px;
	user-select: text;
}
textarea {
	width: 100%;
	box-sizing: border-box;
	margin: var(--spacing-sm) 0;
	background: var(--color-void);
	color: var(--color-text);
	border: 1px solid var(--color-text-dim);
	font: 12px var(--font-flight);
}
summary {
	cursor: pointer;
	color: var(--color-text-dim);
}
.error {
	color: var(--color-caution-tape);
	font-size: 13px;
}
i {
	display: inline-block;
	width: 16px;
	height: 4px;
	margin-right: 8px;
	vertical-align: middle;
}
</style>
