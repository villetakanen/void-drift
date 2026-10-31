<script lang="ts">
import { buildMounts, defaultBuilds, SLOT_STYLE } from "@void-drift/mode-a";
import { CRUISER } from "../../../../../packages/mode-a/src/lib/cruiser";
import { FIGHTER } from "../../../../../packages/mode-a/src/lib/fighter";
import { SCOUT } from "../../../../../packages/mode-a/src/lib/scout";

// References the preserved accepted SVG definitions on engine-identities.astro.
// This keeps the editor trial's artwork identical to the reviewed bodies.
let {
	title = "Full-size engine highlighting",
	chassis = "balanced",
}: { title?: string; chassis?: "balanced" | "scout" | "tank" } = $props();
const engines = [
	{ name: "Small ion", id: "ion-family-1", color: "#29baff" },
	{ name: "Heavy ion", id: "ion-family-2", color: "#29baff" },
	{ name: "Fusion", id: "fusion-pale-1", color: "#c6ff32" },
	{ name: "Plasma", id: "plasma-simple-0", color: "#ffb52e" },
];
const mounts = $derived(buildMounts(defaultBuilds()[chassis]));
const editorMounts = $derived(
	["side", "aft", "hull"].flatMap((group) =>
		mounts.filter((m) => m.group === group),
	),
);
const engineMounts = $derived(mounts.filter((m) => m.group !== "hull"));
let selection = $state("left");
let fitted = $state<Record<string, number>>({ left: 0, right: 0 });
let mode = $state("editor");
const highlight = "halo";
// Forward extents of the accepted SVG bodies, in model units.
const engineFront = [9, 9 * 1.15, 10, 10];
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
}
reset();
function engineId(index: number, key: string) {
	const pose = key === "left" ? 1 : key === "right" ? 2 : 3;
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
		<p>Selected item · soft backlight</p>
		<button type="button" onclick={reset}>Reset</button>
	</div>
	<div class="workspace">
		<svg
			viewBox={chassis === "tank" ? "0 -80 900 900" : "0 0 900 650"}
			aria-label={chassis === "scout"
				? "Scout engine fitting playground"
				: chassis === "tank"
					? "Battleship engine fitting playground"
					: "Fighter engine fitting playground"}
			role="img"
		>
			<defs>
				{#if chassis === "tank"}
					<mask
						id="battleship-hull-mask"
						maskUnits="userSpaceOnUse"
						x="-100"
						y="-100"
						width="200"
						height="200"
					>
						<rect x="-100" y="-100" width="200" height="200" fill="white" />
						<polygon points={points(CRUISER.notch)} fill="black" />
					</mask>
				{/if}
				<filter
					id={`engine-separation-${chassis}`}
					x="-40%"
					y="-40%"
					width="180%"
					height="180%"
				>
					<feMorphology
						in="SourceAlpha"
						operator="dilate"
						radius=".3"
						result="edge"
					/>
					<feFlood flood-color="#080b12" />
					<feComposite in2="edge" operator="in" />
					<feMerge>
						<feMergeNode />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
				<filter
					id={`engine-highlight-rim-${chassis}`}
					x="-40%"
					y="-40%"
					width="180%"
					height="180%"
				>
					<feMorphology
						in="SourceAlpha"
						operator="dilate"
						radius=".35"
						result="edge"
					/>
					<feFlood flood-color="var(--color-acid-lime)" />
					<feComposite in2="edge" operator="in" />
					<feMerge>
						<feMergeNode />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
				<filter
					id={`engine-highlight-halo-${chassis}`}
					x="-60%"
					y="-60%"
					width="220%"
					height="220%"
				>
					<feGaussianBlur in="SourceAlpha" stdDeviation=".8" result="blur" />
					<feFlood flood-color="var(--color-acid-lime)" flood-opacity=".8" />
					<feComposite in2="blur" operator="in" />
					<feMerge>
						<feMergeNode />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			{#snippet engine(m: (typeof mounts)[number], selected: boolean)}
				{@const index = fitted[m.key] ?? -1}
				{#if index >= 0 && m.group !== "hull"}
					<g
						transform={`translate(450 365) rotate(-90) scale(7) translate(${m.x} ${m.y}) rotate(${(m.angle * 180) / Math.PI}) translate(${chassis === "scout" ? h / 7 - engineFront[index] : 0} 0)`}
						style:color={engines[index].color}
					>
						<use
							href={engineId(index, m.key)}
							filter={mode === "editor"
								? selected
									? `url(#engine-highlight-${highlight}-${chassis})`
									: `url(#engine-separation-${chassis})`
								: undefined}
						/>
					</g>
				{/if}
			{/snippet}
			{#if mode === "flight"}
				{#each engineMounts.filter(
					(m) => chassis === "scout" || m.group === "side",
				) as m}
					{@render engine(m, false)}
				{/each}
			{/if}
			<g
				transform="translate(450 365) rotate(-90) scale(7)"
				opacity={mode === "editor" ? 0.7 : 1}
			>
				{#if chassis === "tank"}
					<g mask="url(#battleship-hull-mask)">
						{#each CRUISER.facets as facet}
							<polygon points={points(facet.points)} fill={facet.color} />
						{/each}
					</g>
				{:else if chassis === "scout"}
					{#each SCOUT.facets as facet}
						<polygon points={points(facet.points)} fill={facet.color} />
					{/each}
					<circle
						cx={SCOUT.cockpit.x}
						cy={SCOUT.cockpit.y}
						r={SCOUT.cockpit.collarRadius}
						fill="#51869e"
					/>
					<circle
						cx={SCOUT.cockpit.x}
						cy={SCOUT.cockpit.y}
						r={SCOUT.cockpit.radius}
						fill="#030609"
					/>
				{:else}
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
				{/if}
			</g>
			{#if mode === "flight"}
				{#each engineMounts.filter(
					(m) => chassis !== "scout" && m.group === "aft",
				) as m}
					{@render engine(m, false)}
				{/each}
			{/if}
			{#if mode === "editor"}
				<path
					d={`M ${450 + engineMounts[0].y * 7} ${365 - engineMounts[0].x * 7} V ${chassis === "tank" ? -40 : 60} H ${450 + engineMounts[1].y * 7} V ${365 - engineMounts[1].x * 7}`}
					fill="none"
					stroke={(fitted.left ?? -1) >= 0
						? "var(--color-acid-lime)"
						: "var(--color-void)"}
					stroke-width="1"
					stroke-dasharray="4 4"
				/>
				{#each editorMounts as m}
					{@const i = mounts.findIndex((mount) => mount.key === m.key)}
					{@const ink =
						m.group !== "hull" && (fitted[m.key] ?? -1) >= 0
							? "var(--color-acid-lime)"
							: "var(--color-void)"}
					{@const filled = m.group !== "hull" && (fitted[m.key] ?? -1) >= 0}
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
					</g>
					{@render engine(m, m.key === selection || m.linkedTo === selection)}
					<g
						transform={`translate(${450 + m.y * 7} ${365 - m.x * 7}) rotate(${(m.angle * 180) / Math.PI})`}
					>
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
		Full ship size is fixed in both views. Editor engines always sit above the
		hull. Unselected engines keep their original colors with a dark separation
		edge. Selected engines and their linked partner get only the chosen item
		highlight. The editor hull is 70% opaque. Slot backgrounds sit behind the
		engines; unchanged borders, selection corners and labels draw above them.
		Side slots draw first, aft slots next, and hull/Q slots last. Selection
		never changes this order. Settings are temporary; no saved builds change.
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
