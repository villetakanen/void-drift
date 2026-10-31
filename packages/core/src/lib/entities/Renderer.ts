import { drawPlanet } from "../assets/planet";
import { drawShip } from "../assets/ship";
import { drawStar } from "../assets/star";
import { SURVIVAL_CONFIG } from "../config";
import {
	type DamageFlash,
	renderDamageFlash,
} from "../effects/damage-feedback";
import { getParticleAlpha, type Particle } from "../effects/particles";
import type { Camera } from "../physics/Camera";
import type { GameObject, Planet, Star } from "../physics/Physics";
import { getPlanetInfluenceRadius } from "../physics/Physics";

export class Renderer {
	private ctx: CanvasRenderingContext2D;
	private width = 0;
	private height = 0;

	private stars: Array<{ x: number; y: number; size: number; alpha: number }> =
		[];

	constructor(canvas: HTMLCanvasElement) {
		let seed = 2026;
		const random = () => {
			seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
			return seed / 4294967296;
		};
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Could not get 2D context");
		this.ctx = ctx;
		this.resize(canvas.width, canvas.height);

		// Generate static background stars
		for (let i = 0; i < 200; i++) {
			this.stars.push({
				x: (random() - 0.5) * 3000 + 1920 / 2,
				y: (random() - 0.5) * 3000 + 1080 / 2,
				size: random() * 2 + 0.5,
				alpha: random() * 0.5 + 0.1,
			});
		}
	}

	resize(w: number, h: number) {
		this.width = w;
		this.height = h;
		this.ctx.canvas.width = w;
		this.ctx.canvas.height = h;
	}

	clear() {
		this.ctx.fillStyle = "#050510"; // --color-void
		this.ctx.fillRect(0, 0, this.width, this.height);
	}

	drawBackground() {
		this.ctx.fillStyle = "#ffffff";
		for (const star of this.stars) {
			this.ctx.globalAlpha = star.alpha;
			this.ctx.beginPath();
			this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
			this.ctx.fill();
		}
		this.ctx.globalAlpha = 1.0;
	}

	drawArenaBoundary(radius: number) {
		const cx = 960;
		const cy = 540;
		this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
		this.ctx.lineWidth = 2;
		this.ctx.beginPath();
		this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
		this.ctx.stroke();
	}

	beginCamera(camera: Camera) {
		this.ctx.save();
		camera.applyTransform(this.ctx);
	}
	endCamera() {
		this.ctx.restore();
	}

	private renderWrapped(
		_x: number,
		_y: number,
		_radius: number,
		draw: (offX: number, offY: number) => void,
	) {
		draw(0, 0);
	}

	drawShip(
		ship: GameObject,
		tint?: string,
		variant: "scout" | "balanced" | "tank" = "balanced",
	) {
		this.renderWrapped(ship.pos.x, ship.pos.y, ship.radius, (offX, offY) => {
			drawShip(this.ctx, {
				x: ship.pos.x + offX,
				y: ship.pos.y + offY,
				rotation: ship.rotation,
				color: tint ?? "#00ffcc",
				variant,
			});
		});
	}

	drawStar(star: Star, time: number) {
		this.renderWrapped(
			star.pos.x,
			star.pos.y,
			star.radius * 4,
			(offX, offY) => {
				drawStar(this.ctx, {
					x: star.pos.x + offX,
					y: star.pos.y + offY,
					radius: star.radius,
					color: star.color,
					glowColor: star.glowColor,
					time: time,
					pulseSpeed: star.pulseSpeed,
					powerZoneRadius: SURVIVAL_CONFIG.POWER_ZONE_3_RADIUS,
				});
			},
		);
	}

	drawPlanet(planet: Planet) {
		// Draw Orbit Path (Faint)
		this.ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
		this.ctx.lineWidth = 1;
		this.ctx.beginPath();
		this.ctx.arc(
			planet.orbitCenter.x,
			planet.orbitCenter.y,
			planet.orbitRadius,
			0,
			Math.PI * 2,
		);
		this.ctx.stroke();

		this.renderWrapped(
			planet.pos.x,
			planet.pos.y,
			planet.radius,
			(offX, offY) => {
				drawPlanet(this.ctx, {
					x: planet.pos.x + offX,
					y: planet.pos.y + offY,
					radius: planet.radius,
					color: planet.color,
					hasRing: planet.hasRing,
				});
			},
		);

		const gravityRadius = getPlanetInfluenceRadius(planet);
		this.ctx.strokeStyle = "rgba(120, 220, 255, 0.2)";
		this.ctx.lineWidth = 1;
		this.ctx.setLineDash([6, 6]);
		this.ctx.beginPath();
		this.ctx.arc(planet.pos.x, planet.pos.y, gravityRadius, 0, Math.PI * 2);
		this.ctx.stroke();
		this.ctx.setLineDash([]);
	}

	drawDamageFlash(flash: DamageFlash) {
		renderDamageFlash(this.ctx, flash, this.width, this.height);
	}

	drawParticles(particles: Particle[]) {
		this.ctx.save();
		for (const p of particles) {
			this.renderWrapped(p.x, p.y, p.size, (offX, offY) => {
				this.ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${getParticleAlpha(p.life)})`;
				this.ctx.beginPath();
				this.ctx.arc(p.x + offX, p.y + offY, p.size, 0, Math.PI * 2);
				this.ctx.fill();
			});
		}
		this.ctx.restore();
	}
}
