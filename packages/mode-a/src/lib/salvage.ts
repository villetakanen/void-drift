import type { GameObject, InputState, Resources, Star } from "@void-drift/core";
import { type BuildMount, buildMounts, weaponPose } from "./build-renderer";
import {
	ION_DEFAULTS,
	ION_REFERENCE_MASS,
	type IonSettings,
} from "./schemas/ion";
import { buildStats, type Loadout } from "./schemas/loadout";
import { SALVAGE, WEAPONS } from "./schemas/salvage";

export type FlightTickInput = InputState & { sendDerelict?: boolean };
export interface SalvageBody {
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
	return Math.hypot(x - 960, y - 540) > 1200;
}

/** Bounded, deterministic gameplay. No Canvas, wall clock, or cosmetic randomness. */
export class SalvageSystem {
	readonly weapons: WeaponState[];
	readonly angles: Record<string, number> = {};
	bodies: SalvageBody[] = [];
	shots: RailShot[] = [];
	events: WeaponEvent[] = [];
	time = 0;
	nextPass = SALVAGE.firstPass;
	summonReadyAt = 0;
	passes = 0;
	destroyed = 0;
	shotsFired = 0;
	laserPulses = 0;
	hits = 0;
	energySpent = 0;
	energyCollected = 0;
	lastCollection = { time: -Infinity, amount: 0 };
	private sequence = 0;
	private eventSequence = 0;
	private randomState: number;
	private readonly recoilAcceleration: number;
	constructor(loadout: Loadout, seed: number, ion: IonSettings = ION_DEFAULTS) {
		this.randomState = seed >>> 0;
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
	get canSend() {
		return (
			this.time + 1e-9 >= this.summonReadyAt && this.groups < SALVAGE.groups
		);
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
		};
	}
	private spawn(ship: GameObject, star: Star) {
		if (this.groups >= SALVAGE.groups) return false;
		const cos = Math.cos(ship.rotation),
			sin = Math.sin(ship.rotation);
		const side = this.passes % 2 === 0 ? 1 : -1;
		// Near an edge, use the first safe mirrored pass; never wrap a spawned wreck.
		for (const [forward, lateral] of [
			[1, side],
			[1, -side],
			[-1, side],
			[-1, -side],
		]) {
			const x =
				ship.pos.x +
				cos * SALVAGE.forward * forward -
				sin * SALVAGE.side * lateral;
			const y =
				ship.pos.y +
				sin * SALVAGE.forward * forward +
				cos * SALVAGE.side * lateral;
			if (
				outside(x, y) ||
				Math.hypot(x - star.pos.x, y - star.pos.y) <
					star.radius + SALVAGE.wreck.radius
			)
				continue;
			this.passes++;
			this.bodies.push(
				this.body(
					"wreck",
					this.passes,
					x,
					y,
					ship.vel.x + sin * SALVAGE.wreck.speed * lateral,
					ship.vel.y - cos * SALVAGE.wreck.speed * lateral,
				),
			);
			return true;
		}
		return false;
	}
	beginTick(send: boolean, ship: GameObject, star: Star) {
		if (send && this.canSend && this.spawn(ship, star)) {
			this.summonReadyAt = this.time + SALVAGE.summonCooldown;
			this.nextPass = this.time + SALVAGE.interval;
		}
	}
	private destroy(body: SalvageBody) {
		if (body.hull <= 0) return;
		body.hull = 0;
		if (body.kind !== "wreck") {
			this.emit("impact", body.x, body.y);
			return;
		}
		this.destroyed++;
		this.emit("break", body.x, body.y);
		const phase = this.random() * Math.PI * 2;
		for (let i = 0; i < SALVAGE.fragment.count; i++) {
			const angle = phase + (i * Math.PI * 2) / SALVAGE.fragment.count;
			const fragment = this.body(
				"fragment",
				body.group,
				body.x + Math.cos(angle) * 12,
				body.y + Math.sin(angle) * 12,
				body.vx + Math.cos(angle) * SALVAGE.fragment.speed,
				body.vy + Math.sin(angle) * SALVAGE.fragment.speed,
			);
			this.bodies.push(fragment);
		}
		this.bodies.push(
			this.body("cell", body.group, body.x, body.y, body.vx, body.vy),
		);
	}
	private damage(body: SalvageBody, amount: number) {
		if (body.hull <= 0) return;
		this.hits++;
		if (body.hull <= amount) this.destroy(body);
		else {
			body.hull -= amount;
			this.emit("impact", body.x, body.y);
		}
	}
	private lineClear(
		x: number,
		y: number,
		endX: number,
		endY: number,
		star: Star,
	) {
		return (
			contactTime(
				x - star.pos.x,
				y - star.pos.y,
				endX - x,
				endY - y,
				star.radius,
				1,
			) === Infinity
		);
	}
	private targetLaser(weapon: WeaponState, ship: GameObject, star: Star) {
		const pose = weaponPose(ship, weapon.mount, weapon.angle);
		const candidates = this.bodies
			.flatMap((body) => {
				const distance = Math.hypot(body.x - pose.x, body.y - pose.y);
				if (
					body.kind === "cell" ||
					body.hull <= 0 ||
					distance > WEAPONS.laser.range ||
					!this.lineClear(pose.x, pose.y, body.x, body.y, star)
				)
					return [];
				const threat =
					body.kind === "fragment"
						? contactTime(
								body.x - ship.pos.x,
								body.y - ship.pos.y,
								body.vx - ship.vel.x,
								body.vy - ship.vel.y,
								ship.radius + body.radius,
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
	) {
		for (const weapon of this.weapons) {
			const config = WEAPONS[weapon.kind];
			let target: SalvageBody | undefined;
			if (weapon.kind === "laser") {
				target = this.targetLaser(weapon, ship, star);
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
						!this.lineClear(pose.muzzleX, pose.muzzleY, body.x, body.y, star)
					)
						continue;
					let t = contactTime(
						pose.muzzleX - body.x,
						pose.muzzleY - body.y,
						vx - body.vx,
						vy - body.vy,
						body.radius,
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
				let hit: SalvageBody | undefined;
				for (const body of this.bodies) {
					if (body.kind === "cell" || body.hull <= 0) continue;
					const distance = contactTime(
						pose.muzzleX - body.x,
						pose.muzzleY - body.y,
						dx,
						dy,
						body.radius,
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
	) {
		this.time += dt;
		this.events = this.events.filter((event) => this.time - event.time <= 0.2);
		if (this.time + 1e-9 >= this.nextPass) {
			this.spawn(ship, star);
			this.nextPass = this.time + SALVAGE.interval;
		}
		this.fireWeapons(dt, ship, star, resources);
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
		for (const body of this.bodies) {
			body.previousX = body.x;
			body.previousY = body.y;
			body.x += body.vx * dt;
			body.y += body.vy * dt;
			body.life -= dt;
			body.rotation += dt * (body.kind === "wreck" ? 0.3 : 0.8);
			if (
				body.life <= 0 ||
				outside(body.x, body.y) ||
				contactTime(
					body.previousX - star.pos.x,
					body.previousY - star.pos.y,
					body.vx,
					body.vy,
					star.radius + body.radius,
					dt,
				) !== Infinity
			)
				body.hull = 0;
		}
		this.shots = this.shots.filter((shot) => {
			let first = contactTime(
				shot.x - star.pos.x,
				shot.y - star.pos.y,
				shot.vx,
				shot.vy,
				star.radius,
				dt,
			);
			let hit: SalvageBody | undefined;
			for (const body of this.bodies) {
				if (body.kind === "cell" || body.hull <= 0) continue;
				const time = contactTime(
					shot.x - body.previousX,
					shot.y - body.previousY,
					shot.vx - body.vx,
					shot.vy - body.vy,
					body.radius,
					dt,
				);
				if (time < first) {
					first = time;
					hit = body;
				}
			}
			shot.x += shot.vx * Math.min(dt, first);
			shot.y += shot.vy * Math.min(dt, first);
			if (hit) this.damage(hit, WEAPONS.rail.damage);
			if (first !== Infinity) this.emit("collision", shot.x, shot.y);
			return first === Infinity && !outside(shot.x, shot.y);
		});
		const startX = wrapped ? ship.pos.x : previousX,
			startY = wrapped ? ship.pos.y : previousY;
		// Snapshot: debris created by contact starts participating next substep.
		for (const body of [...this.bodies]) {
			if (body.hull <= 0) continue;
			const contact = contactTime(
				body.previousX - startX,
				body.previousY - startY,
				body.x - body.previousX - (ship.pos.x - startX),
				body.y - body.previousY - (ship.pos.y - startY),
				ship.radius + body.radius,
				1,
			);
			if (contact === Infinity) continue;
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
					const x = body.previousX + (body.x - body.previousX) * contact;
					const y = body.previousY + (body.y - body.previousY) * contact;
					const dx = startX + (ship.pos.x - startX) * contact - x;
					const dy = startY + (ship.pos.y - startY) * contact - y;
					const ratio = body.radius / Math.max(body.radius, Math.hypot(dx, dy));
					this.emit("collision", x + dx * ratio, y + dy * ratio);
				}
				this.destroy(body);
			}
		}
		this.bodies = this.bodies.filter((body) => body.hull > 0);
	}
}
