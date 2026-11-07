<script lang="ts">
import { FxSurface } from "@void-drift/core";
import {
	BUILD_FLIGHT_SCALE,
	createDerelictPainter,
	DERELICT_ENERGY_EJECTION,
	DERELICT_ENERGY_SOURCE,
	DERELICT_ORIGIN,
	DERELICT_SCALE,
	DERELICT_SHARDS,
	drawBuild,
	starterLoadout,
} from "@void-drift/mode-a";
import { onMount } from "svelte";

let {
	label = "Wasp and Fiddler beside an intact derelict and its eight-piece B breakup reference",
}: { label?: string } = $props();
let canvas: HTMLCanvasElement;
let time = $state(0);
let glow = $state(true);
let paint = () => {};
onMount(() => {
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	const painter = createDerelictPainter();
	const paths = DERELICT_SHARDS.map((piece) => new Path2D(piece.path));
	const fx = new FxSurface();
	const scratch = document.createElement("canvas");
	scratch.width = 960;
	scratch.height = 480;
	const light = scratch.getContext("2d");
	const at = (target: CanvasRenderingContext2D, x: number, y: number) => {
		target.translate(x, y);
		target.scale(DERELICT_SCALE * 1.6, DERELICT_SCALE * 1.6);
		target.translate(-DERELICT_ORIGIN.x, -DERELICT_ORIGIN.y);
	};
	paint = () => {
		if (!light) return;
		canvas.width = 960;
		canvas.height = 480;
		drawBuild(
			ctx,
			starterLoadout("wasp"),
			90,
			240,
			-Math.PI / 2,
			BUILD_FLIGHT_SCALE * 1.6,
		);
		drawBuild(
			ctx,
			starterLoadout("fiddler"),
			205,
			240,
			-Math.PI / 2,
			BUILD_FLIGHT_SCALE * 1.6,
		);
		ctx.save();
		at(ctx, 350, 240);
		painter.hull(ctx);
		painter.core(ctx, time);
		ctx.restore();
		for (const [index, piece] of DERELICT_SHARDS.entries()) {
			const elapsed = Math.max(0, time - piece.release);
			ctx.save();
			ctx.translate(
				740 +
					(piece.x - DERELICT_ORIGIN.x) * DERELICT_SCALE * 1.6 +
					piece.vx * elapsed * 1.6,
				240 +
					(piece.y - DERELICT_ORIGIN.y) * DERELICT_SCALE * 1.6 +
					piece.vy * elapsed * 1.6,
			);
			ctx.rotate(piece.spin * elapsed);
			ctx.scale(DERELICT_SCALE * 1.6, DERELICT_SCALE * 1.6);
			ctx.translate(-piece.x, -piece.y);
			ctx.clip(paths[index]);
			painter.hull(ctx);
			ctx.restore();
		}
		const energyY =
			240 + DERELICT_ENERGY_EJECTION.y * Math.max(0, time - 1) * 1.6;
		ctx.save();
		at(ctx, 740, energyY);
		painter.core(ctx, time);
		ctx.restore();
		fx.clear();
		let stampTime = time;
		const emit = (
			target: CanvasRenderingContext2D,
			pass: import("@void-drift/core").FxPass,
		) => {
			if (!glow) return;
			for (const [x, y] of [
				[350, 240],
				[
					740,
					240 + DERELICT_ENERGY_EJECTION.y * Math.max(0, stampTime - 1) * 1.6,
				],
			]) {
				target.save();
				at(target, x, y);
				painter.light(target, pass, stampTime);
				target.restore();
			}
			target.save();
			target.translate(
				740 +
					(DERELICT_ENERGY_SOURCE.x - DERELICT_ORIGIN.x) * DERELICT_SCALE * 1.6,
				240 +
					(DERELICT_ENERGY_SOURCE.y - DERELICT_ORIGIN.y) * DERELICT_SCALE * 1.6,
			);
			target.scale(1.6, 1.6);
			painter.release(target, pass, stampTime - 1);
			target.restore();
		};
		for (let tick = 1; tick <= 30; tick++) {
			stampTime = time - (30 - tick) / 60;
			fx.draw(light, tick / 60, emit);
		}
		fx.draw(ctx, 0.5, emit);
		for (const [x, y] of [
			[350, 240],
			[740, energyY],
		]) {
			ctx.save();
			at(ctx, x, y);
			painter.aperture(ctx, time);
			ctx.restore();
		}
	};
	paint();
});
$effect(() => {
	void time;
	void glow;
	paint();
});
</script>
<div class="bench">
	<p>Shared production artwork · 110 world units · comparison scale 1.60</p>
	<canvas bind:this={canvas} aria-label={label}></canvas>
	<div class="labels">
		<span>Wasp · Fiddler · intact hull</span
		><span>Eight-piece B reference</span>
	</div>
	<label
		>Breakup reference
		<input type="range" min="0" max="2" step="0.01" bind:value={time}>
		<output>{time.toFixed(2)} s</output></label
	>
	<label><input type="checkbox" bind:checked={glow}> Energy light</label>
	<p>
		The scrubber demonstrates the accepted release order and motion. Use the
		damage specimen above to exercise physical release and fitted collisions.
		The damage specimen uses this square and pulse on actual player destruction.
	</p>
</div>
<style>
.bench {
	padding: var(--spacing-lg);
}
canvas {
	display: block;
	width: 960px;
	height: 480px;
	margin: 0 auto;
	background: var(--color-void);
}
.labels {
	width: 960px;
	margin: 0 auto;
	display: flex;
	justify-content: space-around;
	color: var(--color-text-muted);
}
label {
	display: flex;
	align-items: center;
	gap: var(--spacing-md);
	margin: var(--spacing-md) 0;
}
input[type="range"] {
	width: 20rem;
}
p {
	color: var(--color-text-muted);
}
</style>
