import { chooseShip } from "../helpers/hangar";
import { expect, test } from "../helpers/local-browser";

// Guard against losing saved build/preferences across full-page menu navigation.
test("Settings roundtrip preserves the active ship, fitting and preferences", async ({
  page,
}) => {
  await page.goto("/hangar");
  await chooseShip(page, "Scout");
  await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
  await page.getByRole("button", { name: /^Potential Well\b/ }).click();
  const savedBuilds = await page.evaluate(() =>
    localStorage.getItem("void-drift-builds-v3"),
  );
  expect(savedBuilds).not.toBeNull();

  await page.getByRole("link", { name: "Settings", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/settings\?from=hangar$/);
  await page
    .getByRole("checkbox", { name: "Invert controls", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "Speed camera", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "Combat HUD", exact: true })
    .uncheck();
  await page.reload();
  await page
    .getByRole("link", { name: "Return to Hangar", exact: true })
    .click();
  await expect(page).toHaveURL(/\/hangar$/);
  await expect(
    page.getByRole("tab", { name: "Scout", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("button", { name: "Hull 1 · Equipment: Potential Well" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("void-drift-builds-v3")),
  ).toBe(savedBuilds);

  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Invert controls", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Speed camera", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Combat HUD", exact: true }),
  ).not.toBeChecked();
  await page
    .getByRole("link", { name: "Void Drift home", exact: true })
    .click();
  await expect(page).toHaveURL("/");
});

// A prior Hangar visit or untrusted query must not hijack the return destination.
test("ordinary and unknown Settings context return to title, not history or a URL", async ({
  page,
}) => {
  await page.goto("/hangar");
  for (const route of [
    "/settings",
    "/settings?from=https%3A%2F%2Fexample.com&returnTo=%2Fhangar",
  ]) {
    await page.goto(route);
    const back = page.getByRole("link", {
      name: "Return to title screen",
      exact: true,
    });
    await expect(back).toHaveAttribute("href", "/");
    await expect(
      page.getByRole("link", { name: "Return to Hangar", exact: true }),
    ).toHaveCount(0);
    await back.click();
    await expect(page).toHaveURL("/");
  }
});
