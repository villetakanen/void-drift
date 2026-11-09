import { expect, test } from "../helpers/local-browser";

test("Hangar opens the current Derelicts encounters with the fitted ship", async ({
  page,
}) => {
  const time = new Date("2026-11-03T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto("/hangar?chassis=fighter");
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

test("survival from PRESS START meets its first derelict three seconds into flight", async ({
  page,
}) => {
  const time = new Date("2026-11-09T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto("/");
  const flight = page.locator(".flight-page");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await expect(flight).toHaveAttribute("data-phase", "starting");
  await page.clock.runFor(3500);
  await expect(flight).toHaveAttribute("data-phase", "playing");
  await expect(flight).toHaveAttribute("data-salvage-passes", "0");
  await page.clock.runFor(2000);
  await expect(flight).toHaveAttribute("data-salvage-passes", "0");
  await page.clock.runFor(1500);
  await expect(flight).toHaveAttribute("data-salvage-passes", "1");
  await expect(flight).toHaveAttribute("data-salvage-bodies", "1");
});
