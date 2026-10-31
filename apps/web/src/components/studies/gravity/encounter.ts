import {
	CONFIG,
	FlightResistanceSchema,
	type GameObject,
	updateHull,
	updateShip,
	Vec2,
	WellCurveSchema,
} from "@void-drift/core";
import { createStar } from "@void-drift/mode-a";
import { z } from "astro/zod";

export const encounterSchema = z.object({
	speed: z.number().min(150).max(900),
	aim: z.number().min(0).max(300),
	legacy: z.boolean().default(false),
	curve: WellCurveSchema.default("linear"),
	strengthMultiplier: z.number().min(0.25).max(8).default(1),
});
export const star = createStar("G", 600, 600);
export const duration = 12;
export const rate = 60;
export interface Sample {
	x: number;
	y: number;
	speed: number;
	hull: number;
	time: number;
}
export function encounter(raw: unknown, gravity: boolean) {
	const config = encounterSchema.parse(raw);
	const encounterStar = {
		...star,
		mass: star.mass * config.strengthMultiplier,
	};
	const resistance = FlightResistanceSchema.parse({
		drag: config.legacy ? CONFIG.SHIP_DRAG : 0,
		speedLimit: config.legacy ? CONFIG.MAX_SPEED : null,
	});
	const ship: GameObject = {
		pos: new Vec2(
			600 - Math.sqrt(star.influenceRadius ** 2 - config.aim ** 2),
			600 + config.aim,
		),
		vel: new Vec2(config.speed, 0),
		acc: new Vec2(0, 0),
		rotation: 0,
		radius: CONFIG.SHIP_RADIUS,
	};
	const resources = { hull: 100, power: 100 };
	const samples: Sample[] = [];
	let closest = star.influenceRadius;
	let peak = config.speed;
	let outcome = "Still inside after 12 s";
	for (let tick = 0; tick <= duration * rate; tick++) {
		const distance = Math.hypot(ship.pos.x - 600, ship.pos.y - 600);
		const speed = ship.vel.mag();
		closest = Math.min(closest, distance);
		peak = Math.max(peak, speed);
		samples.push({
			x: ship.pos.x - 600,
			y: ship.pos.y - 600,
			speed,
			hull: resources.hull,
			time: tick / rate,
		});
		if (gravity && resources.hull <= 0) {
			outcome = distance < star.radius ? "Sun contact" : "Hull lost to heat";
			break;
		}
		if (tick > 0 && distance >= star.influenceRadius) {
			outcome = "Exited";
			break;
		}
		if (tick === duration * rate) break;
		updateShip(
			ship,
			{ leftThruster: false, rightThruster: false, fire: false },
			1 / rate,
			1200,
			1200,
			gravity ? encounterStar : undefined,
			[],
			undefined,
			undefined,
			undefined,
			resistance,
			config.curve,
		);
		if (gravity)
			updateHull(
				resources,
				Math.hypot(ship.pos.x - 600, ship.pos.y - 600),
				star,
				1 / rate,
			);
	}
	return { samples, closest, peak, outcome, end: samples[samples.length - 1] };
}
