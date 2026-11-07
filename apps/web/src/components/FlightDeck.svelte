<script lang="ts">
import { Camera, Input, paintCountdown, Renderer } from "@void-drift/core";
import {
	BUILD_FLIGHT_SCALE,
	buildStats,
	CHALLENGE,
	drawBuild,
	drawSalvage,
	FlightFx,
	type FlightMode,
	type FlightTickInput,
	gameSettings,
	LandingSystem,
	type Loadout,
	type ShipProfileId,
	Simulation,
	STEP,
	scoresAvailable,
	stockSettings,
	submitHighScore,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { version } from "../../package.json";
import { fitGameScreen, GAME_HEIGHT } from "../lib/game-screen";
import { settings } from "../lib/stores/settings";
import Dialog from "./Dialog.svelte";
import Logo from "./Logo.svelte";
import TitleScreen from "./TitleScreen.svelte";

let {
	loadout,
	launchSource = "title",
	mode = "survival",
	onReturn,
}: {
	loadout?: Loadout;
	launchSource?: "title" | "hangar";
	mode?: FlightMode;
	onReturn?: () => void;
} = $props();
// Practice retains the former fitted test-flight behavior during mode migration.
const testFlight = $derived(mode === "practice");
let canvas: HTMLCanvasElement;
let simulation: Simulation;
let input: Input;
let renderer: Renderer;
let camera: Camera;
const flightFx = new FlightFx();
let chosen = $derived<ShipProfileId>(loadout?.chassis ?? "wasp");
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
let ticks = $state(0);
let runSeed = $state(0);
let left = $state(false);
let right = $state(false);
let cause = $state("");
let pendingDerelict = $state(false);
let canSendDerelict = $state(false);
let salvageFeedback = $state("");
let salvageStats = $state({
	passes: 0,
	destroyed: 0,
	rail: 0,
	laser: 0,
	collected: 0,
	bodies: 0,
	spent: 0,
});
let engineFeedback = $state("");
let activeLoadout = $state<Loadout>();
let phase = $state<"menu" | "starting" | "playing">("menu");
let landing = $state.raw<LandingSystem>();
let transitionTime = 0;
let countTime = -1;
let lastFrameTime = 0;
let portrait = $state(false);
let viewport: HTMLElement;
let screen = $state(fitGameScreen(1920, 1080));
const adaptive = $derived(!landing && !testFlight);
let sceneOpacity = $state(1);
let reducedMotion = false;
let stage: HTMLElement;
let landingFrame = { width: 1920, height: 1080, cardRight: 1200 };
function enterMenu() {
	landing = new LandingSystem();
	sceneOpacity = 1;
	phase = "menu";
	reset(false);
}
let spin = $state(0);
let message = $state("");
let initials = $state("AAA");
let saving = $state(false);
let scoreSaved = $state(false);
function reset(start = false) {
	pendingDerelict = false;
	if (phase !== "starting") phase = start ? "playing" : "menu";
	input?.reset();
	simulation = new Simulation(
		loadout
			? { ...stockSettings(loadout.chassis), loadout, mode }
			: { ...gameSettings("wasp"), mode },
	);
	if (start && !testFlight) {
		simulation = new Simulation({
			...simulation.settings,
			arrival: true,
			seed: (crypto.getRandomValues(new Uint32Array(1))[0] % 2147483647) + 1,
		});
		countTime = 0;
		phase = "starting";
	} else countTime = -1;
	if (start) simulation.start();
	paused = start && portrait;
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
		null,
	);
}
function sync() {
	const salvage = simulation.salvage;
	canSendDerelict = salvage?.canSend ?? false;
	salvageStats = {
		passes: salvage?.passes ?? 0,
		destroyed: salvage?.destroyed ?? 0,
		rail: salvage?.shotsFired ?? 0,
		laser: salvage?.laserPulses ?? 0,
		collected: salvage?.energyCollected ?? 0,
		bodies: salvage?.bodies.length ?? 0,
		spent: salvage?.energySpent ?? 0,
	};
	salvageFeedback =
		salvage && salvage.time - salvage.lastCollection.time < 2
			? `+${salvage.lastCollection.amount.toFixed(1)} energy collected`
			: "";
	engineFeedback = simulation.engineFeedback;
	activeLoadout = simulation.settings.loadout;
	spin = (simulation.angularMotion.velocity * 180) / Math.PI;
	status = simulation.state.status;
	seconds = simulation.state.elapsedTime;
	hull = simulation.state.resources.hull;
	power = simulation.state.resources.power;
	x = simulation.ship.pos.x;
	y = simulation.ship.pos.y;
	ticks = simulation.ticks;
	runSeed = simulation.settings.seed;
	cause = simulation.state.deathCause ?? "";
	zoom = camera?.zoom ?? 1;
	zoomLevel = camera?.zoomLevel ?? 0;
	activeZoomSteps = simulation.settings.camera.zoomSteps;
}
function start() {
	if (phase === "starting") return;
	if (launchSource === "title" && !reducedMotion && landing) {
		phase = "starting";
		transitionTime = 0;
		paused = portrait;
		input?.reset();
	} else {
		landing = undefined;
		phase = "playing";
		transitionTime = 0.3;
		reset(true);
	}
	(document.activeElement as HTMLElement)?.blur();
}
function suspend() {
	input?.reset();
	left = right = false;
	lastFrameTime = performance.now();
	if (status === "PLAYING" || phase === "starting") paused = true;
}
function togglePause() {
	if (portrait || document.hidden) return;
	paused = !paused;
	input?.reset();
	lastFrameTime = performance.now();
}
function advance(state: FlightTickInput) {
	const before = simulation.wraps;
	simulation.step({
		...state,
		sendDerelict: pendingDerelict || state.sendDerelict,
	});
	pendingDerelict = false;
	frameCamera(before !== simulation.wraps);
	camera.update(STEP);
}
async function save() {
	if (
		mode !== "survival" ||
		loadout ||
		chosen === "fiddler" ||
		status !== "GAME_OVER" ||
		saving ||
		scoreSaved
	)
		return;
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
	if (result.success) {
		window.location.assign("/leaderboard");
	} else {
		message = result.error;
	}
}
function press(event: PointerEvent, side: "left" | "right") {
	if (paused || portrait || document.hidden) return;
	event.preventDefault();
	const button = event.currentTarget as HTMLElement;
	button.setPointerCapture(event.pointerId);
	input?.setPointer(event.pointerId, side);
}
function release(event: PointerEvent) {
	input?.setPointer(event.pointerId, null);
}
onMount(() => {
	renderer = new Renderer(canvas);
	renderer.resize(1920, 1080);
	camera = new Camera();
	input = new Input(canvas);
	if (launchSource === "title") enterMenu();
	else reset(Boolean(loadout));
	const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const updateMotion = () => {
		reducedMotion = motion.matches;
	};
	updateMotion();
	motion.addEventListener("change", updateMotion);
	const measure = () => {
		const available = viewport.getBoundingClientRect();
		const css = getComputedStyle(viewport);
		screen = fitGameScreen(
			available.width -
				parseFloat(css.paddingLeft) -
				parseFloat(css.paddingRight),
			available.height -
				parseFloat(css.paddingTop) -
				parseFloat(css.paddingBottom),
		);
		portrait = window.innerWidth <= window.innerHeight;
		if (portrait) suspend();
		const bounds = stage.getBoundingClientRect();
		landingFrame = {
			width: bounds.width,
			height: bounds.height,
			cardRight: bounds.width / 2,
		};
	};
	const resize = new ResizeObserver(measure);
	resize.observe(stage);
	resize.observe(viewport);
	window.addEventListener("resize", measure);
	measure();
	lastFrameTime = performance.now();
	let accumulator = 0;
	let frame = 0;
	const context = canvas.getContext("2d");
	const playSurface = canvas.parentElement;
	const preventMenu = (event: Event) => event.preventDefault();
	playSurface?.addEventListener("contextmenu", preventMenu);
	function draw(time: number) {
		const dt = Math.max(0, Math.min((time - lastFrameTime) / 1000, 0.1));
		if (portrait || document.hidden) suspend();
		const blocked = paused || portrait || document.hidden;
		if (blocked) input.reset();
		const renderWidth = adaptive ? Math.round(screen.logicalWidth) : 1920;
		if (canvas.width !== renderWidth) {
			renderer.resize(renderWidth, GAME_HEIGHT);
			// Update render geometry only; camera policy and fitting remain unchanged.
			camera.viewportWidth = renderWidth;
		}
		lastFrameTime = time;
		let released = false;
		if (phase === "starting" && !blocked) {
			transitionTime += reducedMotion ? 0.3 : dt;
			if (transitionTime >= 0.15 && landing) {
				landing = undefined;
				reset(true);
				accumulator = 0;
			}
			sceneOpacity =
				transitionTime < 0.15
					? 1 - transitionTime / 0.15
					: Math.min(1, (transitionTime - 0.15) / 0.15);
			if (transitionTime >= 0.3 && countTime >= 3) {
				released = true;
				phase = "playing";
				accumulator = 0;
			}
		}
		if (phase === "starting" && !landing && transitionTime >= 0.3 && !blocked)
			countTime = Math.min(3, countTime + dt);
		const controls = input.getEffectiveState(settings.get().invertControls);
		left = controls.leftThruster;
		right = controls.rightThruster;
		if (
			!blocked &&
			!released &&
			phase !== "starting" &&
			simulation.state.status === "PLAYING"
		) {
			accumulator += dt;
			while (accumulator >= STEP) {
				advance(controls);
				accumulator -= STEP;
			}
		} else accumulator = 0;
		sync();
		renderer.clear();
		if (landing && context) {
			if (!document.hidden && !reducedMotion) landing.step(dt);
			// The title backdrop fills the viewport independently of the play stage.
			renderer.drawBackground();
			context.save();
			context.scale(1920 / landingFrame.width, 1080 / landingFrame.height);
			landing.draw(
				context,
				landingFrame.width,
				landingFrame.height,
				landingFrame.cardRight,
			);
			context.restore();
		} else {
			renderer.beginCamera(camera);
			renderer.drawBackground();
			renderer.drawArenaBoundary(1200);
			renderer.drawStar(simulation.star, simulation.ticks * STEP * 1000);
			for (const planet of simulation.planets) renderer.drawPlanet(planet);
			if (context && simulation.salvage)
				drawSalvage(context, simulation.salvage);
			if (simulation.settings.loadout && context)
				drawBuild(
					context,
					simulation.settings.loadout,
					simulation.ship.pos.x,
					simulation.ship.pos.y,
					simulation.ship.rotation,
					BUILD_FLIGHT_SCALE,
					"",
					undefined,
					undefined,
					simulation.salvage?.angles,
				);
			else if (chosen !== "fiddler")
				renderer.drawShip(
					simulation.ship,
					simulation.settings.profile.tint,
					chosen,
				);
			const countCentre = camera.screenToWorld(
				canvas.width / 2,
				canvas.height / 2,
			);
			if (context)
				flightFx.draw(
					context,
					simulation,
					true,
					true,
					Math.max(0, countTime) + simulation.ticks * STEP,
					countTime < 0
						? undefined
						: (light, pass) =>
								paintCountdown(
									light,
									pass,
									countTime + simulation.ticks * STEP,
									countCentre.x,
									countCentre.y,
									camera.zoom,
									reducedMotion,
								),
				);
			renderer.endCamera();
		}
		frame = requestAnimationFrame(draw);
	}
	const key = (event: KeyboardEvent) => {
		if (event.code === "Escape" && status === "PLAYING" && !paused)
			togglePause();
	};
	const visibility = () => {
		if (document.hidden) suspend();
	};
	window.addEventListener("keydown", key);
	window.addEventListener("blur", suspend);
	document.addEventListener("visibilitychange", visibility);
	frame = requestAnimationFrame(draw);
	return () => {
		cancelAnimationFrame(frame);
		playSurface?.removeEventListener("contextmenu", preventMenu);
		resize.disconnect();
		motion.removeEventListener("change", updateMotion);
		input.destroy();
		window.removeEventListener("keydown", key);
		window.removeEventListener("blur", suspend);
		window.removeEventListener("resize", measure);
		document.removeEventListener("visibilitychange", visibility);
	};
});
</script>

<div
	class="flight-page"
	class:title-active={Boolean(landing)}
	class:survival-screen={!testFlight}
	data-paused={paused}
	data-portrait={portrait}
	data-launch-source={launchSource}
	data-status={status}
	data-salvage-passes={salvageStats.passes}
	data-salvage-destroyed={salvageStats.destroyed}
	data-rail-shots={salvageStats.rail}
	data-laser-pulses={salvageStats.laser}
	data-salvage-collected={salvageStats.collected}
	data-salvage-bodies={salvageStats.bodies}
	data-weapon-energy={salvageStats.spent}
	data-phase={phase}
	data-landing-sun={landing?.star.type}
	data-x={x.toFixed(4)}
	data-y={y.toFixed(4)}
	data-ticks={ticks}
	data-seed={runSeed}
	data-spin={spin.toFixed(4)}
	data-stabilizers={activeLoadout?.stabilizers ?? false}
	data-zoom={zoom.toFixed(4)}
	data-zoom-level={zoomLevel}
	data-zoom-steps={activeZoomSteps}
>
	{#if !landing && testFlight}
		<header class="flight-header">
			<a href="/" class="brand"><Logo size="sm" /></a>
			<span class="edition"
				>{loadout
					? testFlight
						? "BUILDER / TEST FLIGHT"
						: "CUSTOM SURVIVAL / UNRANKED"
					: chosen === "fiddler"
						? "FIDDLER / UNRANKED FLIGHT TRIAL"
						: `SURVIVAL / ${version}`}</span
			>
			<nav class:build-nav={Boolean(loadout)} aria-label="Flight navigation">
				{#if onReturn}
					<button type="button" class="btn btn-link" onclick={onReturn}>
						Return to builder
					</button><button
						type="button"
						class="btn btn-link"
						onclick={() => reset(true)}
					>
						Reset flight
					</button>
				{/if}
				{#if testFlight && loadout}
					<button
						type="button"
						class="btn btn-link"
						disabled={paused ||
							pendingDerelict ||
							!canSendDerelict ||
							status !== "PLAYING"}
						onclick={() => (pendingDerelict = true)}
					>
						Send derelict
					</button>
				{/if}

				<a href="/leaderboard">HIGH SCORES</a><a href="/settings">OPTIONS</a>
			</nav>
		</header>
	{/if}
	<div class="flight-layout" bind:this={viewport}>
		<section
			bind:this={stage}
			class="flight-stage"
			class:landing={Boolean(landing)}
			class:adaptive
			style:width={adaptive ? `${screen.width}px` : undefined}
			style:height={adaptive ? `${screen.height}px` : undefined}
			style:--game-gutter={`${screen.gutter}px`}
			data-active-width={screen.activeWidth}
			style:opacity={paused || portrait ? 1 : sceneOpacity}
			aria-label="Flight arena"
		>
			<div
				class="flight-stage-layer"
				class:scrim-stage={Boolean(landing)}
				data-stage
			>
				<canvas
					bind:this={canvas}
					aria-label={landing
						? "Decorative star and orbiting planets"
						: testFlight
							? "Fitted ship, star, derelicts, debris and energy collectibles"
							: "Ship, star and orbiting planets"}
				></canvas>
				<div class="flight-hud" data-hud>
					<div>
						<small>HULL</small><strong>{hull.toFixed(0)}%</strong
						><progress aria-label="Hull" max="100" value={hull}></progress>
					</div>
					<div>
						<small>POWER</small><strong>{power.toFixed(0)}%</strong
						><progress
							aria-label="Power"
							max={activeLoadout ? buildStats(activeLoadout).capacity : 100}
							value={power}
						></progress>
					</div>
					<div class="timer">
						<small>SURVIVAL</small
						><strong class="time">{seconds.toFixed(1)}s</strong>
					</div>
				</div>
				{#if activeLoadout && engineFeedback}
					<p class="engine-feedback" data-hud>{engineFeedback}</p>
				{/if}
				<div class="flight-controls" data-hud>
					<button
						type="button"
						class:active={left}
						class="engine cut-surface left"
						aria-label="Left engine"
						onpointerdown={(event) => press(event, "left")}
						onpointerup={release}
						onpointercancel={release}
						onlostpointercapture={release}
					>
						◀<span>LEFT ENGINE</span>
					</button>
					<div class="flight-actions">
						{#if testFlight}
							<small role="status"
								>{salvageFeedback || "WEAPONS AUTO · 10 ENERGY RESERVE"}</small
							>
						{/if}
						{#if status === "PLAYING"}
							<button type="button" class="btn btn-link" onclick={togglePause}>
								{paused ? "Resume flight" : "Pause"}
							</button>
						{/if}
						<small
							>{loadout
								? testFlight
									? "TEST / NO GAME-OVER"
									: "CUSTOM BUILD / UNRANKED"
								: chosen === "fiddler"
									? "UNRANKED TRIAL"
									: "G CLASS / SHARED CHALLENGE"}</small
						>
					</div>
					<button
						type="button"
						class:active={right}
						class="engine cut-surface right"
						aria-label="Right engine"
						onpointerdown={(event) => press(event, "right")}
						onpointerup={release}
						onpointercancel={release}
						onlostpointercapture={release}
					>
						▶<span>RIGHT ENGINE</span>
					</button>
				</div>
			</div>
			{#if portrait && (phase !== "menu" || !landing)}
				<Dialog
					label="Rotate to landscape"
					class="flight-card"
					returnFocus={false}
				>
					<h1>Rotate to landscape</h1>
					<p>Flight is paused. Turn your screen sideways to continue.</p>
				</Dialog>
			{:else if paused}
				<Dialog label="Paused" class="flight-card" onclose={togglePause}>
					<p class="eyebrow">PAUSED</p>
					<div class="button-group button-group--vertical">
						<button
							type="button"
							class="btn btn-filled"
							data-autofocus
							onclick={togglePause}
						>
							Resume
						</button>
						<button
							type="button"
							class="btn btn-ghost"
							onclick={() => (onReturn ? onReturn() : enterMenu())}
						>
							Abort
						</button>
						{#if !testFlight}
							<a class="btn btn-ghost" href="/leaderboard">Top Scores</a>
							<a class="btn btn-ghost" href="/settings">Settings</a>
						{/if}
					</div>
				</Dialog>
			{:else if landing}
				<div class="dialog-scrim" aria-hidden="true"></div>
				<TitleScreen onStart={start} disabled={phase === "starting"} />
			{:else if status === "GAME_OVER"}
				<Dialog label="Run complete" class="flight-card">
					<p class="eyebrow">
						{cause === "STAR"
							? "TOO CLOSE TO THE STAR"
							: cause === "HULL"
								? "HULL LOST"
								: "POWER DEPLETED"}
					</p>
					<h1>{seconds.toFixed(1)} seconds.</h1>
					<p>Every orbit teaches you something.</p>
					{#if mode === "survival" && !loadout && chosen !== "fiddler"}
						<label for="initials">Your initials</label>
						<input
							id="initials"
							data-autofocus
							maxlength="3"
							bind:value={initials}
							oninput={() => {
								initials = initials.toUpperCase().replace(/[^A-Z]/g, "");
							}}
						>
					{/if}
					{#if message}
						<p role="status" class="flight-message">{message}</p>
					{/if}
					<div class="button-group button-group--vertical">
						{#if mode === "survival" && !loadout && chosen !== "fiddler"}
							<button
								type="button"
								class="btn btn-filled"
								disabled={saving ||
									scoreSaved ||
									!scoresAvailable() ||
									!/^[A-Z]{3}$/.test(initials)}
								onclick={save}
							>
								{saving ? "Saving…" : scoreSaved ? "Saved" : "Save Score"}
							</button>
						{/if}
						<button
							type="button"
							class="btn btn-ghost"
							data-autofocus
							onclick={() => (onReturn ? onReturn() : enterMenu())}
						>
							{launchSource === "hangar"
								? "Return to Hangar"
								: "Return to title screen"}
						</button><a class="btn btn-ghost" href="/leaderboard">Top Scores</a>
					</div>
				</Dialog>
			{/if}
		</section>
	</div>
</div>

<style>
.survival-screen .flight-layout {
	box-sizing: border-box;
	align-items: center;
	justify-content: center;
	padding: env(safe-area-inset-top) env(safe-area-inset-right)
		env(safe-area-inset-bottom) env(safe-area-inset-left);
}
.flight-stage.adaptive {
	flex: none;
}
.flight-stage-layer {
	touch-action: none;
	user-select: none;
	-webkit-user-select: none;
	-webkit-touch-callout: none;
	overscroll-behavior: none;
}
.title-active .flight-layout {
	padding: 0;
}

.flight-message {
	position: static;
}
.title-active {
	padding: 0;
}
.title-active .flight-layout {
	display: block;
	height: 100dvh;
}
.title-active .flight-stage {
	width: 100%;
	height: 100%;
	max-height: none;
	aspect-ratio: auto;
}
.title-active .flight-stage-layer {
	width: 100%;
	height: 100%;
}
.title-active [data-hud] {
	display: none;
}

.flight-stage.landing > .flight-stage-layer > canvas {
	object-fit: fill;
}

.engine-feedback {
	position: absolute;
	bottom: 100px;
	left: 16px;
	right: 16px;
	pointer-events: none;
	color: var(--color-text);
	font-size: 12px;
}
.build-nav {
	display: flex;
	align-items: center;
	gap: var(--spacing-md);
}
</style>
