import { expect, test } from "../helpers/local-browser";
import { expectLit, padPoint } from "../helpers/thrust-pads";

test("armed practice has full resources, no encounters and fresh entry after abort", async ({
  page,
}) => {
  const time = new Date("2026-11-03T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto("/hangar?chassis=fighter");
  await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
  await page.getByRole("button", { name: /^Rail gun\b/ }).click();
  await page.getByRole("button", { name: "Test flight", exact: true }).click();
  const flight = page.locator(".flight-page");
  const initialX = await flight.getAttribute("data-x");
  const initialY = await flight.getAttribute("data-y");
  const power = page.getByRole("progressbar", { name: "Power" });
  const capacity = await power.getAttribute("max");
  await expect(
    page.getByRole("button", { name: /Reset flight|Send derelict/ }),
  ).toHaveCount(0);
  await expect(page.locator(".timer")).toHaveCount(0);
  await page.keyboard.down("ArrowUp");
  await page.clock.runFor(12000);
  await page.keyboard.up("ArrowUp");
  await expect(power).toHaveAttribute("value", capacity ?? "");
  await expect(page.getByRole("progressbar", { name: "Hull" })).toHaveAttribute(
    "value",
    "100",
  );
  await expect(flight).toHaveAttribute("data-status", "PLAYING");
  for (const name of [
    "data-salvage-passes",
    "data-rail-shots",
    "data-salvage-bodies",
  ])
    await expect(flight).toHaveAttribute(name, "0");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const ticks = await flight.getAttribute("data-ticks");
  await page.clock.runFor(1000);
  await expect(flight).toHaveAttribute("data-ticks", ticks ?? "");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(100);
  await expect(flight).not.toHaveAttribute("data-ticks", ticks ?? "");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Abort", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Hull 1 · Equipment: Rail gun" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Test flight", exact: true }).click();
  await expect(flight).toHaveAttribute("data-x", initialX ?? "");
  await expect(flight).toHaveAttribute("data-y", initialY ?? "");
  await expect(page.getByRole("button", { name: "Save Score" })).toHaveCount(0);
});

test("landscape practice retain simultaneous engine input and release", async ({
  page,
  context,
}) => {
  const time = new Date("2026-11-03T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto("/hangar?chassis=wasp");
  await page.getByRole("button", { name: /^Left wing · Equipment:/ }).click();
  await page.getByRole("button", { name: /^Laser\b/ }).click();
  await page.getByRole("button", { name: "Test flight", exact: true }).click();
  const deck = page.locator(".flight-page");
  await expect(page.locator(".thrust-pads")).toHaveCount(2);
  const a = await padPoint(page, "leftUpper"),
    b = await padPoint(page, "rightUpper");
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { ...a, id: 1 },
      { ...b, id: 2 },
    ],
  });
  await page.clock.runFor(500);
  await expectLit(deck, "LR");
  await client.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await page.clock.runFor(32);
  await expectLit(deck, null);
  await expect(page.getByRole("button", { name: "Send derelict" })).toHaveCount(
    0,
  );
});
