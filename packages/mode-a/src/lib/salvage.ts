import type {
	GameObject,
	InputState,
	Planet,
	Resources,
	Star,
} from "@void-drift/core";
import { type BuildMount, buildMounts, weaponPose } from "./build-renderer";
import { castDerelict, getDerelictRadius } from "./derelict-collision";
import {
	DERELICT_ORIGIN,
	DERELICT_SCALE,
	DERELICT_SHARDS,
} from "./derelict-geometry";
import {
	ASSEMBLED_ION_DEFAULTS,
	type AssembledIonSettings,
	ION_REFERENCE_MASS,
} from "./schemas/ion";
import { buildStats, type Loadout } from "./schemas/loadout";
import type { SalvagePhysicalState } from "./schemas/salvage";
import {
	type DestructionCause,
	ENCOUNTER,
	SALVAGE,
	WEAPONS,
} from "./schemas/salvage";

export type FlightTickInput = InputState & { sendDerelict?: boolean };
export interface SalvageBody extends SalvagePhysicalState {
	id: number;
	group: number;
	kind: "wreck" | "fragment" | "cell";
	x: number;
	y: number;
	previousX: number;
	previousY: number;
	vx: number;
	vy: number;
	radius: number;
	hull: number;
	life: number;
	rotation: number;
}
export interface RailShot {
	x: number;
	y: number;
	vx: number;
	vy: number;
	angle: number;
}
export interface WeaponState {
	mount: BuildMount;
	kind: "rail" | "laser";
	angle: number;
	readyAt: number;
	target: number | null;
	recoil: { remaining: number; angle: number } | null;
}
export interface WeaponEvent {
	id: number;
	kind: "rail" | "laser" | "collision" | "impact" | "break" | "collect";
	x: number;
	y: number;
	endX: number;
	endY: number;
	time: number;
}

/** First contact between relative linear motion and a circle, including overlap. */
export function contactTime(
	x: number,
	y: number,
	vx: number,
	vy: number,
	radius: number,
	horizon: number,
) {
	const c = x * x + y * y - radius * radius;
	if (c <= 0) return 0;
	const a = vx * vx + vy * vy;
	const b = 2 * (x * vx + y * vy);
	const d = b * b - 4 * a * c;
	if (a < 1e-12 || b >= 0 || d < 0) return Infinity;
	const t = (-b - Math.sqrt(d)) / (2 * a);
	return t >= 0 && t <= horizon + 1e-9 ? t : Infinity;
}
function angleDifference(a: number, b: number) {
	return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}
function outside(x: number, y: number) {
	return (
		Math.hypot(x - ENCOUNTER.centerX, y - ENCOUNTER.centerY) >
		ENCOUNTER.radius + 1e-7
	);
}

/** Bounded, deterministic gameplay. No Canvas, wall clock, or cosmetic randomness. */
export class SalvageSystem {
	readonly weapons: WeaponState[];
	readonly angles: Record<string, number> = {};
	bodies: SalvageBody[] = [];
	shots: RailShot[] = [];
	events: WeaponEvent[] = [];
	time = 0;
	nextPass = ENCOUNTER.firstPass;
	passes = 0;
	destroyed = 0;
	playerKills = 0;
	shotsFired = 0;
	laserPulses = 0;
	hits = 0;
	energySpent = 0;
	energyCollected = 0;
	lastCollection = { time: -Infinity, amount: 0 };
	private sequence = 0;
	private eventSequence = 0;
	private randomState: number;
	private scheduleState: number;
	private trajectoryState: number;
	private readonly recoilAcceleration: number;
	constructor(
		loadout: Loadout,
		seed: number,
		ion: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
	) {
		this.randomState = seed >>> 0;
		this.scheduleState = (seed ^ 0x9e3779b9) >>> 0;
		this.trajectoryState = (seed ^ 0x85ebca6b) >>> 0;
		this.recoilAcceleration =
			(ion.acceleration * ION_REFERENCE_MASS * WEAPONS.rail.recoilStrength) /
			buildStats(loadout).mass;
		this.weapons = buildMounts(loadout)
			.flatMap((mount): WeaponState[] =>
				mount.part === "rail" || mount.part === "laser"
					? [
							{
								mount,
								kind: mount.part,
								angle: mount.angle,
								readyAt: 0,
								target: null,
								recoil: null,
							},
						]
					: [],
			)
			.sort((a, b) => Number(a.kind === "rail") - Number(b.kind === "rail"));
		for (const weapon of this.weapons)
			this.angles[weapon.mount.key] = weapon.angle;
	}
	get groups() {
		return new Set(this.bodies.map((body) => body.group)).size;
	}
	private random() {
		this.randomState =
			(Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
		return this.randomState / 4294967296;
	}
	private emit(
		kind: WeaponEvent["kind"],
		x: number,
		y: number,
		endX = x,
		endY = y,
	) {
		if (this.events.length >= 128) this.events.shift();
		this.events.push({
			id: ++this.eventSequence,
			kind,
			x,
			y,
			endX,
			endY,
			time: this.time,
		});
	}
	private body(
		kind: SalvageBody["kind"],
		group: number,
		x: number,
		y: number,
		vx: number,
		vy: number,
	): SalvageBody {
		const config =
			kind === "wreck"
				? SALVAGE.wreck
				: kind === "fragment"
					? SALVAGE.fragment
					: SALVAGE.cell;
		return {
			id: ++this.sequence,
			group,
			kind,
			x,
			y,
			previousX: x,
			previousY: y,
			vx,
			vy,
			radius: config.radius,
			hull: "hull" in config ? config.hull : 1,
			life: config.life,
			rotation: this.random() * Math.PI * 2,
			...(kind === "wreck"
				? { initialHull: SALVAGE.wreck.hull, releasedMask: 0 }
				: {}),
		};
	}
	private scheduleRandom() {
		this.scheduleState =
			(Math.imul(this.scheduleState, 1664525) + 1013904223) >>> 0;
		return this.scheduleState / 4294967296;
	}
	private trajectoryRandom() {
		this.trajectoryState =
			(Math.imul(this.trajectoryState, 1664525) + 1013904223) >>> 0;
		return this.trajectoryState / 4294967296;
	}
	private spawn() {
		// Consume the complete trajectory even when the group budget is full.
		const angle = this.trajectoryRandom() * Math.PI * 2;
		const heading =
			angle +
			Math.PI +
			(this.trajectoryRandom() * 2 - 1) * ENCOUNTER.headingSpread;
		const speed =
			ENCOUNTER.speedMin +
			this.trajectoryRandom() * (ENCOUNTER.speedMax - ENCOUNTER.speedMin);
		if (this.groups >= ENCOUNTER.groups) return;
		this.passes++;
		this.bodies.push(
			this.body(
				"wreck",
				this.passes,
				ENCOUNTER.centerX + Math.cos(angle) * ENCOUNTER.radius,
				ENCOUNTER.centerY + Math.sin(angle) * ENCOUNTER.radius,
				Math.cos(heading) * speed,
				Math.sin(heading) * speed,
			),
		);
	}
	private cast(
		body: SalvageBody,
		x: number,
		y: number,
		vx: number,
		vy: number,
		radius: number,
		horizon: number,
		previous = false,
		angularScale = 1,
	) {
		if (body.kind === "cell")
			return contactTime(
				x - (previous ? body.previousX : body.x),
				y - (previous ? body.previousY : body.y),
				vx,
				vy,
				radius + body.radius,
				horizon,
			);
		const shape = {
			kind: body.kind,
			x: previous ? body.previousX : body.x,
			y: previous ? body.previousY : body.y,
			rotation: previous
				? (body.previousRotation ?? body.rotation)
				: body.rotation,
			shardIndex: body.shardIndex ?? 0,
			releasedMask: body.releasedMask ?? 0,
		};
		const bound = getDerelictRadius(shape) + radius;
		if (
			!Number.isFinite(
				contactTime(x - shape.x, y - shape.y, vx, vy, bound, horizon),
			)
		)
			return Infinity;
		if (!Number.isFinite(horizon)) {
			const speed = Math.hypot(vx, vy);
			horizon =
				speed > 0
					? (Math.hypot(x - shape.x, y - shape.y) + bound * 2) / speed
					: 0;
		}
		return (
			castDerelict(
				{
					kind: body.kind,
					x: previous ? body.previousX : body.x,
					y: previous ? body.previousY : body.y,
					rotation: previous
						? (body.previousRotation ?? body.rotation)
						: body.rotation,
					shardIndex: body.shardIndex ?? 0,
					releasedMask: body.releasedMask ?? 0,
				},
				{ x, y },
				{ x: vx, y: vy },
				radius,
				horizon,
				previous ? (body.kind === "wreck" ? 0.3 : 0.8) * angularScale : 0,
			)?.time ?? Infinity
		);
	}
	private release(
		body: SalvageBody,
		index: number,
		suppressShipContact = false,
	) {
		const bit = 1 << index;
		if ((body.releasedMask ?? 0) & bit) return;
		body.releasedMask = (body.releasedMask ?? 0) | bit;
		const site = DERELICT_SHARDS[index];
		const c = Math.cos(body.rotation),
			s = Math.sin(body.rotation);
		const px = (site.x - DERELICT_ORIGIN.x) * DERELICT_SCALE,
			py = (site.y - DERELICT_ORIGIN.y) * DERELICT_SCALE;
		const fragment = this.body(
			"fragment",
			body.group,
			body.x + c * px - s * py,
			body.y + s * px + c * py,
			body.vx + c * site.vx - s * site.vy,
			body.vy + s * site.vx + c * site.vy,
		);
		fragment.rotation = body.rotation;
		fragment.previousRotation = body.rotation;
		fragment.shardIndex = index;
		fragment.suppressShipContact = suppressShipContact;
		this.bodies.push(fragment);
	}
	private destroy(body: SalvageBody, cause: DestructionCause) {
		if (body.hull <= 0) return;
		body.hull = 0;
		if (cause === "expiry" || cause === "exit") return;
		if (body.kind !== "wreck") {
			if (cause === "player-weapon" || cause === "player-ram")
				this.emit("impact", body.x, body.y);
			return;
		}
		if (cause === "player-weapon" || cause === "player-ram") {
			this.destroyed++;
			this.playerKills++;
		}
		this.emit("break", body.x, body.y);
		for (let i = 0; i < DERELICT_SHARDS.length; i++)
			this.release(body, i, cause === "player-ram");
		if (cause !== "environment")
			this.bodies.push(
				this.body("cell", body.group, body.x, body.y, body.vx, body.vy),
			);
	}
	private damage(body: SalvageBody, amount: number) {
		if (body.hull <= 0) return;
		this.hits++;
		if (body.kind === "wreck" && body.initialHull === undefined)
			body.initialHull = body.hull;
		if (body.hull <= amount) this.destroy(body, "player-weapon");
		else {
			body.hull -= amount;
			if (body.kind === "wreck") {
				const damage = 1 - body.hull / (body.initialHull ?? SALVAGE.wreck.hull);
				for (const [threshold, index] of [
					[0.2, 0],
					[0.4, 6],
					[0.6, 3],
				] as const)
					if (damage + 1e-9 >= threshold) this.release(body, index);
			}
			this.emit("impact", body.x, body.y);
		}
	}
	private lineClear(
		x: number,
		y: number,
		endX: number,
		endY: number,
		star: Star,
		planets: readonly Planet[],
	) {
		if (
			contactTime(
				x - star.pos.x,
				y - star.pos.y,
				endX - x,
				endY - y,
				star.radius,
				1,
			) !== Infinity
		)
			return false;
		return planets.every(
			(planet) =>
				contactTime(
					x - planet.pos.x,
					y - planet.pos.y,
					endX - x,
					endY - y,
					planet.radius,
					1,
				) === Infinity,
		);
	}
	private targetLaser(
		weapon: WeaponState,
		ship: GameObject,
		star: Star,
		planets: readonly Planet[],
	) {
		const pose = weaponPose(ship, weapon.mount, weapon.angle);
		const candidates = this.bodies
			.flatMap((body) => {
				const distance = Math.hypot(body.x - pose.x, body.y - pose.y);
				if (
					body.kind === "cell" ||
					body.hull <= 0 ||
					distance > WEAPONS.laser.range ||
					!this.lineClear(pose.x, pose.y, body.x, body.y, star, planets)
				)
					return [];
				const threat =
					body.kind === "fragment"
						? this.cast(
								body,
								ship.pos.x,
								ship.pos.y,
								ship.vel.x - body.vx,
								ship.vel.y - body.vy,
								ship.radius,
								WEAPONS.laser.threatHorizon,
							)
						: Infinity;
				const priority = Number.isFinite(threat)
					? 0
					: body.kind === "wreck"
						? 1
						: 2;
				return [{ body, priority, order: priority === 0 ? threat : distance }];
			})
			.sort(
				(a, b) =>
					a.priority - b.priority || a.order - b.order || a.body.id - b.body.id,
			);
		const first = candidates[0];
		const retained = candidates.find(
			(candidate) => candidate.body.id === weapon.target,
		);
		return retained && retained.priority === first?.priority
			? retained.body
			: first?.body;
	}
	private fireWeapons(
		dt: number,
		ship: GameObject,
		star: Star,
		resources: Resources,
		planets: readonly Planet[],
	) {
		for (const weapon of this.weapons) {
			const config = WEAPONS[weapon.kind];
			let target: SalvageBody | undefined;
			if (weapon.kind === "laser") {
				target = this.targetLaser(weapon, ship, star, planets);
				weapon.target = target?.id ?? null;
				if (target) {
					const base = weaponPose(ship, weapon.mount, weapon.angle);
					const desired =
						Math.atan2(target.y - base.y, target.x - base.x) - ship.rotation;
					const delta = angleDifference(desired, weapon.angle);
					weapon.angle += Math.max(
						-WEAPONS.laser.turnSpeed * dt,
						Math.min(WEAPONS.laser.turnSpeed * dt, delta),
					);
					weapon.angle = angleDifference(weapon.angle, 0);
					if (
						Math.abs(angleDifference(desired, weapon.angle)) >
						WEAPONS.laser.tolerance
					)
						target = undefined;
				}
			} else weapon.angle = weapon.mount.angle;
			this.angles[weapon.mount.key] = weapon.angle;
			if (
				this.time + 1e-9 < weapon.readyAt ||
				resources.power - config.energy < WEAPONS.reserve
			)
				continue;
			const pose = weaponPose(ship, weapon.mount, weapon.angle);
			if (weapon.kind === "rail") {
				if (this.shots.length >= 64) continue;
				const dx = Math.cos(pose.angle),
					dy = Math.sin(pose.angle);
				const vx = ship.vel.x + dx * WEAPONS.rail.speed;
				const vy = ship.vel.y + dy * WEAPONS.rail.speed;
				let earliest = contactTime(
					pose.muzzleX - star.pos.x,
					pose.muzzleY - star.pos.y,
					vx,
					vy,
					star.radius,
					Infinity,
				);
				for (const body of this.bodies) {
					if (
						body.kind === "cell" ||
						body.hull <= 0 ||
						Math.hypot(body.x - pose.x, body.y - pose.y) > config.range ||
						!this.lineClear(
							pose.muzzleX,
							pose.muzzleY,
							body.x,
							body.y,
							star,
							planets,
						)
					)
						continue;
					let t = this.cast(
						body,
						pose.muzzleX,
						pose.muzzleY,
						vx - body.vx,
						vy - body.vy,
						0,
						Infinity,
					);
					// Predict the target's bearing when the slug reaches its forward plane.
					// The arc relaxes the trigger, never the fixed muzzle direction.
					const forward =
						(body.x - pose.muzzleX) * dx + (body.y - pose.muzzleY) * dy;
					const closing = (vx - body.vx) * dx + (vy - body.vy) * dy;
					if (forward > 0 && closing > 0) {
						const crossing = forward / closing;
						const leadX =
							body.x - pose.muzzleX + (body.vx - ship.vel.x) * crossing;
						const leadY =
							body.y - pose.muzzleY + (body.vy - ship.vel.y) * crossing;
						if (
							Math.abs(angleDifference(Math.atan2(leadY, leadX), pose.angle)) <=
							WEAPONS.rail.arc
						)
							t = Math.min(t, crossing);
					}
					if (
						t < earliest &&
						!outside(pose.muzzleX + vx * t, pose.muzzleY + vy * t)
					) {
						earliest = t;
						target = body;
					}
				}
				weapon.target = target?.id ?? null;
				if (!target) continue;
				this.shots.push({
					x: pose.muzzleX,
					y: pose.muzzleY,
					vx,
					vy,
					angle: pose.angle,
				});
				this.shotsFired++;
				weapon.recoil = {
					remaining: WEAPONS.rail.recoilDuration,
					angle: pose.angle,
				};
				this.emit("rail", pose.muzzleX, pose.muzzleY);
			} else {
				if (!target) continue;
				// The visible pulse follows the barrel; its first physical hit owns damage.
				const dx = Math.cos(pose.angle),
					dy = Math.sin(pose.angle);
				let first = contactTime(
					pose.muzzleX - star.pos.x,
					pose.muzzleY - star.pos.y,
					dx,
					dy,
					star.radius,
					config.range,
				);
				for (const planet of planets)
					first = Math.min(
						first,
						contactTime(
							pose.muzzleX - planet.pos.x,
							pose.muzzleY - planet.pos.y,
							dx,
							dy,
							planet.radius,
							config.range,
						),
					);
				let hit: SalvageBody | undefined;
				for (const body of this.bodies) {
					if (body.kind === "cell" || body.hull <= 0) continue;
					const distance = this.cast(
						body,
						pose.muzzleX,
						pose.muzzleY,
						dx,
						dy,
						0,
						config.range,
					);
					if (distance < first) {
						first = distance;
						hit = body;
					}
				}
				if (!hit) continue;
				this.emit(
					"laser",
					pose.muzzleX,
					pose.muzzleY,
					pose.muzzleX + dx * first,
					pose.muzzleY + dy * first,
				);
				this.laserPulses++;
				this.damage(hit, config.damage);
			}
			weapon.readyAt = this.time + config.cooldown;
			resources.power -= config.energy;
			this.energySpent += config.energy;
		}
	}
	step(
		dt: number,
		ship: GameObject,
		star: Star,
		resources: Resources,
		capacity: number,
		previousX: number,
		previousY: number,
		wrapped: boolean,
		planets: readonly Planet[] = [],
	) {
		this.time += dt;
		this.events = this.events.filter((event) => this.time - event.time <= 0.2);
		while (this.time + 1e-9 >= this.nextPass) {
			this.spawn();
			this.nextPass +=
				ENCOUNTER.intervalMin +
				this.scheduleRandom() * (ENCOUNTER.intervalMax - ENCOUNTER.intervalMin);
		}
		const hazards = [star, ...planets];
		const existingBodies = new Set(this.bodies);
		// A body already touching a world hazard is gone before an instantaneous pulse.
		for (const body of existingBodies) {
			if (body.hull <= 0) continue;
			if (body.life <= 0) {
				this.destroy(body, "expiry");
				continue;
			}
			if (outside(body.x, body.y)) {
				this.destroy(body, "exit");
				continue;
			}
			if (
				body.hull > 0 &&
				hazards.some(
					(hazard) =>
						this.cast(
							body,
							hazard.pos.x,
							hazard.pos.y,
							0,
							0,
							hazard.radius,
							0,
						) !== Infinity,
				)
			)
				this.destroy(body, "environment");
		}
		this.fireWeapons(dt, ship, star, resources, planets);
		for (const weapon of this.weapons) {
			if (!weapon.recoil) continue;
			const duration = Math.min(dt, weapon.recoil.remaining);
			const impulse = this.recoilAcceleration * duration;
			// External recoil uses ion force and build mass, without an engine speed cap.
			// Keep the direction of the fired shot even if the ship turns during recoil.
			ship.vel.x -= Math.cos(weapon.recoil.angle) * impulse;
			ship.vel.y -= Math.sin(weapon.recoil.angle) * impulse;
			weapon.recoil.remaining -= duration;
			if (weapon.recoil.remaining <= 1e-9) weapon.recoil = null;
		}
		const startX = wrapped ? ship.pos.x : previousX,
			startY = wrapped ? ship.pos.y : previousY;
		for (const body of existingBodies) {
			if (body.hull <= 0) continue;
			body.previousRotation = body.rotation;
			body.previousX = body.x;
			body.previousY = body.y;
			body.x += body.vx * dt;
			body.y += body.vy * dt;
			body.life -= dt;
			body.rotation += dt * (body.kind === "wreck" ? 0.3 : 0.8);
		}
		type Terminal = { time: number; cause: "environment" | "expiry" | "exit" };
		const terminalTimes = new Map<
			SalvageBody,
			{ mask: number; terminal: Terminal }
		>();
		const shipTimes = new Map<SalvageBody, { mask: number; time: number }>();
		const terminal = (body: SalvageBody): Terminal => {
			const mask = body.releasedMask ?? 0;
			const cached = terminalTimes.get(body);
			if (cached?.mask === mask) return cached.terminal;
			let result: Terminal = { time: Infinity, cause: "environment" };
			for (const hazard of hazards) {
				const time = this.cast(
					body,
					hazard.pos.x,
					hazard.pos.y,
					-body.vx,
					-body.vy,
					hazard.radius,
					dt,
					true,
				);
				if (time < result.time) result = { time, cause: "environment" };
			}
			const expiry = body.life <= 0 ? Math.max(0, dt + body.life) : Infinity;
			if (expiry < result.time) result = { time: expiry, cause: "expiry" };
			if (outside(body.x, body.y)) {
				const x = body.previousX - ENCOUNTER.centerX,
					y = body.previousY - ENCOUNTER.centerY;
				const a = body.vx ** 2 + body.vy ** 2;
				const b = 2 * (x * body.vx + y * body.vy);
				const c = x * x + y * y - ENCOUNTER.radius ** 2;
				const time =
					a > 0
						? Math.max(
								0,
								(-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a),
							)
						: Infinity;
				if (time < result.time) result = { time, cause: "exit" };
			}
			terminalTimes.set(body, { mask, terminal: result });
			return result;
		};
		const shipTime = (body: SalvageBody) => {
			const mask = body.releasedMask ?? 0;
			const cached = shipTimes.get(body);
			if (cached?.mask === mask) return cached.time;
			const time = body.suppressShipContact
				? Infinity
				: dt *
					this.cast(
						body,
						startX,
						startY,
						ship.pos.x - startX - (body.x - body.previousX),
						ship.pos.y - startY - (body.y - body.previousY),
						ship.radius,
						1,
						true,
						dt,
					);
			shipTimes.set(body, { mask, time });
			return time;
		};

		this.shots = this.shots.filter((shot) => {
			let first = contactTime(
				shot.x - star.pos.x,
				shot.y - star.pos.y,
				shot.vx,
				shot.vy,
				star.radius,
				dt,
			);
			for (const planet of planets)
				first = Math.min(
					first,
					contactTime(
						shot.x - planet.pos.x,
						shot.y - planet.pos.y,
						shot.vx,
						shot.vy,
						planet.radius,
						dt,
					),
				);
			let hit: SalvageBody | undefined;
			for (const body of existingBodies) {
				if (body.kind === "cell" || body.hull <= 0) continue;
				const time = this.cast(
					body,
					shot.x,
					shot.y,
					shot.vx - body.vx,
					shot.vy - body.vy,
					0,
					dt,
					true,
				);
				if (
					time < first &&
					time < terminal(body).time &&
					time < shipTime(body)
				) {
					first = time;
					hit = body;
				}
			}
			shot.x += shot.vx * Math.min(dt, first);
			shot.y += shot.vy * Math.min(dt, first);
			if (hit) {
				const end = { x: hit.x, y: hit.y, rotation: hit.rotation };
				hit.x = hit.previousX + hit.vx * first;
				hit.y = hit.previousY + hit.vy * first;
				hit.rotation =
					(hit.previousRotation ?? end.rotation) +
					first * (hit.kind === "wreck" ? 0.3 : 0.8);
				this.damage(hit, WEAPONS.rail.damage);
				if (hit.hull > 0) Object.assign(hit, end);
			}
			if (first !== Infinity) this.emit("collision", shot.x, shot.y);
			return first === Infinity && !outside(shot.x, shot.y);
		});
		// Keep every newborn from one ram suppressed until the ship has left all of them.
		const suppressedBodies = new Set(
			this.bodies.filter((b) => b.suppressShipContact),
		);
		const suppressedGroups = new Set([...suppressedBodies].map((b) => b.group));
		for (const group of suppressedGroups) {
			const pieces = this.bodies.filter(
				(b) => b.group === group && b.suppressShipContact,
			);
			if (
				pieces.every(
					(b) =>
						this.cast(b, ship.pos.x, ship.pos.y, 0, 0, ship.radius, 0) ===
						Infinity,
				)
			)
				for (const piece of pieces) piece.suppressShipContact = false;
		}
		for (const body of [...this.bodies]) {
			if (body.hull <= 0) continue;
			const born = !existingBodies.has(body);
			const contact = born
				? this.cast(body, ship.pos.x, ship.pos.y, 0, 0, ship.radius, 0)
				: this.cast(
						body,
						startX,
						startY,
						ship.pos.x - startX - (body.x - body.previousX),
						ship.pos.y - startY - (body.y - body.previousY),
						ship.radius,
						1,
						true,
						dt,
					);
			if (suppressedBodies.has(body)) continue;
			if (
				contact === Infinity ||
				(!born && terminal(body).time <= contact * dt)
			)
				continue;
			if (body.kind === "cell") {
				const amount = Math.max(
					0,
					Math.min(SALVAGE.cell.energy, capacity - resources.power),
				);
				resources.power += amount;
				this.energyCollected += amount;
				this.lastCollection = { time: this.time, amount };
				body.hull = 0;
				this.emit("collect", body.x, body.y);
			} else {
				resources.hull = Math.max(
					0,
					resources.hull -
						(body.kind === "wreck"
							? SALVAGE.wreck.contact
							: SALVAGE.fragment.contact),
				);
				if (body.kind === "wreck") {
					const hit = castDerelict(
						{
							kind: "wreck",
							x: body.previousX,
							y: body.previousY,
							rotation: body.previousRotation ?? body.rotation,
							releasedMask: body.releasedMask ?? 0,
						},
						{ x: startX, y: startY },
						{
							x: ship.pos.x - startX - (body.x - body.previousX),
							y: ship.pos.y - startY - (body.y - body.previousY),
						},
						ship.radius,
						1,
						0.3 * dt,
					);
					if (hit)
						this.emit(
							"collision",
							hit.surfaceX + (body.x - body.previousX) * hit.time,
							hit.surfaceY + (body.y - body.previousY) * hit.time,
						);
				}
				if (!born) {
					body.x = body.previousX + (body.x - body.previousX) * contact;
					body.y = body.previousY + (body.y - body.previousY) * contact;
					body.rotation =
						(body.previousRotation ?? body.rotation) +
						dt * contact * (body.kind === "wreck" ? 0.3 : 0.8);
				}
				this.destroy(body, "player-ram");
			}
		}
		for (const body of existingBodies) {
			if (body.hull <= 0) continue;
			const { time, cause } = terminal(body);
			if (time === Infinity) continue;
			body.x = body.previousX + body.vx * time;
			body.y = body.previousY + body.vy * time;
			body.rotation =
				(body.previousRotation ?? body.rotation) +
				time * (body.kind === "wreck" ? 0.3 : 0.8);
			this.destroy(body, cause);
		}
		this.bodies = this.bodies.filter((body) => body.hull > 0);
	}
}
