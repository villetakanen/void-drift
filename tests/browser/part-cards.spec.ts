import { chooseShip } from "../helpers/hangar";
import { expect, test } from "../helpers/local-browser";

test("part cards keep blocked fittings visible and support keyboard replacement", async ({
  page,
}) => {
  await page.goto("/hangar");
  await chooseShip(page, "Fighter");
  await page.getByRole("checkbox", { name: "Playground", exact: true }).check();
  await page
    .getByRole("button", { name: "Hull 1 · Equipment: Empty", exact: true })
    .click();
  const parts = page.getByRole("region", { name: "Compatible parts" });
  const laser = parts.getByRole("button", { name: /^Laser/ });
  await expect(parts.getByRole("button", { name: /^Rail gun/ })).toHaveCount(0);
  await laser.click();
  await page
    .getByRole("checkbox", { name: "Playground", exact: true })
    .uncheck();
  await expect(laser).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Practice", exact: true }),
  ).toBeDisabled();
  const cannon = parts.getByRole("button", { name: /^Light Ion Cannon/ });
  await cannon.focus();
  await page.keyboard.press("Enter");
  await expect(cannon).toHaveAttribute("aria-pressed", "true");
  await expect(laser).toHaveAttribute("aria-disabled", "true");
  await laser.focus();
  await page.keyboard.press("Space");
  await expect(cannon).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Practice", exact: true }),
  ).toBeEnabled();
  await parts.getByRole("button", { name: "Keep empty", exact: true }).click();
  await expect(
    parts.getByRole("button", { name: "Keep empty", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("saved rail survives reload and can be removed", async ({ page }) => {
  await page.goto("/hangar");
  await chooseShip(page, "Fighter");
  await page.evaluate(() => {
    const key = "void-drift-builds-v3";
    const builds = JSON.parse(localStorage.getItem(key) ?? "{}");
    builds.fighter.hull[0] = "rail";
    localStorage.setItem(key, JSON.stringify(builds));
  });
  await page.reload();
  await page
    .getByRole("button", {
      name: "Hull 1 · Equipment: Rail gun (disabled)",
      exact: true,
    })
    .click();
  const parts = page.getByRole("region", { name: "Compatible parts" });
  await expect(
    parts.getByRole("button", { name: /^Rail gun · Disabled/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await expect(
    page.getByRole("button", { name: "Practice", exact: true }),
  ).toBeDisabled();
  await parts.getByRole("button", { name: "Keep empty", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Hull 1 · Equipment: Empty",
      exact: true,
    }),
  ).toBeVisible();
});
