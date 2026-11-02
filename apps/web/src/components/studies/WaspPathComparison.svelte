<script lang="ts">
import { Vec2 } from "@void-drift/core";
import {
	defaultLoadout,
	engineImpulse,
	ION_DEFAULTS,
	ION_REFERENCE_MASS,
	ionCeiling,
	ionStrength,
	LoadoutSchema,
	PARTS,
	STABILIZER_STRENGTH,
} from "@void-drift/mode-a";
import {
	type BurnId,
	calculate,
	DT,
	inputAt,
	type Sample,
	SECONDS,
	TICK_RATE,
	TOTAL_TICKS,
	TRACK_COLORS,
	type Track,
	traces,
} from "../../lib/instrument";
import RingSlider from "../inputs/RingSlider.svelte";
import BurnRow from "../lab/instrument/BurnRow.svelte";
import Legend from "../lab/instrument/Legend.svelte";
import PathPane from "../lab/instrument/PathPane.svelte";
import TimeGraph from "../lab/instrument/TimeGraph.svelte";
import { GRAPH_MARGIN } from "../lab/instrument/time-graph";

let {
	label = "LHI Wasp vs Fighter flight-path comparison",
}: { label?: string } = $props();

// Layout, in logical pixels on the 4px grid (matching LabInstrument.svelte, without settings overlay).
const SCREEN = { w: 1440, h: 900 };
const PAD = 32;
const GAP = 32;
const COL = (SCREEN.w - 2 * PAD - GAP) / 2;
const BLOCK = COL;
const CONTROL = 44;
const CONTROL_GAP = 24;
const LEGEND = 24;
const LEGEND_GAP = 24;
const HEIGHT = BLOCK + CONTROL_GAP + CONTROL + LEGEND_GAP + LEGEND;
const TOP = Math.floor((SCREEN.h - HEIGHT) / 2 / 4) * 4;
const GRAPH = 208;
const GRAPH_GAP = (BLOCK - 3 * GRAPH) / 2;
const RIGHT = PAD + COL + GAP;
const CONTROL_TOP = TOP + BLOCK + CONTROL_GAP;
const SLIDER = { left: GRAPH_MARGIN.left - 8, right: GRAPH_MARGIN.right - 8 };
const measures = ["speed", "acceleration", "turn"] as const;

// Approved LHI Wasp hull bounds (49.5 × 36) and 4-stabilizer geometry:
// Front pair: y_study = -18.5 (x_ship = +18.5), x_study = ±4.4, tilt = 8.5°
// Rear pair:  y_study = +13.5 (x_ship = -13.5), x_study = ±4.9, tilt = -10.0°
const WASP_CHASSIS_MASS = 60;
const WASP_NOSE = 25;
const WASP_STERN = -24.5;
const WASP_LENGTH = WASP_NOSE - WASP_STERN;
const WASP_WIDTH = 36;
const WASP_INERTIA_PER_MASS =
	(WASP_LENGTH ** 2 + WASP_WIDTH ** 2) / 12 +
	((WASP_NOSE + WASP_STERN) / 2) ** 2;

const FRONT_RAD = (8.5 * Math.PI) / 180;
const REAR_RAD = (10 * Math.PI) / 180;
const FX_FRONT = -Math.sin(FRONT_RAD);
const FY_FRONT = Math.cos(FRONT_RAD);
const LEVER_FRONT = 18.5 * FY_FRONT + 4.4 * -FX_FRONT;

const FX_REAR = Math.sin(REAR_RAD);
const FY_REAR = Math.cos(REAR_RAD);
const LEVER_REAR = 13.5 * FY_REAR + 4.9 * FX_REAR;

const COUPLED_PAIR_LEVER = LEVER_FRONT + LEVER_REAR;

function calculateWasp(aftEngine: "ion" | "heavy-ion", burn: BurnId): Sample[] {
	const ion = ION_DEFAULTS;
	const mainStrength = ionStrength(aftEngine);
	const mass = WASP_CHASSIS_MASS + PARTS[aftEngine].mass;
	const ship = {
		pos: new Vec2(0, 0),
		vel: new Vec2(0, 0),
		acc: new Vec2(0, 0),
		rotation: 0,
		radius: 16,
	};
	const motion = { velocity: 0 };
	const samples: Sample[] = [];
	const record = () =>
		samples.push({
			x: ship.pos.x,
			y: ship.pos.y,
			vx: ship.vel.x,
			vy: ship.vel.y,
			spin: (motion.velocity * 180) / Math.PI,
		});

	record();
	const dt = DT / 4;
	const maxTurn = (ion.maxTurn * Math.PI) / 180;

	for (let t = 0; t < TOTAL_TICKS; t++) {
		const input = inputAt(burn, t);
		for (let sub = 0; sub < 4; sub++) {
			// Coupled 4-stabilizer steering (L = +1, R = -1) and spin damping (0)
			const command = Number(input.left) - Number(input.right);
			if (command !== 0 || Math.abs(motion.velocity) >= 1e-10) {
				const direction = command || -Math.sign(motion.velocity);
				const accel = (ion.acceleration * ION_REFERENCE_MASS) / mass;
				const angularAccel =
					(accel * STABILIZER_STRENGTH * COUPLED_PAIR_LEVER) /
					WASP_INERTIA_PER_MASS;
				const duty = command
					? 1
					: Math.min(1, Math.abs(motion.velocity) / (angularAccel * dt));
				const stabStrength = duty * STABILIZER_STRENGTH;

				const torque =
					direction *
					stabStrength *
					COUPLED_PAIR_LEVER *
					ion.acceleration *
					ION_REFERENCE_MASS;

				motion.velocity = Math.max(
					-maxTurn,
					Math.min(
						maxTurn,
						motion.velocity + (torque / (mass * WASP_INERTIA_PER_MASS)) * dt,
					),
				);
				if (command === 0 && duty && Math.abs(motion.velocity) < 1e-10) {
					motion.velocity = 0;
				}

				// Apply stabilizer linear impulse only when the rear engine is ALSO firing,
				// OR with at least 1.0 reference ceiling so a 0.008 stabilizer imbalance
				// doesn't set ionCeiling(0.008) = 2.7 u/s and radial-brake the ship's drift!
				const ix =
					(input.left && input.right ? mainStrength : 0) +
					stabStrength * (FX_FRONT + FX_REAR);
				const iy = direction * stabStrength * (FY_FRONT - FY_REAR);
				const combined = Math.hypot(ix, iy);
				if (combined > 1e-10) {
					engineImpulse(
						ship,
						ship.rotation + Math.atan2(iy, ix),
						(ion.acceleration * ION_REFERENCE_MASS * combined) / mass,
						ionCeiling(Math.max(1, combined), ion),
						dt,
					);
				}
			} else if (input.left && input.right) {
				engineImpulse(
					ship,
					ship.rotation,
					(ion.acceleration * ION_REFERENCE_MASS * mainStrength) / mass,
					ionCeiling(mainStrength, ion),
					dt,
				);
			}

			ship.rotation += motion.velocity * dt;
			ship.pos.x += ship.vel.x * dt;
			ship.pos.y += ship.vel.y * dt;
		}
		record();
	}

	return samples;
}

const fighter4IonsLoadout = LoadoutSchema.parse({
	...defaultLoadout("fighter"),
	side: "ion",
	aft: ["ion", "ion"],
	stabilizers: true,
});

const fighter2SideIonsLoadout = LoadoutSchema.parse({
	...defaultLoadout("fighter"),
	side: "ion",
	aft: [null, null],
	stabilizers: true,
});

let burn = $state<BurnId>("course");
let tick = $state(7 * TICK_RATE);

const tracks = $derived.by((): Track[] => {
	const defs: { label: string; samples: Sample[] }[] = [
		{
			label: "Wasp with ion",
			samples: calculateWasp("ion", burn),
		},
		{
			label: "Wasp with heavy ion",
			samples: calculateWasp("heavy-ion", burn),
		},
		{
			label: "Fighter with 4 ions",
			samples: calculate(
				{
					label: "Fighter with 4 ions",
					loadout: fighter4IonsLoadout,
					changes: {},
				},
				burn,
			),
		},
		{
			label: "Fighter with 2 side ions only",
			samples: calculate(
				{
					label: "Fighter with 2 side ions only",
					loadout: fighter2SideIonsLoadout,
					changes: {},
				},
				burn,
			),
		},
	];

	return defs.map((d, i) => ({
		label: d.label,
		color: TRACK_COLORS[i],
		samples: d.samples,
		traces: traces(d.samples),
	}));
});

let hostW = $state(SCREEN.w);
let hostH = $state(SCREEN.h);
const scale = $derived(Math.min(hostW / SCREEN.w, hostH / SCREEN.h));
</script>

<figure
	class="host"
	bind:clientWidth={hostW}
	bind:clientHeight={hostH}
	aria-label={label}
>
	<div
		class="screen"
		style={`width:${SCREEN.w}px;height:${SCREEN.h}px;transform:translate(-50%,-50%) scale(${scale})`}
	>
		<div class="slot" style={`left:${PAD}px;top:${TOP}px`}>
			<PathPane {tracks} {tick} {scale} size={BLOCK} />
		</div>
		<div
			class="slot"
			style={`left:${PAD}px;top:${CONTROL_TOP}px;width:${COL}px`}
		>
			<BurnRow bind:burn {tick} />
		</div>
		{#each measures as m, i}
			<div
				class="slot"
				style={`left:${RIGHT}px;top:${TOP + i * (GRAPH + GRAPH_GAP)}px`}
			>
				<TimeGraph measure={m} {tracks} {tick} width={COL} height={GRAPH} />
			</div>
		{/each}
		<div
			class="slot"
			style={`left:${RIGHT}px;top:${CONTROL_TOP}px;width:${COL}px;padding:0 ${SLIDER.right}px 0 ${SLIDER.left}px`}
		>
			<RingSlider
				compact
				label="Time"
				unit="s"
				digits={2}
				min={0}
				max={SECONDS}
				step={1 / TICK_RATE}
				bind:value={
					() => tick / TICK_RATE,
					(v) => (tick = Math.round(v * TICK_RATE))
				}
			/>
			<span class="slider-label" aria-hidden="true">Time</span>
			<span class="slider-end start" style={`left:${SLIDER.left + 8}px`}
				>0</span
			>
			<span class="slider-end end" style={`right:${SLIDER.right + 8}px`}>
				{SECONDS}
				s
			</span>
		</div>
		<div
			class="slot"
			style={`left:${PAD}px;top:${CONTROL_TOP + CONTROL + LEGEND_GAP}px;width:${SCREEN.w - 2 * PAD}px`}
		>
			<Legend {tracks} />
		</div>
	</div>
</figure>

<style>
.host {
	position: relative;
	margin: 0;
	width: 100%;
	height: 100%;
	aspect-ratio: 1440 / 900;
	overflow: hidden;
	background: var(--color-elev-1);
	color: var(--color-text);
	font-family: var(--font-family-ui);
}
.screen {
	position: absolute;
	left: 50%;
	top: 50%;
	transform-origin: center;
}
.slot {
	position: absolute;
	box-sizing: border-box;
}
.slider-label {
	position: absolute;
	top: 50%;
	right: calc(100% - 44px);
	transform: translateY(-50%);
	color: var(--color-text-dim);
	font-size: 13px;
	letter-spacing: 0.1em;
	text-transform: uppercase;
}
.slider-end {
	position: absolute;
	bottom: -2px;
	color: var(--color-text-dim);
	font-size: 13px;
}
.slider-end.start {
	transform: translateX(-50%);
}
.slider-end.end {
	transform: translateX(50%);
}
</style>
