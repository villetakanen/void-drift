<script lang="ts">
import { EnginePlume, type PlumeEmitter, Vec2 } from "@void-drift/core";
import { BUILD_FLIGHT_SCALE, ENGINE_ART, FIGHTER } from "@void-drift/mode-a";
import { onMount } from "svelte";
import { DT, INPUT_SEQUENCE, TOTAL_TICKS } from "./movement-bench";
import "@void-drift/core/styles/buttons.css";

let { label = "LHI Wasp flight demo" }: { label?: string } = $props();

type Point = readonly [number, number];
type Facet = {
	points: readonly Point[];
	shade: 0 | 1 | 2 | 3 | 4 | 5;
};

const palette = [
	FIGHTER.facets[0], // #c8f4f0 (0: brightest)
	FIGHTER.facets[1], // #83c7d0 (1: light)
	FIGHTER.facets[5], // #6193a9 (2: medium-light)
	FIGHTER.facets[2], // #437e99 (3: medium)
	FIGHTER.facets[4], // #365d79 (4: dark)
	FIGHTER.facets[3], // #264d6b (5: deepest shadow)
] as const;

// Approved 06.9 hull facets in upright study coordinates (x_study, y_study)
const hull069StudyFacets: readonly Facet[] = [
	{
		points: [
			[-3, -25],
			[0, -25],
			[0, -16],
			[-3, -10],
			[-6, -10],
		],
		shade: 0,
	},
	{
		points: [
			[0, -25],
			[3, -25],
			[6, -10],
			[3, -10],
			[0, -16],
		],
		shade: 2,
	},
	{
		points: [
			[-6, -10],
			[-13.5, 12.5],
			[-18, 6.5],
		],
		shade: 3,
	},
	{
		points: [
			[6, -10],
			[18, 6.5],
			[13.5, 12.5],
		],
		shade: 5,
	},
	{
		points: [
			[-6, -10],
			[-7.4, 10.1],
			[-9.5, 11],
			[-13.5, 12.5],
		],
		shade: 2,
	},
	{
		points: [
			[6, -10],
			[13.5, 12.5],
			[9.5, 11],
			[7.4, 10.1],
		],
		shade: 4,
	},
	{
		points: [
			[-6, -10],
			[-3, -10],
			[-3, -1],
			[-5, 9],
			[-7.4, 10.1],
		],
		shade: 0,
	},
	{
		points: [
			[6, -10],
			[7.4, 10.1],
			[5, 9],
			[3, -1],
			[3, -10],
		],
		shade: 2,
	},
	{
		points: [
			[-9.5, 11],
			[-7.4, 10.1],
			[-5, 9],
			[-4, 17.4],
			[-7.3, 18.8],
		],
		shade: 2,
	},
	{
		points: [
			[9.5, 11],
			[7.3, 18.8],
			[4, 17.4],
			[5, 9],
			[7.4, 10.1],
		],
		shade: 4,
	},
	{
		points: [
			[-3, -1],
			[-1.4, 24.5],
			[-3.3, 24.5],
			[-5, 9],
		],
		shade: 0,
	},
	{
		points: [
			[3, -1],
			[5, 9],
			[3.3, 24.5],
			[1.4, 24.5],
		],
		shade: 3,
	},
	{
		points: [
			[-3, -1],
			[0, 3.5],
			[0, 24.5],
			[-1.4, 24.5],
		],
		shade: 1,
	},
	{
		points: [
			[0, 3.5],
			[3, -1],
			[1.4, 24.5],
			[0, 24.5],
		],
		shade: 4,
	},
];

const cockpitStudyPolygons: readonly (readonly Point[])[] = [
	[
		[0, -16],
		[-3, -10],
		[-3, -1],
		[0, 3.5],
	],
	[
		[0, -16],
		[3, -10],
		[3, -1],
		[0, 3.5],
	],
];

// Approved rear engine mount Y and 4 stabilizer positions
const ENGINE_MOUNT_Y = 17.5;
const STAB_CONFIG = {
	frontX: 4.4,
	frontY: -18.5,
	frontAngleDeg: 8.5,
	rearX: 4.9,
	rearY: 13.5,
	rearAngleDeg: -10.0,
} as const;

type EngineOption = "plasma" | "ion" | "fusion" | "heavy-ion";
type LayerMode = "both" | "effects-only" | "hull-only";
type ControlMode = "replay" | "live";

let engineOption = $state<EngineOption>("plasma");
let layerMode = $state<LayerMode>("both");
let controlMode = $state<ControlMode>("replay");
let zoom = $state(2.4);
let playing = $state(true);
let tick = $state(0);

// Manual live controls
let liveLeft = $state(false);
let liveRight = $state(false);
let liveForward = $state(false);

function fillStudyPolygon(
	ctx: CanvasRenderingContext2D,
	points: readonly Point[],
	color: string,
) {
	ctx.fillStyle = color;
	ctx.beginPath();
	points.forEach(([x, y], index) => {
		if (index === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	});
	ctx.closePath();
	ctx.fill();
}

function drawSingleStabilizerSlit(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = "#080b13";
	ctx.beginPath();
	ctx.moveTo(-1.2, -3.2);
	ctx.lineTo(1, -2.6);
	ctx.lineTo(1, 2.6);
	ctx.lineTo(-1.2, 3.2);
	ctx.closePath();
	ctx.fill();

	ctx.fillStyle = "#303d4c";
	ctx.fillRect(-0.45, -2.2, 0.9, 4.4);

	ctx.strokeStyle = "#718594";
	ctx.lineWidth = 0.25;
	ctx.beginPath();
	ctx.moveTo(0.65, -2.5);
	ctx.lineTo(0.65, 2.5);
	ctx.stroke();

	ctx.strokeStyle = "#69cfff";
	ctx.lineWidth = 0.45;
	ctx.beginPath();
	ctx.moveTo(-0.7, -2.3);
	ctx.lineTo(-0.7, 2.3);
	ctx.stroke();
}

/**
 * Draw the approved LHI Wasp in ship-forward (+x) flight coordinates.
 * Render order:
 *   1. 06.9 Hull facets + cockpit
 *   2. 4 Stabilizer slits (BEHIND slotted engine parts)
 *   3. Slotted Rear Engine at y_study = 17.5 (ON TOP of hull & stabilizers)
 */
function drawWaspHullAndParts(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	heading: number,
	scale: number,
	eng: EngineOption,
) {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(heading);
	ctx.scale(scale, scale);
	// Convert upright study coordinates (nose = -y_study) into ship-forward (+x_ship):
	// rotating by +90° maps (x_study, y_study) -> (-y_study, x_study).
	ctx.rotate(Math.PI / 2);

	// 1. Hull facets + cockpit
	for (const facet of hull069StudyFacets) {
		fillStudyPolygon(ctx, facet.points, palette[facet.shade]);
	}
	for (const cp of cockpitStudyPolygons) {
		fillStudyPolygon(ctx, cp, "#000000");
	}

	// 2. Four Stabilizer slits (drawn BEHIND slotted parts)
	const slits = [
		{
			x: -STAB_CONFIG.frontX,
			y: STAB_CONFIG.frontY,
			deg: STAB_CONFIG.frontAngleDeg,
			mirror: false,
		},
		{
			x: STAB_CONFIG.frontX,
			y: STAB_CONFIG.frontY,
			deg: STAB_CONFIG.frontAngleDeg,
			mirror: true,
		},
		{
			x: -STAB_CONFIG.rearX,
			y: STAB_CONFIG.rearY,
			deg: STAB_CONFIG.rearAngleDeg,
			mirror: false,
		},
		{
			x: STAB_CONFIG.rearX,
			y: STAB_CONFIG.rearY,
			deg: STAB_CONFIG.rearAngleDeg,
			mirror: true,
		},
	] as const;

	for (const s of slits) {
		ctx.save();
		ctx.translate(s.x, s.y);
		if (s.mirror) ctx.scale(-1, 1);
		ctx.rotate((s.deg * Math.PI) / 180);
		drawSingleStabilizerSlit(ctx);
		ctx.restore();
	}

	// 3. Slotted Rear Engine at y_study = 17.5 (drawn ON TOP of hull and stabilizers)
	ctx.save();
	ctx.translate(0, ENGINE_MOUNT_Y);
	for (const face of ENGINE_ART[eng][3]) {
		const color =
			face.color === "currentColor"
				? eng === "fusion"
					? "#c6ff32"
					: "#ffb52e"
				: face.color;
		const uprightPts = face.points.map(([ex, ey]) => [ey, -ex] as const);
		fillStudyPolygon(ctx, uprightPts, color);
	}
	ctx.restore();

	ctx.restore();
}

/**
 * 5 Plume Emitters in ship-forward (+x) flight coordinates (scaled by BUILD_FLIGHT_SCALE):
 *   0: Central rear engine at y_study = 17.5 + nozzleOffset
 *   1: Front-Left stabilizer (-4.4, -18.5, +8.5°)
 *   2: Front-Right stabilizer (+4.4, -18.5, +8.5°)
 *   3: Rear-Left stabilizer (-4.9, 13.5, -10.0°)
 *   4: Rear-Right stabilizer (+4.9, 13.5, -10.0°)
 */
function createWaspEmitters(
	eng: EngineOption,
	outputs: readonly [number, number, number, number, number],
): PlumeEmitter[] {
	const nozzleY =
		ENGINE_MOUNT_Y + (eng === "heavy-ion" ? 12.65 : eng === "fusion" ? 12 : 11);
	const mainStyle =
		eng === "ion" ? "ion-light" : eng === "heavy-ion" ? "ion-heavy" : "default";

	const frontRad = (STAB_CONFIG.frontAngleDeg * Math.PI) / 180;
	const rearRad = (STAB_CONFIG.rearAngleDeg * Math.PI) / 180;

	// Offset 0.9 units outboard from each slit center so the plume starts at the #69cfff emitter line
	const flX = -STAB_CONFIG.frontY + 0.9 * Math.sin(frontRad);
	const flY = -STAB_CONFIG.frontX - 0.9 * Math.cos(frontRad);
	const frX = -STAB_CONFIG.frontY + 0.9 * Math.sin(frontRad);
	const frY = STAB_CONFIG.frontX + 0.9 * Math.cos(frontRad);

	const rlX = -STAB_CONFIG.rearY + 0.9 * Math.sin(rearRad);
	const rlY = -STAB_CONFIG.rearX - 0.9 * Math.cos(rearRad);
	const rrX = -STAB_CONFIG.rearY + 0.9 * Math.sin(rearRad);
	const rrY = STAB_CONFIG.rearX + 0.9 * Math.cos(rearRad);

	return [
		{
			style: mainStyle,
			x: -nozzleY * BUILD_FLIGHT_SCALE,
			y: 0,
			angle: 0,
			output: outputs[0],
		},
		// Front-Left: exhaust shoots port (-y_ship), so force (+x_local) points starboard (+y_ship)
		{
			style: "ion-light",
			x: flX * BUILD_FLIGHT_SCALE,
			y: flY * BUILD_FLIGHT_SCALE,
			angle: Math.PI / 2 + frontRad,
			output: outputs[1],
		},
		// Front-Right: exhaust shoots starboard (+y_ship), so force points port (-y_ship)
		{
			style: "ion-light",
			x: frX * BUILD_FLIGHT_SCALE,
			y: frY * BUILD_FLIGHT_SCALE,
			angle: -Math.PI / 2 - frontRad,
			output: outputs[2],
		},
		// Rear-Left: exhaust shoots port (-y_ship), so force points starboard (+y_ship)
		{
			style: "ion-light",
			x: rlX * BUILD_FLIGHT_SCALE,
			y: rlY * BUILD_FLIGHT_SCALE,
			angle: Math.PI / 2 + rearRad,
			output: outputs[3],
		},
		// Rear-Right: exhaust shoots starboard (+y_ship), so force points port (-y_ship)
		{
			style: "ion-light",
			x: rrX * BUILD_FLIGHT_SCALE,
			y: rrY * BUILD_FLIGHT_SCALE,
			angle: -Math.PI / 2 - rearRad,
			output: outputs[4],
		},
	];
}

interface FlightSample {
	x: number;
	y: number;
	vx: number;
	vy: number;
	heading: number;
	spin: number;
	speed: number;
	outputs: readonly [number, number, number, number, number];
}

function stepWaspPhysics(
	state: {
		x: number;
		y: number;
		vx: number;
		vy: number;
		heading: number;
		spin: number;
	},
	leftHeld: boolean,
	rightHeld: boolean,
	dt: number,
): FlightSample {
	const substeps = 4;
	const h = dt / substeps;
	const maxSpeed = 340;
	const mainAccel = 235;
	const stabLinearAccel = 28;
	const stabAngularAccel = (260 * Math.PI) / 180; // rad/s^2 from coupled front+rear pair
	const maxSpin = (185 * Math.PI) / 180;

	let mainOut = 0;
	let flOut = 0;
	let frOut = 0;
	let rlOut = 0;
	let rrOut = 0;

	for (let s = 0; s < substeps; s++) {
		// Turn command: L (-1 counter-clockwise), R (+1 clockwise), LR or coast (0)
		const turnCmd = (rightHeld ? 1 : 0) - (leftHeld ? 1 : 0);
		// Rear engine ONLY fires when both L+R (or F) are pressed; it does NOT fire during L/R turns
		const mainActive = leftHeld && rightHeld;

		flOut = 0;
		frOut = 0;
		rlOut = 0;
		rrOut = 0;

		if (turnCmd < 0) {
			// Turn Left (CCW): Front-Right + Rear-Left fire
			frOut = 0.32;
			rlOut = 0.32;
			state.spin = Math.max(-maxSpin, state.spin - stabAngularAccel * h);
		} else if (turnCmd > 0) {
			// Turn Right (CW): Front-Left + Rear-Right fire
			flOut = 0.32;
			rrOut = 0.32;
			state.spin = Math.min(maxSpin, state.spin + stabAngularAccel * h);
		} else if (Math.abs(state.spin) > 1e-3) {
			// Counter-spin damping using opposing diagonal pair
			const step = Math.min(Math.abs(state.spin), stabAngularAccel * h);
			if (state.spin > 0) {
				frOut = 0.25;
				rlOut = 0.25;
				state.spin -= step;
			} else {
				flOut = 0.25;
				rrOut = 0.25;
				state.spin += step;
			}
		}

		state.heading += state.spin * h;

		const cos = Math.cos(state.heading);
		const sin = Math.sin(state.heading);

		if (mainActive) {
			const forwardSpeed = state.vx * cos + state.vy * sin;
			const taper =
				forwardSpeed <= 0 ? 1 : Math.max(0, 1 - forwardSpeed / maxSpeed);
			mainOut = Math.max(0.18, taper);
			state.vx += cos * mainAccel * taper * h;
			state.vy += sin * mainAccel * taper * h;
		} else {
			mainOut = 0;
		}

		// Small net axial component from angled stabilizer pairs
		const netStabForward =
			(rlOut + rrOut) * Math.sin((10 * Math.PI) / 180) -
			(flOut + frOut) * Math.sin((8.5 * Math.PI) / 180);
		state.vx += cos * stabLinearAccel * netStabForward * h;
		state.vy += sin * stabLinearAccel * netStabForward * h;

		state.x += state.vx * h;
		state.y += state.vy * h;
	}

	return {
		x: state.x,
		y: state.y,
		vx: state.vx,
		vy: state.vy,
		heading: state.heading,
		spin: (state.spin * 180) / Math.PI,
		speed: Math.hypot(state.vx, state.vy),
		outputs: [mainOut, flOut, frOut, rlOut, rrOut],
	};
}

function buildReplaySamples(): FlightSample[] {
	const state = { x: 0, y: 0, vx: 0, vy: 0, heading: 0, spin: 0 };
	const list: FlightSample[] = [
		{
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			heading: 0,
			spin: 0,
			speed: 0,
			outputs: [0, 0, 0, 0, 0],
		},
	];
	for (let t = 0; t < TOTAL_TICKS; t++) {
		const cmd = INPUT_SEQUENCE[Math.floor(t / 60)] ?? "coast";
		const leftHeld = cmd === "L" || cmd === "LR";
		const rightHeld = cmd === "R" || cmd === "LR";
		list.push(stepWaspPhysics(state, leftHeld, rightHeld, DT));
	}
	return list;
}

const replaySamples = buildReplaySamples();

let flightCanvas: HTMLCanvasElement;
let plume = new EnginePlume();

// Live mode state
let liveState = {
	x: 0,
	y: 0,
	vx: 0,
	vy: 0,
	heading: -Math.PI / 2,
	spin: 0,
};
let liveTrail: { x: number; y: number }[] = [];
let currentSample = $state<FlightSample>(replaySamples[0]);

function advanceReplay() {
	if (tick >= TOTAL_TICKS) {
		playing = false;
		return;
	}
	tick++;
	const s = replaySamples[tick];
	currentSample = s;
	plume.stepMounted(
		DT,
		{
			pos: new Vec2(s.x, s.y),
			vel: new Vec2(s.vx, s.vy),
			acc: new Vec2(0, 0),
			rotation: s.heading,
			radius: 1,
		},
		createWaspEmitters(engineOption, s.outputs),
	);
}

function advanceLive() {
	const leftHeld = liveLeft || liveForward;
	const rightHeld = liveRight || liveForward;
	const s = stepWaspPhysics(liveState, leftHeld, rightHeld, DT);
	currentSample = s;
	liveTrail.push({ x: s.x, y: s.y });
	if (liveTrail.length > 150) liveTrail.shift();
	plume.stepMounted(
		DT,
		{
			pos: new Vec2(s.x, s.y),
			vel: new Vec2(s.vx, s.vy),
			acc: new Vec2(0, 0),
			rotation: s.heading,
			radius: 1,
		},
		createWaspEmitters(engineOption, s.outputs),
	);
}

function seekReplay(target: number) {
	controlMode = "replay";
	playing = false;
	tick = 0;
	plume = new EnginePlume();
	currentSample = replaySamples[0];
	while (tick < target) advanceReplay();
	drawFlightCanvas();
}

function restartReplay() {
	seekReplay(0);
	playing = true;
}

function switchToLive() {
	controlMode = "live";
	liveState = { x: 0, y: 0, vx: 0, vy: 0, heading: -Math.PI / 2, spin: 0 };
	liveTrail = [{ x: 0, y: 0 }];
	plume = new EnginePlume();
	currentSample = {
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		heading: -Math.PI / 2,
		spin: 0,
		speed: 0,
		outputs: [0, 0, 0, 0, 0],
	};
}

function drawFlightCanvas() {
	const ctx = flightCanvas?.getContext("2d");
	if (!ctx) return;
	const s = currentSample;
	ctx.clearRect(0, 0, 1000, 620);

	ctx.save();
	ctx.translate(500, 310);
	ctx.scale(zoom, zoom);
	ctx.translate(-s.x, -s.y);

	// World reference grid
	const reach = 600 / zoom;
	ctx.strokeStyle = "#202636";
	ctx.lineWidth = 1 / zoom;
	for (let x = Math.floor((s.x - reach) / 50) * 50; x < s.x + reach; x += 50) {
		ctx.beginPath();
		ctx.moveTo(x, s.y - reach);
		ctx.lineTo(x, s.y + reach);
		ctx.stroke();
	}
	for (let y = Math.floor((s.y - reach) / 50) * 50; y < s.y + reach; y += 50) {
		ctx.beginPath();
		ctx.moveTo(s.x - reach, y);
		ctx.lineTo(s.x + reach, y);
		ctx.stroke();
	}

	// Route trace
	ctx.strokeStyle = "#40516a";
	ctx.lineWidth = 1.4 / zoom;
	ctx.beginPath();
	if (controlMode === "replay") {
		const startIdx = Math.max(0, tick - 120);
		for (let i = startIdx; i <= tick; i++) {
			const p = replaySamples[i];
			if (i === startIdx) ctx.moveTo(p.x, p.y);
			else ctx.lineTo(p.x, p.y);
		}
	} else {
		liveTrail.forEach((p, i) => {
			if (i === 0) ctx.moveTo(p.x, p.y);
			else ctx.lineTo(p.x, p.y);
		});
	}
	ctx.stroke();

	// Ship hull + behind-engine stabilizer slits + top-mounted engine
	if (layerMode !== "effects-only") {
		drawWaspHullAndParts(
			ctx,
			s.x,
			s.y,
			s.heading,
			BUILD_FLIGHT_SCALE,
			engineOption,
		);
	}

	// Effect layer (plumes from rear engine + 4 stabilizer slits)
	if (layerMode !== "hull-only") {
		plume.draw(ctx);
	}

	ctx.restore();
}

$effect(() => {
	tick;
	zoom;
	engineOption;
	layerMode;
	controlMode;
	drawFlightCanvas();
});

onMount(() => {
	let last = performance.now();
	let carry = 0;
	let frame = 0;

	const loop = (now: number) => {
		const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
		last = now;

		if (controlMode === "replay") {
			if (playing) {
				carry += dt;
				while (carry >= DT && playing) {
					advanceReplay();
					carry -= DT;
				}
			} else {
				carry = 0;
			}
		} else {
			carry += dt;
			while (carry >= DT) {
				advanceLive();
				carry -= DT;
			}
		}

		drawFlightCanvas();
		frame = requestAnimationFrame(loop);
	};

	frame = requestAnimationFrame(loop);

	const onKey = (e: KeyboardEvent, down: boolean) => {
		if (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLSelectElement
		) {
			return;
		}
		if (["KeyA", "ArrowLeft", "KeyL"].includes(e.code)) {
			e.preventDefault();
			if (down && controlMode !== "live") switchToLive();
			liveLeft = down;
		}
		if (["KeyD", "ArrowRight", "KeyR"].includes(e.code)) {
			e.preventDefault();
			if (down && controlMode !== "live") switchToLive();
			liveRight = down;
		}
		if (["KeyF", "KeyW", "ArrowUp", "Space"].includes(e.code)) {
			e.preventDefault();
			if (down && controlMode !== "live") switchToLive();
			liveForward = down;
		}
	};

	const kd = (e: KeyboardEvent) => onKey(e, true);
	const ku = (e: KeyboardEvent) => onKey(e, false);
	window.addEventListener("keydown", kd);
	window.addEventListener("keyup", ku);

	return () => {
		cancelAnimationFrame(frame);
		window.removeEventListener("keydown", kd);
		window.removeEventListener("keyup", ku);
	};
});
</script>

<section class="wasp-flight-demo" aria-label={label}>
	<div class="demo-toolbar">
		<div class="toolbar-group">
			<span class="group-label">Mode &amp; Playback</span>
			<div class="btn-row">
				<button
					type="button"
					class="btn btn-filled"
					onclick={() => {
						if (controlMode === "live") {
							restartReplay();
						} else {
							if (tick === TOTAL_TICKS) seekReplay(0);
							playing = !playing;
						}
					}}
				>
					{controlMode === "replay" && playing
						? "Pause Replay"
						: "Play 14s Sequence"}
				</button>
				<button type="button" class="btn btn-ghost" onclick={restartReplay}>
					Replay
				</button>
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => seekReplay(Math.max(0, tick - 1))}
				>
					−1 frame
				</button>
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => seekReplay(Math.min(TOTAL_TICKS, tick + 1))}
				>
					+1 frame
				</button>
				<button
					type="button"
					class="btn btn-ghost"
					aria-pressed={controlMode === "live"}
					onclick={switchToLive}
				>
					Live Pilot (A / W / D)
				</button>
			</div>
		</div>

		<div class="toolbar-group">
			<span class="group-label">Effect Layer &amp; Engine</span>
			<div class="btn-row">
				<label class="inline-select">
					<span>Layer</span>
					<select bind:value={layerMode}>
						<option value="both">Hull + Effect Layer</option>
						<option value="effects-only">Effect Layer Only (Solo)</option>
						<option value="hull-only">Hull + Parts Only</option>
					</select>
				</label>
				<label class="inline-select">
					<span>Single Engine</span>
					<select
						bind:value={engineOption}
						onchange={() => {
							if (controlMode === "replay") seekReplay(tick);
						}}
					>
						<option value="plasma">Plasma (Single Rear)</option>
						<option value="ion">Light Ion (Single Rear)</option>
						<option value="fusion">Light Fusion (Single Rear)</option>
						<option value="heavy-ion">Heavy Ion (Single Rear)</option>
					</select>
				</label>
				<label class="inline-select">
					<span>Scale</span>
					<select bind:value={zoom}>
						<option value={1}>Game scale · 1×</option>
						<option value={2.4}>Enlarged · 2.4×</option>
						<option value={4}>Detail · 4×</option>
					</select>
				</label>
			</div>
		</div>
	</div>

	<div class="live-pilot-strip">
		<span class="pilot-hint">
			Touch / Mouse / Keyboard controls (switches to Live Pilot):
		</span>
		<button
			type="button"
			class="pilot-btn"
			class:active={liveLeft}
			onpointerdown={() => {
				if (controlMode !== "live") switchToLive();
				liveLeft = true;
			}}
			onpointerup={() => (liveLeft = false)}
			onpointerleave={() => (liveLeft = false)}
		>
			↺ Turn Left (FR + RL Stabs · A / ←)
		</button>
		<button
			type="button"
			class="pilot-btn"
			class:active={liveForward}
			onpointerdown={() => {
				if (controlMode !== "live") switchToLive();
				liveForward = true;
			}}
			onpointerup={() => (liveForward = false)}
			onpointerleave={() => (liveForward = false)}
		>
			↑ Straight Thrust (Rear Engine Only on LR / F · W / ↑)
		</button>
		<button
			type="button"
			class="pilot-btn"
			class:active={liveRight}
			onpointerdown={() => {
				if (controlMode !== "live") switchToLive();
				liveRight = true;
			}}
			onpointerup={() => (liveRight = false)}
			onpointerleave={() => (liveRight = false)}
		>
			↻ Turn Right (FL + RR Stabs · D / →)
		</button>
	</div>

	<canvas
		bind:this={flightCanvas}
		width="1000"
		height="620"
		aria-label="LHI Wasp live flight animation and effect layer demo"
	></canvas>

	<output class="telemetry-bar">
		{#if controlMode === "replay"}
			<span>
				Sequence:
				<strong>
					{(tick * DT).toFixed(2)}
					/ 14.00 s ·{" "}
					{tick === TOTAL_TICKS ? "End" : INPUT_SEQUENCE[Math.floor(tick / 60)]}
				</strong>
			</span>
		{:else}
			<span>Mode: <strong>Live Pilot</strong></span>
		{/if}
		<span>Speed: <strong>{currentSample.speed.toFixed(1)}</strong></span>
		<span>Turn rate: <strong>{currentSample.spin.toFixed(1)}°/s</strong></span>
		<span>
			Active emitters:
			<strong>
				{[
					currentSample.outputs[0] > 0 ? "Rear Engine" : null,
					currentSample.outputs[1] > 0 ? "FL Stab" : null,
					currentSample.outputs[2] > 0 ? "FR Stab" : null,
					currentSample.outputs[3] > 0 ? "RL Stab" : null,
					currentSample.outputs[4] > 0 ? "RR Stab" : null,
				]
					.filter(Boolean)
					.join(" + ") || "Coasting (Fade)"}
			</strong>
		</span>
	</output>
</section>

<style>
.wasp-flight-demo {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin: 1rem 0 1.5rem;
	padding: 1rem;
	background: var(--bg-secondary, #16162a);
	border: 1px solid var(--border-default, rgba(255, 255, 255, 0.12));
	border-radius: 8px;
}

.demo-toolbar {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	gap: 1rem;
	align-items: flex-end;
}

.toolbar-group {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
}

.group-label {
	font-family: var(--font-mono, monospace);
	font-size: 0.72rem;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: var(--text-secondary, #94a3b8);
}

.btn-row {
	display: flex;
	flex-wrap: wrap;
	gap: 0.45rem;
	align-items: center;
}

.inline-select {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	font-family: var(--font-mono, monospace);
	font-size: 0.75rem;
	color: var(--text-secondary, #94a3b8);
}

.inline-select select {
	font-family: var(--font-mono, monospace);
	font-size: 0.75rem;
	padding: 0.3rem 0.5rem;
	border-radius: 4px;
	background: rgba(15, 23, 42, 0.85);
	color: var(--text-primary, #f0f4f8);
	border: 1px solid rgba(255, 255, 255, 0.16);
}

.live-pilot-strip {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	align-items: center;
	padding: 0.5rem 0.75rem;
	background: rgba(10, 12, 22, 0.55);
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 6px;
}

.pilot-hint {
	font-family: var(--font-mono, monospace);
	font-size: 0.73rem;
	color: var(--text-secondary, #94a3b8);
	margin-right: 0.25rem;
}

.pilot-btn {
	font-family: var(--font-mono, monospace);
	font-size: 0.74rem;
	padding: 0.35rem 0.65rem;
	border-radius: 4px;
	border: 1px solid rgba(105, 207, 255, 0.3);
	background: rgba(15, 23, 42, 0.8);
	color: var(--text-primary, #f0f4f8);
	cursor: pointer;
	user-select: none;
	touch-action: manipulation;
}

.pilot-btn.active {
	background: rgba(105, 207, 255, 0.22);
	border-color: #69cfff;
	color: #69cfff;
}

canvas {
	width: 100%;
	height: auto;
	display: block;
	background: #080b12;
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
}

.telemetry-bar {
	display: flex;
	flex-wrap: wrap;
	gap: 1.2rem;
	padding: 0.5rem 0.75rem;
	background: rgba(10, 12, 22, 0.65);
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 6px;
	font-family: var(--font-mono, monospace);
	font-size: 0.75rem;
	color: var(--text-secondary, #94a3b8);
}

.telemetry-bar strong {
	color: var(--text-primary, #f0f4f8);
}
</style>
