import type { GameObject } from "../physics/Physics";

export const ENGINE_CUTOFF = 750;
const LIFETIME = 0.65;
const CAPACITY = 80;
type Surface = {
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
		for (const surface of this.surfaces) {
			surface.age += dt;
			surface.x += surface.vx * dt;
			surface.y += surface.vy * dt;
		}
		this.surfaces = this.surfaces.filter((surface) => surface.age < LIFETIME);
		for (const side of [-1, 1]) {
			const output = side === -1 ? left : right;
			if (output <= 0) continue;
			const angle = ship.rotation - (side * Math.PI) / 15;
			this.surfaces.push({
				x:
					ship.pos.x -
					8 * Math.cos(ship.rotation) -
					side * 5 * Math.sin(ship.rotation),
				y:
					ship.pos.y -
					8 * Math.sin(ship.rotation) +
					side * 5 * Math.cos(ship.rotation),
				vx: ship.vel.x * 0.8 - 45 * Math.cos(angle),
				vy: ship.vel.y * 0.8 - 45 * Math.sin(angle),
				angle,
				age: 0,
				size: Math.sqrt(Math.min(1, output)),
			});
		}
		if (this.surfaces.length > CAPACITY)
			this.surfaces.splice(0, this.surfaces.length - CAPACITY);
	}
	draw(ctx: CanvasRenderingContext2D) {
		for (const surface of this.surfaces) {
			const age = surface.age / LIFETIME;
			const length = (43 + age * 22) * surface.size;
			ctx.save();
			ctx.translate(surface.x, surface.y);
			ctx.rotate(surface.angle);
			ctx.globalAlpha = 0.26 * (1 - age) ** 2;
			ctx.translate(-length * 0.42, 0);
			ctx.scale(length * 0.58, (9 + age * 5) * surface.size);
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
