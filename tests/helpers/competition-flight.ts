import type { Page } from "@playwright/test";
import {
	gameSettings,
	Simulation,
} from "../../packages/mode-a/src/lib/simulation";

export type CompetitionChassis = "scout" | "corvette";

/** Fixed-step routes found and checked against the production Simulation. */
export const COMPETITION_FLIGHTS: Record<
	CompetitionChassis,
	{ turnTicks: number; thrustTicks: number }
> = {
	scout: { turnTicks: 15, thrustTicks: 101 },
	corvette: { turnTicks: 28, thrustTicks: 125 },
};

const turnLeft = { leftThruster: true, rightThruster: false, fire: false };
const thrustForward = { leftThruster: true, rightThruster: true, fire: false };

export function competitionFlightResult(
	chassis: CompetitionChassis,
	turnTicks = COMPETITION_FLIGHTS[chassis].turnTicks,
	thrustTicks = COMPETITION_FLIGHTS[chassis].thrustTicks,
) {
	const simulation = new Simulation(gameSettings(chassis));
	simulation.start();
	for (let i = 0; i < turnTicks; i++) simulation.step(turnLeft);
	for (let i = 0; i < thrustTicks && simulation.state.status === "PLAYING"; i++)
		simulation.step(thrustForward);
	return {
		status: simulation.state.status,
		cause: simulation.state.deathCause,
		ticks: simulation.ticks,
		elapsed: simulation.state.elapsedTime,
	};
}

/** Advance until the production fixed-step tick count increases exactly once. */
export async function advanceFlightTicks(page: Page, ticks: number) {
	const deck = page.locator(".flight-page");
	for (let step = 0; step < ticks; step++) {
		const before = Number(await deck.getAttribute("data-ticks"));
		let after = before;
		for (
			let millisecond = 0;
			millisecond < 64 && after === before;
			millisecond++
		) {
			await page.clock.runFor(1);
			after = Number(await deck.getAttribute("data-ticks"));
		}
		if (after !== before + 1)
			throw new Error(
				`Expected one flight tick after advancing the browser clock; saw ${before} → ${after}.`,
			);
	}
}

/** Let the landing transition finish without advancing the flight simulation. */
export async function waitForFlightPhase(page: Page, phase: "playing") {
	const deck = page.locator(".flight-page");
	for (let millisecond = 0; millisecond < 1000; millisecond++) {
		if ((await deck.getAttribute("data-phase")) === phase) return;
		await page.clock.runFor(1);
	}
	throw new Error(
		`Flight did not enter ${phase} phase before the clock limit.`,
	);
}
