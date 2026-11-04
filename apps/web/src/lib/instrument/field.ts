import { getPlanetInfluenceRadius } from "@void-drift/core";
import {
	type GravityField,
	ION_DEFAULTS,
	type ShipStart,
	Simulation,
	stockSettings,
} from "@void-drift/mode-a";
import { type BurnId, inputAt, TOTAL_TICKS } from "./burns";
import type { Sample } from "./calculate";
import type { InstrumentVehicle } from "./config";

// Field mode (lab-instrument.md, "Gravity field mode"): each vehicle
// flies the production Simulation under the document's field. Gravity comes
// only from Simulation; nothing here computes a pull.

/** A document's field: every field value except the start, which is per vehicle. */
export type InstrumentField = Omit<GravityField, "start">;
export type FieldVehicle = InstrumentVehicle & { start?: ShipStart };

/** One moment in a field: the sample plus gravity acceleration and the nearest surface. */
export type FieldSample = Sample & { gx: number; gy: number; surface: number };
export type FieldEvent = { tick: number; kind: "contact" | "wrap" };
export type Outcome = "star" | "hull" | "power" | "free" | "bound";
export type FieldRun = {
	samples: FieldSample[];
	events: FieldEvent[];
	outcome: Outcome;
};

/** The vehicle's Simulation; throws as Simulation does (a start inside a body). */
export function fieldSimulation(vehicle: FieldVehicle, field: InstrumentField) {
	return new Simulation(
		{
			...stockSettings(vehicle.loadout.chassis),
			loadout: vehicle.loadout,
			ion: { ...ION_DEFAULTS, ...vehicle.changes.ion },
		},
		{ field: { ...field, start: vehicle.start } },
	);
}

/** Distance to the nearest surface: game bodies by their surface, Lab wells by centre. */
function nearestSurface(sim: Simulation, field: InstrumentField) {
	const { x, y } = sim.ship.pos;
	const to = (bx: number, by: number) => Math.hypot(x - bx, y - by);
	let nearest = Number.POSITIVE_INFINITY;
	if (sim.hasSun)
		nearest = to(sim.star.pos.x, sim.star.pos.y) - sim.star.radius;
	for (const planet of sim.planets)
		nearest = Math.min(nearest, to(planet.pos.x, planet.pos.y) - planet.radius);
	for (const well of field.wells)
		nearest = Math.min(nearest, to(well.x, well.y));
	return nearest;
}

function insideSomeReach(sim: Simulation, field: InstrumentField) {
	const { x, y } = sim.ship.pos;
	const to = (bx: number, by: number) => Math.hypot(x - bx, y - by);
	return (
		(sim.hasSun &&
			to(sim.star.pos.x, sim.star.pos.y) < sim.star.influenceRadius) ||
		sim.planets.some(
			(p) => to(p.pos.x, p.pos.y) < getPlanetInfluenceRadius(p),
		) ||
		field.wells.some((w) => to(w.x, w.y) < w.reach)
	);
}

/** Flies one vehicle on a burn under the field, through the production step. */
export function calculateField(
	vehicle: FieldVehicle,
	burn: BurnId,
	field: InstrumentField,
): FieldRun {
	const sim = fieldSimulation(vehicle, field);
	const samples: FieldSample[] = [];
	const events: FieldEvent[] = [];
	const record = () => {
		const gravity = sim.gravityAt();
		samples.push({
			x: sim.ship.pos.x,
			y: sim.ship.pos.y,
			vx: sim.ship.vel.x,
			vy: sim.ship.vel.y,
			spin: (sim.angularMotion.velocity * 180) / Math.PI,
			gx: gravity.x,
			gy: gravity.y,
			surface: nearestSurface(sim, field),
		});
	};
	sim.start();
	record();
	for (let tick = 0; tick < TOTAL_TICKS; tick++) {
		const { left, right } = inputAt(burn, tick);
		const { contacts, wraps } = sim;
		sim.step({ leftThruster: left, rightThruster: right, fire: false });
		if (sim.contacts > contacts)
			events.push({ tick: tick + 1, kind: "contact" });
		if (sim.wraps > wraps) events.push({ tick: tick + 1, kind: "wrap" });
		record();
		const cause = sim.state.deathCause;
		if (sim.state.status !== "PLAYING" && cause)
			return {
				samples,
				events,
				outcome: cause.toLowerCase() as "star" | "hull" | "power",
			};
	}
	return {
		samples,
		events,
		outcome: insideSomeReach(sim, field) ? "bound" : "free",
	};
}
