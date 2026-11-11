import type { Page } from "@playwright/test";
import {
  buildStats,
  defaultLoadout,
} from "../../packages/mode-a/src/lib/schemas/loadout";
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
  await expect(page.locator(".actions button")).toHaveText([
    "Practice",
    "Derelicts",
    "Gauntlet",
    "Survival",
  ]);

  await chooseShip(page, "Scout");
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

  await page.getByRole("button", { name: "Survival", exact: true }).click();
  const flight = page.locator(".flight-page");
  await expect(flight).toHaveAttribute("data-phase", "starting");
  await expect(flight).toHaveAttribute("data-chassis", "scout");
  await expect(flight).toHaveAttribute("data-ranked", "true");
  await expect(flight).toHaveAttribute("data-launch-source", "hangar");
});

test("the title launches its active ship and freezes it for the run", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/hangar");
  await chooseShip(page, "Scout");
  await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
  await page.getByRole("button", { name: /^Potential Well\b/ }).click();
  await page.getByRole("link", { name: "Void Drift", exact: true }).click();
  await expect(
    page.getByText("ACTIVE SHIP · Scout", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "PRESS START", exact: true }).click();
  await page.evaluate(async (modulePath) => {
    const setup = await import(modulePath);
    setup.setActiveChassis("wasp");
    setup.setExperimentalSetting("On");
  }, "/src/lib/stores/ship-setup.ts");
  await page.clock.runFor(3400);
  const flight = page.locator(".flight-page");
  await expect(flight).toHaveAttribute("data-chassis", "scout");
  await expect(flight).toHaveAttribute("data-experimental", "Off");
  await expect(flight).toHaveAttribute("data-ranked", "true");
  await expect(flight).toHaveAttribute("data-launch-source", "title");
});

test("Experimental and blocked title states retain portrait framing and native controls", async ({
  page,
}) => {
  await page.clock.install();
  const viewport = { width: 768, height: 1024 };
  await page.setViewportSize(viewport);
  await page.goto("/hangar");
  await enablePreviewContent(page);
  await page.getByRole("link", { name: "Void Drift", exact: true }).click();
  await expect(page.locator(".playground-status")).toHaveText(
    "PLAYGROUND ACTIVEUNRANKED PLAY",
  );
  await expect(page.locator(".playground-status br")).toHaveCount(1);

  const slot = page.locator(".title-slot");
  const assertFrame = async () => {
    const box = await slot.boundingBox();
    if (!box) throw new Error("Title slot missing");
    expect(box.width).toBeCloseTo(viewport.width, 0);
    expect(box.height).toBeCloseTo((box.width * 9) / 16, 0);
    for (const action of await page.locator(".title-panel .btn").all()) {
      const actionBox = await action.boundingBox();
      if (!actionBox) throw new Error("Title action missing");
      expect(actionBox.height).toBeGreaterThanOrEqual(44);
      const textLines = await action.evaluate((button) => {
        const range = document.createRange();
        range.selectNodeContents(button);
        return new Set(
          [...range.getClientRects()]
            .filter((rect) => rect.width > 0)
            .map((rect) => Math.round(rect.top)),
        ).size;
      });
      expect(textLines).toBe(1);
      expect(
        await action.evaluate((node) => getComputedStyle(node).fontSize),
      ).toBe("16px");
    }
  };
  await assertFrame();

  await page.getByRole("link", { name: "HANGAR", exact: true }).click();
  await chooseShip(page, "Fiddler");
  await chooseExperimental(page, "Off");
  await page.getByRole("link", { name: "Void Drift", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "PRESS START", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".playground-status")).toHaveText(
    "UNSANCTIONED BUILDPLAYGROUND REQUIRED",
  );
  await expect(page.locator(".playground-status br")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "HANGAR", exact: true }),
  ).toBeFocused();
  await assertFrame();

  await page.setViewportSize({ width: 1280, height: 800 });
  const rotatingHint = page.locator(".hint p");
  await expect(rotatingHint).toBeVisible();
  const firstHint = await rotatingHint.textContent();
  await page.clock.runFor(8000);
  await expect(rotatingHint).not.toHaveText(firstHint ?? "");
  await expect(page.locator(".playground-status")).toHaveText(
    "UNSANCTIONED BUILDPLAYGROUND REQUIRED",
  );
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
      hasText: "Playground is Off",
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

test("turning Experimental Off preserves a preview fitting until the player changes it", async ({
  page,
}) => {
  await page.goto("/hangar");
  await enablePreviewContent(page);
  await page
    .getByRole("button", { name: "Left wing · Equipment: Ion Point Defence" })
    .click();
  await page.getByRole("button", { name: /^Laser\b/ }).click();
  await chooseExperimental(page, "Off");

  await expect(
    page.getByRole("button", { name: "Left wing · Equipment: Laser" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Laser\b/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Survival" })).toBeDisabled();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("void-drift-builds-v3") ?? "null"),
  );
  expect(stored.wasp.hull).toContain("laser");

  await page.getByRole("button", { name: /^Ion Point Defence\b/ }).click();
  await expect(page.getByRole("button", { name: "Survival" })).toBeEnabled();
  await expect(
    page.getByRole("button", {
      name: "Left wing · Equipment: Ion Point Defence",
    }),
  ).toBeVisible();
});

test("Experimental runs keep the active ship and never expose score submission", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/hangar");
  await enablePreviewContent(page);
  await chooseShip(page, "Scout");
  await page.getByRole("button", { name: "Survival" }).click();

  const flight = page.locator(".flight-page");
  await expect(flight).toHaveAttribute("data-chassis", "scout");
  await expect(flight).toHaveAttribute("data-experimental", "On");
  await expect(flight).toHaveAttribute("data-ranked", "false");
  await expect(page.getByText("No score for this run.")).toBeVisible();
  await expect(page.getByText("SCORING OFF")).toBeVisible();
});

test("an Experimental Survival completion shows time and no score action", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.clock.install();
  await page.addInitScript(() => {
    const random = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = ((array: ArrayBufferView) => {
      if (array instanceof Uint32Array && array.length === 1) {
        array[0] = 157;
        return array;
      }
      return random(array);
    }) as typeof crypto.getRandomValues;
  });
  await page.goto("/hangar");
  await enablePreviewContent(page);
  await page.getByRole("button", { name: "Survival" }).click();
  const flight = page.locator(".flight-page");
  await expect(flight).toHaveAttribute("data-phase", "starting");
  await page.clock.runFor(3400);
  await expect(flight).toHaveAttribute("data-seed", "158");
  await expect(flight).toHaveAttribute("data-ranked", "false");

  for (let i = 0; i < 25; i++) {
    if ((await flight.getAttribute("data-status")) === "GAME_OVER") break;
    await page.clock.runFor(1000);
  }
  const result = page.getByRole("dialog", { name: "Run complete" });
  await expect(result).toBeVisible();
  await expect(result.getByText(/seconds\./)).toBeVisible();
  await expect(result.getByText("No score for this run.")).toBeVisible();
  await expect(result.getByRole("button", { name: "Save Score" })).toHaveCount(
    0,
  );
  await expect(result.getByRole("link", { name: "Top Scores" })).toBeVisible();
});

test("iPad landscape touch chooses, fits in View, flies and returns unchanged", async ({
  newLocalContext,
}) => {
  const context = await newLocalContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("/hangar");
  await page
    .getByRole("tablist", { name: "Choose chassis" })
    .getByText("Scout", { exact: true })
    .tap();
  await page
    .getByRole("button", { name: "Hull 1 · Equipment: Empty", exact: true })
    .tap();
  await page
    .getByRole("radiogroup", { name: "Ship preview mode" })
    .getByText("View", { exact: true })
    .tap();
  await page.getByRole("button", { name: /^Heavy Potential Well\b/ }).tap();
  const fitted = defaultLoadout("scout");
  fitted.hull[0] = "heavy-well";
  await page.getByRole("button", { name: "Practice", exact: true }).tap();
  await expect(
    page.getByRole("progressbar", { name: "Power" }),
  ).toHaveAttribute("max", String(buildStats(fitted).capacity));
  await page.getByRole("button", { name: "Pause", exact: true }).tap();
  await page.getByRole("button", { name: "Abort", exact: true }).tap();
  await expect(
    page.getByRole("radio", { name: "View", exact: true }),
  ).toBeChecked();
  await page
    .getByRole("radiogroup", { name: "Ship preview mode" })
    .getByText("Plan", { exact: true })
    .tap();
  await expect(
    page.getByRole("button", {
      name: "Hull 1 · Equipment: Heavy Potential Well",
      exact: true,
    }),
  ).toBeVisible();
  await context.close();
});
