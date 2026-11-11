import { SURVIVAL_ENCOUNTER } from "../../packages/mode-a/src/lib/schemas/salvage";
import {
  gameSettings,
  Simulation,
  STEP,
} from "../../packages/mode-a/src/lib/simulation";
import { chooseShip, enablePreviewContent } from "../helpers/hangar";
import { expect, test } from "../helpers/local-browser";

test("Hangar opens the current Derelicts encounters with the fitted ship", async ({
  page,
}) => {
  const time = new Date("2026-11-03T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto("/hangar");
  await chooseShip(page, "Fighter");
  await enablePreviewContent(page);
  await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
  await page.getByRole("button", { name: /^Rail gun\b/ }).click();
  await page.getByRole("button", { name: "Derelicts", exact: true }).click();
  const flight = page.locator(".flight-page");
  await expect(flight).toHaveAttribute("data-launch-source", "hangar");
  await page.clock.runFor(7000);
  await expect(flight).toHaveAttribute("data-salvage-passes", "1");
  await expect(page.getByRole("button", { name: "Send derelict" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Abort", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Hull 1 · Equipment: Rail gun" }),
  ).toBeVisible();
});

test("PRESS START uses the seeded Survival derelict schedule", async ({
  page,
}) => {
  // Choose a short, survivable production scenario; the arrival window is tuning.
  let scenario: { seed: number; first: number } | undefined;
  for (let candidate = 1; candidate <= 256; candidate++) {
    const seed = candidate * 104729;
    const sim = new Simulation({
      ...gameSettings("wasp"),
      arrival: true,
      seed,
    });
    sim.start();
    const first = sim.salvage?.nextPass;
    if (
      first === undefined ||
      first <= SURVIVAL_ENCOUNTER.firstPass.min + 0.5 ||
      first > SURVIVAL_ENCOUNTER.firstPass.min + 4
    )
      continue;
    while (
      sim.state.status === "PLAYING" &&
      sim.state.elapsedTime < first + STEP
    )
      sim.step({ leftThruster: false, rightThruster: false, fire: false });
    if (sim.state.status === "PLAYING") {
      scenario = { seed, first };
      break;
    }
  }
  if (!scenario) throw new Error("No short surviving Survival encounter found");
  const time = new Date("2026-11-09T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.addInitScript((seed) => {
    const random = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = ((array: ArrayBufferView) => {
      if (array instanceof Uint32Array && array.length === 1) {
        array[0] = seed - 1;
        return array;
      }
      return random(array);
    }) as typeof crypto.getRandomValues;
  }, scenario.seed);
  await page.goto("/");
  const flight = page.locator(".flight-page");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await page.clock.runFor(3500);
  await expect(flight).toHaveAttribute("data-phase", "playing");
  const elapsed = Number(await flight.getAttribute("data-ticks")) * STEP;
  await page.clock.runFor((scenario.first - elapsed - 2 * STEP) * 1000);
  await expect(flight).toHaveAttribute("data-salvage-passes", "0");
  await page.clock.runFor(4 * STEP * 1000);
  await expect(flight).toHaveAttribute("data-salvage-passes", "1");
  await expect(flight).toHaveAttribute("data-salvage-bodies", "1");
});
