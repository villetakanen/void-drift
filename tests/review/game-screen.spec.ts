import { expect, test } from "../helpers/local-browser";

test("Survival screen at desktop, tablet and phone sizes", async ({
  page,
}, info) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await page.clock.runFor(3500);
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-phase",
    "playing",
  );
  for (const [name, width, height] of [
    ["desktop", 1920, 1080],
    ["ipad", 1024, 768],
    ["phone", 844, 390],
    ["portrait", 768, 1024],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.clock.runFor(32);
    const path = info.outputPath(`survival-${name}.png`);
    await page.screenshot({ path });
    await info.attach(name, { path, contentType: "image/png" });
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(
    page.getByRole("dialog", { name: "Paused", exact: true }),
  ).toBeVisible();
  const path = info.outputPath("survival-paused.png");
  await page.screenshot({ path });
  await info.attach("paused", { path, contentType: "image/png" });
});
