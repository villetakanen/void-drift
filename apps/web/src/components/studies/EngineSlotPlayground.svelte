<script lang="ts">
import { buildMounts, defaultBuilds, SLOT_STYLE } from "@void-drift/mode-a";
import { FIGHTER } from "../../../../../packages/mode-a/src/lib/fighter";

// References the preserved accepted SVG definitions on engine-identities.astro.
// This keeps the editor trial's artwork identical to the reviewed bodies.
let { title = "Engine fitting playground" }: { title?: string } = $props();
const engines = [
	{ name: "Small ion", id: "ion-family-1", color: "#29baff" },
	{ name: "Heavy ion", id: "ion-family-2", color: "#29baff" },
	{ name: "Fusion", id: "fusion-pale-1", color: "#c6ff32" },
	{ name: "Plasma", id: "plasma-simple-0", color: "#ffb52e" },
];
const mounts = buildMounts(defaultBuilds().balanced);
const engineMounts = mounts.filter((m) => m.group !== "hull");
let selection = $state("left");
let fitted = $state<Record<string, number>>({ left: 0, right: 0 });
let mode = $state("editor");
let treatment = $state("slot");
let size = $state(2.1);
const w = SLOT_STYLE.width / 2 + SLOT_STYLE.gap;
const h = SLOT_STYLE.height / 2 + SLOT_STYLE.gap;
const points = (v: readonly (readonly number[])[]) =>
	v.map((p) => p.join(",")).join(" ");
function install(value: number) {
	fitted = { ...fitted, [selection]: value };
	if (selection === "left") fitted.right = value;
}
function reset() {
	fitted = Object.fromEntries(
		engineMounts.map((m, i) => [m.key, m.group === "side" ? 0 : i % 4]),
	);
	selection = "left";
	mode = "editor";
	treatment = "slot";
	size = 2.1;
}
reset();
function engineId(index: number, key: string) {
	const pose = engineMounts.findIndex((m) => m.key === key) + 1;
	return `#${engines[index].id}-${pose}`;
}
</script>

<div class="playground" {title}>
	<div class="toolbar">
		<label
			>View<select bind:value={mode}>
				<option value="editor">Ship editor</option>
				<option value="flight">Ship only · flight layering</option>
			</select></label
		>
		<label
			>Editor engine treatment<select
				bind:value={treatment}
				disabled={mode === "flight"}
			>
				<option value="slot">Fit inside slot · above hull</option>
				<option value="layered">Physical size · hull layering</option>
			</select></label
		>
		<label
			>Slot artwork size · {size.toFixed(1)}×<input
				type="range"
				min="1.6"
				max="2.5"
				step=".1"
				bind:value={size}
				disabled={mode === "flight" || treatment === "layered"}
			></label
		>
		<button type="button" onclick={reset}>Reset</button>
	</div>
	<div class="workspace">
		<svg
			viewBox="0 0 900 650"
			aria-label="Fighter engine fitting playground"
			role="img"
		>
			{#snippet engine(m: (typeof mounts)[number], inSlot: boolean)}
				{@const index = fitted[m.key] ?? -1}
				{#if index >= 0 && m.group !== "hull"}
					<g
						transform={inSlot
							? `translate(${450 + m.y * 7} ${365 - m.x * 7}) rotate(${(m.angle * 180) / Math.PI}) scale(${size}) rotate(-90)`
							: `translate(450 365) rotate(-90) scale(7) translate(${m.x + (m.group === "aft" ? 5 : 0)} ${m.y}) rotate(${(m.angle * 180) / Math.PI})`}
						style:color={engines[index].color}
					>
						<use href={engineId(index, m.key)} />
					</g>
				{/if}
			{/snippet}
			{#if mode === "flight" || treatment === "layered"}
				{#each engineMounts.filter((m) => m.group === "side") as m}
					{@render engine(m, false)}
				{/each}
			{/if}
			<g transform="translate(450 365) rotate(-90) scale(7)">
				{#each FIGHTER.hull as p, i}
					{@const q = FIGHTER.hull[(i + 1) % FIGHTER.hull.length]}
					<polygon
						points={points([[-3, 0], p, q])}
						fill={FIGHTER.facets[(p[1] + q[1]) / 2 < 0 ? i % 3 : 3 + (i % 3)]}
					/>
				{/each}
				<polygon points={points(FIGHTER.ridge)} fill="#a2d8df" />
				<polygon points="38,0 -21,0 -15,4" fill="#51869e" />
				<polygon points={points(FIGHTER.cockpit)} fill="#030609" />
			</g>
			{#if mode === "flight" || treatment === "layered"}
				{#each engineMounts.filter((m) => m.group === "aft") as m}
					{@render engine(m, false)}
				{/each}
			{/if}
			{#if mode === "editor"}
				<path
					d={`M ${450 + engineMounts[0].y * 7} ${365 - engineMounts[0].x * 7} V 600 H ${450 + engineMounts[1].y * 7} V ${365 - engineMounts[1].x * 7}`}
					fill="none"
					stroke={(fitted.left ?? -1) >= 0
						? "var(--color-acid-lime)"
						: "var(--color-void)"}
					stroke-width="1"
					stroke-dasharray="4 4"
				/>
				{#each mounts as m, i}
					{@const filled = m.group !== "hull" && (fitted[m.key] ?? -1) >= 0}
					{@const ink = filled ? "var(--color-acid-lime)" : "var(--color-void)"}
					<g
						transform={`translate(${450 + m.y * 7} ${365 - m.x * 7}) rotate(${(m.angle * 180) / Math.PI})`}
					>
						<rect
							x={-SLOT_STYLE.width / 2}
							y={-SLOT_STYLE.height / 2}
							width={SLOT_STYLE.width}
							height={SLOT_STYLE.height}
							fill={filled ? "var(--color-void)" : "var(--color-acid-lime)"}
							opacity=".35"
						/>
						<rect
							x={-w}
							y={-h}
							width={w * 2}
							height={h * 2}
							fill="none"
							stroke={ink}
							stroke-width={SLOT_STYLE.border}
							stroke-dasharray={m.linkedTo ? "4 3" : undefined}
						/>
						{#if !filled}
							<text
								text-anchor="middle"
								dominant-baseline="central"
								fill={ink}
								font-size="32"
							>
								{m.group === "hull" ? "Q" : m.group === "aft" ? "+" : "E"}
							</text>
						{/if}
						{#if m.key === selection}
							<path
								d={`M ${-w - 5} ${-h + 7} V ${-h - 5} H ${-w + 7} M ${w - 7} ${-h - 5} H ${w + 5} V ${-h + 7} M ${w + 5} ${h - 7} V ${h + 5} H ${w - 7} M ${-w + 7} ${h + 5} H ${-w - 5} V ${h - 7}`}
								fill="none"
								stroke="var(--color-acid-lime)"
								stroke-width="3"
							/>
						{/if}
						<text
							x={-w - 5}
							y={-h - 5}
							text-anchor="end"
							fill="var(--color-text)"
							font-size="11"
						>
							{String(i + 1).padStart(2, "0")}
						</text>
						<text
							transform={`translate(${-w - 4} ${h}) rotate(-90)`}
							fill={ink}
							font-size="8"
						>
							{m.group === "hull"
								? "Equipment"
								: m.group === "aft"
									? "Universal"
									: "Engines"}
						</text>
					</g>
					{#if treatment === "slot"}
						{@render engine(m, true)}
					{/if}
				{/each}
			{/if}
		</svg>
		<aside>
			<label
				>Mount<select bind:value={selection}>
					{#each engineMounts.filter((m) => !m.linkedTo) as m}
						<option value={m.key}>
							{m.group === "side" ? "Side pair" : m.key}
						</option>
					{/each}
				</select></label
			>
			<p>Choose a mount, then an engine. The side pair changes together.</p>
			{#each engines as e, i}
				<button
					type="button"
					class:active={fitted[selection] === i}
					aria-pressed={fitted[selection] === i}
					onclick={() => install(i)}
				>
					<svg viewBox="-15 -16 30 32" aria-hidden="true" style:color={e.color}>
						<use href={`#${e.id}-0`} transform="rotate(-90)" />
					</svg>{e.name}
				</button>
			{/each}
			<button type="button" onclick={() => install(-1)}>
				Empty selected mount
			</button>
		</aside>
	</div>
	<p class="note">
		Editor proposal: the full engine becomes a compact slot illustration above
		the hull. Flight keeps side engines beneath the hull and aft engines above
		it. Fitting here is temporary; this trial does not change saved builds or
		simulate performance. Hull equipment is left empty.
	</p>
</div>
<style>
.playground {
	border: var(--flight-border);
	background: var(--color-void-light);
	padding: var(--spacing-md);
}
.toolbar {
	display: flex;
	gap: 16px;
	flex-wrap: wrap;
	align-items: end;
}
label {
	display: grid;
	gap: 6px;
	font-size: var(--font-small);
}
select,
button {
	background: var(--color-void);
	color: var(--color-text);
	border: var(--flight-border);
	min-height: 44px;
	padding: 8px;
}
input {
	min-height: 32px;
	accent-color: var(--color-acid-lime);
}
.workspace {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 180px;
	align-items: start;
	gap: 16px;
}
.workspace > svg {
	width: 100%;
	min-width: 0;
}
aside {
	display: grid;
	gap: 8px;
	padding-top: 24px;
}
aside button {
	display: flex;
	align-items: center;
	gap: 10px;
	text-align: left;
}
.workspace aside svg {
	width: 40px;
	height: 52px;
}
.active {
	border-color: var(--color-acid-lime);
}
p {
	font-size: var(--font-small);
	color: var(--color-text-dim);
}
:focus-visible {
	outline: 2px solid var(--color-acid-lime);
	outline-offset: 3px;
}
@media (max-width: 650px) {
	.workspace {
		grid-template-columns: 1fr;
	}
	aside {
		grid-template-columns: 1fr 1fr;
		padding-top: 0;
	}
	aside label,
	aside p {
		grid-column: 1 / -1;
	}
}
</style>
