import { GAME_MIN_RATIO } from "../../apps/web/src/lib/game-screen";
import {
  buildStats,
  CHASSIS,
  defaultLoadout,
} from "../../packages/mode-a/src/lib/schemas/loadout";
import { expect, test } from "../helpers/local-browser";

test("fit, persist, practise, pause and return to an assembled ship", async ({
  page,
}) => {
  const time = new Date("2026-11-03T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  const fitted = defaultLoadout("fighter");
  fitted.hull[0] = "heavy-well";
  const capacity = String(buildStats(fitted).capacity);
  await page.goto("/hangar");
  await expect(
    page.getByRole("heading", { name: "Hangar", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Light ion\b/ }).click();
  await expect(
    page.getByRole("button", { name: "Right side · mirrored E: Light ion" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
  await expect(page.getByRole("button", { name: /^Light ion\b/ })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: /^Heavy Potential Well\b/ }).click();
  await expect(
    page
      .getByRole("region", { name: "Ship assembly" })
      .getByRole("button", { name: /Hull 1.*Potential Well/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("radio", { name: "Scout", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("radio", { name: "Corvette", exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Hull 1 · Equipment: Heavy Potential Well",
    }),
  ).toBeVisible();
  // A 4:3 viewport: Practice fills it with no header, so flight is not gated.
  await page.setViewportSize({
    width: 1440,
    height: (1440 * GAME_MIN_RATIO.height) / GAME_MIN_RATIO.width,
  });
  await page.getByRole("button", { name: "Test flight", exact: true }).click();
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-status",
    "PLAYING",
  );
  await expect(
    page.getByRole("progressbar", { name: "Power" }),
  ).toHaveAttribute("max", capacity);
  await page.keyboard.down("a");
  await page.keyboard.down("d");
  await page.clock.runFor(600);
  await expect
    .poll(async () =>
      Number(await page.locator(".flight-page").getAttribute("data-ticks")),
    )
    .toBeGreaterThan(30);
  await page.keyboard.up("a");
  await page.keyboard.up("d");
  await expect(page.getByRole("button", { name: "Reset flight" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("progressbar", { name: "Power" }),
  ).toHaveAttribute("value", capacity);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Abort", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Hull 1 · Equipment: Heavy Potential Well",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start survival" }).click();
  await page.clock.runFor(3200);
  await expect(page.locator("header")).toHaveCount(0);
  await expect(page.locator(".deck-info small").first()).toHaveText("UNRANKED");
});

test("corrupt browser storage recovers to flyable defaults", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("void-drift-builds-v3", '{"broken":true}'),
  );
  await page.goto("/hangar");
  await expect(page.getByRole("status")).toContainText("Restored flyable");
  await expect(
    page.getByRole("button", {
      name: "Left side · mirrored E: Light ion",
    }),
  ).toBeVisible();
});

test("preserves other chassis saves and independently selects tight aft mounts", async ({
  page,
}) => {
  const saved = {
    scout: {
      version: 2,
      chassis: "scout",
      side: "ion",
      hull: ["battery"],
      aft: ["rail"],
    },
    fighter: {
      version: 2,
      chassis: "fighter",
      side: "fusion",
      hull: [null, null],
      aft: [null, null],
    },
    corvette: {
      version: 2,
      chassis: "corvette",
      side: "ion",
      hull: ["coil", null, "laser"],
      aft: ["ion", null, "fusion"],
    },
  };
  await page.clock.install();
  await page.goto("/hangar");
  await page.evaluate(
    (value) =>
      localStorage.setItem("void-drift-builds-v3", JSON.stringify(value)),
    saved,
  );
  await page.reload();
  await expect(
    page.getByRole("radio", { name: "Fighter", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Aft 1 · Universal: Empty" }).click();
  await page.getByRole("button", { name: /^Rail gun\b/ }).click();
  await page.getByRole("button", { name: "Aft 2 · Universal: Empty" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: /^Light ion\b/ }).click();
  await page.reload();
  const restored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("void-drift-builds-v3") ?? "null"),
  );
  expect(restored.scout).toEqual({ ...saved.scout, stabilizers: true });
  expect(restored.corvette).toEqual({ ...saved.corvette, stabilizers: true });
  expect(restored.fighter.aft).toEqual(["rail", "ion"]);
  await page
    .getByRole("radiogroup", { name: "Choose chassis" })
    .getByText("Corvette", { exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mark II Escort Frigate" }),
  ).toBeVisible();
  await expect(page.locator(".mount")).toHaveCount(
    2 + CHASSIS.corvette.hull + CHASSIS.corvette.aft,
  );
  await page.getByRole("button", { name: "Aft 2 · Universal: Empty" }).click();
  await page.getByRole("button", { name: /^Light ion\b/ }).click();
  await page.reload();
  await page
    .getByRole("radiogroup", { name: "Choose chassis" })
    .getByText("Corvette", { exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Aft 2 · Universal: Light ion" }),
  ).toBeVisible();
  await page
    .getByRole("radiogroup", { name: "Choose chassis" })
    .getByText("Fighter", { exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Aegis XF-1 Interceptor" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Aft 1 · Universal: Rail gun" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start survival" }).click();
  await page.clock.runFor(3200);
  await page.keyboard.down("ArrowRight");
  await page.clock.runFor(750);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.down("ArrowUp");
  for (
    let i = 0;
    i < 40 &&
    (await page.locator(".flight-page").getAttribute("data-status")) !==
      "GAME_OVER";
    i++
  )
    await page.clock.runFor(1000);
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-status",
    "GAME_OVER",
  );
  await page.keyboard.up("ArrowUp");
  await expect(page.getByRole("button", { name: "Save Score" })).toHaveCount(0);
  await page
    .getByRole("dialog", { name: "Run complete" })
    .getByRole("button", { name: "Return to Hangar" })
    .click();
  await expect(
    page.getByRole("button", { name: "Aft 1 · Universal: Rail gun" }),
  ).toBeVisible();
});

test("new engine catalog resets old saves and exposes plasma charging in flight", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("void-drift-builds-v1", JSON.stringify({ old: true }));
    localStorage.setItem(
      "void-drift-builds-v2",
      JSON.stringify({ balanced: {}, tank: {} }),
    );
  });
  await page.goto("/hangar");
  await expect
    .poll(() =>
      page.evaluate(() => [
        localStorage.getItem("void-drift-builds-v1"),
        localStorage.getItem("void-drift-builds-v2"),
      ]),
    )
    .toEqual([null, null]);
  await expect(page.getByText("could not be read")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^Heavy ion\b/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Plasma\b/ }).click();
  await expect(
    page.getByRole("button", { name: "Right side · mirrored E: Plasma" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Test flight", exact: true }).click();
  await page.keyboard.down("a");
  await expect(page.locator(".engine-feedback")).toContainText("charging");
  await expect(page.locator(".engine-feedback")).toContainText("firing");
  await page.keyboard.up("a");
  await expect(page.locator(".engine-feedback")).toHaveCount(0);
  await page.keyboard.down("a");
  await expect(page.locator(".engine-feedback")).toContainText("charging");
  await page.keyboard.up("a");
});
