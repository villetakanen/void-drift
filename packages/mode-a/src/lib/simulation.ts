import type { GameObject, InputState } from "@void-drift/core";
import {
	CONFIG,
	ENGINE_CUTOFF,
	EnginePlume,
	GravityFlightSchema,
	getPlanetInfluenceRadius,
	initializePlanets,
	PlanetWellSchema,
	updateHull,
	updatePower,
	updateShip,
	Vec2,
} from "@void-drift/core";
import { applyBuildEngines, buildDrain, solarCharge } from "./build-flight";
import { SHIP_PROFILE_BY_ID } from "./config";
import { createStar } from "./game-loop";
import {
	type FlightSettings,
	FlightSettingsSchema,
	ReplaySchema,
} from "./schemas/flight";
import { createInitialGameState } from "./schemas/game-state";
import { buildStats } from "./schemas/loadout";
import type { ShipProfileId } from "./schemas/ship-profile";

export const STEP = 1 / 60;
export { CHALLENGE } from "../schemas/highscore";
export const GRAVITY_FLIGHT = GravityFlightSchema.parse({
	engineSpeedScale: 600,
	sunMultiplier: 4,
	planetStrength: 600,
});
export const CHALLENGE_SEED = 2026;
export function stockSettings(id: ShipProfileId = "balanced"): FlightSettings {
	return FlightSettingsSchema.parse({
		seed: CHALLENGE_SEED,
		profile: SHIP_PROFILE_BY_ID[id],
		camera: { padding: 160, smoothing: 4, zoomSteps: 5 },
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
	readonly plume = new EnginePlume();
	engineOutput = { left: 0, right: 0 };
	ticks = 0;
	wraps = 0;
	private thrust = { left: false, right: false };
	constructor(settings: unknown = stockSettings()) {
		this.settings = FlightSettingsSchema.parse(settings);
		this.star.mass *= GRAVITY_FLIGHT.sunMultiplier;
		for (const planet of this.planets) {
			planet.well = PlanetWellSchema.parse({
				reach: getPlanetInfluenceRadius(planet),
				strength: GRAVITY_FLIGHT.planetStrength,
			});
		}
		// Seed changes orbit phase, not flight tuning.
		const phase = ((this.settings.seed % 360) / 180) * Math.PI;
		for (const planet of this.planets) {
			planet.orbitAngle += phase;
			planet.pos.set(
				960 + Math.cos(planet.orbitAngle) * planet.orbitRadius,
				540 + Math.sin(planet.orbitAngle) * planet.orbitRadius,
			);
		}
		this.state.sunType = "G";
		if (this.settings.loadout)
			this.state.resources.power = buildStats(this.settings.loadout).capacity;
		if (this.settings.testFlight) {
			this.planets.length = 0;
			this.star.mass *= (12 / this.star.radius) ** 2;
			this.star.radius = 12;
			this.ship.pos.set(820, 540);
		}
	}
	start() {
		this.state.status = "PLAYING";
		this.state.startTime = 0;
	}
	step(input: InputState) {
		if (this.state.status !== "PLAYING") return;
		const beforeX = this.ship.pos.x;
		const beforeY = this.ship.pos.y;
		let delivered = 0;
		let substeps = 0;
		// Four substeps resolve stronger close passes without changing the replay tick rate.
		for (let substep = 0; substep < 4; substep++) {
			if (this.settings.loadout) {
				this.engineOutput = applyBuildEngines(
					this.ship,
					this.settings.loadout,
					input,
					STEP / 4,
					this.state.resources.power > 0,
				);
			}
			delivered += updateShip(
				this.ship,
				this.settings.loadout
					? { leftThruster: false, rightThruster: false, fire: false }
					: input,
				STEP / 4,
				1920,
				1080,
				this.star,
				this.planets,
				this.state.resources,
				undefined,
				this.settings.loadout
					? { ...this.settings.profile, hullMultiplier: 1 }
					: this.settings.profile,
				{ drag: 0, speedLimit: null },
				"inverse-square",
				GRAVITY_FLIGHT.engineSpeedScale,
				ENGINE_CUTOFF,
			);
			substeps++;
			if (
				Math.hypot(this.ship.pos.x - 960, this.ship.pos.y - 540) <
				this.star.radius + this.ship.radius
			)
				break;
		}
		if (!this.settings.loadout) {
			this.engineOutput.left = input.leftThruster ? delivered / substeps : 0;
			this.engineOutput.right = input.rightThruster ? delivered / substeps : 0;
		}
		this.plume.step(
			STEP,
			this.ship,
			this.engineOutput.left,
			this.engineOutput.right,
		);
		if (Math.hypot(this.ship.pos.x - beforeX, this.ship.pos.y - beforeY) > 1200)
			this.wraps++;
		const distance = Math.hypot(this.ship.pos.x - 960, this.ship.pos.y - 540);
		this.thrust.left = input.leftThruster;
		this.thrust.right = input.rightThruster;
		if (this.settings.loadout) {
			const stats = buildStats(this.settings.loadout);
			this.state.resources.power = Math.max(
				0,
				Math.min(
					stats.capacity,
					this.state.resources.power +
						(solarCharge(distance, this.star, stats.coils) -
							buildDrain(this.settings.loadout, input)) *
							STEP,
				),
			);
		} else
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
			this.settings.loadout ? 1 : this.settings.profile.hullMultiplier,
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
		if (cause && !this.settings.testFlight) {
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
