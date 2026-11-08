import { COLOR, FX_INK, type FxPass } from "@void-drift/core";
import { weaponPose } from "./build-renderer";
import { DERELICT_RELEASE_CUE } from "./derelict-geometry";
import {
	drawDerelict,
	drawDerelictEnergy,
	drawDerelictShard,
	stampDerelictRelease,
} from "./derelict-renderer";
import type { SalvageSystem } from "./salvage";
import { ION_CANNON } from "./schemas/salvage";
import type { Simulation } from "./simulation";

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
		if (event.kind === "ion-cannon") continue;
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

// Cached complete blue profiles; clipping never stretches the accepted transparent tip.
const ionStamps = new Map<boolean, HTMLCanvasElement>();
function ionStamp(dispersal: boolean) {
	let stamp = ionStamps.get(dispersal);
	if (stamp) return stamp;
	stamp = document.createElement("canvas");
	stamp.width = 800;
	stamp.height = 24;
	const ctx = stamp.getContext("2d");
	if (!ctx) throw new Error("Ion cannon requires Canvas 2D");
	ctx.scale(4, 4);
	ctx.translate(0, 3);
	const g = ctx.createLinearGradient(0, 0, 200, 0);
	g.addColorStop(0, dispersal ? "#8cddff" : "#eafaff");
	g.addColorStop(0.25, "#8cddff");
	g.addColorStop(0.65, "#29baff");
	g.addColorStop(1, "#29baff00");
	ctx.strokeStyle = g;
	for (const [width, alpha] of [
		[3, 0.09],
		[1.333, 0.24],
		[0.4, dispersal ? 0.65 : 1],
	]) {
		ctx.lineWidth = width;
		ctx.globalAlpha = alpha;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(200, 0);
		ctx.stroke();
	}
	ionStamps.set(dispersal, stamp);
	return stamp;
}
/** Current muzzle presentation is separate from the authoritative discharge hit. */
export function drawIonCannonLight(
	ctx: CanvasRenderingContext2D,
	sim: Simulation,
	dispersal = false,
	pass?: FxPass,
) {
	const salvage = sim.salvage;
	if (!salvage) return;
	for (const weapon of salvage.weapons) {
		if (weapon.kind !== "light-ion-cannon") continue;
		const event = [...salvage.events]
			.reverse()
			.find((e) => e.kind === "ion-cannon" && e.mountKey === weapon.mount.key);
		if (
			event?.kind !== "ion-cannon" ||
			salvage.time - event.time >= ION_CANNON.flashSeconds
		)
			continue;
		const pose = weaponPose(sim.ship, weapon.mount);
		const distance = Math.min(
			event.distance,
			salvage.ionContact(
				pose.muzzleX,
				pose.muzzleY,
				pose.angle,
				sim.star,
				sim.planets,
			).distance,
		);
		if (
			pass &&
			(!pass.visible(pose.muzzleX, pose.muzzleY, 200) ||
				!pass.budget.take(true))
		)
			continue;
		if (!(distance > 0)) continue;
		ctx.save();
		ctx.translate(pose.muzzleX, pose.muzzleY);
		ctx.rotate(pose.angle);
		ctx.globalCompositeOperation = "lighter";
		ctx.globalAlpha = pass?.opacity ?? 1;
		ctx.drawImage(
			ionStamp(dispersal),
			0,
			0,
			distance * 4,
			24,
			0,
			-3,
			distance,
			6,
		);
		ctx.restore();
	}
}
