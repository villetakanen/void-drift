<script lang="ts">
import {
	BuildStoreSchema,
	buildMounts,
	buildStats,
	CHASSIS,
	defaultBuilds,
	drawBuild,
	ENGINE_ART,
	engineArtId,
	PARTS,
	type PartId,
	type ShipProfileId,
	ShipProfileIdSchema,
	SLOT_STYLE,
	slotAccepts,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { version } from "../../package.json";
import FlightDeck from "./FlightDeck.svelte";

let { lab = false }: { lab?: boolean } = $props();
let builds = $state(defaultBuilds());
let chosen = $state<ShipProfileId>("balanced");
let selected = $state("left");
let flying = $state<"test" | "survival" | null>(null);
let ready = $state(false);
let notice = $state("");
let canvas = $state<HTMLCanvasElement>();
const build = $derived(builds[chosen]);
const stats = $derived(buildStats(build));
const mounts = $derived(buildMounts(build));
const previewScale = $derived(chosen === "tank" ? 4.5 : 5.2);
const previewY = $derived(chosen === "tank" ? 270 : 325);
const mount = $derived(
	mounts.find((item) => item.key === selected) ?? mounts[0],
);
const compatible = $derived(
	Object.values(PARTS).filter((part) => slotAccepts(mount.type, part.category)),
);
onMount(() => {
	try {
		localStorage.removeItem("void-drift-builds-v1");
		const saved = localStorage.getItem("void-drift-builds-v2");
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
	const context = canvas?.getContext("2d");
	if (context && canvas) {
		context.clearRect(0, 0, 600, 540);
		const style = getComputedStyle(canvas);
		drawBuild(
			context,
			build,
			300,
			previewY,
			-Math.PI / 2,
			previewScale,
			selected,
			{
				dark: style.getPropertyValue("--color-void").trim(),
				lime: style.getPropertyValue("--color-acid-lime").trim(),
				ivory: style.getPropertyValue("--color-text").trim(),
			},
		);
	}
});
$effect(() => {
	if (ready) {
		try {
			localStorage.setItem("void-drift-builds-v2", JSON.stringify(builds));
		} catch {
			notice =
				"Storage is unavailable. Changes are kept until this page closes.";
		}
	}
});
function install(id: PartId | null) {
	if (mount.linkedTo || (id && !slotAccepts(mount.type, PARTS[id].category)))
		return;
	if (mount.group === "side") {
		if (
			id === "ion" ||
			id === "heavy-ion" ||
			id === "fusion" ||
			id === "plasma"
		)
			build.side = id;
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
		testFlight={flying === "test"}
		onReturn={() => (flying = null)}
	/>
{:else}
	<main class="builder">
		<header>
			<a class="brand" href="/">VOID·DRIFT</a
			><span
				>{lab
					? "SHIP BUILDER LAB / SHARED SYSTEMS"
					: `SHIPYARD / ${version}`}</span
			><a href="/lab/flight">Flight Lab</a>
		</header>
		<div class="heading">
			<div>
				<p class="eyebrow">BUILD SOMETHING THAT FEELS YOURS</p>
				<h1>Your ship. Your compromise.</h1>
				<p>Fit a slot. Watch the numbers. Take it out.</p>
			</div>
			<span class="saved"
				>{ready ? "BUILDS SAVED ON THIS BROWSER" : "LOADING BUILDS"}</span
			>
		</div>
		<nav class="chassis" aria-label="Choose chassis">
			{#each Object.entries(CHASSIS) as [id, chassis]}
				<button
					type="button"
					class="btn"
					class:btn-filled={chosen === id}
					class:btn-ghost={chosen !== id}
					aria-pressed={chosen === id}
					onclick={() => choose(id as ShipProfileId)}
				>
					{chassis.name}<small
						>{2 + chassis.hull + chassis.aft}
						SLOTS · {chassis.mass} MASS</small
					>
				</button>
			{/each}
		</nav>
		<div class="workbench">
			<section class="assembly" aria-label="Ship assembly">
				<div class="panel-title">
					<h2>{CHASSIS[chosen].name}</h2>
					<span>FIXED MOUNTS / TOP VIEW</span>
				</div>
				<div class="blueprint">
					<div class="grid-lines"></div>
					<canvas
						width="600"
						height="540"
						bind:this={canvas}
						aria-label="Ship preview with installed parts"
					></canvas>
					{#each mounts as slot}
						<button
							type="button"
							class="mount"
							disabled={Boolean(slot.linkedTo)}
							title={slot.linkedTo
								? "Linked to the left engine slot; edit the pair there"
								: slot.label}
							style:left={`${(300 + slot.y * previewScale) / 6}%`}
							style:top={`${(previewY - slot.x * previewScale) / 5.4}%`}
							style:width={`${(((SLOT_STYLE.width + 2 * SLOT_STYLE.gap) / SLOT_STYLE.referenceScale) * previewScale) / 6}%`}
							style:height={`${(((SLOT_STYLE.height + 2 * SLOT_STYLE.gap) / SLOT_STYLE.referenceScale) * previewScale) / 5.4}%`}
							style:transform={`translate(-50%, -50%) rotate(${slot.angle}rad)`}
							aria-label={`${slot.label}: ${slot.part ? PARTS[slot.part].name : "Empty"}`}
							aria-pressed={mount.key === slot.key}
							onclick={() => (selected = slot.key)}
						></button>
					{/each}
				</div>
				<p class="assembly-note">
					Side engines are a mirrored pair. Hull and aft fittings are
					independent.<br>Every installed part adds mass. Weapons are static
					fittings in this alpha.
				</p>
			</section>
			<section class="parts" aria-label="Compatible parts">
				<p class="eyebrow">SELECTED MOUNT</p>
				<h2>{mount.label}</h2>
				<p>
					{mount.group === "side"
						? "One choice fits both sides. Two engines, two masses."
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
										? "#c6ff32"
										: part.id === "plasma"
											? "#ffb52e"
											: "#29baff"}
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
									? `${part.thrust.toLocaleString()} thrust · ${part.limit} powered ceiling · ${part.response === "pulse" ? "0.18s pulse / 0.45s cycle" : part.response === "delayed" ? "0.6s charge, then sustained" : "Immediate / steady"}`
									: part.id === "battery"
										? "+100 energy capacity"
										: part.id === "coil"
											? "+1× solar charging"
											: "Static fitting · no energy draw"}</small
							>
						</button>
					{/each}
					{#if mount.group !== "side"}
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
				<p class="eyebrow">FLIGHT ESTIMATE</p>
				<h2>Know your ship.</h2>
				<dl>
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
						<dd>3 /s</dd>
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
						<dt>Single-side turning</dt>
						<dd>
							{((Math.abs(stats.turnRate) * 180) / Math.PI).toFixed(1)}
							°/s
						</dd>
					</div>
					<div>
						<dt>Side mount angle / arm</dt>
						<dd>{CHASSIS[chosen].angle.toFixed(1)}° / {CHASSIS[chosen].arm}</dd>
					</div>
				</dl>
				<p class="footnote">
					¹ Energy/s, near → far, G-class sun.<br>² Full batteries, no solar
					charging.<br>³ At rest, both controls, world units/s².<br>Intrinsic
					battery and coil included. More mass slows acceleration and turning.
					The side mounts turn left-engine input clockwise and right-engine
					input counterclockwise.
				</p>
			</aside>
		</div>
		<footer>
			<div>
				<strong>Ready when you are.</strong>
				<p>A + D or ← + → · Both controls fire aft engines.</p>
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
			</div>
		</footer>
		<p class="footnote">
			Test flight: small sun, real energy and damage, no game-over. Custom
			survival is unranked during alpha tuning.
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
.panel-title,
footer,
.actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20px;
}
header a {
	color: var(--color-text-dim);
	text-decoration: none;
}
header a:hover {
	color: var(--color-acid-lime);
}
header {
	padding-bottom: 22px;
	border-bottom: 1px solid var(--color-flight-trail);
	font-size: 12px;
	letter-spacing: 0.12em;
}
.heading {
	margin: 26px 0;
}
h1 {
	font-size: 32px;
	margin: 4px 0 8px;
}
h2 {
	font-size: 20px;
	margin: 4px 0 12px;
}
p {
	line-height: 1.6;
	color: var(--color-text-dim);
	margin: 6px 0;
}
.eyebrow {
	color: var(--color-acid-lime);
	font-size: 11px;
	letter-spacing: 0.16em;
}
.saved,
.panel-title span {
	font-size: 10px;
	color: var(--color-text-dim);
	letter-spacing: 0.1em;
}
.chassis {
	display: flex;
	gap: 12px;
	margin-bottom: 22px;
}
.chassis button {
	flex: 1;
	display: flex;
	justify-content: space-between;
	gap: 12px;
}
.chassis small {
	font-size: 10px;
}
.workbench {
	display: grid;
	grid-template-columns: minmax(360px, 1.4fr) minmax(250px, 1fr) minmax(
			270px,
			1fr
		);
	gap: 20px;
}
.assembly,
.parts,
.numbers {
	border: 1px solid var(--color-flight-trail);
	padding: 20px;
	background: var(--color-void-light);
}
.blueprint {
	position: relative;
	aspect-ratio: 600 / 540;
	width: 100%;
	max-width: 533px;
	margin: auto;
}
canvas {
	width: 100%;
	height: 100%;
	position: absolute;
	inset: 0;
}
.grid-lines {
	position: absolute;
	inset: 0;
	opacity: 0.2;
	background-image:
		linear-gradient(#537079 1px, transparent 1px),
		linear-gradient(90deg, #537079 1px, transparent 1px);
	background-size: 30px 30px;
}
.mount {
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
	border: 1px solid var(--color-flight-trail);
	padding: 14px;
	cursor: pointer;
	display: grid;
	gap: 7px;
}
.part:hover,
.part.installed {
	border-color: var(--color-acid-lime);
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
	color: var(--color-text-dim);
}
.part-name small {
	color: var(--color-acid-lime);
}
dl {
	margin: 20px 0;
}
dl div {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	border-bottom: 1px solid var(--color-flight-trail);
	padding: 10px 0;
}
dt {
	font-size: 12px;
	color: var(--color-text-dim);
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
	z-index: 2;
	background: var(--color-void);
	padding-bottom: 12px;
	margin-top: 22px;
	border-top: 1px solid var(--color-flight-trail);
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
	.chassis button {
		min-width: 160px;
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
