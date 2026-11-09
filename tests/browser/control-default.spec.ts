import { expect, test } from "../helpers/local-browser";
import { expectLit } from "../helpers/thrust-pads";

test("inversion defaults on and an explicit opt-out persists", async ({
  page,
}) => {
  await page.goto("/settings");
  const toggle = page.getByRole("checkbox");
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
