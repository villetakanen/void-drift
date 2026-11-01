<script lang="ts">
import "@void-drift/core/styles/buttons.css";
import {
	type Family,
	familiesOf,
	InstrumentConfig,
	PARAMETERS,
	serialize,
	stockValue,
	TRACK_COLORS,
} from "../../../lib/instrument";

// The pane's default content (lab-instrument study, 02.2–02.3): each vehicle's
// values under investigation, then the configuration document to copy back or
// to load from an agent. A value outside its schema range is refused.
let { config = $bindable() }: { config: InstrumentConfig } = $props();

let copied = $state(false);
let draft = $state("");
let loadError = $state("");
const text = $derived(serialize($state.snapshot(config)));

function current(i: number, family: Family, key: string): number | undefined {
	const group = config.vehicles[i].changes[family] as
		| Record<string, number>
		| undefined;
	return group?.[key];
}
function setValue(i: number, family: Family, key: string, raw: string) {
	const plain = $state.snapshot(config);
	const changes = plain.vehicles[i].changes as Record<
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
	plain.vehicles[i].changes = { ...changes, [family]: group };
	const parsed = InstrumentConfig.safeParse(plain);
	if (parsed.success) config = parsed.data;
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
		config = parsed.data;
		loadError = "";
		draft = "";
	} catch {
		loadError = "Not valid JSON.";
	}
}
</script>

<section aria-labelledby="pane-values">
	<h4 id="pane-values">Values</h4>
	{#each config.vehicles as vehicle, i}
		<fieldset>
			<legend>
				<i style={`background:${TRACK_COLORS[i]}`}></i>{vehicle.label}
			</legend>
			{#each familiesOf(vehicle.loadout) as family}
				<p class="family">{family}</p>
				{#each PARAMETERS[family] as param}
					{@const value = current(i, family, param.key)}
					{@const stock = stockValue(family, param.key)}
					{@const id = `p-${i}-${family}-${param.key}`}
					<div class="param" class:changed={value !== undefined}>
						<label for={id}>{param.label}</label>
						<input
							{id}
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

<section aria-labelledby="pane-document">
	<h4 id="pane-document">Document</h4>
	<button type="button" class="btn btn-ghost" onclick={copy}>
		{copied ? "Copied" : "Copy JSON"}
	</button>
	<pre>{text}</pre>
	<details>
		<summary>Load a document</summary>
		<textarea
			bind:value={draft}
			rows="6"
			aria-label="Configuration document to load"
			placeholder="Paste JSON from the agent"
		></textarea>
		<button
			type="button"
			class="btn btn-ghost"
			onclick={load}
			disabled={!draft.trim()}
		>
			Load
		</button>
		{#if loadError}
			<p class="error" role="alert">{loadError}</p>
		{/if}
	</details>
</section>

<style>
section {
	margin-top: var(--spacing-md);
}
h4 {
	margin: 0 0 var(--spacing-sm);
	color: var(--color-text-dim);
	font-size: 13px;
	font-weight: normal;
	letter-spacing: 0.1em;
	text-transform: uppercase;
}
fieldset {
	margin: 0 0 var(--spacing-md);
	padding: 0;
	border: 0;
}
legend {
	padding: 0;
	margin-bottom: var(--spacing-xs);
}
.family {
	margin: var(--spacing-sm) 0 var(--spacing-xs);
	color: var(--color-text-dim);
	font-size: 13px;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}
.param {
	display: grid;
	grid-template-columns: 1fr 7rem 2.5rem;
	align-items: center;
	gap: 2px var(--spacing-sm);
	padding: 2px 0 2px var(--spacing-sm);
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
	background: transparent;
	color: var(--color-text);
	border: 1px solid var(--color-text-dim);
	cursor: pointer;
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
	font: 12px var(--font-family-ui);
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
	width: 24px;
	height: 3px;
	margin-right: 8px;
	vertical-align: middle;
}
input:focus-visible,
textarea:focus-visible,
summary:focus-visible,
.reset:focus-visible {
	outline: 2px solid var(--color-focus-ring);
	outline-offset: 2px;
}
</style>
