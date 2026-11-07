import {
	COLOR,
	drawPlanet,
	drawStar,
	PLANET_TYPES,
	type Planet,
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
		this.star = createStar("G", 0, 0);
		const appearances = Object.values(PLANET_TYPES);
		this.planets = Array.from({ length: 3 }, (_, index) => {
			const type = appearances[Math.floor(random() * appearances.length)];
			// The outer planet opens toward the upper-left of the system.
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
				orbitSpeed: (Math.PI * 2) / (120 + index * 45 + random() * 30),
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

	/** Project orbits along the diagonal from the sun toward the upper-left. */
	layout(width: number, height: number, _cardRight = 0) {
		const x = width * 0.75;
		const y = height * 0.75;
		const bodyScale = Math.max(0.65, Math.min(1.2, width / 1280));
		const star = { x, y, radius: this.star.radius * bodyScale };
		const rotation = Math.atan2(y, x);
		const diagonal = Math.hypot(x, y);
		const planets = this.planets.map((planet, index) => {
			const variation = planet.orbitRadius / [180, 560, 920][index];
			const orbitX = diagonal * [0.22, 0.58, 0.94][index] * variation;
			const orbitY = orbitX;
			const localX = (planet.pos.x / planet.orbitRadius) * orbitX;
			const localY = (planet.pos.y / planet.orbitRadius) * orbitY;
			return {
				planet,
				orbitX,
				orbitY,
				rotation,
				x: x + localX * Math.cos(rotation) - localY * Math.sin(rotation),
				y: y + localX * Math.sin(rotation) + localY * Math.cos(rotation),
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
				body.rotation,
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
