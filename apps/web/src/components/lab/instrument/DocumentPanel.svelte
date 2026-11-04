<script lang="ts">
import "@void-drift/core/styles/buttons.css";
import {
	GRAVITY_TUNING,
	type LabWell,
	type ShipStart,
} from "@void-drift/mode-a";
import {
	editDocument,
	type Family,
	familiesOf,
	GRAVITY_PARAMETERS,
	gravityChange,
	gravityStock,
	InstrumentConfig,
	type InstrumentField,
	PARAMETERS,
	serialize,
	setGravityChange,
	stockValue,
	TRACK_COLORS,
} from "../../../lib/instrument";
import Toggle from "../../inputs/Toggle.svelte";

// The pane's default content (lab-instrument study, 02.2–02.3): each vehicle's
// values under investigation, then the configuration document to copy back or
// to load from an agent. A value outside its schema range is refused. A
// version 2 document also edits its gravity field (lab-instrument.md, "Gravity
// field mode"): system, orbits, gravity values, Lab wells and vehicle starts.
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
// Field edits go through the schema; a refused edit says why.
let fieldError = $state("");
const MAX_WELLS = 4;
const SPAWN: ShipStart = { x: 460, y: 540, heading: -90, speed: 0 };
const WELL_KEYS = [
	{ key: "x", label: "X", unit: "u" },
	{ key: "y", label: "Y", unit: "u" },
	{ key: "reach", label: "Reach", unit: "u" },
	{ key: "strength", label: "Strength", unit: "u/s²" },
] as const;
const START_KEYS = [
	{ key: "x", label: "X", unit: "u" },
	{ key: "y", label: "Y", unit: "u" },
	{ key: "heading", label: "Heading", unit: "° (0 = +x, −90 = up)" },
	{ key: "speed", label: "Speed", unit: "u/s" },
] as const;
function editField(
	change: (
		field: InstrumentField,
		draft: Extract<InstrumentConfig, { version: 2 }>,
	) => void,
) {
	const result = editDocument($state.snapshot(config), (draft) => {
		if (draft.version === 2 && draft.field) change(draft.field, draft);
	});
	if (result.ok) {
		config = result.doc;
		fieldError = "";
	} else fieldError = result.message;
	return result.ok;
}
function addField() {
	const parsed = InstrumentConfig.safeParse({
		...$state.snapshot(config),
		version: 2,
		field: {},
	});
	if (parsed.success) {
		config = parsed.data;
		fieldError = "";
	} else
		fieldError = parsed.error.issues.map((issue) => issue.message).join("; ");
}
function addWell(field: InstrumentField) {
	const used = new Set(field.wells.map((w) => w.label));
	let n = 1;
	while (used.has(`W${n}`)) n++;
	editField((f) => {
		f.wells.push({
			label: `W${n}`,
			x: 1600,
			y: 300,
			reach: 200,
			strength: 600,
			curve: "inverse-square",
		});
	});
}
/** Number input change: apply, or put the shown value back when refused. */
function onNumber(
	e: Event & { currentTarget: HTMLInputElement },
	shown: number,
	apply: (value: number | undefined) => boolean,
) {
	const raw = e.currentTarget.value;
	const value = raw === "" ? undefined : Number(raw);
	if (value !== undefined && !Number.isFinite(value)) {
		e.currentTarget.value = String(shown);
		return;
	}
	if (!apply(value)) e.currentTarget.value = String(shown);
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

<section aria-labelledby="pane-field">
	<h4 id="pane-field">Gravity field</h4>
	{#if config.version === 2 && config.field}
		{@const field = config.field}
		<div class="toggles">
			<Toggle
				compact
				label="System"
				options={["game", "empty"]}
				bind:value={
					() => field.system,
					(v) =>
	editField((f) => {
		f.system = v as InstrumentField["system"];
	})
				}
			/>
			<Toggle
				compact
				label="Orbits"
				options={["moving", "frozen"]}
				bind:value={
					() => field.orbits,
					(v) =>
	editField((f) => {
		f.orbits = v as InstrumentField["orbits"];
	})
				}
			/>
		</div>
		<fieldset>
			<legend>Gravity values</legend>
			{#each GRAVITY_PARAMETERS as param}
				{@const value = gravityChange(field.changes, param.key)}
				{@const stock = gravityStock(param.key)}
				{@const id = `g-${param.key.replace(".", "-")}`}
				<div class="param" class:changed={value !== undefined}>
					<label for={id}>{param.label}</label>
					<input
						{id}
						type="number"
						step="any"
						value={value ?? stock}
						onchange={(e) =>
							onNumber(e, value ?? stock, (v) =>
								editField((f) => setGravityChange(f.changes, param.key, v)),
							)}
					>
					{#if value !== undefined}
						<button
							type="button"
							class="reset"
							aria-label={`Reset ${param.label} to ${stock}`}
							onclick={() =>
								editField((f) =>
									setGravityChange(f.changes, param.key, undefined),
								)}
						>
							↺
						</button>
					{/if}
					<span class="unit">
						{param.unit}{value !== undefined ? ` · game ${stock}` : ""}
					</span>
				</div>
			{/each}
			<div
				class="param"
				class:changed={field.changes.curve !== undefined &&
					field.changes.curve !== GRAVITY_TUNING.curve}
			>
				<Toggle
					compact
					label="Well curve"
					options={["inverse-square", "linear"]}
					bind:value={
						() => field.changes.curve ?? GRAVITY_TUNING.curve,
						(v) =>
	editField((f) => {
		if (v === GRAVITY_TUNING.curve) delete f.changes.curve;
		else f.changes.curve = v as LabWell["curve"];
	})
					}
				/>
				<span class="unit"
					>curve of the sun and planets · game {GRAVITY_TUNING.curve}</span
				>
			</div>
		</fieldset>
		{#each field.wells as well, w}
			<fieldset>
				<legend>Lab well {well.label}</legend>
				{#each WELL_KEYS as param}
					{@const id = `w-${w}-${param.key}`}
					<div class="param">
						<label for={id}>{param.label}</label>
						<input
							{id}
							type="number"
							step="any"
							value={well[param.key]}
							onchange={(e) =>
								onNumber(
									e,
									well[param.key],
									(v) =>
										v !== undefined &&
										editField((f) => {
											f.wells[w][param.key] = v;
										}),
								)}
						>
						<span></span>
						<span class="unit">{param.unit}</span>
					</div>
				{/each}
				<div class="param">
					<Toggle
						compact
						label={`${well.label} curve`}
						options={["inverse-square", "linear"]}
						bind:value={
							() => well.curve,
							(v) =>
	editField((f) => {
		f.wells[w].curve = v as LabWell["curve"];
	})
						}
					/>
				</div>
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => editField((f) => void f.wells.splice(w, 1))}
				>
					Remove {well.label}
				</button>
			</fieldset>
		{/each}
		<button
			type="button"
			class="btn btn-ghost"
			disabled={field.wells.length >= MAX_WELLS}
			onclick={() => addWell(field)}
		>
			Add Lab well
		</button>
		{#each config.vehicles as vehicle, i}
			{@const start = "start" in vehicle ? vehicle.start : undefined}
			<fieldset>
				<legend>
					<i style={`background:${TRACK_COLORS[i]}`}></i>{vehicle.label}
					start
				</legend>
				{#if start}
					{#each START_KEYS as param}
						{@const id = `s-${i}-${param.key}`}
						<div class="param changed">
							<label for={id}>{param.label}</label>
							<input
								{id}
								type="number"
								step="any"
								value={start[param.key]}
								onchange={(e) =>
									onNumber(
										e,
										start[param.key],
										(v) =>
											v !== undefined &&
											editField((_, d) => {
												const s = d.vehicles[i].start;
												if (s) s[param.key] = v;
											}),
									)}
							>
							<span></span>
							<span class="unit">{param.unit}</span>
						</div>
					{/each}
					<button
						type="button"
						class="btn btn-ghost"
						onclick={() =>
							editField((_, d) => {
								delete d.vehicles[i].start;
							})}
					>
						Use the game's spawn
					</button>
				{:else}
					<p class="unit">The game's spawn, at rest, facing up.</p>
					<button
						type="button"
						class="btn btn-ghost"
						onclick={() =>
							editField((_, d) => {
								d.vehicles[i].start = { ...SPAWN };
							})}
					>
						Set a start
					</button>
				{/if}
			</fieldset>
		{/each}
	{:else}
		<p class="unit">
			Flies the vehicles in the game's sun and planets, with Lab wells and
			starts of their own.
		</p>
		<button type="button" class="btn btn-ghost" onclick={addField}>
			Add a gravity field
		</button>
	{/if}
	{#if fieldError}
		<p class="error" role="alert">{fieldError}</p>
	{/if}
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
	color: var(--color-text-muted);
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
.toggles {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-sm);
	margin-bottom: var(--spacing-md);
}
legend {
	padding: 0;
	margin-bottom: var(--spacing-xs);
}
.family {
	margin: var(--spacing-sm) 0 var(--spacing-xs);
	color: var(--color-text-muted);
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
	border-left-color: var(--color-selected);
}
.param input {
	min-height: 36px;
	width: 100%;
	box-sizing: border-box;
	padding: 2px 6px;
	background: var(--color-void);
	color: var(--color-text);
	border: 1px solid var(--color-text-muted);
	font: inherit;
	text-align: right;
}
.param.changed input {
	border-color: var(--color-selected);
}
.reset {
	min-height: 36px;
	background: transparent;
	color: var(--color-text);
	border: 1px solid var(--color-text-muted);
	cursor: pointer;
}
.unit {
	grid-column: 1 / -1;
	color: var(--color-text-muted);
	font-size: 13px;
}
pre {
	max-height: 16rem;
	overflow: auto;
	margin: var(--spacing-sm) 0;
	padding: var(--spacing-sm);
	background: var(--color-void);
	border: 1px solid var(--color-border-subtle);
	font-size: 12px;
	user-select: text;
}
textarea {
	width: 100%;
	box-sizing: border-box;
	margin: var(--spacing-sm) 0;
	background: var(--color-void);
	color: var(--color-text);
	border: 1px solid var(--color-text-muted);
	font: 12px var(--font-family-ui);
}
summary {
	cursor: pointer;
	color: var(--color-text-muted);
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
