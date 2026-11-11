import { expect, test } from "../helpers/local-browser";

test("production Gauntlet launches both opponents and keeps pause usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/hangar");
  await page.getByRole("button", { name: "Gauntlet", exact: true }).click();

  const flight = page.locator(".flight-page");
  await expect(flight).toHaveAttribute("data-mode", "gauntlet");
  await expect(flight).toHaveAttribute("data-gauntlet-opponents", "2");
  await expect(flight).toHaveAttribute("data-countdown-tone", "space-purple");
  await expect
    .poll(async () => Number(await flight.getAttribute("data-ticks")))
    .toBeGreaterThan(0);

  await page.getByRole("button", { name: "Pause" }).click();
  const paused = page.getByRole("dialog", { name: "Paused" });
  await expect(paused).toBeVisible();
  const pausedTicks = Number(await flight.getAttribute("data-ticks"));
  await page.waitForTimeout(100);
  await expect(flight).toHaveAttribute("data-ticks", String(pausedTicks));
  await paused.getByRole("button", { name: "Resume" }).click();
  await expect(paused).toBeHidden();
  await expect
    .poll(async () => Number(await flight.getAttribute("data-ticks")))
    .toBeGreaterThan(pausedTicks);

  await page.getByRole("button", { name: "Pause" }).click();
  await page
    .getByRole("dialog", { name: "Paused" })
    .getByRole("button", { name: "Abort" })
    .click();
  await expect(page.locator(".flight-page")).toHaveCount(0);
  const relaunch = page.getByRole("button", { name: "Gauntlet", exact: true });
  await expect(relaunch).toBeEnabled();
  await relaunch.click();
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-gauntlet-opponents",
    "2",
  );
});

test("Gauntlet Lab renders both independently readable pirate hulls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/lab/gauntlet");
  const bench = page.locator(".gauntlet-bench");
  await expect(bench).toHaveAttribute("data-opponents", "2");
  await expect(page.getByText("PIRATE HULL")).toBeVisible();
  await expect(page.getByText("PIRATE 2 HULL")).toBeVisible();
  await expect(bench).toHaveAttribute("data-rendered", "true");
  const resets = Number(await bench.getAttribute("data-resets"));
  await page.getByRole("button", { name: "Reset encounter" }).click();
  await expect(bench).toHaveAttribute("data-resets", String(resets + 1));
});
