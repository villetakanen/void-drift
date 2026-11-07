import { COLOR, FX_INK, type FxPass } from "@void-drift/core";
import { drawDerelict } from "./derelict-renderer";
import type { SalvageSystem } from "./salvage";

const LASER_INK = "#ff1028";

/** Physical objects stay readable even when decorative light is disabled. */
export function drawSalvage(
	ctx: CanvasRenderingContext2D,
	salvage: SalvageSystem,
) {
	ctx.save();
	for (const body of salvage.bodies) {
		if (body.kind === "wreck") {
			drawDerelict(ctx, body.x, body.y, body.rotation, salvage.time);
			continue;
		}
		ctx.save();
		ctx.translate(body.x, body.y);
		ctx.rotate(body.rotation);
		const r = body.radius;
		if (body.kind === "cell") {
			ctx.fillStyle = COLOR.resourcePower;
			ctx.beginPath();
			ctx.moveTo(0, -r);
			ctx.lineTo(r, 0);
			ctx.lineTo(0, r);
			ctx.lineTo(-r, 0);
			ctx.closePath();
			ctx.fill();
			ctx.fillStyle = COLOR.void;
			ctx.fillRect(-2, -2, 4, 4);
		} else {
			ctx.fillStyle = COLOR.resourceWarning;
			ctx.beginPath();
			ctx.moveTo(-r, -r * 0.3);
			ctx.lineTo(-r * 0.4, -r * 0.8);
			ctx.lineTo(r * 0.7, -r * 0.55);
			ctx.lineTo(r, r * 0.2);
			ctx.lineTo(r * 0.2, r * 0.75);
			ctx.lineTo(-r * 0.7, r * 0.5);
			ctx.closePath();
			ctx.fill();
			ctx.fillStyle = COLOR.grid;
			ctx.beginPath();
			ctx.moveTo(-r, -r * 0.3);
			ctx.lineTo(r * 0.7, -r * 0.55);
			ctx.lineTo(r * 0.2, r * 0.15);
			ctx.closePath();
			ctx.fill();
		}
		ctx.restore();
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
		if (body.kind === "wreck")
			drawDerelict(
				ctx,
				body.x,
				body.y,
				body.rotation,
				salvage.time,
				"aperture",
			);
}
