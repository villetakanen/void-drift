import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { weaponPose } from "./build-renderer";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { buildStats, defaultLoadout } from "./schemas/loadout";
import { SALVAGE } from "./schemas/salvage";
import { Simulation, STEP, setStarMassWell, stockSettings } from "./simulation";

const idle = {
	leftThruster: false,
	rightThruster: false,
	fire: false as const,
};
function fixture(parts: ("rail" | "laser" | null)[] = []) {
	const loadout = defaultLoadout("fighter");
	loadout.hull = [parts[0] ?? null, parts[1] ?? null];
	const system = new SalvageSystem(loadout, 2026);
	system.nextPass = 1000;
	const ship = {
		pos: new Vec2(400, 400),
		vel: new Vec2(0, 0),
		acc: new Vec2(0, 0),
		rotation: 0,
		radius: 20,
	};
	const star = createStar("G", 960, 540);
	const resources = { hull: 100, power: 100 };
	const step = (count = 1) => {
		for (let i = 0; i < count; i++)
			system.step(
				STEP,
				ship,
				star,
				resources,
				100,
				ship.pos.x,
				ship.pos.y,
				false,
			);
	};
	return { system, loadout, ship, star, resources, step };
}
function body(
	kind: SalvageBody["kind"],
	x: number,
	y: number,
	id = 1,
	vx = 0,
	vy = 0,
): SalvageBody {
	return {
		id,
		group: 1,
		kind,
		x,
		y,
		previousX: x,
		previousY: y,
		vx,
		vy,
		radius: kind === "wreck" ? 18 : kind === "fragment" ? 5 : 6,
		hull: kind === "cell" ? 1 : SALVAGE[kind].hull,
		life: 20,
		rotation: 0,
	};
}

function legacyEncounter(sim: Simulation) {
	sim.planets.length = 0;
	const well = sim.star.massWell;
	if (well)
		setStarMassWell(sim.star, {
			...well,
			mass: well.mass * (12 / sim.star.radius) ** 2,
		});
	sim.star.radius = 12;
	sim.ship.pos.set(
		sim.star.pos.x - sim.star.influenceRadius - 85,
		sim.star.pos.y,
	);
}

describe("Derelicts weapons and salvage", () => {
	it("completes a real rail salvage and collection pass using flight controls", () => {
		const loadout = defaultLoadout("fighter");
		loadout.hull[0] = "rail";
		const sim = new Simulation({
			...stockSettings("fighter"),
			loadout,
			mode: "derelicts",
		});
		legacyEncounter(sim);
		sim.start();
		sim.replay([
			{ ...idle, ticks: 432 },
			{ ...idle, leftThruster: true, rightThruster: true, ticks: 90 },
		]);
		expect(sim.salvage?.destroyed).toBe(1);
		expect(sim.salvage?.energyCollected).toBeGreaterThan(0);
	});
	it.each(["wasp", "scout", "fighter", "corvette", "fiddler"] as const)(
		"%s can engage the opening pass with either weapon",
		(chassis) => {
			for (const gun of ["rail", "laser"] as const) {
				const loadout = defaultLoadout(chassis);
				loadout.hull[0] = gun;
				const sim = new Simulation({
					...stockSettings(chassis),
					loadout,
					mode: "derelicts",
				});
				legacyEncounter(sim);
				sim.start();
				for (let i = 0; i < 900; i++) sim.step(idle);
				expect(sim.salvage?.hits, `${chassis} ${gun}`).toBeGreaterThan(0);
				if (gun === "rail") expect(sim.salvage?.destroyed).toBe(1);
			}
		},
	);
	it("fires from the rotated slot muzzle with inherited velocity, without steering", () => {
		const f = fixture(["rail"]);
		Object.assign(f.system.weapons[0].mount, {
			x: 12,
			y: -8,
			angle: Math.PI / 2,
		});
		f.ship.vel.x = 45;
		f.system.bodies.push(body("wreck", 412, 550, 1, 45));
		f.step();
		const shot = f.system.shots[0];
		expect(shot).toBeDefined();
		expect(shot.vx).toBeCloseTo(45);
		expect(shot.vy).toBeCloseTo(600);
		expect(shot.x - shot.vx * STEP).toBeCloseTo(407.8);
		// x=400 + 12*0.65; y=400 - 8*0.65 + (11/2+1)*0.65.
		expect(shot.y - shot.vy * STEP).toBeCloseTo(399.025);
		f.system.bodies[0].y += 100;
		f.step();
		expect(shot.vx).toBeCloseTo(45);
		expect(shot.vy).toBeCloseTo(600);
	});
	it("waits for an intercept and catches fast relative crossings between ticks", () => {
		const f = fixture(["rail"]);
		f.system.bodies.push(body("fragment", 500, 450));
		f.step();
		expect(f.system.shotsFired).toBe(0);
		f.system.bodies[0] = body("fragment", 500, 400);
		f.system.shots.push({
			x: 400,
			y: 400,
			vx: 12000,
			vy: 0,
			angle: 0,
		});
		f.step();
		expect(f.system.bodies).toHaveLength(0);
		expect(f.system.hits).toBe(1);
	});
	it("predicts target motion without a target lock or aim cone steering", () => {
		const f = fixture(["rail"]);
		const pose = weaponPose(f.ship, f.system.weapons[0].mount);
		f.system.bodies.push(
			body("fragment", pose.muzzleX + 60, pose.muzzleY + 20, 1, 0, -200),
		);
		f.step();
		expect(f.system.shotsFired).toBe(1);
		f.step(8);
		expect(f.system.bodies).toHaveLength(0);
	});
	it.each([-9, -7, 7, 9])(
		"uses the firing arc at %s degrees without steering the barrel",
		(degrees) => {
			const f = fixture(["rail"]);
			f.ship.rotation = 0.4;
			f.system.weapons[0].mount.angle = 0.3;
			const pose = weaponPose(f.ship, f.system.weapons[0].mount);
			const bearing = pose.angle + (degrees * Math.PI) / 180;
			f.system.bodies.push(
				body(
					"fragment",
					pose.muzzleX + Math.cos(bearing) * 300,
					pose.muzzleY + Math.sin(bearing) * 300,
				),
			);
			f.step();
			expect(f.system.shotsFired).toBe(Math.abs(degrees) < 8 ? 1 : 0);
			if (f.system.shots[0]) {
				expect(f.system.shots[0].angle).toBeCloseTo(pose.angle);
				expect(f.system.shots[0].vx).toBeCloseTo(Math.cos(pose.angle) * 600);
				expect(f.system.shots[0].vy).toBeCloseTo(Math.sin(pose.angle) * 600);
			}
		},
	);
	it("keeps a missed slug beyond acquisition range until it exits the system", () => {
		const f = fixture(["rail"]);
		const pose = weaponPose(f.ship, f.system.weapons[0].mount);
		f.system.bodies.push(
			body("fragment", pose.muzzleX + 300, pose.muzzleY + 30),
		);
		f.step();
		expect(f.system.shots).toHaveLength(1);
		f.resources.power = 10;
		f.step(60);
		expect(f.system.hits).toBe(0);
		expect(f.system.events.some((event) => event.kind === "collision")).toBe(
			false,
		);
		expect(f.system.shots).toHaveLength(1);
		expect(f.system.shots[0].x - pose.muzzleX).toBeGreaterThan(600);
		f.step(120);
		expect(f.system.shots).toHaveLength(0);
	});
	it("hits beyond acquisition range and emits its plume at the swept contact point", () => {
		const f = fixture(["rail"]);
		const pose = weaponPose(f.ship, f.system.weapons[0].mount);
		f.system.bodies.push(
			body("fragment", pose.muzzleX + 300, pose.muzzleY + 30),
		);
		f.step();
		f.resources.power = 10;
		const distant = body("wreck", pose.muzzleX + 900, pose.muzzleY, 2);
		distant.hull = 105;
		f.system.bodies.push(distant);
		for (let i = 0; i < 100 && f.system.hits === 0; i++) f.step();
		expect(distant.hull).toBe(5);
		expect(f.system.shots).toHaveLength(0);
		const impacts = f.system.events.filter(
			(event) => event.kind === "collision",
		);
		expect(impacts).toHaveLength(1);
		expect(impacts[0].x).toBeCloseTo(distant.x - distant.radius);
		expect(impacts[0].y).toBeCloseTo(distant.y);
	});
	it("deals 100 rail damage to an 85-hull wreck and 5 laser damage to a 12-hull shard", () => {
		const rail = fixture(["rail"]);
		rail.system.bodies.push(body("wreck", 550, 400));
		rail.step(12);
		expect(rail.system.shotsFired).toBe(1);
		expect(rail.system.destroyed).toBe(1);
		expect(rail.system.energySpent).toBe(3);
		const laser = fixture(["laser"]);
		const pose = weaponPose(laser.ship, laser.system.weapons[0].mount);
		const shard = body("fragment", pose.x + 100, pose.y);
		laser.system.bodies.push(shard);
		laser.step();
		expect(shard.hull).toBe(7);
		laser.step(15);
		expect(shard.hull).toBe(2);
		laser.step(15);
		expect(laser.system.bodies).toHaveLength(0);
		expect(laser.system.laserPulses).toBe(3);
	});
	it("limits laser acquisition to 160 units", () => {
		const f = fixture(["laser"]);
		const pose = weaponPose(f.ship, f.system.weapons[0].mount);
		const wreck = body("wreck", pose.x + 161, pose.y);
		f.system.bodies.push(wreck);
		f.step(30);
		expect(f.system.laserPulses).toBe(0);
		wreck.x = pose.x + 159;
		f.step();
		expect(f.system.laserPulses).toBe(1);
	});
	it("applies a mass-scaled 0.34-ion recoil for exactly 0.22 seconds in the shot direction", () => {
		const f = fixture(["rail"]);
		f.system.bodies.push(body("wreck", 550, 400));
		f.step();
		const acceleration = (220 * 115 * 0.34) / buildStats(f.loadout).mass;
		expect(f.ship.vel.x).toBeCloseTo(-acceleration * STEP);
		const shot = f.system.shots[0];
		expect(shot.vx).toBe(600);
		f.resources.power = 10;
		f.ship.rotation = Math.PI / 2;
		f.step(13);
		expect(f.ship.vel.x).toBeCloseTo(-acceleration * 0.22);
		expect(f.ship.vel.y).toBeCloseTo(0);
		expect(f.system.weapons[0].recoil).toBeNull();
		f.step(30);
		expect(f.ship.vel.x).toBeCloseTo(-acceleration * 0.22);
		expect(f.system.energySpent).toBe(3);
	});
	it("tracks at a finite rate and gives an incoming fragment priority over a wreck", () => {
		const f = fixture(["laser"]);
		f.system.bodies.push(
			body("wreck", 550, 400),
			body("fragment", 400, 500, 2, 0, -50),
		);
		f.step();
		expect(f.system.weapons[0].target).toBe(2);
		expect(f.system.weapons[0].angle).toBeCloseTo(Math.PI / 30);
		expect(f.system.laserPulses).toBe(0);
		f.step(50);
		expect(f.system.bodies.some((b) => b.id === 2)).toBe(false);
		expect(f.resources.hull).toBe(100);
	});
	it("allows laser-only salvage and releases a single complete drop", () => {
		const f = fixture(["laser"]);
		f.system.bodies.push(body("wreck", 550, 400));
		for (let i = 0; i < 360 && f.system.destroyed === 0; i++) f.step();
		expect(f.system.destroyed).toBe(1);
		expect(f.system.laserPulses).toBe(17);
		expect(f.system.bodies.filter((b) => b.kind === "fragment")).toHaveLength(
			4,
		);
		expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(1);
		expect(f.system.energySpent).toBe(8.5);
	});
	it("charges for actual shots only, protects reserve, and budgets defence first", () => {
		const f = fixture(["rail", "laser"]);
		f.system.bodies.push(body("wreck", 550, 400));
		f.resources.power = 10.4;
		f.step();
		expect(f.system.energySpent).toBe(0);
		f.resources.power = 13;
		f.step();
		expect(f.system.laserPulses).toBe(1);
		expect(f.system.shotsFired).toBe(0);
		expect(f.resources.power).toBe(12.5);
		f.step(10);
		expect(f.resources.power).toBe(12.5);
		f.step(8);
		expect(f.resources.power).toBe(12);
		f.resources.power = 0;
		f.step(60);
		expect(f.resources.power).toBe(0);
	});
	it("does not duplicate a wreck drop when multiple rounds hit together", () => {
		const f = fixture();
		f.system.bodies.push(body("wreck", 550, 400));
		for (let i = 0; i < 3; i++)
			f.system.shots.push({
				x: 500,
				y: 400,
				vx: 6000,
				vy: 0,
				angle: 0,
			});
		f.step();
		expect(f.system.destroyed).toBe(1);
		expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(1);
		expect(
			f.system.bodies.filter((b) => b.kind === "fragment").length,
		).toBeLessThanOrEqual(4);
	});
	it("blocks laser and rail fire through the star and absorbs existing rounds", () => {
		const f = fixture(["rail", "laser"]);
		f.star.pos.set(470, 400);
		f.system.bodies.push(body("wreck", 550, 400));
		f.step(60);
		expect(f.system.energySpent).toBe(0);
		f.system.shots.push({
			x: 420,
			y: 400,
			vx: 12000,
			vy: 0,
			angle: 0,
		});
		f.step();
		expect(f.system.shots).toHaveLength(0);
		expect(f.system.bodies[0].hull).toBe(85);
	});
	it("applies fragment damage and capped collection once, with cells immune to weapons", () => {
		const f = fixture();
		f.resources.power = 90;
		f.system.bodies.push(body("fragment", 400, 400), body("cell", 400, 400, 2));
		f.step(2);
		expect(f.resources).toEqual({ hull: 95, power: 100 });
		expect(f.system.events.some((event) => event.kind === "collision")).toBe(
			false,
		);
		expect(f.system.energyCollected).toBe(10);
		expect(f.system.bodies).toHaveLength(0);
		const armed = fixture(["rail", "laser"]);
		armed.system.bodies.push(body("cell", 550, 400));
		armed.step(60);
		expect(armed.system.energySpent).toBe(0);
		expect(armed.system.bodies).toHaveLength(1);
	});
	it("deals 30 on wreck contact with one shared impact plume, and never sweeps across a player wrap", () => {
		const f = fixture();
		f.system.bodies.push(body("wreck", 420, 400));
		f.step();
		expect(f.resources.hull).toBe(70);
		expect(f.system.destroyed).toBe(1);
		const plumes = f.system.events.filter(
			(event) => event.kind === "collision",
		);
		expect(plumes).toHaveLength(1);
		expect(plumes[0].x).toBeCloseTo(402);
		expect(plumes[0].y).toBeCloseTo(400);
		expect(
			f.system.bodies.filter((body) => body.kind === "fragment"),
		).toHaveLength(4);
		expect(f.system.bodies.filter((body) => body.kind === "cell")).toHaveLength(
			1,
		);
		f.step();
		expect(f.system.destroyed).toBe(1);
		expect(
			f.system.events.filter((event) => event.kind === "collision"),
		).toHaveLength(1);
		const wrapped = fixture();
		wrapped.system.bodies.push(body("cell", 960, 450));
		wrapped.resources.power = 40;
		wrapped.ship.pos.set(2140, 450);
		wrapped.system.step(
			STEP,
			wrapped.ship,
			wrapped.star,
			wrapped.resources,
			100,
			-220,
			450,
			true,
		);
		expect(wrapped.system.energyCollected).toBe(0);
	});
	it("bounds whole encounter groups, expires objects, and resets automatic cadence on summon", () => {
		const f = fixture();
		f.system.nextPass = SALVAGE.firstPass;
		f.step(179);
		expect(f.system.passes).toBe(0);
		f.step();
		expect(f.system.passes).toBe(1);
		f.system.beginTick(true, f.ship, f.star);
		expect(f.system.passes).toBe(2);
		expect(f.system.canSend).toBe(false);
		f.step(60);
		f.system.beginTick(true, f.ship, f.star);
		expect(f.system.passes).toBe(2);
		f.system.nextPass = 1000;
		f.step(18 * 60);
		expect(f.system.groups).toBe(0);
		expect(f.system.canSend).toBe(true);
	});
	it("replays summon only once per chunk and isolates ordinary survival", () => {
		const loadout = defaultLoadout("fighter");
		loadout.hull = ["rail", "laser"];
		const settings = {
			...stockSettings("fighter"),
			loadout,
			mode: "derelicts",
		};
		const a = new Simulation(settings),
			b = new Simulation(settings);
		a.start();
		b.start();
		const replay = [
			{ ...idle, ticks: 180, sendDerelict: true },
			{ ...idle, ticks: 180 },
		];
		a.replay(replay);
		b.replay(replay);
		expect(a.salvage?.passes).toBe(1);
		expect(a.salvage).toEqual(b.salvage);
		expect(a.state).toEqual(b.state);
		const snapshot = JSON.stringify(a.salvage);
		a.state.status = "MENU";
		a.step({ ...idle, sendDerelict: true });
		expect(JSON.stringify(a.salvage)).toBe(snapshot);
		const reset = new Simulation(settings);
		expect(reset.salvage?.bodies).toHaveLength(0);
		expect(reset.salvage?.shotsFired).toBe(0);
		const survival = new Simulation({ ...settings, mode: "survival" });
		survival.start();
		survival.replay(replay);
		expect(survival.salvage).toBeUndefined();
	});
});
