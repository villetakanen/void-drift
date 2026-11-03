import {
	COLOR,
	drawPlanet,
	drawStar,
	PLANET_TYPES,
	type Planet,
	SunTypeSchema,
	updatePlanetOrbit,
	Vec2,
} from "@void-drift/core";
import { createStar } from "./game-loop";

/** Cosmetic state only: never supplied to the survival simulation. */
export class LandingSystem {
	readonly star;
	readonly planets: Planet[];
	time = 0;

	constructor(random: () => number = Math.random) {
		const types = SunTypeSchema.options;
		this.star = createStar(types[Math.floor(random() * types.length)], 0, 0);
		const appearances = Object.values(PLANET_TYPES);
		this.planets = Array.from({ length: 3 }, (_, index) => {
			const type = appearances[Math.floor(random() * appearances.length)];
			// The outer planet opens in the left-hand space, not behind the launcher.
			const angle =
				index === 2
					? Math.PI + (random() - 0.5) * 0.18
					: random() * Math.PI * 2;
			const orbitRadius = [180, 560, 920][index] + random() * 25;
			return {
				pos: new Vec2(
					Math.cos(angle) * orbitRadius,
					Math.sin(angle) * orbitRadius,
				),
				orbitCenter: new Vec2(0, 0),
				orbitRadius,
				orbitSpeed: (Math.PI * 2) / (20 + index * 8 + random() * 9),
				orbitAngle: angle,
				initialAngle: angle,
				radius: [30, 44, 36][index] + random() * 8,
				mass: 0,
				color: type.color,
				type: type.id,
				hasRing: false,
			};
		});
	}

	step(dt: number) {
		this.time += dt;
		for (const planet of this.planets) updatePlanetOrbit(planet, dt);
	}

	/** Project the shared orbital motion into a wide, tilted presentation plane.
	 * Body sizes are independent of orbit framing, so wide orbits stay readable.
	 */
	layout(width: number, height: number, cardRight: number) {
		const space = Math.max(0, width - cardRight);
		const cardLeft = Math.max(0, width - cardRight);
		const x = cardRight + space / 2;
		const y = height / 2;
		const bodyScale = Math.max(0.65, Math.min(1.2, width / 1280));
		const star = {
			x,
			y,
			radius: Math.min(
				Math.max(18, this.star.radius * bodyScale),
				Math.max(8, space * 0.3),
			),
		};
		const spans = [
			Math.max(
				space * 0.36,
				star.radius + this.planets[0].radius * bodyScale + 16,
			),
			x - cardLeft * 0.65,
			x - cardLeft * 0.35,
		];
		const planets = this.planets.map((planet, index) => {
			const variation = planet.orbitRadius / [180, 560, 920][index];
			const orbitX = spans[index] * variation;
			const orbitY =
				index === 0
					? orbitX
					: Math.min(orbitX, height * [0.28, 0.36, 0.43][index]);
			return {
				planet,
				orbitX,
				orbitY,
				x: x + (planet.pos.x / planet.orbitRadius) * orbitX,
				y: y + (planet.pos.y / planet.orbitRadius) * orbitY,
				radius: planet.radius * bodyScale,
			};
		});
		return { star, planets };
	}

	/** CSS-pixel composition; the caller supplies the canvas pixel transform. */
	draw(
		context: CanvasRenderingContext2D,
		width: number,
		height: number,
		cardRight: number,
	) {
		const frame = this.layout(width, height, cardRight);
		context.save();
		drawStar(context, { ...this.star, ...frame.star, time: this.time * 1000 });
		for (const body of frame.planets) {
			context.strokeStyle = COLOR.borderFaint;
			context.lineWidth = 1;
			context.beginPath();
			context.ellipse(
				frame.star.x,
				frame.star.y,
				body.orbitX,
				body.orbitY,
				0,
				0,
				Math.PI * 2,
			);
			context.stroke();
			drawPlanet(context, {
				...body.planet,
				x: body.x,
				y: body.y,
				radius: body.radius,
			});
		}
		context.restore();
	}
}
