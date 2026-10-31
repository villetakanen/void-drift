import {
	CONFIG,
	type Planet,
	updatePlanetOrbit,
	Vec2,
	wellAcceleration,
} from "@void-drift/core";
import { z } from "astro/zod";

export const planetEncounterSchema = z.object({
	speed: z.number().min(150).max(900),
	aim: z.number().min(-90).max(90),
	reach: z.number().min(160).max(400),
	pull: z.number().min(100).max(2400),
	motion: z.number().min(-120).max(120),
});
export const planetRadius = 20;
export const planetRate = 240;
export const planetDuration = 12;
export function planetEncounter(raw: unknown, moving: boolean) {
	const c = planetEncounterSchema.parse(raw);
	const orbitSpeed = moving ? c.motion / 600 : 0;
	const planet: Planet = {
		pos: new Vec2(0, 0),
		orbitCenter: new Vec2(-600, 0),
		orbitRadius: 600,
		orbitSpeed,
		orbitAngle: 0,
		initialAngle: 0,
		radius: planetRadius,
		mass: 1,
		color: "#8B7355",
		type: "rock",
		hasRing: false,
	};
	const y0 = (c.reach * c.aim) / 100;
	const pos = new Vec2(-Math.sqrt(c.reach ** 2 - y0 ** 2), y0);
	const vel = new Vec2(c.speed, 0);
	const samples: {
		x: number;
		y: number;
		speed: number;
		relativeSpeed: number;
		time: number;
	}[] = [];
	let peak = c.speed;
	let closest = c.reach;
	let outcome = "Still inside after 12 s";
	for (let tick = 0; tick <= planetRate * planetDuration; tick++) {
		const dx = planet.pos.x - pos.x;
		const dy = planet.pos.y - pos.y;
		const distance = Math.hypot(dx, dy);
		const pvx = -Math.sin(planet.orbitAngle) * 600 * orbitSpeed;
		const pvy = Math.cos(planet.orbitAngle) * 600 * orbitSpeed;
		peak = Math.max(peak, vel.mag());
		closest = Math.min(closest, distance);
		samples.push({
			x: -dx,
			y: -dy,
			speed: vel.mag(),
			relativeSpeed: Math.hypot(vel.x - pvx, vel.y - pvy),
			time: tick / planetRate,
		});
		if (distance <= planet.radius + CONFIG.SHIP_RADIUS) {
			outcome = "Planet contact";
			break;
		}
		if (tick > 0 && distance >= c.reach) {
			outcome = "Exited";
			break;
		}
		if (tick === planetRate * planetDuration) break;
		// Same bounded force law as the solar study; independent midpoint pull and reach.
		const acceleration = wellAcceleration(
			distance,
			c.reach,
			c.pull * 2,
			"inverse-square",
		);
		vel.x += ((dx / distance) * acceleration) / planetRate;
		vel.y += ((dy / distance) * acceleration) / planetRate;
		pos.x += vel.x / planetRate;
		pos.y += vel.y / planetRate;
		updatePlanetOrbit(planet, 1 / planetRate);
	}
	return { samples, peak, closest, outcome, end: samples[samples.length - 1] };
}
