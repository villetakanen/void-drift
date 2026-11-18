import { expect, test } from "../helpers/local-browser";
import { expectLit } from "../helpers/thrust-pads";

test("inversion defaults on and an explicit opt-out persists", async ({
  page,
}) => {
  await page.goto("/settings");
  const toggle = page.getByRole("checkbox", { name: "Invert Controls" });
  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  await page.reload();
  await expect(toggle).not.toBeChecked();
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await page.keyboard.down("ArrowLeft");
  // With inversion off, left input lights the left turn pad.
  await expectLit(page.locator(".flight-page"), "L");
  await page.keyboard.up("ArrowLeft");
});

test("Options migrates and persists camera preference without changing ranked eligibility", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.evaluate(() =>
    localStorage.setItem(
      "void-drift:settings",
      JSON.stringify({ invertControls: false }),
    ),
  );
  await page.reload();
  const invert = page.getByRole("checkbox", { name: "Invert Controls" });
  const camera = page.getByRole("checkbox", {
    name: "Speed camera",
    exact: true,
  });
  await expect(invert).not.toBeChecked();
  await expect(camera).not.toBeChecked();
  await camera.focus();
  await page.keyboard.press("Space");
  await expect(camera).toBeChecked();
  await page.reload();
  await expect(camera).toBeChecked();
  await expect(invert).not.toBeChecked();
  await page.getByRole("link", { name: "Return to title screen" }).click();
  await page.getByRole("button", { name: "PRESS START" }).click();
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-ranked",
    "true",
  );
});

test("unavailable preference storage leaves options and flight usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Unavailable", "QuotaExceededError");
    };
    Storage.prototype.getItem = () => {
      throw new DOMException("Unavailable", "SecurityError");
    };
  });
  await page.goto("/settings");
  const toggle = page.getByRole("checkbox", {
    name: "Speed camera",
    exact: true,
  });
  await toggle.check();
  await expect(toggle).toBeChecked();
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-status",
    "PLAYING",
  );
});
