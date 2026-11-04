import type { GameObject, Planet, Star } from "@void-drift/core";
import {
	CONFIG,
	ENGINE_CUTOFF,
	EnginePlume,
	GravityFlightSchema,
	getPlanetInfluenceRadius,
	initializePlanets,
	PlanetWellSchema,
	planetPull,
	starPull,
	updateHull,
	updatePower,
	updateShip,
	Vec2,
	wellAcceleration,
} from "@void-drift/core";
import { z } from "zod";
import { applyBuildEngines, buildDrain, solarCharge } from "./build-flight";
import { buildCollisionRadius, buildPlumeEmitters } from "./build-renderer";
import { SHIP_PROFILE_BY_ID } from "./config";
import { createStar } from "./game-loop";
import {
	GRAVITY_COLLECTION,
	gravityCollectionRate,
	gravitySource,
} from "./gravity-collection";
import { type FlightTickInput, SalvageSystem } from "./salvage";
import {
	type FlightSettings,
	FlightSettingsSchema,
	ReplaySchema,
} from "./schemas/flight";
import { createInitialGameState } from "./schemas/game-state";
import {
	type GravityField,
	GravityFieldSchema,
	type GravityTuning,
	GravityTuningSchema,
	type LabWell,
} from "./schemas/gravity";
import {
	buildStats,
	defaultLoadout,
	PARTS,
	starterLoadout,
} from "./schemas/loadout";
import type { ShipProfileId } from "./schemas/ship-profile";
import { GRAVITY_TUNING } from "./tuning";

export const STEP = 1 / 60;
export { CHALLENGE } from "../schemas/highscore";
export const GRAVITY_FLIGHT = GravityFlightSchema.parse({
	engineSpeedScale: 600,
	sunMultiplier: GRAVITY_TUNING.sunMultiplier,
	planetStrength: GRAVITY_TUNING.planetStrength,
});
/** A planet's well under the gravity tuning, from its size and mass. */
export function tunedWell(
	planet: Planet,
	tuning: GravityTuning = GRAVITY_TUNING,
) {
	return PlanetWellSchema.parse({
		reach: getPlanetInfluenceRadius(
			{ radius: planet.radius, mass: planet.mass },
			tuning.planetReach,
		),
		strength: tuning.planetStrength,
		curve: tuning.curve,
	});
}
/** Applies the gravity tuning to freshly created bodies. */
export function applyGravityTuning(
	star: Star,
	planets: Planet[],
	tuning: GravityTuning = GRAVITY_TUNING,
) {
	star.mass *= tuning.sunMultiplier;
	star.influenceRadius = star.radius * tuning.sunReachFactor;
	for (const planet of planets) planet.well = tunedWell(planet, tuning);
}
/**
 * Options beyond flight settings. `field` sets Lab flight conditions; the Lab
 * usability plan adds a per-chassis tuning patch beside it.
 */
export const SimulationOptionsSchema = z
	.object({ field: GravityFieldSchema.optional() })
	.strict();
export type SimulationOptions = z.input<typeof SimulationOptionsSchema>;
/** Summed pull of Lab wells at a point; like a planet's, each stops at contact distance. */
export function labWellPull(
	wells: readonly LabWell[],
	at: { x: number; y: number },
	contactRadius: number,
) {
	const pull = { x: 0, y: 0 };
	for (const well of wells) {
		const dx = well.x - at.x;
		const dy = well.y - at.y;
		const distance = Math.hypot(dx, dy);
		if (distance <= contactRadius) continue;
		const strength = wellAcceleration(
			distance,
			well.reach,
			well.strength,
			well.curve,
		);
		pull.x += (dx / distance) * strength;
		pull.y += (dy / distance) * strength;
	}
	return pull;
}
export const CHALLENGE_SEED = 2026;
export function stockSettings(id: ShipProfileId = "fighter"): FlightSettings {
	return FlightSettingsSchema.parse({
		seed: CHALLENGE_SEED,
		profile: SHIP_PROFILE_BY_ID[id],
		camera: { padding: 160, smoothing: 4, zoomSteps: 5 },
	});
}
export function gameSettings(id: ShipProfileId = "fighter"): FlightSettings {
	return FlightSettingsSchema.parse({
		...stockSettings(id),
		loadout: starterLoadout(id),
	});
}
export function labSettings(id: ShipProfileId = "fighter"): FlightSettings {
	return FlightSettingsSchema.parse({
		...stockSettings(id),
		loadout: defaultLoadout(id),
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
	readonly gravity: GravityTuning;
	readonly field?: GravityField;
	/** False in a field with system "empty": no sun pull, light, heat or contact. */
	readonly hasSun: boolean;
	readonly salvage?: SalvageSystem;
	gravityCollectionRate = 0;
	gravityFoldOpacity = 0;
	gravityFoldDirection = 0;
	engineOutput = {
		left: 0,
		right: 0,
		aft: [] as number[],
		stabilizers: [0, 0],
	};
	readonly angularMotion = { velocity: 0 };
	private readonly buildEmitters;
	private readonly engineTimers: Record<string, number> = {};
	ticks = 0;
	wraps = 0;
	/** Planet contacts so far (one per contact substep). */
	contacts = 0;
	private thrust = { left: false, right: false };
	constructor(settings: unknown = stockSettings(), options: unknown = {}) {
		this.settings = FlightSettingsSchema.parse(settings);
		const { field } = SimulationOptionsSchema.parse(options);
		if (field && this.settings.testFlight)
			throw new Error("A field cannot be combined with a test flight");
		this.field = field;
		this.hasSun = field?.system !== "empty";
		this.gravity = GravityTuningSchema.parse({
			...GRAVITY_TUNING,
			...field?.changes,
		});
		this.buildEmitters = this.settings.loadout
			? buildPlumeEmitters(this.settings.loadout)
			: [];
		if (this.settings.loadout)
			this.ship.radius = buildCollisionRadius(this.settings.loadout);
		applyGravityTuning(this.star, this.planets, this.gravity);
		// Seed changes orbit phase, not flight tuning.
		const phase = ((this.settings.seed % 360) / 180) * Math.PI;
		for (const planet of this.planets) {
			planet.orbitAngle += phase;
			planet.pos.set(
				960 + Math.cos(planet.orbitAngle) * planet.orbitRadius,
				540 + Math.sin(planet.orbitAngle) * planet.orbitRadius,
			);
		}
		if (field) this.applyField(field);
		this.state.sunType = "G";
		if (this.settings.loadout)
			this.state.resources.power = buildStats(this.settings.loadout).capacity;
		if (this.settings.testFlight) {
			this.planets.length = 0;
			this.star.mass *= (12 / this.star.radius) ** 2;
			this.star.radius = 12;
			// Give fitting trials a quiet opening pass; flying into the well remains real.
			this.ship.pos.set(
				this.star.pos.x - this.star.influenceRadius - 85,
				this.star.pos.y,
			);
			if (this.settings.loadout)
				this.salvage = new SalvageSystem(
					this.settings.loadout,
					this.settings.seed,
					this.settings.ion,
				);
		}
	}
	private applyField(field: GravityField) {
		if (field.system === "empty") this.planets.length = 0;
		if (field.orbits === "frozen")
			for (const planet of this.planets) planet.orbitSpeed = 0;
		const start = field.start;
		if (!start) return;
		const heading = (start.heading * Math.PI) / 180;
		this.ship.pos.set(start.x, start.y);
		this.ship.rotation = heading;
		this.ship.vel.set(
			Math.cos(heading) * start.speed,
			Math.sin(heading) * start.speed,
		);
		const inside = (x: number, y: number, radius: number) =>
			Math.hypot(start.x - x, start.y - y) <= radius + this.ship.radius;
		if (
			this.hasSun &&
			inside(this.star.pos.x, this.star.pos.y, this.star.radius)
		)
			throw new Error("start is inside the sun");
		for (const planet of this.planets)
			if (inside(planet.pos.x, planet.pos.y, planet.radius))
				throw new Error("start is inside a planet");
	}
	private pullLabWells() {
		const pull = labWellPull(
			this.field?.wells ?? [],
			this.ship.pos,
			this.ship.radius,
		);
		this.ship.acc.x += pull.x;
		this.ship.acc.y += pull.y;
	}
	/** Distance from the arena centre, where play's sun sits; infinite without a sun, so no heat or contact. */
	/** Summed gravity acceleration at a point (default: the ship) from every body and Lab well. */
	gravityAt(at: { x: number; y: number } = this.ship.pos) {
		const pull = labWellPull(this.field?.wells ?? [], at, this.ship.radius);
		if (this.hasSun) {
			const sun = starPull(at, this.star, this.gravity.curve);
			pull.x += sun.x;
			pull.y += sun.y;
		}
		for (const planet of this.planets) {
			const planetGravity = planetPull(at, this.ship.radius, planet);
			pull.x += planetGravity.x;
			pull.y += planetGravity.y;
		}
		return pull;
	}
	private sunDistance() {
		return this.hasSun
			? Math.hypot(this.ship.pos.x - 960, this.ship.pos.y - 540)
			: Infinity;
	}
	get engineFeedback() {
		const build = this.settings.loadout;
		if (!build) return "";
		return Object.entries(this.engineTimers)
			.filter(([, time]) => time > 0)
			.map(([key, time]) => {
				const id = key.startsWith("aft-")
					? build.aft[Number(key.slice(4))]
					: build.side;
				if (!id) return "";
				const part = PARTS[id];
				if (part.response === "delayed" && time < part.chargeSeconds)
					return `${key}: charging ${Math.floor((time / part.chargeSeconds) * 100)}%`;
				if (part.response === "pulse")
					return `${key}: ${time % part.pulsePeriod < part.pulseOn ? "pulse" : "recovering"}`;
				return `${key}: firing`;
			})
			.filter(Boolean)
			.join(" · ");
	}
	start() {
		this.state.status = "PLAYING";
		this.state.startTime = 0;
	}
	step(input: FlightTickInput) {
		if (this.state.status !== "PLAYING") return;
		this.salvage?.beginTick(input.sendDerelict ?? false, this.ship, this.star);
		const beforeX = this.ship.pos.x;
		const beforeY = this.ship.pos.y;
		let delivered = 0;
		let collected = 0;
		let substeps = 0;
		// Four substeps resolve stronger close passes without changing the replay tick rate.
		for (let substep = 0; substep < 4; substep++) {
			const previousX = this.ship.pos.x,
				previousY = this.ship.pos.y;
			let engineFraction = 1;
			if (this.settings.loadout) {
				const stats = buildStats(this.settings.loadout);
				// Solar supply measures from the sun's position; heat and contact from the arena centre.
				const distance = this.hasSun
					? Math.hypot(
							this.ship.pos.x - this.star.pos.x,
							this.ship.pos.y - this.star.pos.y,
						)
					: Infinity;
				const supplied =
					this.state.resources.power +
					(solarCharge(distance, this.star, stats.coils) - 3) * (STEP / 4);
				const source = gravitySource(this.ship, this.planets);
				const amount = source
					? Math.max(
							0,
							Math.min(
								stats.capacity - supplied,
								(gravityCollectionRate(this.settings.loadout) * STEP) / 4,
							),
						)
					: 0;
				collected += amount;
				if (source && amount > 0)
					this.gravityFoldDirection = Math.atan2(
						this.ship.pos.y - source.pos.y,
						this.ship.pos.x - source.pos.x,
					);
				const available = Math.max(
					0,
					Math.min(stats.capacity, supplied + amount),
				);
				const requested =
					(buildDrain(
						this.settings.loadout,
						input,
						this.angularMotion.velocity,
						STEP / 4,
						this.settings.ion,
					) -
						3) *
					(STEP / 4);
				const spent = Math.min(available, requested);
				engineFraction = requested > 0 ? spent / requested : 0;
				this.state.resources.power = available - spent;
			}

			if (this.settings.loadout) {
				this.engineOutput = applyBuildEngines(
					this.ship,
					this.settings.loadout,
					input,
					STEP / 4,
					engineFraction > 0,
					this.engineTimers,
					engineFraction,
					this.angularMotion,
					this.settings.ion,
				);
			}
			this.pullLabWells();
			delivered += updateShip(
				this.ship,
				this.settings.loadout
					? { leftThruster: false, rightThruster: false, fire: false }
					: input,
				STEP / 4,
				1920,
				1080,
				this.hasSun ? this.star : undefined,
				this.planets,
				this.state.resources,
				() => {
					this.contacts++;
				},
				this.settings.loadout
					? { ...this.settings.profile, hullMultiplier: 1 }
					: this.settings.profile,
				{ drag: 0, speedLimit: null },
				this.gravity.curve,
				GRAVITY_FLIGHT.engineSpeedScale,
				ENGINE_CUTOFF,
			);
			substeps++;
			if (this.salvage && this.settings.loadout)
				this.salvage.step(
					STEP / 4,
					this.ship,
					this.star,
					this.state.resources,
					buildStats(this.settings.loadout).capacity,
					previousX,
					previousY,
					Math.hypot(this.ship.pos.x - previousX, this.ship.pos.y - previousY) >
						1200,
				);
			if (
				!this.settings.testFlight &&
				this.sunDistance() < this.star.radius + this.ship.radius
			)
				break;
		}
		if (!this.settings.loadout) {
			this.engineOutput.left = input.leftThruster ? delivered / substeps : 0;
			this.engineOutput.right = input.rightThruster ? delivered / substeps : 0;
		}
		if (
			Math.hypot(this.ship.pos.x - beforeX, this.ship.pos.y - beforeY) > 1200
		) {
			this.wraps++;
			this.plume.clear();
		}
		if (this.settings.loadout) {
			const outputs =
				this.settings.loadout.chassis === "wasp"
					? [this.engineOutput.left, ...this.engineOutput.stabilizers]
					: [
							this.engineOutput.left,
							this.engineOutput.right,
							...this.engineOutput.aft.filter((_, index) => {
								const id = this.settings.loadout?.aft[index];
								return !!id && PARTS[id].category === "E";
							}),
							...this.engineOutput.stabilizers,
						];
			for (const [index, emitter] of this.buildEmitters.entries())
				emitter.output = outputs[index];
			this.plume.stepMounted(STEP, this.ship, this.buildEmitters);
		} else
			this.plume.step(
				STEP,
				this.ship,
				this.engineOutput.left,
				this.engineOutput.right,
			);
		const distance = this.sunDistance();
		this.thrust.left = input.leftThruster;
		this.thrust.right = input.rightThruster;
		if (!this.settings.loadout)
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
		this.gravityCollectionRate = collected / STEP;
		const target = collected > 0 ? 1 : 0;
		const fade = STEP / GRAVITY_COLLECTION.fadeSeconds;
		this.gravityFoldOpacity += Math.max(
			-fade,
			Math.min(fade, target - this.gravityFoldOpacity),
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
			for (let tick = 0; tick < input.ticks; tick++)
				this.step({ ...input, sendDerelict: tick === 0 && input.sendDerelict });
	}
}
