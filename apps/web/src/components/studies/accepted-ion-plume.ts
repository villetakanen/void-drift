/** Study-only history preserved from 7e15fc9 for the 02.3/02.4 comparisons.
 * Production history lives in FxSurface. */

import {
	FxPass,
	type GameObject,
	type PlumeProportions,
	PlumeProportionsSchema,
	type PlumeStyle,
} from "@void-drift/core";

export { PlumeProportionsSchema };

const DEFAULT_PROPORTIONS = PlumeProportionsSchema.parse({});
export const ENGINE_CUTOFF = 750;
const LIFETIME = 0.65;
const MAX_EMITTERS = 8;
const CAPACITY = 40 * MAX_EMITTERS;
export interface PlumeEmitter {
	style?: PlumeStyle;
	x: number;
	y: number;
	angle: number;
	output: number;
}
export interface PlumeMark {
	style: PlumeStyle;
	x: number;
	y: number;
	vx: number;
	vy: number;
	angle: number;
	age: number;
	size: number;
}
const emptyMark = (): PlumeMark => ({
	style: "default",
	x: 0,
	y: 0,
	vx: 0,
	vy: 0,
	angle: 0,
	age: 0,
	size: 0,
});

/** Fixed storage, game-time lifetime, attached activation and detached world trails. */
export class EnginePlume {
	private readonly surfaces = Array.from({ length: CAPACITY }, emptyMark);
	private readonly outlets = Array.from({ length: MAX_EMITTERS }, emptyMark);
	private used = 0;
	private active = 0;
	private readonly pass = new FxPass();
	private readonly legacy: PlumeEmitter[] = [-1, 1].map((side) => ({
		x: -8,
		y: side * 5,
		angle: (-side * Math.PI) / 15,
		output: 0,
	}));
	get count() {
		return this.used;
	}
	get activeCount() {
		return this.active;
	}
	clear() {
		this.used = 0;
		this.active = 0;
	}
	/** Read-only inspection of lifecycle/coordinates; rendering recipes stay private. */
	inspect(visit: (mark: Readonly<PlumeMark>) => void) {
		for (let i = 0; i < this.used; i++) visit(this.surfaces[i]);
	}
	step(dt: number, ship: GameObject, left: number, right: number) {
		this.legacy[0].output = left;
		this.legacy[1].output = right;
		this.stepMounted(dt, ship, this.legacy);
	}
	stepMounted(dt: number, ship: GameObject, emitters: readonly PlumeEmitter[]) {
		if (!(dt > 0) || !Number.isFinite(dt)) return;
		for (let i = this.used - 1; i >= 0; i--) {
			const mark = this.surfaces[i];
			mark.age += dt;
			if (mark.age >= LIFETIME) {
				this.surfaces[i] = this.surfaces[--this.used];
				this.surfaces[this.used] = mark;
			} else {
				mark.x += mark.vx * dt;
				mark.y += mark.vy * dt;
			}
		}
		const cos = Math.cos(ship.rotation),
			sin = Math.sin(ship.rotation);
		this.active = 0;
		for (let i = 0; i < Math.min(MAX_EMITTERS, emitters.length); i++) {
			const emitter = emitters[i];
			if (!(emitter.output > 0) || !Number.isFinite(emitter.output)) continue;
			const outlet = this.outlets[this.active++];
			outlet.style = emitter.style ?? "default";
			outlet.x = ship.pos.x + emitter.x * cos - emitter.y * sin;
			outlet.y = ship.pos.y + emitter.x * sin + emitter.y * cos;
			outlet.angle = ship.rotation + emitter.angle;
			outlet.size = Math.sqrt(Math.min(1, emitter.output));
			if (this.used >= CAPACITY) continue;
			const mark = this.surfaces[this.used++];
			mark.style = outlet.style;
			mark.x = outlet.x;
			mark.y = outlet.y;
			mark.angle = outlet.angle;
			mark.size = outlet.size;
			mark.age = 0;
			mark.vx = ship.vel.x * 0.8 - 45 * Math.cos(outlet.angle);
			mark.vy = ship.vel.y * 0.8 - 45 * Math.sin(outlet.angle);
		}
	}
	draw(
		ctx: CanvasRenderingContext2D,
		proportions: PlumeProportions = DEFAULT_PROPORTIONS,
		paintSurface?: (
			ctx: CanvasRenderingContext2D,
			size: number,
			age: number,
		) => void,
		scene?: FxPass,
	) {
		const pass = scene ?? this.pass;
		const radius = 60 * Math.max(proportions.length, proportions.width);
		if (!scene) pass.begin(ctx, !paintSurface);
		try {
			// Reserve activation independently of decorative capacity across the scene.
			if (!paintSurface)
				for (let i = 0; i < this.active; i++) {
					const mark = this.outlets[i];
					if (!pass.visible(mark.x, mark.y, radius) || !pass.budget.take(true))
						continue;
					ctx.save();
					ctx.translate(mark.x, mark.y);
					ctx.rotate(mark.angle);
					ctx.scale(proportions.length, proportions.width);
					ctx.globalAlpha = 0.9 * proportions.opacity;
					paintBeam(ctx, mark.size, mark.style);
					ctx.restore();
				}
			for (let i = 0; i < this.used; i++) {
				const mark = this.surfaces[i];
				if (!pass.visible(mark.x, mark.y, radius) || !pass.budget.take())
					continue;
				const age = mark.age / LIFETIME;
				ctx.save();
				ctx.translate(mark.x, mark.y);
				ctx.rotate(mark.angle);
				ctx.globalAlpha =
					(paintSurface ? 0.26 : 0.18) * (1 - age) ** 2 * proportions.opacity;
				if (paintSurface) paintSurface(ctx, mark.size, age);
				else {
					ctx.scale(proportions.length, proportions.width);
					paintBeam(ctx, mark.size * (0.25 + age * 0.35), mark.style);
				}
				ctx.restore();
			}
		} finally {
			if (!scene) pass.end(ctx);
		}
	}
}

/** Preserve the former fallback painter too; custom accepted painters stay in the views. */
function paintBeam(
	ctx: CanvasRenderingContext2D,
	size: number,
	style: PlumeStyle,
) {
	const heavy = style === "ion-heavy",
		length = (heavy ? 42 : 30) * size;
	ctx.strokeStyle =
		style === "default" ? "#ffb340" : heavy ? "#70e2ff" : "#70ffe2";
	ctx.lineWidth = heavy ? 2.4 : 1.6;
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(-length, 0);
	ctx.stroke();
	ctx.strokeStyle = "#eafff9";
	ctx.lineWidth = 0.65;
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(-length * 0.75, 0);
	ctx.stroke();
}
