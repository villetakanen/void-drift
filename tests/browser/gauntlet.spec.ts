import { expect, test } from "@playwright/test";

test("Hangar launches the first pirate encounter as unranked Gauntlet", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/hangar");
  const launch = page.getByRole("button", { name: "Gauntlet", exact: true });
  await expect(launch).toBeEnabled();
  await launch.click();

  const flight = page.locator(".flight-page");
  await expect(flight).toHaveAttribute("data-mode", "gauntlet");
  await expect(flight).toHaveAttribute("data-ranked", "false");
  await expect(page.getByText("GAUNTLET · UNRANKED")).toBeVisible();
  await expect(flight).toHaveAttribute("data-countdown-text", "FIGHT");
  await expect(flight).toHaveAttribute("data-countdown-tone", "space-purple");
  await expect(flight).toHaveAttribute("data-phase", "playing");
  await page.screenshot({
    path: "/private/tmp/gauntlet-production-1440x900.png",
  });
  const countdownPixels = await page
    .locator('canvas[data-layer="fx"]')
    .evaluate((canvas) => {
      const element = canvas as HTMLCanvasElement;
      const context = element.getContext("2d");
      if (!context) return 0;
      const { data, width, height } = context.getImageData(
        0,
        0,
        element.width,
        element.height,
      );
      let count = 0;
      for (let y = 0; y < height; y += 4)
        for (let x = 0; x < width; x += 4) {
          const offset = (y * width + x) * 4;
          if (data[offset + 3] > 30) count++;
        }
      return count;
    });
  expect(countdownPixels).toBeGreaterThan(10);
  await expect
    .poll(async () => Number(await flight.getAttribute("data-ticks")))
    .toBeGreaterThan(0);
  await expect(flight).toHaveAttribute("data-gauntlet-result", "none");
  expect(errors).toEqual([]);
});

test("the Gauntlet Lab bench exposes the production encounter", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/lab/gauntlet");
  const bench = page.locator(".gauntlet-bench");
  await expect(
    page.getByRole("heading", { name: "Gauntlet · pirate Scout" }),
  ).toBeVisible();
  await expect(page.getByText("PLAYER HULL")).toBeVisible();
  await expect(page.getByText("PIRATE HULL")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reset encounter" }),
  ).toBeEnabled();
  await expect(bench).toHaveAttribute("data-rendered", "true");
  await expect(bench).toHaveAttribute("data-sim-status", "PLAYING");
  await expect
    .poll(async () => Number(await bench.getAttribute("data-ticks")))
    .toBeGreaterThan(0);
  await expect(
    page.getByRole("region", { name: "Pirate pilot plan" }),
  ).toBeVisible();
  await expect
    .poll(async () => Number(await bench.getAttribute("data-range")))
    .toBeLessThan(1400);
  await page.screenshot({ path: "/private/tmp/gauntlet-lab-1440x900.png" });
  const worldPixels = await page
    .locator('canvas[data-layer="world"]')
    .evaluate((canvas) => {
      const element = canvas as HTMLCanvasElement;
      const context = element.getContext("2d");
      if (!context) return 0;
      const { data, width, height } = context.getImageData(
        0,
        0,
        element.width,
        element.height,
      );
      let count = 0;
      for (let y = 0; y < height; y += 8)
        for (let x = 0; x < width; x += 8) {
          const offset = (y * width + x) * 4;
          if (
            data[offset] > 45 ||
            data[offset + 1] > 45 ||
            data[offset + 2] > 45
          )
            count++;
        }
      return count;
    });
  expect(worldPixels).toBeGreaterThan(10);
  const startingResets = await bench.getAttribute("data-resets");
  const startingPosition = await bench.getAttribute("data-x");
  await page.keyboard.down("ArrowLeft");
  await expect(bench).toHaveAttribute("data-left", "true");
  await expect
    .poll(async () => bench.getAttribute("data-x"))
    .not.toBe(startingPosition);
  await page.keyboard.up("ArrowLeft");
  await page.getByRole("button", { name: "Reset encounter" }).click();
  await expect(bench).toHaveAttribute(
    "data-resets",
    String(Number(startingResets) + 1),
  );
  await expect(bench).toHaveAttribute("data-result", "FIGHTING");
  expect(await bench.getAttribute("data-x")).not.toBe(startingPosition);
  expect(errors).toEqual([]);
});
