import { describe, expect, it } from "vitest";
import { gameSettings, Simulation } from "./simulation";

// Scenarios on the game sun (docs/specs/gravity-field.md), planets removed.
const idle = { leftThruster: false, rightThruster: false, fire: false };
function sunFlight(x: number, y: number, heading: number, speed: number) {
	const sim = new Simulation(gameSettings());
	sim.planets.length = 0;
	const angle = (heading * Math.PI) / 180;
	sim.ship.pos.set(x, y);
	sim.ship.rotation = angle;
	sim.ship.vel.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
	sim.start();
	const path = [];
	for (let tick = 0; tick < 840 && sim.state.status === "PLAYING"; tick++) {
		sim.step(idle);
		path.push({ x: sim.ship.pos.x, y: sim.ship.pos.y, vy: sim.ship.vel.y });
	}
	return { sim, path };
}

describe("game sun scenarios", () => {
	it("ends the run with STAR when going too deep", () => {
		const reach = new Simulation(gameSettings()).star.influenceRadius;
		const { sim } = sunFlight(960 - 0.9 * reach, 540, 0, 0);
		expect(sim.state.deathCause).toBe("STAR");
	});

	it("bends a fast close pass and lets it escape", () => {
		const { star } = new Simulation(gameSettings());
		const reach = star.influenceRadius;
		const { sim, path } = sunFlight(
			960 - reach - 20,
			540 + 0.45 * reach,
			0,
			500,
		);
		const distances = path.map((p) => Math.hypot(p.x - 960, p.y - 540));
		const closest = Math.min(...distances);
		expect(closest).toBeLessThan(reach / 2);
		expect(closest).toBeGreaterThan(star.radius + sim.ship.radius);
		expect(path.at(-1)?.vy).toBeLessThan(0);
		expect(
			distances.findIndex(
				(d, i) => i > distances.indexOf(closest) && d > reach,
			),
		).toBeGreaterThan(-1);
		expect(sim.state.deathCause).toBeNull();
	});
});
