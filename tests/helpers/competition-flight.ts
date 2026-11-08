import type { Page } from "@playwright/test";
import {
  gameSettings,
  Simulation,
} from "../../packages/mode-a/src/lib/simulation";

export type CompetitionChassis = "wasp";

/** Predict a seeded arrival through the real production simulation. */
export function competitionFlightResult(
  chassis: CompetitionChassis,
  seed: number,
) {
  const simulation = new Simulation({
    ...gameSettings(chassis),
    arrival: true,
    seed,
  });
  simulation.start();
  while (simulation.state.status === "PLAYING" && simulation.ticks < 36000)
    simulation.step({ leftThruster: false, rightThruster: false, fire: false });
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
  for (let millisecond = 0; millisecond < 4000; millisecond++) {
    if ((await deck.getAttribute("data-phase")) === phase) return;
    await page.clock.runFor(1);
  }
  throw new Error(
    `Flight did not enter ${phase} phase before the clock limit.`,
  );
}
