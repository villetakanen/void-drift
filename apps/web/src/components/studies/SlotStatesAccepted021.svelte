<script lang="ts">
import { buildMounts, defaultBuilds } from "@void-drift/mode-a";
import { FIGHTER } from "../../../../../packages/mode-a/src/lib/fighter";

let { title = "Slot appearance playground" }: { title?: string } = $props();
const colors = [
	{ value: "--color-void", name: "Void / dark" },
	{ value: "--color-acid-lime", name: "Acid lime" },
	{ value: "--color-text", name: "Ivory" },
];
const states = [
	{ name: "Empty / unselected", filled: false, selected: false, id: "01" },
	{ name: "Empty / selected", filled: false, selected: true, id: "02" },
	{ name: "Filled / unselected", filled: true, selected: false, id: "03" },
	{ name: "Filled / selected", filled: true, selected: true, id: "04" },
	{ name: "Filled / selected primary", filled: true, selected: true, id: "05" },
	{
		name: "Filled / linked secondary · not selectable",
		filled: true,
		selected: false,
		id: "06",
	},
];
const allMounts = buildMounts(defaultBuilds().balanced);
const mounts = [
	...allMounts.filter((m) => m.group !== "side"),
	...allMounts.filter((m) => m.group === "side"),
];
// Settled in study 02.1; units are SVG preview pixels.
const geometry = { width: 54, height: 64, gap: 4, weight: 1.5 } as const;
const initial = () =>
	states.map((state, index) => ({
		corner: "--color-acid-lime",
		corners: state.selected,
		cornerGap: 5,
		dx: 0,
		dy: 0,
		slotType: index >= 4 ? "E" : index === 0 ? "W" : "+",
	}));
let settings = $state(initial());
let target = $state(1);
let links = $state(true);
let labels = $state(true);
let closeup = $state(true);
const color = (token: string) => `var(${token})`;
const borderColor = (filled: boolean) =>
	color(filled ? "--color-acid-lime" : "--color-void");
const points = (vertices: readonly (readonly number[])[]) =>
	vertices.map(([x, y]) => `${y * 7 + 350},${390 - x * 7}`).join(" ");
function reset() {
	settings = initial();
	links = true;
	labels = true;
}
function copyStyle() {
	const source = settings[target];
	settings = settings.map((s) => ({
		...source,
		dx: s.dx,
		dy: s.dy,
		corners: s.corners,
		slotType: s.slotType,
	}));
}
</script>

<div class="playground" {title}>
	<div class="editor">
		<label
			>Style target<select bind:value={target}>
				{#each states as state, index}
					<option value={index}>{state.id} · {state.name}</option>
				{/each}
			</select></label
		>
		<p class="hint">
			Choose which example to style. This design-tool control does not select a
			slot for fitting; linked secondary 06 is not independently selectable in
			the proposed interaction.
		</p>
		<fieldset>
			<legend>Colors</legend>
			{#each [{ key: "corner", name: "Corner color" }] as field}
				<label
					>{field.name}<select
						bind:value={settings[target][field.key as "corner"]}
					>
						{#each colors as c}
							<option value={c.value}>{c.name}</option>
						{/each}
					</select></label
				>
			{/each}
			<p class="hint">
				Fixed fills: empty = acid lime at 35%; filled = void-dark at 35%.
				Borders: empty = void-dark; filled = acid lime, including dashed
				linked-slot borders. Selection and linking do not change the fill.
			</p>
		</fieldset>
		<fieldset>
			<legend>Position and corners · preview pixels</legend>
			<p class="hint">
				Fixed: 54 × 64 px fill, 4 px fill-to-border gap, 1.5 px border. Side
				slots retain their production ±26° mounting angles.
			</p>
			{#each [
				{
					key: "cornerGap",
					name: "Border to corner gap",
					min: 0,
					max: 16,
					step: 1,
				},
				{ key: "dx", name: "Horizontal offset", min: -60, max: 60, step: 2 },
				{ key: "dy", name: "Vertical offset", min: -70, max: 70, step: 2 },
			] as field}
				{@const key = field.key as "cornerGap" | "dx" | "dy"}
				<label
					>{field.name}
					· {settings[target][key]}<input
						type="range"
						min={field.min}
						max={field.max}
						step={field.step}
						bind:value={settings[target][key]}
					></label
				>
			{/each}
		</fieldset>
		<fieldset>
			<legend>Details</legend>
			<label
				><input type="checkbox" bind:checked={settings[target].corners}>
				Corner brackets</label
			>
			{#if !states[target].filled}
				<label
					>Empty-slot type<select bind:value={settings[target].slotType}>
						<option value="E">E · Engines</option>
						<option value="W">W · Weapons</option>
						<option value="+">+ · Generic</option>
					</select></label
				>
			{/if}
			<label
				><input type="checkbox" bind:checked={links}>
				Show linked pair</label
			>
			<label><input type="checkbox" bind:checked={labels}> State labels</label>
		</fieldset>
		<div class="actions">
			<button type="button" onclick={copyStyle}>Copy style to all slots</button
			><button type="button" onclick={reset}>Reset appearance</button>
		</div>
		<p class="hint">
			Copy preserves positions and which slots have corners. Fixed fills and
			geometry are preserved by copy and reset. Settings last until reload.
		</p>
	</div>
	<div class="preview">
		<label
			><input type="checkbox" bind:checked={closeup}>
			Enlarge mount area</label
		>
		<svg
			viewBox={closeup ? "140 290 420 380" : "0 0 700 680"}
			role="img"
			aria-label="Fighter slot playground with four primary states and a linked engine pair"
		>
			{#each FIGHTER.hull as point, index}
				{@const next = FIGHTER.hull[(index + 1) % FIGHTER.hull.length]}
				<polygon
					points={points([[-3, 0], point, next])}
					fill={FIGHTER.facets[
						(point[1] + next[1]) / 2 < 0 ? index % 3 : 3 + (index % 3)
					]}
				/>
			{/each}
			<polygon points={points(FIGHTER.ridge)} fill="#a2d8df" />
			<polygon
				points={points([
					[38, 0],
					[-21, 0],
					[-15, 4],
				])}
				fill="#51869e"
			/>
			<polygon points={points(FIGHTER.cockpit)} fill="#000000" />
			{#if links}
				<path
					class="link"
					stroke={borderColor(states[4].filled)}
					d={`M ${350 + mounts[4].y * 7 + settings[4].dx} ${390 - mounts[4].x * 7 + settings[4].dy} V 615 H ${350 + mounts[5].y * 7 + settings[5].dx} V ${390 - mounts[5].x * 7 + settings[5].dy}`}
				/>
				<text x="350" y="637" text-anchor="middle" class="caption">
					05 ↔ 06 / LINKED PAIR
				</text>
			{/if}
			{#each mounts as mount, index}
				{#if index < 4 || links}
					{@const state = states[index]}
					{@const s = settings[index]}
					{@const x = 350 + mount.y * 7 + s.dx}
					{@const y = 390 - mount.x * 7 + s.dy}
					{@const w = geometry.width / 2 + geometry.gap}
					{@const h = geometry.height / 2 + geometry.gap}
					{@const cw = w + s.cornerGap}
					{@const ch = h + s.cornerGap}
					<g
						transform={`translate(${x},${y}) rotate(${(mount.angle * 180) / Math.PI})`}
					>
						<title>{state.id}: {state.name}</title>
						<rect
							x={-geometry.width / 2}
							y={-geometry.height / 2}
							width={geometry.width}
							height={geometry.height}
							fill={color(state.filled ? "--color-void" : "--color-acid-lime")}
							fill-opacity="0.35"
						/>
						<rect
							x={-w}
							y={-h}
							width={w * 2}
							height={h * 2}
							fill="none"
							stroke={borderColor(state.filled)}
							stroke-width={geometry.weight}
							stroke-dasharray={index === 5 ? "4 3" : undefined}
						/>
						{#if s.corners}
							<path
								fill="none"
								stroke={color(s.corner)}
								stroke-width="3"
								d={`M ${-cw} ${-ch + 12} V ${-ch} H ${-cw + 12} M ${cw - 12} ${-ch} H ${cw} V ${-ch + 12} M ${cw} ${ch - 12} V ${ch} H ${cw - 12} M ${-cw + 12} ${ch} H ${-cw} V ${ch - 12}`}
							/>
						{/if}
						{#if index >= 4}
							<path
								class="item"
								d="M -10 -13 H 10 V 10 L 15 20 H -15 L -10 10 Z"
							/>
							<path class="symbol" d="M -5 -6 H 5 M -5 0 H 5" />
						{:else if state.filled}
							<rect class="item" x="-12" y="-16" width="24" height="32" />
							<path class="symbol" d="M -6 0 H 6 M 0 -6 V 6 M -5 -19 H 5" />
						{:else}
							<text
								class="slot-type"
								x="0"
								y="0"
								text-anchor="middle"
								dominant-baseline="central"
								fill={borderColor(false)}
							>
								{s.slotType}
							</text>
						{/if}
						<text
							class="edge-type"
							transform={`translate(${-w - 4},${h}) rotate(-90)`}
							fill={borderColor(state.filled)}
						>
							{s.slotType === "E"
								? "Engines"
								: s.slotType === "W"
									? "Weapons"
									: "Generic"}
						</text>
						{#if labels}
							<rect
								x={-cw - 23}
								y={-ch - 12}
								width="22"
								height="16"
								fill="var(--color-void)"
								fill-opacity="0.35"
							/>
							<text class="number" x={-cw - 5} y={-ch} text-anchor="end">
								{state.id}
							</text>
						{/if}
					</g>
				{/if}
			{/each}
		</svg>
		{#if labels}
			<ol class="legend">
				{#each states as state, index}
					{#if index < 4 || links}
						<li><strong>{state.id}</strong> {state.name}</li>
					{/if}
				{/each}
			</ol>
		{/if}
		<p class="hint">
			All slots share the same empty/filled and selected/unselected states. 06
			is a linked secondary, not independently selectable; the dashed border is
			a visual proposal for that relationship. E only denotes compatibility.
			Linking can also apply to other slot types. This is an appearance study,
			not a fitting simulation.
		</p>
	</div>
</div>
<style>
.playground {
	display: grid;
	grid-template-columns: 260px minmax(0, 1fr);
	gap: var(--spacing-md);
	border: var(--flight-border);
	background: var(--color-void-light);
	padding: var(--spacing-md);
	align-items: start;
}
.editor {
	max-height: 85vh;
	overflow: auto;
	padding: var(--spacing-xs);
}
.preview {
	position: sticky;
	top: var(--spacing-md);
	min-width: 0;
}
fieldset {
	border: var(--flight-border);
	margin: var(--spacing-md) 0;
	padding: var(--spacing-sm);
	display: grid;
	gap: var(--spacing-sm);
}
legend {
	color: var(--color-acid-lime);
	font: var(--font-small) var(--font-flight);
}
label {
	display: block;
	font: var(--font-small) var(--font-flight);
}
select {
	display: block;
	width: 100%;
	min-height: 44px;
	color: var(--color-text);
	background: var(--color-void);
	border: var(--flight-border);
	padding: var(--spacing-xs);
}
input[type="range"] {
	display: block;
	width: 100%;
	min-height: 36px;
	accent-color: var(--color-acid-lime);
}
input[type="checkbox"] {
	min-height: 24px;
	vertical-align: middle;
	accent-color: var(--color-acid-lime);
}
button {
	min-height: 44px;
	color: var(--color-text);
	background: var(--color-void);
	border: 1px solid var(--color-text-dim);
	padding: var(--spacing-sm);
}
.actions {
	display: grid;
	gap: var(--spacing-sm);
}
:focus-visible {
	outline: 2px solid var(--color-focus-ring);
	outline-offset: 2px;
}
svg {
	display: block;
	width: 100%;
	max-height: 65vh;
}
.item {
	fill: var(--color-void);
	stroke: var(--color-text);
	stroke-width: 1.5;
}
.symbol {
	fill: none;
	stroke: var(--color-text);
	stroke-width: 2;
}
.edge-type {
	font: 8px var(--font-flight);
	letter-spacing: 0.06em;
}
.slot-type {
	opacity: 0.7;
	font: 700 32px var(--font-flight);
}
.number,
.caption {
	fill: var(--color-text);
	font: 11px var(--font-flight);
}
.link {
	fill: none;
	stroke-width: 1;
	stroke-dasharray: 4 4;
}
.legend {
	list-style: none;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--spacing-xs);
	padding: 0;
	font: var(--font-small) var(--font-flight);
}
.legend strong {
	color: var(--color-acid-lime);
}
.hint {
	color: var(--color-text-dim);
	font-size: var(--font-small);
	line-height: 1.5;
}
@media (max-width: 700px) {
	.playground {
		grid-template-columns: 1fr;
	}
	.preview {
		grid-row: 1;
		position: static;
	}
	.editor {
		max-height: none;
		overflow: visible;
	}
	svg {
		max-height: none;
	}
	.legend {
		grid-template-columns: 1fr;
	}
}
</style>
