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
  const rail = parts.getByRole("button", { name: /^Rail gun/ });
  await rail.click();
  await page
    .getByRole("checkbox", { name: "Playground", exact: true })
    .uncheck();
  await expect(rail).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Practice", exact: true }),
  ).toBeDisabled();
  const cannon = parts.getByRole("button", { name: /^Light Ion Cannon/ });
  await cannon.focus();
  await page.keyboard.press("Enter");
  await expect(cannon).toHaveAttribute("aria-pressed", "true");
  await expect(rail).toHaveAttribute("aria-disabled", "true");
  await rail.focus();
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
