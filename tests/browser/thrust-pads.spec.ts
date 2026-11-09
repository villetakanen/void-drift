import type {
  InputAction,
  ThrustPad,
} from "../../packages/core/src/lib/entities/Input";
import { THRUST_PADS } from "../../packages/core/src/lib/entities/Input";
import { test } from "../helpers/local-browser";
import { expectLit, padPoint } from "../helpers/thrust-pads";

test.describe("thrust pads in the Lab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/lab/inputs");
    await page.locator(".stage").scrollIntoViewIfNeeded();
  });

  test("pressing each pad lights the pads of its resolved action", async ({
    page,
  }) => {
    const stage = page.locator(".stage");
    await expectLit(stage, null);
    const expected: Record<ThrustPad, InputAction> = {
      leftUpper: "L",
      leftLower: "LF",
      rightUpper: "R",
      rightLower: "RF",
    };
    for (const pad of THRUST_PADS) {
      const point = await padPoint(page, pad);
      await page.mouse.move(point.x, point.y);
      await page.mouse.down();
      await expectLit(stage, expected[pad]);
      await page.mouse.up();
      await expectLit(stage, null);
    }
  });

  test("a pointer slides across the seam and releases on leaving the assembly", async ({
    page,
  }) => {
    const stage = page.locator(".stage");
    const upper = await padPoint(page, "leftUpper");
    const lower = await padPoint(page, "leftLower");
    await page.mouse.move(upper.x, upper.y);
    await page.mouse.down();
    await expectLit(stage, "L");
    await page.mouse.move(lower.x, lower.y, { steps: 8 });
    await expectLit(stage, "LF");
    const box = await stage.boundingBox();
    if (!box) throw new Error("stage missing");
    await page.mouse.move(box.x + box.width / 2, lower.y, { steps: 8 });
    await expectLit(stage, null);
    // Coming back without lifting does not press again.
    await page.mouse.move(lower.x, lower.y, { steps: 8 });
    await expectLit(stage, null);
    await page.mouse.up();
  });

  test("the state selector shows every lit state", async ({ page }) => {
    const stage = page.locator(".stage");
    const group = page.getByRole("radiogroup", { name: "Thrust pad state" });
    for (const action of ["L", "R", "LR", "LF", "RF"] as const) {
      await group.getByText(action, { exact: true }).click();
      await expectLit(stage, action);
    }
  });
});

test("two thumbs on the upper pads resolve to forward and light only the burn pads", async ({
  newLocalContext,
}) => {
  const context = await newLocalContext({
    viewport: { width: 1280, height: 900 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/lab/inputs");
  await page.locator(".stage").scrollIntoViewIfNeeded();
  const stage = page.locator(".stage");
  const left = await padPoint(page, "leftUpper");
  const right = await padPoint(page, "rightUpper");
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...left, id: 1 }],
  });
  await expectLit(stage, "L");
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { ...left, id: 1 },
      { ...right, id: 2 },
    ],
  });
  await expectLit(stage, "LR");
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expectLit(stage, null);
  await context.close();
});
