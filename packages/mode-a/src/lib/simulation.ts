import type { GameObject, InputState } from "@void-drift/core";
import {
	CONFIG,
	initializePlanets,
	updateHull,
	updatePower,
	updateShip,
	Vec2,
} from "@void-drift/core";
import { SHIP_PROFILE_BY_ID } from "./config";
import { createStar } from "./game-loop";
import {
	type FlightSettings,
	FlightSettingsSchema,
	ReplaySchema,
} from "./schemas/flight";
import { createInitialGameState } from "./schemas/game-state";
import type { ShipProfileId } from "./schemas/ship-profile";

export const STEP = 1 / 60;
export const CHALLENGE = "alpha-1";
export const CHALLENGE_SEED = 2026;
export function stockSettings(id: ShipProfileId = "balanced"): FlightSettings {
	return FlightSettingsSchema.parse({
		seed: CHALLENGE_SEED,
		profile: SHIP_PROFILE_BY_ID[id],
		camera: { padding: 160, smoothing: 4 },
	});
}
export class Simulation {
	readonly settings: FlightSettings;
	readonly ship: GameObject = {
		pos: new Vec2(460, 540),
		vel: new Vec2(0, 0),
		acc: new Vec2(0, 0),
		rotation: -Math.PI / 2,
		radius: CONFIG.SHIP_RADIUS,
	};
	readonly star = createStar("G", 960, 540);
	readonly planets = initializePlanets(960, 540);
	readonly state = createInitialGameState();
	ticks = 0;
	wraps = 0;
	private thrust = { left: false, right: false };
	constructor(settings: unknown = stockSettings()) {
		this.settings = FlightSettingsSchema.parse(settings);
		// The seed changes orbit phase, never gravity or drag.
		const phase = ((this.settings.seed % 360) / 180) * Math.PI;
		for (const planet of this.planets) {
			planet.orbitAngle += phase;
			planet.pos.set(
				960 + Math.cos(planet.orbitAngle) * planet.orbitRadius,
				540 + Math.sin(planet.orbitAngle) * planet.orbitRadius,
			);
		}
		this.state.sunType = "G";
	}
	start() {
		this.state.status = "PLAYING";
		this.state.startTime = 0;
	}
	step(input: InputState) {
		if (this.state.status !== "PLAYING") return;
		const beforeX = this.ship.pos.x;
		const beforeY = this.ship.pos.y;
		updateShip(
			this.ship,
			input,
			STEP,
			1920,
			1080,
			this.star,
			this.planets,
			this.state.resources,
			undefined,
			this.settings.profile,
		);
		if (Math.hypot(this.ship.pos.x - beforeX, this.ship.pos.y - beforeY) > 1200)
			this.wraps++;
		const distance = Math.hypot(this.ship.pos.x - 960, this.ship.pos.y - 540);
		this.thrust.left = input.leftThruster;
		this.thrust.right = input.rightThruster;
		updatePower(
			this.state.resources,
			distance,
			this.star,
			STEP,
			this.thrust,
			this.settings.profile.powerDrainMultiplier,
		);
		updateHull(
			this.state.resources,
			distance,
			this.star,
			STEP,
			this.settings.profile.hullMultiplier,
		);
		this.ticks++;
		this.state.elapsedTime = this.ticks * STEP;
		const cause =
			distance < this.star.radius + this.ship.radius
				? "STAR"
				: this.state.resources.hull <= 0
					? "HULL"
					: this.state.resources.power <= 0
						? "POWER"
						: null;
		if (cause) {
			this.state.status = "GAME_OVER";
			this.state.deathCause = cause;
		}
	}
	replay(data: unknown) {
		const inputs = ReplaySchema.parse(data);
		for (const input of inputs)
			for (let tick = 0; tick < input.ticks; tick++) this.step(input);
	}
}
