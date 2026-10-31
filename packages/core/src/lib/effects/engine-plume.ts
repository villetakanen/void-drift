import { z } from "zod";
import type { GameObject } from "../physics/Physics";
import { type PlumeStyle, paintIonBeam } from "./ion-beam";

/** Render-only proportions; emission, output and world-space lifetime stay shared. */
export const PlumeProportionsSchema = z.object({
	length: z.number().positive().max(4).default(1),
	width: z.number().positive().max(4).default(1),
	opacity: z.number().min(0).max(1).default(1),
});
export type PlumeProportions = z.infer<typeof PlumeProportionsSchema>;
const DEFAULT_PROPORTIONS = PlumeProportionsSchema.parse({});

export const ENGINE_CUTOFF = 750;
const LIFETIME = 0.65;
const CAPACITY_PER_ENGINE = 40;
export interface PlumeEmitter {
	style?: PlumeStyle;
	x: number;
	y: number;
	angle: number;
	output: number;
}
type Surface = {
	style: PlumeStyle;
	x: number;
	y: number;
	vx: number;
	vy: number;
	angle: number;
	age: number;
	size: number;
};

/** Alpha plume: complete surfaces, aged by simulation time in world space. */
export class EnginePlume {
	private surfaces: Surface[] = [];
	get count() {
		return this.surfaces.length;
	}
	step(dt: number, ship: GameObject, left: number, right: number) {
		this.stepMounted(
			dt,
			ship,
			[-1, 1].map((side) => ({
				x: -8,
				y: side * 5,
				angle: (-side * Math.PI) / 15,
				output: side === -1 ? left : right,
			})),
		);
	}
	stepMounted(dt: number, ship: GameObject, emitters: readonly PlumeEmitter[]) {
		for (const surface of this.surfaces) {
			surface.age += dt;
			surface.x += surface.vx * dt;
			surface.y += surface.vy * dt;
		}
		this.surfaces = this.surfaces.filter((surface) => surface.age < LIFETIME);
		const cos = Math.cos(ship.rotation),
			sin = Math.sin(ship.rotation);
		for (const emitter of emitters) {
			if (emitter.output <= 0) continue;
			const angle = ship.rotation + emitter.angle;
			this.surfaces.push({
				style: emitter.style ?? "default",
				x: ship.pos.x + emitter.x * cos - emitter.y * sin,
				y: ship.pos.y + emitter.x * sin + emitter.y * cos,
				vx: ship.vel.x * 0.8 - 45 * Math.cos(angle),
				vy: ship.vel.y * 0.8 - 45 * Math.sin(angle),
				angle,
				age: 0,
				size: Math.sqrt(Math.min(1, emitter.output)),
			});
		}
		const CAPACITY = CAPACITY_PER_ENGINE * Math.max(2, emitters.length);
		if (this.surfaces.length > CAPACITY)
			this.surfaces.splice(0, this.surfaces.length - CAPACITY);
	}
	draw(
		ctx: CanvasRenderingContext2D,
		proportions: PlumeProportions = DEFAULT_PROPORTIONS,
		paintSurface?: (
			ctx: CanvasRenderingContext2D,
			size: number,
			age: number,
		) => void,
	) {
		for (const surface of this.surfaces) {
			const age = surface.age / LIFETIME;
			const length = (43 + age * 22) * surface.size * proportions.length;
			ctx.save();
			ctx.translate(surface.x, surface.y);
			ctx.rotate(surface.angle);
			ctx.globalAlpha = 0.26 * (1 - age) ** 2 * proportions.opacity;
			// A study can change the mark, while core owns its position, motion and fade.
			if (paintSurface) {
				paintSurface(ctx, surface.size, age);
				ctx.restore();
				continue;
			}
			if (surface.style !== "default") {
				paintIonBeam(ctx, surface.size, surface.style);
				ctx.restore();
				continue;
			}
			ctx.translate(-length * 0.42, 0);
			ctx.scale(
				length * 0.58,
				(9 + age * 5) * surface.size * proportions.width,
			);
			const gradient = ctx.createRadialGradient(0.3, 0, 0, 0, 0, 1);
			gradient.addColorStop(0, "#eafff9");
			gradient.addColorStop(0.22, "#70ffe2");
			gradient.addColorStop(0.6, "#13aebf88");
			gradient.addColorStop(1, "#1754b000");
			ctx.fillStyle = gradient;
			ctx.shadowColor = "#25e9d2";
			ctx.shadowBlur = 12;
			ctx.beginPath();
			ctx.ellipse(0, 0, 1, 1, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		}
	}
}
