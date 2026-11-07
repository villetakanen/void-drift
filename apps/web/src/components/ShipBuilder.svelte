<script lang="ts">
import { COLOR, loadCanvasFonts } from "@void-drift/core";
import {
	BuildStoreSchema,
	buildMounts,
	buildStats,
	CHASSIS,
	CRUISER,
	defaultBuilds,
	drawBuild,
	ENGINE_ACCENT,
	ENGINE_ART,
	engineArtId,
	FIDDLER,
	FIGHTER,
	LIFE_SUPPORT_DRAIN,
	PARTS,
	type PartId,
	POTENTIAL_WELL_ART,
	SCOUT,
	SHIP_IDENTITY,
	type ShipProfileId,
	ShipProfileIdSchema,
	SLOT_STYLE,
	slotAccepts,
	UTILITY_ART,
	WASP,
	WEAPONS,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { version } from "../../package.json";
import FlightDeck from "./FlightDeck.svelte";
import Switch from "./inputs/Switch.svelte";
import Toggle from "./inputs/Toggle.svelte";
import Logo from "./Logo.svelte";

const shipIds = ["wasp", "scout", "fighter", "corvette", "fiddler"] as const;

let { lab = false }: { lab?: boolean } = $props();
let builds = $state(defaultBuilds());
let chosen = $state<ShipProfileId>("fighter");
let selected = $state("left");
let previewMode = $state("Plan");
let flying = $state<"test" | "derelicts" | "survival" | null>(null);
let ready = $state(false);
let fontsLoaded = $state(false);
let notice = $state("");
let canvas = $state<HTMLCanvasElement>();
const build = $derived(builds[chosen]);
const stats = $derived(buildStats(build));
const mounts = $derived(buildMounts(build));
let previewWidth = $state(600);
let previewHeight = $state(540);
let titleHeight = $state(48);
const framing = $derived.by(() => {
	const hull =
		chosen === "fighter"
			? FIGHTER.hull
			: (chosen === "fiddler"
					? FIDDLER.facets
					: chosen === "wasp"
						? WASP.facets
						: chosen === "scout"
							? SCOUT.facets
							: CRUISER.facets
				).flatMap((f) => f.points);
	const points: number[][] = hull.map((p) => [p[0], p[1]]);
	for (const m of mounts) {
		// Bounds include the fitting, slot number, caption and selection brackets.
		const r = Math.max(12, m.width, m.height);
		for (const x of [-r, r])
			for (const y of [-r, r])
				points.push([
					m.x + x * Math.cos(m.angle) - y * Math.sin(m.angle),
					m.y + x * Math.sin(m.angle) + y * Math.cos(m.angle),
				]);
		if (m.linkedTo)
			points.push([
				Math.max(CHASSIS[chosen].length, ...mounts.map((m) => m.x)) + 8,
				m.y,
			]);
	}
	const xs = points.map((p) => p[1]),
		ys = points.map((p) => -p[0]);
	const minX = Math.min(...xs),
		maxX = Math.max(...xs),
		minY = Math.min(...ys),
		maxY = Math.max(...ys);
	const top = Math.max(60, titleHeight + 32);
	const drawingHeight = Math.max(1, previewHeight - top - 28);
	const scale = Math.max(
		0.01,
		Math.min(
			Math.max(1, previewWidth - 32) / (maxX - minX),
			drawingHeight / (maxY - minY),
		),
	);
	return {
		scale,
		x: previewWidth / 2 - ((minX + maxX) * scale) / 2,
		y: top + drawingHeight / 2 - ((minY + maxY) * scale) / 2,
	};
});
const previewScale = $derived(framing.scale);
const previewY = $derived(framing.y);
const mount = $derived(
	mounts.find((item) => item.key === selected) ?? mounts[0],
);
const compatible = $derived(
	Object.values(PARTS).filter((part) => slotAccepts(mount.type, part.category)),
);
onMount(() => {
	loadCanvasFonts().then(() => {
		fontsLoaded = true;
	});
	try {
		// Alpha: saves from before the fighter/corvette ids are purged, not migrated.
		localStorage.removeItem("void-drift-builds-v1");
		localStorage.removeItem("void-drift-builds-v2");
		const saved = localStorage.getItem("void-drift-builds-v3");
		if (saved) {
			const parsed = BuildStoreSchema.safeParse(JSON.parse(saved));
			if (parsed.success) builds = parsed.data;
			else
				notice =
					"The saved build could not be read. Restored flyable starting ships.";
		}
	} catch {
		notice =
			"Browser storage is unavailable or unreadable. You can still build and fly.";
	}
	const requested = ShipProfileIdSchema.safeParse(
		new URL(window.location.href).searchParams.get("chassis"),
	);
	if (requested.success) choose(requested.data);
	ready = true;
});
$effect(() => {
	// Read so slot labels redraw once webfonts load; canvas text does not load them.
	void fontsLoaded;
	const context = canvas?.getContext("2d");
	if (context && canvas) {
		const dpr = window.devicePixelRatio || 1;
		canvas.width = Math.round(previewWidth * dpr);
		canvas.height = Math.round(previewHeight * dpr);
		context.scale(dpr, dpr);
		drawBuild(
			context,
			build,
			framing.x,
			previewY,
			-Math.PI / 2,
			previewScale,
			selected,
			previewMode === "Plan"
				? {
						dark: COLOR.void,
						lime: COLOR.selected,
						ivory: COLOR.text,
					}
				: undefined,
		);
	}
});
$effect(() => {
	if (ready) {
		try {
			localStorage.setItem("void-drift-builds-v3", JSON.stringify(builds));
		} catch {
			notice =
				"Storage is unavailable. Changes are kept until this page closes.";
		}
	}
});
function install(id: PartId | null) {
	if (
		mount.linkedTo ||
		(!id && mount.required) ||
		(id && !slotAccepts(mount.type, PARTS[id].category))
	)
		return;
	if (mount.group === "side") {
		if (
			id === "ion" ||
			id === "heavy-ion" ||
			id === "fusion" ||
			id === "plasma"
		)
			build.side = id;
	} else if (chosen === "fiddler" && mount.group === "aft") {
		build.aft = [id, id];
	} else build[mount.group][mount.index] = id;
}
function choose(id: ShipProfileId) {
	chosen = id;
	selected = "left";
}
</script>

{#if flying}
	<FlightDeck
		loadout={build}
		launchSource="hangar"
		mode={flying === "test" ? "practice" : flying}
		onReturn={() => (flying = null)}
	/>
{:else}
	<main class="builder">
		<header>
			<a class="brand" href="/"><Logo size="sm" /></a
			><span
				>{lab
					? "SHIP BUILDER LAB / SHARED SYSTEMS"
					: `HANGAR / ${version}`}</span
			><a href="/">Return to title screen</a>
		</header>
		<div class="heading">
			<h1>Hangar</h1>
			<span class="saved"
				>{ready ? "BUILDS SAVED ON THIS BROWSER" : "LOADING BUILDS"}</span
			>
		</div>
		<div class="chassis">
			<Toggle
				label="Choose chassis"
				stretch
				details={Object.fromEntries(
					shipIds.map((id) => [
						SHIP_IDENTITY[id].shortName,
						`${(id === "wasp" ? 1 : 2) + CHASSIS[id].hull + CHASSIS[id].aft} slots · ${CHASSIS[id].mass} mass`,
					]),
				)}
				options={shipIds.map((id) => SHIP_IDENTITY[id].shortName)}
				bind:value={
					() => SHIP_IDENTITY[chosen].shortName,
					(name) => {
	const id = shipIds.find((id) => SHIP_IDENTITY[id].shortName === name);
	if (id) choose(id);
}
				}
			/>
		</div>
		<div class="workbench">
			<div class="ship-column">
				<section class="assembly" aria-label="Ship assembly">
					<div
						class="blueprint"
						bind:clientWidth={previewWidth}
						bind:clientHeight={previewHeight}
					>
						{#if previewMode === "Plan"}
							<div class="view-axes" aria-hidden="true"></div>
						{/if}
						<div class="preview-mode">
							<Toggle
								compact
								label="Ship preview mode"
								options={["Plan", "View"]}
								bind:value={previewMode}
							/>
						</div>
						<h2 class="ship-name" bind:clientHeight={titleHeight}>
							{SHIP_IDENTITY[chosen].longName}
						</h2>
						<span class="view-caption"
							>{previewMode === "Plan"
								? "FIXED MOUNTS / TOP VIEW"
								: "IN-GAME / TOP VIEW"}</span
						>
						<canvas
							width="600"
							height="540"
							bind:this={canvas}
							aria-label="Ship preview with installed parts"
						></canvas>
						{#each previewMode === "Plan" ? mounts : [] as slot}
							<button
								type="button"
								class="mount"
								disabled={Boolean(slot.linkedTo)}
								title={slot.linkedTo
									? "Linked to the left engine slot; edit the pair there"
									: slot.label}
								style:left={`${((framing.x + slot.y * previewScale) / previewWidth) * 100}%`}
								style:top={`${((previewY - slot.x * previewScale) / previewHeight) * 100}%`}
								style:width={`${(((SLOT_STYLE.width + 2 * SLOT_STYLE.gap) / SLOT_STYLE.referenceScale) * previewScale * 100) / previewWidth}%`}
								style:height={`${(((SLOT_STYLE.height + 2 * SLOT_STYLE.gap) / SLOT_STYLE.referenceScale) * previewScale * 100) / previewHeight}%`}
								style:transform={`translate(-50%, -50%) rotate(${slot.angle}rad)`}
								aria-label={`${slot.label}: ${slot.part ? PARTS[slot.part].name : "Empty"}`}
								aria-pressed={mount.key === slot.key}
								onclick={() => (selected = slot.key)}
							></button>
						{/each}
					</div>
				</section>
				<section class="ship-systems cut-surface" aria-label="Ship systems">
					<label class="system-setting" for="hangar-stabilizers">
						<span
							>Ion stabilizers{chosen === "wasp" || chosen === "fiddler"
								? " (forced on)"
								: ""}</span
						>
						<Switch
							id="hangar-stabilizers"
							bind:checked={build.stabilizers}
							disabled={chosen === "wasp" || chosen === "fiddler"}
						/>
					</label>
					<p class="assembly-note">
						0.22 Light-ion thrust · 0.25 Light-ion energy while firing. Assist
						turns and brake spin automatically.
					</p>

					<p class="assembly-note">
						{chosen === "fiddler"
							? "Four engines in two required matching pairs. Five independent weapon/support fittings. Four turning stabilizers are forced on."
							: chosen === "wasp"
								? "One rear center engine (fires on A+D) and two independent under-wing equipment slots. Four turning stabilizers are forced on."
								: "Side engines are a mirrored pair. Hull and aft fittings are independent."}
						<br>Every installed part adds mass. Weapons are static fittings in
						this alpha.
					</p>
				</section>
				<section class="ship-systems cut-surface" aria-label="Linked engines">
					<label class="system-setting" for="hangar-linked-engines">
						<span>Linked engines</span>
						<Switch
							id="hangar-linked-engines"
							bind:checked={
								() => build.linkedEngines ?? false,
								(value) => (build.linkedEngines = value)
							}
						/>
					</label>
					<p class="assembly-note">
						{chosen === "fiddler"
							? "Turning or braking spin also fires the two main engines on the corresponding side. This adds forward thrust, without changing the turn. When off, mains require both controls."
							: "Left or right input also fires all fitted aft engines. When off, aft engines require both inputs."}
					</p>
				</section>
			</div>
			<section class="parts" aria-label="Compatible parts">
				<p class="eyebrow">SELECTED MOUNT</p>
				<h2>{mount.label}</h2>
				<p>
					{mount.required
						? "Required engine pair. One choice fits both sides; each engine adds mass."
						: mount.group === "side"
							? chosen === "wasp"
								? "Single rear center engine. Required propulsion slot."
								: "One choice fits both sides. Two engines, two masses."
							: "Swap freely. Empty is a valid choice."}
				</p>
				<div class="part-list">
					{#each compatible as part}
						<button
							type="button"
							class="part"
							class:installed={mount.part === part.id}
							aria-pressed={mount.part === part.id}
							onclick={() => install(part.id)}
						>
							{#if part.category === "E"}
								<svg
									viewBox="-18 -20 36 40"
									width="72"
									height="56"
									aria-hidden="true"
									style:color={part.id === "fusion"
										? ENGINE_ACCENT.fusion
										: part.id === "plasma"
											? ENGINE_ACCENT.plasma
											: ENGINE_ACCENT.ion}
								>
									<g transform="rotate(-90)">
										{#each ENGINE_ART[engineArtId(part.id)][0] as face}
											<polygon
												points={face.points.map((p) => p.join(",")).join(" ")}
												fill={face.color}
											/>
										{/each}
									</g>
								</svg>
							{:else if part.id === "gravity-coil"}
								<svg
									viewBox="-24 -30 48 60"
									width="72"
									height="56"
									aria-hidden="true"
								>
									<g transform="rotate(-90)">
										{#each UTILITY_ART.gravity as face}
											<path
												d={face.contours
													.map(
														(c) => `M${c.map((p) => p.join(",")).join("L")}Z`,
													)
													.join(" ")}
												fill={face.color}
												fill-rule={face.fillRule}
											/>
										{/each}
									</g>
								</svg>
							{:else if part.capacity > 0}
								<svg
									viewBox="-24 -30 48 60"
									width="72"
									height="56"
									aria-hidden="true"
								>
									{#each POTENTIAL_WELL_ART[
										part.id === "heavy-well" ? "heavy" : "normal"
									] as face}
										<path
											d={face.path}
											fill={face.fill}
											stroke={face.stroke}
											stroke-width={face.width}
										/>
									{/each}
								</svg>
							{/if}
							<span class="part-name"
								>{part.name}<small
									>{mount.part === part.id ? "FITTED" : part.category}</small
								></span
							>
							<span
								>{part.mass}
								mass{part.category === "E"
									? ` · ${part.draw} energy/s`
									: ""}</span
							>
							<small
								>{part.category === "E"
									? `${part.thrust.toLocaleString()} thrust · ${part.response === "pulse" ? "0.18s pulse / 0.45s cycle" : part.response === "delayed" ? "0.6s charge, then sustained" : "Immediate / steady"}`
									: part.capacity > 0
										? `+${part.capacity} energy capacity`
										: part.id === "coil"
											? "+1× solar charging"
											: part.id === "rail" || part.id === "laser"
												? `${part.id === "rail" ? "Fixed direction · automatic" : "Rotating point defence"} · ${WEAPONS[part.id].energy} energy/shot · Derelicts only`
												: "Static fitting · no energy draw"}</small
							>
							{#if part.description}
								<small>{part.description}</small>
							{/if}
						</button>
					{/each}
					{#if mount.group !== "side" && !mount.required}
						<button
							type="button"
							class="btn btn-ghost"
							disabled={!mount.part}
							onclick={() => install(null)}
						>
							Remove fitting
						</button>
					{/if}
				</div>
			</section>
			<aside class="numbers" aria-label="Build statistics">
				<h2>Flight estimates</h2>
				<dl>
					<div>
						<dt>Powered cruise ceiling</dt>
						<dd>{stats.poweredCruiseCeiling} u/s</dd>
					</div>
					<div>
						<dt>Hull base + installed engines</dt>
						<dd>
							{stats.hullBaseSpeed}
							+ {stats.installedEngineContribution} u/s
						</dd>
					</div>
					<div>
						<dt>Total mass</dt>
						<dd>{stats.mass}</dd>
					</div>
					<div>
						<dt>Energy capacity</dt>
						<dd>{stats.capacity}%</dd>
					</div>
					<div>
						<dt>Solar charging</dt>
						<dd>{stats.coils}×</dd>
					</div>
					<div>
						<dt>Charging zones¹</dt>
						<dd>{4 * stats.coils} / {2 * stats.coils} / {0.5 * stats.coils}</dd>
					</div>
					<div>
						<dt>Life support</dt>
						<dd>{LIFE_SUPPORT_DRAIN} /s</dd>
					</div>
					<div>
						<dt>All engines + life support</dt>
						<dd>{stats.drain} /s</dd>
					</div>
					<div>
						<dt>Coasting endurance²</dt>
						<dd>{stats.endurance.toFixed(1)} s</dd>
					</div>
					<div>
						<dt>Full thrust endurance²</dt>
						<dd>{stats.fullEndurance.toFixed(1)} s</dd>
					</div>
					<div>
						<dt>Peak forward acceleration³</dt>
						<dd>{stats.acceleration.toFixed(1)}</dd>
					</div>
					<div>
						<dt>Single-side angular acceleration</dt>
						<dd>
							{((Math.abs(stats.turnRate) * 180) / Math.PI).toFixed(1)}
							°/s²
						</dd>
					</div>
					<div>
						<dt>Side mount angle / arm</dt>
						<dd>{CHASSIS[chosen].angle.toFixed(1)}° / {CHASSIS[chosen].arm}</dd>
					</div>
				</dl>
				<p class="footnote">
					¹ Energy/s, near → far, G-class sun.<br>² Full batteries, no solar
					charging.<br>³ At rest, both controls, world units/s²; full power and
					all fitted engines active. Instantaneous peak before pulse/charge
					timing. Intrinsic battery and coil included. More mass slows
					acceleration and turning.
					{chosen === "fiddler"
						? "Stabilizers provide turning; linked mains add forward speed only."
						: "The side mounts turn left-engine input clockwise and right-engine input counterclockwise."}
				</p>
			</aside>
		</div>
		<footer>
			<div>
				<p>
					A + D or ← + → ·
					{chosen === "fiddler"
						? build.linkedEngines
							? "Turn + matching-side drive; both controls fire all four."
							: "One control turns; both fire all four mains."
						: build.linkedEngines
							? "Either control fires aft engines."
							: "Both controls fire aft engines."}
				</p>
			</div>
			<div class="actions">
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => (flying = "test")}
				>
					Test flight
				</button><button
					type="button"
					class="btn btn-filled"
					onclick={() => (flying = "survival")}
				>
					Start survival
				</button>
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => (flying = "derelicts")}
				>
					Derelicts
				</button>
			</div>
		</footer>
		<p class="footnote">
			Test flight: practise in a repeatable star system with full health and
			energy. Derelicts: survive, destroy passing wrecks and collect energy; see
			your score at game over. Pause to resume or abort back to the Hangar.
			Custom survival is unranked; weapons remain inactive there.
		</p>
		{#if notice}
			<p role="status">{notice}</p>
		{/if}
	</main>
{/if}
<style>
.builder {
	height: 100dvh;
	overflow: auto;
	padding: 24px 36px;
	color: var(--color-text);
	background: var(--color-void);
}
header,
.heading,
footer,
.actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20px;
}
header a {
	color: var(--color-text-muted);
	text-decoration: none;
}
header a:hover {
	color: var(--color-action);
}
header .brand {
	color: var(--color-brand);
}
header {
	padding-bottom: 22px;
	border-bottom: 1px solid var(--color-border-subtle);
	font-size: 12px;
	letter-spacing: 0.12em;
}
.heading {
	margin: 26px 0;
}
h1 {
	font-size: var(--font-size-heading);
	margin: 4px 0 8px;
}
h2 {
	font-size: 20px;
	margin: 4px 0 12px;
}
p {
	line-height: 1.6;
	color: var(--color-text-muted);
	margin: 6px 0;
}
.eyebrow {
	color: var(--color-text-muted);
	font-size: 11px;
	letter-spacing: 0.16em;
}
.saved,
.view-caption {
	font-size: 10px;
	color: var(--color-text-muted);
	letter-spacing: 0.1em;
}
.chassis {
	display: flex;
	gap: 12px;
	margin-bottom: 22px;
}
.workbench {
	display: grid;
	grid-template-columns: minmax(360px, 1.4fr) minmax(250px, 1fr) minmax(
			270px,
			1fr
		);
	gap: 20px;
}
.parts,
.numbers {
	border: 1px solid var(--color-border-subtle);
	padding: 20px;
	background: var(--color-elev-1);
}
.ship-column {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-md);
	min-width: 0;
}
.ship-systems {
	--_fill: var(--color-elev-1);
	--_edge: transparent;
	padding: var(--spacing-md);
}
.system-setting {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--spacing-sm);
	min-height: var(--control-min-height);
	cursor: pointer;
}
.blueprint {
	background: var(--surface-display);
	box-shadow: var(--shadow-display);
}
.blueprint {
	position: relative;
	isolation: isolate;
	aspect-ratio: 600 / 540;
	width: 100%;
	margin: auto;
}
.preview-mode {
	position: absolute;
	top: var(--spacing-md);
	right: var(--spacing-md);
	z-index: var(--layer-hud);
}
.ship-name {
	position: absolute;
	top: var(--spacing-md);
	left: var(--spacing-md);
	max-width: calc(100% - 180px);
	margin: 0;
	text-align: left;
	z-index: var(--layer-base);
	pointer-events: none;
}
.view-caption {
	position: absolute;
	bottom: var(--spacing-md);
	right: var(--spacing-md);
	z-index: var(--layer-raised);
	pointer-events: none;
}
canvas {
	z-index: var(--layer-raised);
	width: 100%;
	height: 100%;
	position: absolute;
	inset: 0;
}
.view-axes {
	position: absolute;
	inset: 0;
	pointer-events: none;
	background:
		linear-gradient(var(--color-border-subtle), var(--color-border-subtle))
		center / 1px 100% no-repeat,
		linear-gradient(var(--color-border-subtle), var(--color-border-subtle))
		center / 100% 1px no-repeat;
}
.mount {
	z-index: var(--layer-hud);
	position: absolute;
	border: 0;
	background: transparent;
	cursor: pointer;
}
.mount:disabled {
	cursor: default;
}
.mount:hover {
	background: transparent;
}
.mount:focus-visible {
	outline: 3px solid var(--color-text);
	outline-offset: 4px;
}
.assembly-note,
.footnote {
	font-size: 11px;
}
.part-list {
	display: grid;
	gap: 10px;
	margin-top: 20px;
}
.part {
	text-align: left;
	background: transparent;
	color: inherit;
	border: 1px solid var(--color-border-subtle);
	padding: 14px;
	cursor: pointer;
	display: grid;
	gap: 7px;
}
.part:hover,
.part.installed {
	border-color: var(--color-selected);
}
.part.installed {
	background: var(--color-void);
}
.part-name {
	display: flex;
	justify-content: space-between;
	font-weight: 700;
}
.part small,
.part > span + span {
	font-size: 11px;
	color: var(--color-text-muted);
}
.part-name small {
	color: var(--color-text-muted);
}
dl {
	margin: 20px 0;
}
dl div {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	border-bottom: 1px solid var(--color-border-subtle);
	padding: 10px 0;
}
dt {
	font-size: 12px;
	color: var(--color-text-muted);
}
dd {
	margin: 0;
	font-variant-numeric: tabular-nums;
	font-size: 15px;
	white-space: nowrap;
}
footer {
	position: sticky;
	bottom: 0;
	z-index: var(--layer-raised);
	background: var(--color-void);
	padding-bottom: 12px;
	margin-top: 22px;
	border-top: 1px solid var(--color-border-subtle);
	padding-top: 20px;
}
footer p {
	font-size: 12px;
}
.actions button {
	min-width: 180px;
}

@media (max-width: 1000px) {
	.workbench {
		grid-template-columns: minmax(0, 1fr);
	}
	.builder {
		padding: 16px;
	}
	.chassis {
		flex-wrap: wrap;
	}
	.heading,
	header,
	footer {
		flex-wrap: wrap;
	}
	.actions {
		flex-wrap: wrap;
	}
}
</style>
