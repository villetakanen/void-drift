import { COLOR, FX_INK, type FxPass } from "@void-drift/core";
import { DERELICT_RELEASE_CUE } from "./derelict-geometry";
import {
	drawDerelict,
	drawDerelictEnergy,
	drawDerelictShard,
	stampDerelictRelease,
} from "./derelict-renderer";
import type { SalvageSystem } from "./salvage";

const LASER_INK = "#ff1028";
const RELEASE_REACH =
	DERELICT_RELEASE_CUE.radius +
	DERELICT_RELEASE_CUE.speed * DERELICT_RELEASE_CUE.duration +
	DERELICT_RELEASE_CUE.lineWidth / 2;

/** Physical objects stay readable even when decorative light is disabled. */
export function drawSalvage(
	ctx: CanvasRenderingContext2D,
	salvage: SalvageSystem,
) {
	ctx.save();
	for (const body of salvage.bodies) {
		if (body.kind === "wreck") {
			drawDerelict(
				ctx,
				body.x,
				body.y,
				body.rotation,
				salvage.time,
				"body",
				undefined,
				body.releasedMask ?? 0,
			);
			continue;
		}
		if (body.kind === "fragment") {
			drawDerelictShard(
				ctx,
				body.x,
				body.y,
				body.rotation,
				body.shardIndex ?? 0,
			);
			continue;
		}
		drawDerelictEnergy(
			ctx,
			body.x,
			body.y,
			body.rotation,
			salvage.time,
			"body",
		);
	}
	ctx.restore();
}

/** Current pulses and moving rounds stamp fresh light; history belongs to FxSurface. */
export function stampWeaponLight(
	ctx: CanvasRenderingContext2D,
	salvage: SalvageSystem,
	pass: FxPass,
) {
	for (const body of salvage.bodies) {
		if (body.kind === "cell" && pass.visible(body.x, body.y, 30))
			drawDerelictEnergy(
				ctx,
				body.x,
				body.y,
				body.rotation,
				salvage.time,
				"light",
				pass,
			);
		if (body.kind === "wreck" && pass.visible(body.x, body.y, 60))
			drawDerelict(
				ctx,
				body.x,
				body.y,
				body.rotation,
				salvage.time,
				"light",
				pass,
			);
	}
	ctx.save();
	ctx.globalAlpha = pass.opacity;
	ctx.strokeStyle = FX_INK.core;
	ctx.lineWidth = 1.5;
	for (const shot of salvage.shots) {
		if (!pass.visible(shot.x, shot.y, 12) || !pass.budget.take(true)) continue;
		ctx.beginPath();
		ctx.moveTo(shot.x, shot.y);
		ctx.lineTo(
			shot.x - Math.cos(shot.angle) * 12,
			shot.y - Math.sin(shot.angle) * 12,
		);
		ctx.stroke();
	}
	for (const event of salvage.events) {
		const age = salvage.time - event.time;
		if (event.kind === "energy-release") {
			if (pass.visible(event.x, event.y, RELEASE_REACH))
				stampDerelictRelease(ctx, event.x, event.y, age, pass);
			continue;
		}
		const collision = event.kind === "collision";
		if (age > (collision ? 0.2 : 0.08)) continue;
		const radius = collision
			? 40
			: Math.hypot(event.endX - event.x, event.endY - event.y) / 2 + 10;
		if (
			!pass.visible(
				(event.x + event.endX) / 2,
				(event.y + event.endY) / 2,
				radius,
			) ||
			!pass.budget.take(true)
		)
			continue;
		if (collision) {
			// A short expanding circular plume stamps into the shared light history.
			ctx.globalAlpha = pass.opacity * (1 - age / 0.2);
			ctx.strokeStyle = FX_INK.fire;
			ctx.lineWidth = 6;
			ctx.beginPath();
			ctx.arc(event.x, event.y, 4 + age * 150, 0, Math.PI * 2);
			ctx.stroke();
			ctx.strokeStyle = FX_INK.core;
			ctx.lineWidth = 1.5;
			ctx.stroke();
			ctx.globalAlpha = pass.opacity;
			continue;
		}
		ctx.fillStyle =
			event.kind === "laser"
				? LASER_INK
				: event.kind === "collect"
					? COLOR.resourcePower
					: FX_INK.core;
		ctx.fillRect(event.x - 2, event.y - 2, 4, 4);
		if (event.kind === "laser") {
			ctx.strokeStyle = LASER_INK;
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(event.x, event.y);
			ctx.lineTo(event.endX, event.endY);
			ctx.stroke();
			ctx.strokeStyle = "#ff7080";
			ctx.lineWidth = 1;
			ctx.stroke();
		}
	}
	ctx.restore();
}

/** Restore the hollow centre after the persistent light surface is composited. */
export function drawSalvageApertures(
	ctx: CanvasRenderingContext2D,
	salvage: SalvageSystem,
) {
	for (const body of salvage.bodies)
		if (body.kind === "cell")
			drawDerelictEnergy(
				ctx,
				body.x,
				body.y,
				body.rotation,
				salvage.time,
				"aperture",
			);
		else if (body.kind === "wreck")
			drawDerelict(
				ctx,
				body.x,
				body.y,
				body.rotation,
				salvage.time,
				"aperture",
			);
}
