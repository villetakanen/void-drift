import { expect, it } from "vitest";
import { FxBench } from "./fx-bench";
import { Simulation } from "./simulation";

const both = { leftThruster: true, rightThruster: true, fire: false };
const idle = { leftThruster: false, rightThruster: false, fire: false };
it("arena wrap refreshes outlet state without altering inward momentum", () => {
	const sim = new Simulation();
	sim.start();
	sim.step(both);
	expect(sim.plume.activeCount).toBeGreaterThan(0);
	sim.ship.pos.set(2161, 540);
	sim.ship.vel.set(100, 0);
	sim.step(idle);
	expect(sim.wraps).toBe(1);
	expect(sim.plume.activeCount).toBe(0);
	expect(sim.ship.pos.x).toBeLessThan(960);
	expect(sim.ship.vel.x).toBeGreaterThan(0);
});

it("effect detail and burst overload leave the six simulations identical", () => {
	const a = new FxBench(),
		b = new FxBench();
	b.overload = true;
	b.enabled = false;
	for (let i = 0; i < 180; i++) {
		a.step();
		b.step();
	}
	for (let i = 0; i < 6; i++) {
		expect(a.ships[i].state).toEqual(b.ships[i].state);
		expect(a.ships[i].ship).toEqual(b.ships[i].ship);
	}
	expect(a.ships.some((sim) => sim.gravityCollectionRate > 0)).toBe(true);
	a.reset();
	expect(a.sparks.count).toBe(0);
	for (const sim of a.ships) expect(sim.plume.activeCount).toBe(0);
});
