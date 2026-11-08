<script lang="ts">
import {
	BUILD_FLIGHT_SCALE,
	CHASSIS,
	defaultLoadout,
	drawBuild,
	drawSalvage,
	drawSalvageApertures,
	FlightFx,
	LoadoutSchema,
	type SalvageBody,
	Simulation,
	STEP,
	stockSettings,
	weaponPose,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import "@void-drift/core/styles/buttons.css";

let { label = "Production Light Ion Cannon encounter" }: { label?: string } =
	$props();
let canvas: HTMLCanvasElement;
let scenario = $state("close");
let playing = $state(false);
let ready = $state(false);
let moving = $state(false);
let effects = $state(true);
let zoom = $state(2);
let shots = $state(0),
	hits = $state(0),
	spent = $state(0),
	seconds = $state(0);
let reset = () => {};
let advance = () => {};
onMount(() => {
	const context = canvas.getContext("2d");
	if (!context) return;
	const ctx: CanvasRenderingContext2D = context;
	const fx = new FlightFx();
	let sim: Simulation;
	function start() {
		const loadout = defaultLoadout("fighter");
		if (scenario === "miss") loadout.aft.fill("light-ion-cannon");
		else loadout.hull.fill("light-ion-cannon");
		sim = new Simulation({
			...stockSettings("fighter"),
			loadout: LoadoutSchema.parse(loadout),
			mode: "derelicts",
			arrival: false,
		});
		sim.planets.length = 0;
		sim.star.pos.set(1800, 1000);
		sim.ship.pos.set(400, 400);
		sim.ship.rotation = 0;
		sim.ship.vel.set(0, 0);
		sim.start();
		fx.clear();
		const salvage = sim.salvage;
		if (!salvage) return;
		salvage.nextPass = Infinity;
		const target = (
			x: number,
			id: number,
			kind: SalvageBody["kind"] = "wreck",
		) => {
			const b: SalvageBody = {
				id,
				group: id,
				kind,
				x,
				y: 400,
				previousX: x,
				previousY: 400,
				vx: 0,
				vy: 0,
				radius: 18,
				hull: 85,
				life: 60,
				rotation: 0,
			};
			salvage.bodies.push(b);
			return b;
		};
		if (scenario === "miss") {
			const t = target(500, 101, "fragment");
			t.hull = 12;
			let found = false;
			for (let shard = 0; shard < 8 && !found; shard++)
				for (let i = 0; i < 360; i++) {
					t.shardIndex = shard;
					t.rotation = (i * Math.PI) / 180;
					if (
						salvage.ionContact(400, 400, 0, sim.star, []).hit &&
						salvage.weapons.some((w) => {
							const p = weaponPose(sim.ship, w.mount);
							return !salvage.ionContact(
								p.muzzleX,
								p.muzzleY,
								p.angle,
								sim.star,
								[],
							).hit;
						})
					) {
						found = true;
						break;
					}
				}
		} else {
			target(scenario === "far" ? 620 : 495, 101);
			if (scenario === "blocked") target(590, 102);
		}
		shots = hits = spent = seconds = 0;
		draw();
	}
	function draw() {
		ctx.resetTransform();
		ctx.fillStyle = "#070710";
		ctx.fillRect(0, 0, 1080, 600);
		ctx.setTransform(
			zoom,
			0,
			0,
			zoom,
			230 - sim.ship.pos.x * zoom,
			300 - sim.ship.pos.y * zoom,
		);
		ctx.strokeStyle = "#202437";
		ctx.lineWidth = 1 / zoom;
		for (let x = 0; x < 1920; x += 50) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, 1080);
			ctx.stroke();
		}
		for (let y = 0; y < 1080; y += 50) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(1920, y);
			ctx.stroke();
		}
		if (sim.settings.loadout) {
			ctx.save();
			ctx.translate(sim.ship.pos.x, sim.ship.pos.y);
			ctx.rotate(sim.ship.rotation);
			ctx.strokeStyle = "#437e99";
			ctx.setLineDash([3, 4]);
			const width =
				CHASSIS[sim.settings.loadout.chassis].width * BUILD_FLIGHT_SCALE;
			ctx.strokeRect(0, -width / 2, 200, width);
			ctx.restore();
		}
		if (sim.salvage) drawSalvage(ctx, sim.salvage);
		if (sim.settings.loadout)
			drawBuild(
				ctx,
				sim.settings.loadout,
				sim.ship.pos.x,
				sim.ship.pos.y,
				sim.ship.rotation,
				BUILD_FLIGHT_SCALE,
				"",
				undefined,
				undefined,
				sim.salvage?.angles,
			);
		if (effects) fx.draw(ctx, sim);
		if (sim.salvage) drawSalvageApertures(ctx, sim.salvage);
		// Fresh final light pass, shared with FlightDeck and the mixed-effects bench.
		if (effects) fx.drawLfx(ctx, sim);
		ctx.resetTransform();
		shots = sim.salvage?.ionDischarges ?? 0;
		hits = sim.salvage?.hits ?? 0;
		spent = sim.salvage?.energySpent ?? 0;
		seconds = sim.ticks * STEP;
	}
	reset = start;
	advance = () => {
		sim.step({ leftThruster: moving, rightThruster: false, fire: false });
		draw();
	};
	start();
	ready = true;
	let previous = performance.now(),
		accumulated = 0,
		raf = 0;
	function frame(now: number) {
		if (playing) {
			accumulated += Math.min(0.1, (now - previous) / 1000);
			while (accumulated >= STEP) {
				sim.step({ leftThruster: moving, rightThruster: false, fire: false });
				accumulated -= STEP;
			}
		} else accumulated = 0;
		previous = now;
		draw();
		raf = requestAnimationFrame(frame);
	}
	raf = requestAnimationFrame(frame);
	return () => cancelAnimationFrame(raf);
});
</script>
<section
	aria-label={label}
	data-shots={shots}
	data-hits={hits}
	data-spent={spent}
>
	<div class="controls">
		<label
			>Encounter
			<select
				aria-label="Encounter"
				bind:value={scenario}
				onchange={() => {
					playing = false;
					reset();
				}}
			>
				<option value="close">Close hit</option>
				<option value="far">Distant hit</option>
				<option value="miss">Small target · offset misses</option>
				<option value="blocked">First target stops ray</option>
			</select></label
		>
		<button
			disabled={!ready}
			type="button"
			class="btn"
			onclick={() => (playing = !playing)}
		>
			{playing ? "Pause encounter" : "Play encounter"}
		</button>
		<button
			disabled={!ready}
			type="button"
			class="btn"
			onclick={() => {
				playing = false;
				advance();
			}}
		>
			Step encounter
		</button>
		<button
			disabled={!ready}
			type="button"
			class="btn"
			onclick={() => {
				playing = false;
				reset();
			}}
		>
			Reset encounter
		</button>
		<label><input type="checkbox" bind:checked={moving}>Turn and burn</label>
		<label><input type="checkbox" bind:checked={effects}>Effects</label>
		<label
			>Zoom
			<select aria-label="Zoom" bind:value={zoom}>
				<option value={1}>1×</option>
				<option value={2}>2×</option>
				<option value={3}>3×</option>
			</select></label
		>
	</div>
	<p>
		{seconds.toFixed(2)}
		s · {shots} discharges · {hits} hits · {spent.toFixed(1)}p spent · 50-unit
		grid
	</p>
	<canvas
		bind:this={canvas}
		width="1080"
		height="600"
		aria-label="Real cannon simulation, ship, targets, impacts and LFX"
	></canvas>
	<p>
		Real validated fittings, collision geometry and damage. Pause or step to
		inspect the muzzle and first contact; turn and burn to inspect attachment.
		Reset repeats the same encounter. Play the equipped ship in
		<a href="/hangar">Hangar → Derelicts</a>
		with keyboard or landscape touch controls.
	</p>
</section>
<style>
.controls {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--spacing-md);
}
label {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
}
select {
	background: var(--color-elev-1);
	color: var(--color-text);
	padding: var(--spacing-sm);
}
canvas {
	display: block;
	width: 100%;
	background: var(--color-void);
}
</style>
