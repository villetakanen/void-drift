import { COLOR, type FxPass } from "@void-drift/core";
import {
	DERELICT_ORIGIN,
	DERELICT_PLANE_PALETTE,
	DERELICT_RELEASE_CUE,
	DERELICT_SCALE,
	DERELICT_SHARDS,
	DERELICT_SOURCE_PLANES,
} from "./derelict-geometry";

// Shared source-space painter: unchanged reference paths with cached flat fills.
export function createDerelictPainter() {
	const hull = document.createElement("canvas");
	hull.width = 240;
	hull.height = 600;
	const ctx = hull.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D is required");
	ctx.scale(4, 4);
	ctx.translate(-72, -75);
	for (const [index, plane] of DERELICT_SOURCE_PLANES.entries()) {
		const path = new Path2D(plane.d);
		ctx.fillStyle = DERELICT_PLANE_PALETTE[index];
		ctx.fill(path);
	}

	const shardPaths = DERELICT_SHARDS.map((piece) => new Path2D(piece.path));
	const remainingPaths = new Map<number, Path2D>();
	const paintHull = (target: CanvasRenderingContext2D) =>
		target.drawImage(hull, 72, 75, 60, 150);

	// Cache the complete square and halo once; no per-frame blur.
	const light = document.createElement("canvas");
	light.width = light.height = 384;
	const glow = light.getContext("2d");
	if (!glow) throw new Error("Canvas 2D is required");
	glow.translate(192, 192);
	const halo = glow.createRadialGradient(0, 0, 12, 0, 0, 180);
	halo.addColorStop(0, COLOR.brand.replace(")", " / 0.65)"));
	halo.addColorStop(0.35, COLOR.brand.replace(")", " / 0.3)"));
	halo.addColorStop(1, COLOR.brand.replace(")", " / 0)"));
	glow.fillStyle = halo;
	glow.fillRect(-192, -192, 384, 384);
	glow.strokeStyle = COLOR.brand;
	glow.lineWidth = 16.56;
	glow.shadowColor = COLOR.brand;
	glow.shadowBlur = 40;
	glow.strokeRect(-25.92, -25.92, 51.84, 51.84);

	function atCore(target: CanvasRenderingContext2D, time: number) {
		target.translate(100.05, 154.15);
		target.rotate(Math.PI / 6 + (time * Math.PI) / 6);
	}
	return {
		release(target: CanvasRenderingContext2D, pass: FxPass, age: number) {
			const cue = DERELICT_RELEASE_CUE;
			if (age < 0 || age >= cue.duration || !pass.budget.take(true)) return;
			target.save();
			target.globalAlpha =
				pass.opacity * cue.strength * (1 - age / cue.duration);
			target.strokeStyle = COLOR.brand;
			target.lineWidth = cue.lineWidth;
			target.beginPath();
			target.arc(0, 0, cue.radius + age * cue.speed, 0, Math.PI * 2);
			target.stroke();
			target.restore();
		},
		hull(target: CanvasRenderingContext2D, releasedMask = 0) {
			if (!releasedMask) {
				paintHull(target);
				return;
			}
			let path = remainingPaths.get(releasedMask);
			if (!path) {
				path = new Path2D();
				for (let index = 0; index < shardPaths.length; index++)
					if (!(releasedMask & (1 << index))) path.addPath(shardPaths[index]);
				remainingPaths.set(releasedMask, path);
			}
			target.save();
			target.clip(path);
			paintHull(target);
			target.restore();
		},
		shard(target: CanvasRenderingContext2D, index: number) {
			const path = shardPaths[index];
			if (!path) throw new Error("Invalid derelict shard index");
			target.save();
			target.clip(path);
			paintHull(target);
			target.restore();
		},
		core(target: CanvasRenderingContext2D, time: number) {
			target.save();
			atCore(target, time);
			target.strokeStyle = COLOR.brand;
			target.lineWidth = 2.754;
			target.strokeRect(-4.32, -4.32, 8.64, 8.64);
			target.restore();
		},
		aperture(target: CanvasRenderingContext2D, time: number) {
			target.save();
			atCore(target, time);
			// The hollow centre occludes accumulated light, including older rotations.
			const innerHalf = 4.32 - 2.754 / 2;
			target.fillStyle = "#000";
			target.fillRect(-innerHalf, -innerHalf, innerHalf * 2, innerHalf * 2);
			target.restore();
		},
		light(target: CanvasRenderingContext2D, pass: FxPass, time: number) {
			if (!pass.budget.take(true)) return;
			target.save();
			atCore(target, time);
			target.globalAlpha = pass.opacity * 0.5;
			target.drawImage(light, -32, -32, 64, 64);
			target.restore();
		},
	};
}

let cachedPainter: ReturnType<typeof createDerelictPainter> | undefined;
export function getDerelictPainter() {
	if (!cachedPainter) cachedPainter = createDerelictPainter();
	return cachedPainter;
}
/** Apply the accepted source-space artwork at its nominal world extent. */
export function drawDerelict(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	rotation: number,
	time: number,
	layer: "body" | "light" | "aperture" = "body",
	pass?: FxPass,
	releasedMask = 0,
) {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rotation);
	ctx.scale(DERELICT_SCALE, DERELICT_SCALE);
	ctx.translate(-DERELICT_ORIGIN.x, -DERELICT_ORIGIN.y);
	const painter = getDerelictPainter();
	if (layer === "body") {
		painter.hull(ctx, releasedMask);
		painter.core(ctx, time);
	} else if (layer === "aperture") painter.aperture(ctx, time);
	else if (pass) painter.light(ctx, pass, time);
	ctx.restore();
}

/** A physical shard uses its source-site pivot, matching fitted collision geometry. */
export function drawDerelictShard(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	rotation: number,
	index: number,
) {
	const piece = DERELICT_SHARDS[index];
	if (!piece) throw new Error("Invalid derelict shard index");
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rotation);
	ctx.scale(DERELICT_SCALE, DERELICT_SCALE);
	ctx.translate(-piece.x, -piece.y);
	getDerelictPainter().shard(ctx, index);
	ctx.restore();
}
