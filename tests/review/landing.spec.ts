import { expect, test } from "../helpers/local-browser";

for (const [name, random] of [
  ["O", 0.01],
  ["M", 0.99],
] as const) {
  for (const [width, height] of [
    [1280, 720],
    [844, 390],
  ] as const) {
    test(`landing ${name} at ${width}x${height}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height });
      await page.addInitScript((value) => {
        Math.random = () => value;
      }, random);
      const time = new Date("2026-11-03T00:00:00Z");
      await page.clock.install({ time });
      await page.clock.pauseAt(time);
      await page.goto("/");
      await expect(page.locator(".flight-page")).toHaveAttribute(
        "data-landing-sun",
        name,
      );
      await page.clock.runFor(2000);
      const path = info.outputPath("landing.png");
      await page.screenshot({ path });
      await info.attach("landing", { path, contentType: "image/png" });
    });
  }
}
