import { FX_INK, FxPass, type GameObject, paintArc } from "@void-drift/core";
import {
	BUILD_FLIGHT_SCALE,
	type BuildMount,
	buildMounts,
} from "./build-renderer";
import type { Loadout } from "./schemas/loadout";
import type { Simulation } from "./simulation";

// Parsed loadouts are stable during a run. Mount geometry is shared with drawing.
const coilMounts = new WeakMap<Loadout, readonly BuildMount[]>();
function collectors(loadout: Loadout) {
	let mounts = coilMounts.get(loadout);
	if (!mounts) {
		mounts = buildMounts(loadout).filter((m) => m.part === "gravity-coil");
		coilMounts.set(loadout, mounts);
	}
	return mounts;
}

/** Phase waves need no particle simulation, gradients, blur or history canvas. */
export function drawGravityFold(
	ctx: CanvasRenderingContext2D,
	loadout: Loadout,
	ship: GameObject,
	time: number,
	opacity: number,
	direction: number,
	pass?: FxPass,
) {
	if (!(opacity > 0)) return;
	const cos = Math.cos(ship.rotation),
		sin = Math.sin(ship.rotation);
	let index = 0;
	for (const mount of collectors(loadout)) {
		const x = ship.pos.x + (mount.x * cos - mount.y * sin) * BUILD_FLIGHT_SCALE;
		const y = ship.pos.y + (mount.x * sin + mount.y * cos) * BUILD_FLIGHT_SCALE;
		if (pass && (!pass.visible(x, y, 48) || !pass.budget.take(true))) continue;
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(direction);
		ctx.strokeStyle = FX_INK.gravity;
		ctx.lineWidth = 1;
		ctx.globalAlpha = opacity;
		paintArc(ctx, 5, 0);
		for (let wave = 0; wave < 4; wave++) {
			if (pass && !pass.budget.take()) break;
			const phase = (time * 1.25 + wave / 4 + index * 0.19) % 1;
			ctx.save();
			ctx.translate(phase * 14, 0);
			ctx.globalAlpha = opacity * (1 - phase) * 0.8;
			paintArc(ctx, 6 + phase * 24, Math.sin(time * 3 + wave) * 0.16);
			ctx.restore();
		}
		ctx.restore();
		index++;
	}
}

/** Same final pass in play, Lab and multi-ship diagnostic scenes. */
export class FlightFx {
	readonly pass = new FxPass();
	begin(ctx: CanvasRenderingContext2D, additive = true) {
		this.pass.begin(ctx, additive);
	}
	drawShip(ctx: CanvasRenderingContext2D, sim: Simulation, fold = true) {
		sim.plume.draw(ctx, undefined, undefined, this.pass);
		if (fold && sim.settings.loadout)
			drawGravityFold(
				ctx,
				sim.settings.loadout,
				sim.ship,
				sim.ticks / 60,
				sim.gravityFoldOpacity,
				sim.gravityFoldDirection,
				this.pass,
			);
	}
	end(ctx: CanvasRenderingContext2D) {
		this.pass.end(ctx);
	}
	draw(
		ctx: CanvasRenderingContext2D,
		sim: Simulation,
		fold = true,
		additive = true,
	) {
		this.begin(ctx, additive);
		try {
			this.drawShip(ctx, sim, fold);
		} finally {
			this.end(ctx);
		}
	}
}
