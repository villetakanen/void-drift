import {
  buildStats,
  defaultLoadout,
  PARTS,
} from "../../packages/mode-a/src/lib/schemas/loadout";
import { chooseShip, enablePreviewContent } from "../helpers/hangar";
import { expect, test } from "../helpers/local-browser";

test("Gravity coil fits, persists and flies separately from solar Loading coil", async ({
  page,
}) => {
  const fitted = defaultLoadout("fighter");
  fitted.hull[0] = "gravity-coil";
  fitted.aft[0] = "coil";
  await page.goto("/hangar");
  await chooseShip(page, "Fighter");
  await enablePreviewContent(page);
  await expect(page.getByRole("button", { name: /^Gravity coil/ })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Hull 1 · Equipment: Empty", exact: true })
    .click();
  const part = page.getByRole("button", { name: /^Gravity coil/ });
  await expect(part).toContainText(PARTS["gravity-coil"].description);
  await part.click();
  await page
    .getByRole("button", { name: "Aft 1 · Universal: Empty", exact: true })
    .click();
  await page.getByRole("button", { name: /^Loading coil/ }).click();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Hull 1 · Equipment: Gravity coil",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Aft 1 · Universal: Loading coil",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-status",
    "PLAYING",
  );
  await expect(
    page.getByRole("progressbar", { name: "Power" }),
  ).toHaveAttribute("max", String(buildStats(fitted).capacity));
  await page.keyboard.down("a");
  await expect
    .poll(async () =>
      Number(await page.locator(".flight-page").getAttribute("data-ticks")),
    )
    .toBeGreaterThan(30);
  await page.keyboard.up("a");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Abort", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Hull 1 · Equipment: Gravity coil",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Remove fitting", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Hull 1 · Equipment: Empty",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Aft 1 · Universal: Loading coil",
      exact: true,
    }),
  ).toBeVisible();
});
