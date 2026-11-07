<script lang="ts">
import { COLOR, FxSurface } from "@void-drift/core";
import {
	BUILD_FLIGHT_SCALE,
	defaultLoadout,
	drawBuild,
	drawSalvage,
	drawSalvageApertures,
	getDerelictWorldPolygons,
	SALVAGE,
	type SalvageBody,
	SalvageBodySchema,
	Simulation,
	stampWeaponLight,
	stockSettings,
} from "@void-drift/mode-a";
import { onMount } from "svelte";

let {
	label = "Live derelict damage and physical shedding specimen",
}: { label?: string } = $props();
let canvas: HTMLCanvasElement;
let ready = $state(false);
let showMaterial = $state(false);
let repaint = () => {};
let energyX = $state<number | undefined>();
let energyY = $state<number | undefined>();
let pulseX = $state<number | undefined>();
let pulseY = $state<number | undefined>();
let gameTime = $state(0);
let hull = $state(SALVAGE.wreck.hull),
	fragments = $state(0),
	cells = $state(0),
	shipHull = $state(100);
let act: (
	kind: "laser" | "rail" | "ram" | "coast" | "coast-short" | "reset",
) => void = () => {};
onMount(() => {
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	const fx = new FxSurface();
	const loadout = defaultLoadout("fighter");
	loadout.hull = ["laser", "rail"];
	let sim: Simulation, wreck: SalvageBody;
	const paint = () => {
		canvas.width = 960;
		canvas.height = 360;
		ctx.translate(480, 180);
		ctx.scale(2, 2);
		ctx.translate(-1240, -540);
		const salvage = sim.salvage;
		if (!salvage) return;
		drawSalvage(ctx, salvage);
		drawBuild(
			ctx,
			loadout,
			sim.ship.pos.x,
			sim.ship.pos.y,
			sim.ship.rotation,
			BUILD_FLIGHT_SCALE,
			"",
			undefined,
			undefined,
			salvage.angles,
		);
		if (showMaterial) {
			const path = new Path2D();
			for (const body of salvage.bodies) {
				if (body.kind === "cell") continue;
				for (const points of getDerelictWorldPolygons({
					...body,
					kind: body.kind,
					shardIndex: body.shardIndex ?? 0,
					releasedMask: body.releasedMask ?? 0,
				})) {
					path.moveTo(points[0].x, points[0].y);
					for (const point of points.slice(1)) path.lineTo(point.x, point.y);
					path.closePath();
				}
			}
			ctx.save();
			ctx.globalAlpha = 0.3;
			ctx.fillStyle = COLOR.resourceWarning;
			ctx.fill(path);
			ctx.restore();
		}
		fx.draw(ctx, salvage.time, (target, pass) =>
			stampWeaponLight(target, salvage, pass),
		);
		drawSalvageApertures(ctx, salvage);
		hull = Math.max(0, wreck.hull);
		fragments = salvage.bodies.filter(
			(body) => body.kind === "fragment",
		).length;
		cells = salvage.bodies.filter((body) => body.kind === "cell").length;
		shipHull = sim.state.resources.hull;
		const cell = salvage.bodies.find((body) => body.kind === "cell");
		const release = salvage.events.find(
			(event) => event.kind === "energy-release",
		);
		energyX = cell?.x;
		energyY = cell?.y;
		pulseX = release?.x;
		pulseY = release?.y;
		gameTime = salvage.time;
	};
	const reset = () => {
		sim = new Simulation({
			...stockSettings("fighter"),
			loadout,
			mode: "derelicts",
		});
		sim.star.pos.set(10000, 10000);
		sim.planets.length = 0;
		sim.ship.pos.set(1130, 540);
		sim.ship.vel.set(0, 0);
		sim.ship.rotation = 0;
		if (!sim.salvage) throw new Error("Missing derelict combat specimen");
		sim.salvage.nextPass = Infinity;
		for (const weapon of sim.salvage.weapons) weapon.readyAt = Infinity;
		wreck = SalvageBodySchema.parse({
			id: 1000,
			group: 1,
			kind: "wreck",
			x: 1240,
			y: 540,
			previousX: 1240,
			previousY: 540,
			vx: 0,
			vy: 0,
			radius: 60,
			hull: SALVAGE.wreck.hull,
			initialHull: SALVAGE.wreck.hull,
			releasedMask: 0,
			life: SALVAGE.wreck.life,
			rotation: 0,
			previousRotation: 0,
		});
		sim.salvage.bodies.push(wreck);
		sim.start();
		fx.clear();
		paint();
	};
	act = (kind) => {
		if (kind === "reset") {
			reset();
			return;
		}
		if (!sim.salvage) return;
		for (const weapon of sim.salvage.weapons) weapon.readyAt = Infinity;
		if (kind === "laser" || kind === "rail") {
			const weapon = sim.salvage.weapons.find((weapon) => weapon.kind === kind);
			if (weapon) weapon.readyAt = 0;
		}
		if (kind === "ram") {
			sim.ship.pos.set(wreck.x - 25, wreck.y);
			sim.ship.vel.set(100, 0);
		}
		const ticks =
			kind === "coast"
				? 30
				: kind === "coast-short"
					? 6
					: kind === "rail"
						? 15
						: 1;
		for (let tick = 0; tick < ticks; tick++) {
			sim.step({ leftThruster: false, rightThruster: false, fire: false });
			paint();
		}
	};
	repaint = paint;
	reset();
	ready = true;
});
$effect(() => {
	void showMaterial;
	repaint();
});
</script>
<section
	class="damage-bench"
	aria-label="Physical shedding specimen"
	data-energy-x={energyX}
	data-energy-y={energyY}
	data-pulse-x={pulseX}
	data-pulse-y={pulseY}
	data-game-time={gameTime}
>
	<h2>Damage and physical pieces</h2>
	<p>Production simulation · fixed specimen · 2× view</p>
	<canvas bind:this={canvas} aria-label={label}></canvas>
	<label
		><input type="checkbox" bind:checked={showMaterial}>
		Show fitted material</label
	>
	<p role="status">
		Hull {hull.toFixed(0)} / {SALVAGE.wreck.hull} · Fragments {fragments} ·
		Energy cells {cells} · Ship hull {shipHull.toFixed(0)}
	</p>
	<div class="button-group">
		<button
			type="button"
			class="btn btn-ghost"
			disabled={!ready || hull <= 0}
			onclick={() => act("laser")}
		>
			Laser pulse
		</button>
		<button
			type="button"
			class="btn btn-ghost"
			disabled={!ready || hull <= 0}
			onclick={() => act("rail")}
		>
			Rail shot
		</button>
		<button
			type="button"
			class="btn btn-ghost"
			disabled={!ready || hull <= 0}
			onclick={() => act("ram")}
		>
			Ram
		</button>
		<button
			type="button"
			class="btn btn-ghost"
			disabled={!ready}
			onclick={() => act("coast-short")}
		>
			Coast 0.1 s
		</button>
		<button
			type="button"
			class="btn btn-ghost"
			disabled={!ready}
			onclick={() => act("coast")}
		>
			Coast 0.5 s
		</button>
		<button
			type="button"
			class="btn btn-ghost"
			disabled={!ready}
			onclick={() => act("reset")}
		>
			Reset specimen
		</button>
	</div>
	<p>
		Laser damage sheds pieces at 20%, 40% and 60%. Player destruction releases
		the remaining pieces, ejects the energy square and stamps the release pulse.
		Environmental destruction loses the energy and awards no kill.
	</p>
</section>
<style>
.button-group {
	flex-wrap: wrap;
}
.damage-bench {
	padding: var(--spacing-lg);
}
canvas {
	display: block;
	width: 960px;
	height: 360px;
	margin: 0 auto;
	background: var(--color-void);
}
p {
	color: var(--color-text-muted);
}
</style>
