import type { Page } from "@playwright/test";
import { chooseShip, enablePreviewContent } from "../helpers/hangar";
import { expect, test } from "../helpers/local-browser";

async function chooseExperimental(page: Page, value: "Off" | "On") {
  await page
    .getByRole("checkbox", { name: "Playground", exact: true })
    .setChecked(value === "On");
}

test("a fresh device flies its fitted Wasp, and Hangar changes survive a reload", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/hangar?chassis=scout");
  await expect(
    page.getByRole("tab", { name: "Wasp", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "Practice" })).toBeEnabled();

  const wasp = page.getByRole("tab", { name: "Wasp", exact: true });
  await wasp.focus();
  await page.keyboard.press("ArrowRight");
  await expect(wasp).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("tab", { name: "Scout", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
  await page.getByRole("button", { name: /^Potential Well\b/ }).click();
  await chooseShip(page, "Wasp");
  await chooseShip(page, "Scout");
  await expect(
    page.getByRole("button", { name: "Hull 1 · Equipment: Potential Well" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("tab", { name: "Scout", exact: true }),
  ).toHaveAttribute("aria-selected", "true");

  await page.getByRole("link", { name: "Void Drift", exact: true }).click();
  await page.getByRole("button", { name: "PRESS START", exact: true }).click();
  const flight = page.locator(".flight-page");
  await expect(flight).toHaveAttribute("data-phase", "starting");
  await expect(flight).toHaveAttribute("data-chassis", "scout");
  await expect(flight).toHaveAttribute("data-ranked", "true");
  await expect(flight).toHaveAttribute("data-launch-source", "title");
});

test("turning Experimental Off preserves a preview ship and blocks both launch sources", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/hangar");
  await enablePreviewContent(page);
  await chooseShip(page, "Fiddler");
  await chooseExperimental(page, "Off");
  await expect(
    page.getByRole("tab", { name: "Fiddler", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "Practice" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Survival" })).toBeDisabled();

  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("void-drift-builds-v3") ?? "null"),
  );
  expect(saved.activeChassis).toBe("fiddler");
  await page.getByRole("link", { name: "Void Drift", exact: true }).click();
  const start = page.getByRole("button", { name: "PRESS START", exact: true });
  await expect(start).toBeDisabled();
  await expect(
    page.getByRole("status").filter({
      hasText: "PLAYGROUND REQUIRED",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "HANGAR", exact: true }),
  ).toBeFocused();

  await page.getByRole("link", { name: "HANGAR", exact: true }).click();
  await chooseShip(page, "Wasp");
  await expect(page.getByRole("button", { name: "Survival" })).toBeEnabled();
  await page.getByRole("button", { name: "Survival" }).click();
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-ranked",
    "true",
  );
});
