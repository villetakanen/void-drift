import { GAME_MIN_RATIO } from "../../apps/web/src/lib/game-screen";
import {
  BuildStoreSchema,
  buildStats,
  CHASSIS,
} from "../../packages/mode-a/src/lib/schemas/loadout";
import { expect, test } from "../helpers/local-browser";

test("Scout restores its four-slot save, fits equipment and engines and flies from the canonical Lab", async ({
  page,
}) => {
  const time = new Date("2026-11-03T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto("/hangar");
  await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
  await page.getByRole("button", { name: /^Potential Well\b/ }).click();
  await page
    .getByRole("radiogroup", { name: "Choose chassis" })
    .getByText("Corvette", { exact: true })
    .click();
  await page.getByRole("button", { name: "Hull 2 · Equipment: Empty" }).click();
  await page.getByRole("button", { name: /^Loading coil\b/ }).click();
  const before = await page.evaluate(() =>
    localStorage.getItem("void-drift-builds-v3"),
  );
  if (!before) throw new Error("Initial chassis builds not saved");
  await page.goto("/lab/builder?chassis=scout");
  await expect(
    page.getByRole("radio", { name: "Scout", exact: true }),
  ).toBeChecked();
  await expect(page.locator(".mount")).toHaveCount(
    2 + CHASSIS.scout.hull + CHASSIS.scout.aft,
  );
  await expect(
    page.getByText("Scout design is pending.", { exact: false }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Right side · mirrored E: Light ion",
    }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Left side · mirrored E: Light ion" })
    .focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: /^Light ion\b/ }).click();
  await expect(
    page.getByRole("button", { name: "Left side · mirrored E: Light ion" }),
  ).toBeVisible();

  for (const [part, label] of [
    ["Rail gun", "Rail gun"],
    ["Loading coil", "Loading coil"],
  ]) {
    await page.locator(".mount").nth(2).click();
    await expect(
      page.getByRole("button", { name: /^Light ion\b/ }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: new RegExp(`^${part}\\b`) }).click();
    await expect(
      page.getByRole("button", { name: `Hull 1 · Equipment: ${label}` }),
    ).toBeVisible();
  }
  for (const part of ["Rail gun", "Light ion"]) {
    await page.locator(".mount").nth(3).click();
    await page.getByRole("button", { name: new RegExp(`^${part}\\b`) }).click();
    await expect(
      page.getByRole("button", { name: `Aft 1 · Universal: ${part}` }),
    ).toBeVisible();
  }
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Hull 1 · Equipment: Loading coil" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Aft 1 · Universal: Light ion" }),
  ).toBeVisible();
  const after = await page.evaluate(() =>
    localStorage.getItem("void-drift-builds-v3"),
  );
  if (!after) throw new Error("Scout build not saved");
  const savedBefore = BuildStoreSchema.parse(JSON.parse(before));
  const savedAfter = BuildStoreSchema.parse(JSON.parse(after));
  // Compare unrelated version-1 builds, not just their presence.
  for (const chassis of ["fighter", "corvette"] as const) {
    expect(savedAfter[chassis]).toEqual(savedBefore[chassis]);
  }
  // A 4:3 viewport: Practice fills it with no header, so flight is not gated.
  await page.setViewportSize({
    width: 1440,
    height: (1440 * GAME_MIN_RATIO.height) / GAME_MIN_RATIO.width,
  });
  await page.getByRole("button", { name: "Test flight", exact: true }).click();
  const deck = page.locator(".flight-page");
  await expect(deck).toHaveAttribute("data-status", "PLAYING");
  const x = await deck.getAttribute("data-x");
  const tick = Number(await deck.getAttribute("data-ticks"));
  await page.keyboard.down("a");
  await page.clock.runFor(32);
  await expect(
    page.getByRole("button", { name: "Right engine", exact: true }),
  ).toHaveClass(/active/);
  await page.keyboard.down("d");
  await page.clock.runFor(32);
  await expect(
    page.getByRole("button", { name: "Left engine", exact: true }),
  ).toHaveClass(/active/);
  await page.clock.runFor(800);
  await expect
    .poll(async () => Number(await deck.getAttribute("data-ticks")))
    .toBeGreaterThan(tick + 45);
  await page.keyboard.up("a");
  await page.keyboard.up("d");
  await expect.poll(() => deck.getAttribute("data-x")).not.toBe(x);
  await expect(page.getByRole("button", { name: "Reset flight" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("progressbar", { name: "Power" }),
  ).toHaveAttribute("value", String(buildStats(savedAfter.scout).capacity));
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Abort", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Aft 1 · Universal: Light ion" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start survival" }).click();
  await expect(page.locator("header")).toHaveCount(0);
  await expect(page.locator(".flight-actions")).toContainText(
    "CUSTOM BUILD / UNRANKED",
  );
});

test("invalid chassis deep links recover to the normal Fighter selection", async ({
  page,
}) => {
  await page.goto("/hangar?chassis=not-a-chassis");
  await expect(
    page.getByRole("radio", { name: "Fighter", exact: true }),
  ).toBeChecked();
});
