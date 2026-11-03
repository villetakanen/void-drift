<script lang="ts">
import { COLOR, canvasFont } from "@void-drift/core";
import {
	defaultLoadout,
	drawBuild,
	drawStabilizerSlits,
	drawUtilityArtwork,
	ENGINE_ART,
	SLOT_STYLE,
	SLOT_TYPES,
	WASP,
} from "@void-drift/mode-a";
import { geometry, type Point, type Variant } from "./geometry";

let {
	ship,
	view = "Hull",
	scale = 2.35,
	width = 320,
	height = 310,
	label,
}: {
	ship: Variant | "wasp" | "corvette";
	view?: string;
	scale?: number;
	width?: number;
	height?: number;
	label: string;
} = $props();
let canvas: HTMLCanvasElement;

$effect(() => {
	if (!canvas) return;
	const ratio = window.devicePixelRatio || 1;
	canvas.width = width * ratio;
	canvas.height = height * ratio;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	ctx.scale(ratio, ratio);
	ctx.clearRect(0, 0, width, height);
	if (ship === "wasp" || ship === "corvette") {
		const build = defaultLoadout(ship);
		drawBuild(
			ctx,
			build,
			width / 2,
			height / 2,
			-Math.PI / 2,
			scale,
			"",
			undefined,
			[],
		);
		return;
	}
	const model = geometry(ship);
	const polygon = (points: readonly Point[], color: string) => {
		ctx.fillStyle = color;
		ctx.beginPath();
		points.forEach(([x, y], i) => {
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		});
		ctx.closePath();
		ctx.fill();
	};
	ctx.translate(width / 2, height / 2 + 4 * scale);
	ctx.scale(scale, scale);
	for (const face of model.faces) polygon(face.points, face.color);
	polygon(model.canopy, WASP.facets[WASP.facets.length - 1].color);
	ctx.save();
	ctx.rotate(-Math.PI / 2);
	drawStabilizerSlits(ctx, { x: 48, y: model.spread + 4, fx: 0, fy: 1 });
	drawStabilizerSlits(ctx, { x: -30, y: model.spread + 7, fx: 0, fy: 1 });
	ctx.restore();
	if (view === "Mounts") {
		// Footprint diagram, not a duplicate of the interactive Hangar slot UI.
		const w = SLOT_STYLE.width / SLOT_STYLE.referenceScale;
		const h = SLOT_STYLE.height / SLOT_STYLE.referenceScale;
		for (const mount of model.mounts) {
			ctx.fillStyle = COLOR.void;
			ctx.fillRect(mount.x - w / 2, mount.y - h / 2, w, h);
			ctx.fillStyle = COLOR.text;
			ctx.font = canvasFont(4.8, 700);
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(SLOT_TYPES[mount.type].symbol, mount.x, mount.y);
		}
	}
	if (view === "Fitted") {
		for (const mount of model.mounts) {
			ctx.save();
			ctx.translate(mount.x, mount.y);
			ctx.rotate(-Math.PI / 2);
			if (mount.type === "engine") {
				for (const face of ENGINE_ART["heavy-ion"][3])
					polygon(face.points, face.color);
			} else {
				drawUtilityArtwork(
					ctx,
					mount.type === "universal" ? "storage" : "solar",
				);
			}
			ctx.restore();
		}
	}
});
</script>

<canvas
	bind:this={canvas}
	style={`width:${width}px;max-width:100%;height:auto;aspect-ratio:${width}/${height}`}
	aria-label={label}
>
	{label}
</canvas>

<style>
canvas {
	display: block;
	margin-inline: auto;
}
</style>
