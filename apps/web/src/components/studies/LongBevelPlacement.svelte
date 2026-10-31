<script lang="ts">
import { buildMounts, defaultBuilds } from "@void-drift/mode-a";
import { FIGHTER } from "../../../../../packages/mode-a/src/lib/fighter";

let {
	title = "08 / Long bevel — placement study",
	forwardTrial = false,
}: { title?: string; forwardTrial?: boolean } = $props();

const outline = [
	[-3, -50],
	[3, -50],
	[12, -27],
	[14, 7],
	[21, 19],
	[19, 42],
	[-19, 42],
	[-21, 19],
	[-14, 7],
	[-12, -27],
];
const initial = () =>
	buildMounts(defaultBuilds().tank)
		.map((m) => ({
			...m,
			x:
				m.group === "side"
					? m.index === 0
						? -19
						: 19
					: m.group === "aft"
						? (m.index - 1) * 11
						: 0,
			y:
				m.group === "side"
					? 16
					: m.group === "aft"
						? m.index === 1
							? 24
							: 37
						: -17 + m.index * 13,
			rotation: m.group === "side" ? (m.index === 0 ? 20 : -20) : 0,
			width: 9,
			height: m.group === "side" ? 14 : 11,
			short:
				m.group === "side"
					? m.index === 0
						? "Left E"
						: "Right E"
					: `${m.group === "hull" ? "H" : "A"}${m.index + 1}`,
		}))
		.map((m) =>
			forwardTrial
				? {
						...m,
						x: m.group === "side" ? (m.index === 0 ? -13 : 13) : m.x,
						y:
							m.group === "side"
								? -22.5
								: m.group === "hull"
									? [-14.5, -0.5, 12.5][m.index]
									: m.index === 1
										? 30.5
										: 37,
						rotation: m.group === "side" ? (m.index === 0 ? 34 : -34) : 0,
					}
				: m,
		);
let mounts = $state(initial());
let selected = $state("hull-0");
let guides = $state(true);
const active = $derived(mounts.find((m) => m.key === selected) ?? mounts[0]);
const paired = $derived(
	active.group === "side" || (active.group === "aft" && active.index !== 1),
);
function change(field: "x" | "y" | "rotation", value: number) {
	const a = active;
	mounts = mounts.map((m) => {
		const partner =
			paired && m.group === a.group && (a.group === "side" || m.index !== 1);
		if (m.key !== a.key && !partner) return m;
		const mirrored = m.key !== a.key && field !== "y";
		return { ...m, [field]: mirrored ? -value : value };
	});
}
function reset() {
	mounts = initial();
}
</script>

{#if forwardTrial}
	<div class="trial-options">
		<button
			type="button"
			onclick={() => {
				mounts = mounts.map((m) =>
					m.key === "hull-0" ? { ...m, y: -14.5 } : m,
				);
				selected = "hull-0";
			}}
		>
			H1 behind cockpit
		</button>
		<button
			type="button"
			onclick={() => {
				mounts = mounts.map((m) =>
					m.key === "hull-0" ? { ...m, y: -45.5 } : m,
				);
				selected = "hull-0";
			}}
		>
			Try H1 at bow
		</button>
	</div>
	<p>
		Bow trial: H1 at −45.5 gives a one-unit gap ahead of the cockpit, but
		overhangs the narrow nose. This exposes the need for a reinforced bow mount
		or a wider tip.
	</p>
{/if}
<div class="workbench">
	<div class="drawing">
		<svg
			viewBox="-42 -58 84 111"
			role="img"
			aria-label="Enlarged Long bevel 08 with eight numbered mounts. Change positions using the controls alongside."
		>
			<title>{title}</title>
			{#each outline as p, i}
				{@const n = outline[(i + 1) % outline.length]}
				<polygon
					points={`0,-5 ${p.join(",")} ${n.join(",")}`}
					fill={FIGHTER.facets[
						(p[0] + n[0]) / 2 < 0 ? [0, 1, 2][i % 3] : [3, 4, 5][i % 3]
					]}
				/>
			{/each}
			<polygon
				points="-3,-50 -5,-26 -6,14 -14,36 -19,42 -14,7 -12,-27"
				fill={FIGHTER.facets[1]}
			/>
			<polygon
				points="3,-50 12,-27 14,7 19,42 14,36 6,14 5,-26"
				fill={FIGHTER.facets[3]}
			/>
			<polygon
				points="0,-40 6,-26 7,17 0,30 -7,17 -6,-26"
				fill={FIGHTER.facets[0]}
			/>
			<polygon points="0,-40 6,-26 7,17 0,30 0,-25" fill={FIGHTER.facets[5]} />
			<polygon points="-5,31 5,31 6,44 -6,44" class="void" />
			<polygon points="-7,-36 -1,-39 -1,-31 -5,-30" fill="#000" />
			<polygon points="1,-39 7,-36 5,-30 1,-31" fill="#000" />
			{#each mounts as m}
				<g transform={`translate(${m.x} ${m.y}) rotate(${m.rotation})`}>
					{#if guides && m.group !== "hull"}
						<path class="guide" d={`M0 ${m.height / 2} v18`} />
					{/if}
					<rect
						class:chosen={selected === m.key}
						x={-m.width / 2}
						y={-m.height / 2}
						width={m.width}
						height={m.height}
					/>
					<text text-anchor="middle" y="1">{m.short}</text>
				</g>
			{/each}
		</svg>
		<p>
			Bow ↑ · exact 08 hull, enlarged · mount footprints stay at Fighter size
		</p>
	</div>
	<div class="controls">
		<h4>Select a mount</h4>
		<div class="choices">
			{#each mounts as m}
				<button
					type="button"
					aria-pressed={selected === m.key}
					onclick={() => (selected = m.key)}
				>
					{m.short}
				</button>
			{/each}
		</div>
		<p>
			<strong>{active.short}</strong>
			·
			{active.group === "side"
				? "Required mirrored engine pair"
				: active.group === "hull"
					? "Gun or utility; can be empty"
					: "Engine, gun or utility; can be empty"}
		</p>
		<label
			>Fore–aft position <output>{active.y}</output>
			<input
				aria-label="Fore–aft position"
				type="range"
				min={forwardTrial ? "-51" : "-25"}
				max="44"
				step="0.5"
				value={active.y}
				oninput={(e) => change("y", Number(e.currentTarget.value))}
			></label
		>
		{#if paired}
			<label
				>Distance from center <output>{Math.abs(active.x)}</output>
				<input
					aria-label="Distance from center"
					type="range"
					min="6"
					max="27"
					step="0.5"
					value={Math.abs(active.x)}
					oninput={(e) =>
						change(
							"x",
							Number(e.currentTarget.value) * (active.x < 0 ? -1 : 1),
						)}
				></label
			>
		{/if}
		{#if active.group === "side"}
			<label
				>Side-engine angle <output>{Math.abs(active.rotation)}°</output>
				<input
					aria-label="Side-engine angle"
					type="range"
					min="0"
					max="45"
					step="1"
					value={Math.abs(active.rotation)}
					oninput={(e) =>
						change(
							"rotation",
							Number(e.currentTarget.value) * (active.index === 0 ? 1 : -1),
						)}
				></label
			>
		{/if}
		<p class="hint">
			Negative positions move toward the bow.
			{paired
				? "The opposite mount moves with this one, keeping the pair mirrored."
				: "This mount stays on the centerline."}
			Dimensions: {active.width} × {active.height}.
		</p>
		<label class="check"
			><input type="checkbox" bind:checked={guides}>
			Show engine direction guides</label
		>
		<button type="button" onclick={reset}>
			{forwardTrial ? "Reset screenshot trial" : "Reset to 08 placement"}
		</button>
		<p class="hint">
			Positions are temporary and reset on reload. Mount overlap and hull
			overhang are allowed for inspection; no automatic clearance check is
			implied.
		</p>
	</div>
</div>
<div class="coordinates">
	<table>
		<caption>
			Current placement · top-view drawing units
		</caption>
		<thead>
			<tr>
				<th>Mount</th>
				<th>Across</th>
				<th>Fore–aft</th>
				<th>Angle</th>
			</tr>
		</thead>
		<tbody>
			{#each mounts as m}
				<tr>
					<th>{m.short}</th>
					<td>{m.x}</td>
					<td>{m.y}</td>
					<td>{m.rotation}°</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
<style>
.trial-options {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-sm);
	margin-block: var(--spacing-md);
}
.workbench {
	display: grid;
	grid-template-columns: minmax(0, 1.3fr) minmax(240px, 1fr);
	gap: var(--spacing-lg);
}
.drawing {
	border: var(--flight-border);
	padding: var(--spacing-md);
}
svg {
	display: block;
	width: 100%;
	max-height: 760px;
}
.void {
	fill: var(--color-void);
}
rect {
	fill: #071015;
	fill-opacity: 0.65;
	stroke: #e0ffff;
	stroke-width: 0.4;
}
rect.chosen {
	stroke: var(--color-acid-lime);
	stroke-width: 0.8;
}
text {
	fill: #fff;
	font: 2.6px var(--font-flight);
}
.guide {
	stroke: #ffc56e;
	stroke-width: 0.35;
	stroke-dasharray: 1 1;
	fill: none;
}
.choices {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: var(--spacing-sm);
	margin-block: var(--spacing-md);
}
button {
	min-height: 44px;
	padding: var(--spacing-sm);
	background: var(--color-void);
	color: var(--color-text);
	border: 1px solid var(--color-text-dim);
	cursor: pointer;
	font: inherit;
}
button[aria-pressed="true"] {
	border-color: var(--color-acid-lime);
	color: var(--color-acid-lime);
}
button:focus-visible,
input:focus-visible {
	outline: 2px solid var(--color-acid-lime);
	outline-offset: 3px;
}
label {
	display: block;
	margin-block: var(--spacing-md);
}
output {
	float: right;
	font-family: var(--font-flight);
}
input[type="range"] {
	display: block;
	width: 100%;
	min-height: 44px;
	accent-color: var(--color-acid-lime);
}
.check {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
	min-height: 44px;
}
.check input {
	width: 20px;
	height: 20px;
	accent-color: var(--color-acid-lime);
}
.hint,
.drawing p {
	color: var(--color-text-dim);
}
.coordinates {
	overflow-x: auto;
	margin-block: var(--spacing-lg);
}
table {
	border-collapse: collapse;
	width: 100%;
	max-width: 600px;
}
th,
td {
	padding: var(--spacing-sm);
	text-align: left;
	border-bottom: var(--flight-border);
}
caption {
	text-align: left;
	margin-bottom: var(--spacing-sm);
}
@media (max-width: 700px) {
	.workbench {
		grid-template-columns: 1fr;
	}
}
</style>
