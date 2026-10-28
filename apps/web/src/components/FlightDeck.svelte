<script lang="ts">
import { Camera, Input, Renderer } from "@void-drift/core";
import {
	CHALLENGE,
	type FlightSettings,
	FlightSettingsSchema,
	SHIP_PROFILES,
	type ShipProfileId,
	ShipProfileIdSchema,
	Simulation,
	STEP,
	scoresAvailable,
	stockSettings,
	submitHighScore,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { settings } from "../lib/stores/settings";

let { lab = false }: { lab?: boolean } = $props();
let canvas: HTMLCanvasElement;
let simulation: Simulation;
let input: Input;
let renderer: Renderer;
let camera: Camera;
let chosen = $state<ShipProfileId>("balanced");
let tuning = $state<FlightSettings>(stockSettings());
let status = $state("MENU");
let paused = $state(false);
let seconds = $state(0);
let hull = $state(100);
let power = $state(100);
let x = $state(460);
let y = $state(540);
let zoom = $state(1);
let zoomLevel = $state(0);
let activeZoomSteps = $state(5);
let previewLevel = $state(-1);
let ticks = $state(0);
let left = $state(false);
let right = $state(false);
let cause = $state("");
let wraps = $state(0);
let json = $state("");
let message = $state("");
let initials = $state("AAA");
let saving = $state(false);
let scoreSaved = $state(false);
const replay = [
	{ ticks: 180, leftThruster: true, rightThruster: true, fire: false as const },
	{ ticks: 90, leftThruster: true, rightThruster: false, fire: false as const },
	{ ticks: 180, leftThruster: true, rightThruster: true, fire: false as const },
];
const coast = [
	{
		ticks: 36000,
		leftThruster: false,
		rightThruster: false,
		fire: false as const,
	},
];
let trailX = new Float64Array(80);
let trailY = new Float64Array(80);
let trailCount = 0;
function reset(start = false) {
	input?.reset();
	previewLevel = -1;
	simulation = new Simulation(lab ? tuning : stockSettings(chosen));
	if (start) simulation.start();
	paused = false;
	trailCount = 0;
	scoreSaved = false;
	message = "";
	frameCamera(true);
	sync();
}
function frameCamera(snap = false) {
	if (!camera || !simulation) return;
	const c = simulation.settings.camera;
	camera.frame(
		simulation.ship.pos.x,
		simulation.ship.pos.y,
		960,
		540,
		c.padding,
		c.smoothing,
		snap,
		c.zoomSteps,
		lab && previewLevel >= 0 ? previewLevel : null,
	);
}
function sync() {
	status = simulation.state.status;
	seconds = simulation.state.elapsedTime;
	hull = simulation.state.resources.hull;
	power = simulation.state.resources.power;
	x = simulation.ship.pos.x;
	y = simulation.ship.pos.y;
	ticks = simulation.ticks;
	wraps = simulation.wraps;
	cause = simulation.state.deathCause ?? "";
	zoom = camera?.zoom ?? 1;
	zoomLevel = camera?.zoomLevel ?? 0;
	activeZoomSteps = simulation.settings.camera.zoomSteps;
}
function selectShip(value: string) {
	chosen = ShipProfileIdSchema.parse(value);
	tuning = stockSettings(chosen);
	settings.set({ ...settings.get(), selectedShipId: chosen });
	reset(false);
}
function start() {
	reset(true);
	(document.activeElement as HTMLElement)?.blur();
}
function togglePause() {
	paused = !paused;
	input?.reset();
}
function step() {
	if (simulation.state.status === "MENU") simulation.start();
	paused = true;
	advance({ leftThruster: false, rightThruster: false, fire: false });
	sync();
}
function advance(state: {
	leftThruster: boolean;
	rightThruster: boolean;
	fire: boolean;
}) {
	const before = simulation.wraps;
	simulation.step(state);
	if (before !== simulation.wraps) trailCount = 0;
	frameCamera(before !== simulation.wraps);
	camera.update(STEP);
	if (simulation.state.status === "PLAYING") {
		const i = trailCount % 80;
		trailX[i] = simulation.ship.pos.x;
		trailY[i] = simulation.ship.pos.y;
		trailCount++;
	}
}
function trial(coasting = false) {
	reset(true);
	for (const chunk of coasting ? coast : replay)
		for (
			let i = 0;
			i < chunk.ticks && simulation.state.status === "PLAYING";
			i++
		)
			advance(chunk);
	paused = true;
	sync();
}
function apply() {
	const parsed = FlightSettingsSchema.safeParse(tuning);
	if (!parsed.success) {
		message = "Use finite values within the displayed tuning ranges.";
		return;
	}
	tuning = parsed.data;
	chosen = tuning.profile.id;
	reset(false);
	json = JSON.stringify(tuning, null, 2);
}
function importTrial() {
	try {
		const next = FlightSettingsSchema.parse(JSON.parse(json));
		tuning = next;
		chosen = next.profile.id;
		reset(false);
		message = "Trial imported. Ready to fly or replay.";
	} catch {
		message =
			"Invalid trial. Check the seed, profile and camera ranges. Current flight is unchanged.";
	}
}
async function save() {
	if (lab || status !== "GAME_OVER" || saving || scoreSaved) return;
	saving = true;
	const result = await submitHighScore({
		initials,
		seconds: Math.max(1, Math.floor(seconds)),
		shipId: chosen,
		challenge: CHALLENGE,
		deathCause: simulation.state.deathCause ?? "POWER",
	});
	saving = false;
	scoreSaved = result.success;
	message = result.success
		? "Personal best saved. Compare your run on the leaderboard."
		: result.error;
}
function press(event: PointerEvent, side: "left" | "right") {
	const button = event.currentTarget as HTMLElement;
	button.setPointerCapture(event.pointerId);
	input?.setPointer(event.pointerId, side);
}
function release(event: PointerEvent) {
	input?.setPointer(event.pointerId, null);
}
onMount(() => {
	chosen = settings.get().selectedShipId;
	tuning = stockSettings(chosen);
	if (lab) {
		const trialJSON = new URL(location.href).searchParams.get("trial");
		if (trialJSON) {
			try {
				tuning = FlightSettingsSchema.parse(JSON.parse(trialJSON));
				chosen = tuning.profile.id;
			} catch {
				message = "Invalid trial link; using stock settings.";
			}
		}
	}
	renderer = new Renderer(canvas);
	renderer.resize(1920, 1080);
	camera = new Camera();
	input = new Input(canvas);
	reset();
	let last = performance.now();
	let accumulator = 0;
	let frame = 0;
	const context = canvas.getContext("2d");
	function draw(time: number) {
		const dt = Math.min((time - last) / 1000, 0.1);
		last = time;
		const controls = input.getEffectiveState(settings.get().invertControls);
		left = controls.leftThruster;
		right = controls.rightThruster;
		if (!paused && simulation.state.status === "PLAYING") {
			accumulator += dt;
			while (accumulator >= STEP) {
				advance(controls);
				accumulator -= STEP;
			}
		} else accumulator = 0;
		sync();
		renderer.clear();
		renderer.beginCamera(camera);
		renderer.drawBackground();
		renderer.drawArenaBoundary(1200);
		renderer.drawStar(simulation.star, simulation.ticks * STEP * 1000);
		for (const planet of simulation.planets) renderer.drawPlanet(planet);
		if (context) {
			context.strokeStyle = simulation.settings.profile.tint;
			context.lineWidth = 2;
			context.globalAlpha = 0.35;
			context.beginPath();
			const count = Math.min(80, trailCount);
			for (let n = 0; n < count; n++) {
				const i = (trailCount - count + n) % 80;
				if (n === 0) context.moveTo(trailX[i], trailY[i]);
				else context.lineTo(trailX[i], trailY[i]);
			}
			context.stroke();
			context.globalAlpha = 1;
			if (left || right) {
				context.save();
				context.translate(x, y);
				context.rotate(simulation.ship.rotation);
				context.fillStyle = simulation.settings.profile.tint;
				context.beginPath();
				context.moveTo(-8, -4);
				context.lineTo(-22 - (simulation.ticks % 4) * 2, 0);
				context.lineTo(-8, 4);
				context.fill();
				context.restore();
			}
		}
		renderer.drawShip(
			simulation.ship,
			simulation.settings.profile.tint,
			chosen,
		);
		renderer.endCamera();
		frame = requestAnimationFrame(draw);
	}
	const key = (event: KeyboardEvent) => {
		if (event.code === "Escape" && status === "PLAYING") togglePause();
	};
	const blur = () => {
		if (status === "PLAYING") paused = true;
	};
	window.addEventListener("keydown", key);
	window.addEventListener("blur", blur);
	frame = requestAnimationFrame(draw);
	return () => {
		cancelAnimationFrame(frame);
		input.destroy();
		window.removeEventListener("keydown", key);
		window.removeEventListener("blur", blur);
	};
});
</script>

<div
	class:lab
	class="flight-page"
	data-status={status}
	data-x={x.toFixed(4)}
	data-y={y.toFixed(4)}
	data-ticks={ticks}
	data-zoom={zoom.toFixed(4)}
	data-zoom-level={zoomLevel}
	data-zoom-steps={activeZoomSteps}
>
	<header class="flight-header">
		<a href="/" class="brand">VOID<span>·</span>DRIFT</a>
		<span class="edition">{lab ? "FLIGHT LAB" : "SURVIVAL / ALPHA 1"}</span>
		<nav aria-label="Flight navigation">
			<a href={lab ? "/" : "/lab/flight"}>{lab ? "Play" : "Flight Lab"}</a
			><a href="/leaderboard">Scores</a><a href="/settings">Settings</a>
		</nav>
	</header>
	<div class="flight-layout">
		<section class="flight-stage" aria-label="Flight arena">
			<canvas
				bind:this={canvas}
				aria-label="Ship, star and orbiting planets"
			></canvas>
			<div class="flight-hud">
				<div>
					<small>HULL</small><strong>{hull.toFixed(0)}%</strong
					><progress aria-label="Hull" max="100" value={hull}></progress>
				</div>
				<div>
					<small>POWER</small><strong>{power.toFixed(0)}%</strong
					><progress aria-label="Power" max="100" value={power}></progress>
				</div>
				<div class="timer">
					<small>SURVIVAL</small
					><strong class="time">{seconds.toFixed(1)}s</strong>
				</div>
			</div>
			{#if status === "MENU"}
				<div
					class="flight-overlay"
					role="dialog"
					aria-label="Game menu"
					aria-modal="true"
				>
					<div class="flight-card">
						<p class="eyebrow">
							{lab ? "DESIGN THE FLIGHT" : "KEEP THE ENGINES ALIVE"}
						</p>
						<h1>{lab ? "Test. Feel. Repeat." : "Dance with gravity."}</h1>
						<p>
							Skim the star to recharge. Stay clear of its heat.<br>Keep moving.
							Beat your best.
						</p>
						<label for="ship-select">Ship Chassis</label
						><select
							id="ship-select"
							value={chosen}
							onchange={(event) => selectShip(event.currentTarget.value)}
						>
							{#each SHIP_PROFILES as profile}
								<option value={profile.id}>{profile.name}</option>
							{/each}
						</select>
						<div class="ship-description">
							{chosen === "scout"
								? "SCOUT / Quick thrust. Sharp turns. Fragile hull."
								: chosen === "tank"
									? "TANK / Heavy hull. Efficient engines. Deliberate turns."
									: "BALANCED / Steady thrust. Predictable handling."}
						</div>
						<button type="button" class="btn btn-filled" onclick={start}>
							TAP TO START
						</button>
						<p class="control-copy">
							A + D / ← + → · Both engines thrust forward
						</p>
					</div>
				</div>
			{:else if status === "GAME_OVER"}
				<div
					class="flight-overlay"
					role="dialog"
					aria-label="Run complete"
					aria-modal="true"
				>
					<div class="flight-card">
						<p class="eyebrow">
							{cause === "STAR"
								? "TOO CLOSE TO THE STAR"
								: cause === "HULL"
									? "HULL LOST"
									: "POWER DEPLETED"}
						</p>
						<h1>{seconds.toFixed(1)} seconds.</h1>
						<p>Every orbit teaches you something.</p>
						{#if !lab}
							<label for="initials">Your initials</label>
							<input
								id="initials"
								maxlength="3"
								bind:value={initials}
								oninput={() => {
									initials = initials.toUpperCase().replace(/[^A-Z]/g, "");
								}}
							><button
								type="button"
								class="btn btn-filled"
								disabled={saving ||
									scoreSaved ||
									!scoresAvailable() ||
									!/^[A-Z]{3}$/.test(initials)}
								onclick={save}
							>
								{saving ? "Saving…" : scoreSaved ? "Saved" : "Submit Score"}
							</button>
							{#if !scoresAvailable()}
								<p>Shared scores are unavailable in this local session.</p>
							{/if}
						{/if}
						<button
							type="button"
							class="btn btn-ghost"
							onclick={() => reset(false)}
						>
							Try Again
						</button><a href="/leaderboard">View Leaderboard</a>
					</div>
				</div>
			{:else if paused}
				<div class="pause-banner">
					<span>PAUSED</span
					><button type="button" class="btn btn-ghost" onclick={togglePause}>
						Resume
					</button>
				</div>
			{/if}
			<div class="flight-controls">
				<button
					type="button"
					class:active={left}
					class="engine left"
					aria-label="Left engine"
					onpointerdown={(event) => press(event, "left")}
					onpointerup={release}
					onpointercancel={release}
					onlostpointercapture={release}
				>
					◀<span>LEFT ENGINE</span>
				</button>
				<div class="flight-actions">
					{#if status === "PLAYING"}
						<button type="button" class="btn btn-link" onclick={togglePause}>
							{paused ? "Resume flight" : "Pause"}
						</button>
					{/if}
					<small>{lab ? "UNRANKED TRIAL" : "G CLASS / SHARED CHALLENGE"}</small>
				</div>
				<button
					type="button"
					class:active={right}
					class="engine right"
					aria-label="Right engine"
					onpointerdown={(event) => press(event, "right")}
					onpointerup={release}
					onpointercancel={release}
					onlostpointercapture={release}
				>
					▶<span>RIGHT ENGINE</span>
				</button>
			</div>
		</section>
		{#if lab}
			<aside class="flight-inspector">
				<h2>Flight instruments</h2>
				<p>Production physics. Repeatable trials.</p>
				<label for="seed">Scenario seed</label>
				<input
					id="seed"
					type="number"
					min="1"
					max="2147483647"
					bind:value={tuning.seed}
				>
				{#each [
					"thrustMultiplier",
					"turnMultiplier",
					"hullMultiplier",
					"powerDrainMultiplier",
				] as key}
					<label for={key}
						>{key.replace("Multiplier", "")}
						×
						{Number(tuning.profile[key as "thrustMultiplier"]).toFixed(
							2,
						)}</label
					><input
						id={key}
						type="range"
						min="0.5"
						max="2"
						step="0.01"
						bind:value={tuning.profile[key as "thrustMultiplier"]}
					>
				{/each}
				<h3>Solar system zoom</h3>
				<p>Fixed 1920 × 1080 · 16:9. Zoom snaps; trails stay in space.</p>
				<label for="zoom-steps">Zoom levels: {tuning.camera.zoomSteps}</label>
				<input
					id="zoom-steps"
					type="range"
					min="4"
					max="11"
					step="1"
					bind:value={tuning.camera.zoomSteps}
				>
				<label for="zoom-preview">Preview zoom</label>
				<select
					id="zoom-preview"
					bind:value={previewLevel}
					onchange={() => {
						frameCamera(true);
						sync();
					}}
				>
					<option value={-1}>Automatic framing</option>
					{#each Array(activeZoomSteps) as _, i}
						<option value={i}>
							Level {i + 1}{i === 0
								? " · Whole system"
								: i === activeZoomSteps - 1
									? " · Close"
									: ""}
						</option>
					{/each}
				</select>
				<p>
					Apply & reset to change the number of levels. Preview any level while
					paused or flying.
				</p>
				<label for="padding">Camera padding</label>
				<input
					id="padding"
					type="range"
					min="80"
					max="400"
					bind:value={tuning.camera.padding}
				><label for="smoothing">Camera pan response</label>
				<input
					id="smoothing"
					type="range"
					min="1"
					max="12"
					step="0.5"
					bind:value={tuning.camera.smoothing}
				>
				<div class="inspector-actions">
					<button type="button" class="btn btn-filled" onclick={apply}>
						Apply & reset
					</button><button type="button" class="btn btn-ghost" onclick={step}>
						Step 1 frame
					</button><button
						type="button"
						class="btn btn-ghost"
						onclick={() => trial()}
					>
						Replay trial
					</button><button
						type="button"
						class="btn btn-ghost"
						onclick={() => trial(true)}
					>
						Coast to end
					</button>
				</div>
				<output
					>Tick {ticks} · Level {zoomLevel + 1}/{activeZoomSteps}
					· Zoom {zoom.toFixed(2)} · Wraps {wraps}<br>Position
					{x.toFixed(1)}, {y.toFixed(1)}</output
				>
				<label for="trial-json">Trial configuration</label
				><textarea
					id="trial-json"
					bind:value={json}
					spellcheck="false"
				></textarea>
				<div class="inspector-actions">
					<button
						type="button"
						class="btn btn-ghost"
						onclick={() => {
							json = JSON.stringify(simulation.settings, null, 2);
						}}
					>
						Export JSON
					</button><button
						type="button"
						class="btn btn-ghost"
						onclick={importTrial}
					>
						Import JSON
					</button>
				</div>
				<a
					href={`/lab/flight?trial=${encodeURIComponent(JSON.stringify(tuning))}`}
					>Open shareable trial</a
				><a href="/lab">Asset & token Lab →</a>
			</aside>
		{/if}
	</div>
	{#if message}
		<p role="status" class="flight-message">{message}</p>
	{/if}
</div>
