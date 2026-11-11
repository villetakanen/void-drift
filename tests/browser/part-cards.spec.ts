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
  await expect(rail).toHaveClass(/blocked/);
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
  for (const width of [1280, 1024]) {
    await page.setViewportSize({ width, height: 768 });
    expect((await cannon.boundingBox())?.width).toBe(300);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("landscape touch fits an engine without offering an empty choice", async ({
  newLocalContext,
}) => {
  const context = await newLocalContext({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/hangar");
  const parts = page.getByRole("region", { name: "Compatible parts" });
  await expect(
    parts.getByRole("button", { name: "Keep empty", exact: true }),
  ).toHaveCount(0);
  const heavy = parts.getByRole("button", { name: /^Heavy ion/ });
  await heavy.tap();
  await expect(heavy).toHaveAttribute("aria-pressed", "true");
  await expect(heavy).toContainText("Still reliable. Not that cheap, though.");
  await context.close();
});

test("all sanctioned prose fits two lines beside the drawing", async ({
  page,
}) => {
  await page.goto("/hangar");
  await chooseShip(page, "Fighter");
  await page
    .getByRole("button", { name: "Aft 1 · Universal: Empty", exact: true })
    .click();
  const parts = page.getByRole("region", { name: "Compatible parts" });
  await page.evaluate(() => document.fonts.ready);
  const prose = await parts
    .locator(".card:not([aria-disabled]) .prose")
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        text: node.textContent,
        visible: node.clientHeight,
        full: node.scrollHeight,
      })),
    );
  expect(prose).toHaveLength(7);
  for (const line of prose)
    expect(line.full, line.text ?? "part prose").toBeLessThanOrEqual(
      line.visible + 1,
    );
  await page.screenshot({
    path: "artifacts/part-cards-sanctioned.png",
    fullPage: true,
  });
});
