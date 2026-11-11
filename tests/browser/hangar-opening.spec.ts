import { chooseShip, enablePreviewContent } from "../helpers/hangar";
import { expect, test } from "../helpers/local-browser";

test("legacy Hangar links retain queries without selecting a ship", async ({
  page,
}) => {
  await page.goto("/builder?chassis=fiddler&source=legacy#opening");
  await expect(page).toHaveURL(
    /\/hangar\?chassis=fiddler&source=legacy#opening$/,
  );
  await expect(
    page.getByRole("tab", { name: "Wasp", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await chooseShip(page, "Scout");
  await page.goto("/hangar?chassis=fighter");
  await expect(
    page.getByRole("tab", { name: "Scout", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});

test("Experimental persists and navigation preserves the active ship", async ({
  page,
}) => {
  await page.goto("/hangar");
  const experimental = page.getByRole("checkbox", {
    name: "Playground",
    exact: true,
  });
  await expect(experimental).not.toBeChecked();
  await expect(
    page.getByText("Only scored ships and parts can fly."),
  ).toHaveCount(0);
  await enablePreviewContent(page);
  await chooseShip(page, "Fiddler");
  await experimental.focus();
  await page.keyboard.press("Space");
  await expect(experimental).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Practice", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Space");
  await expect(experimental).toBeChecked();
  await page.reload();
  await expect(experimental).toBeChecked();
  await expect(
    page.getByRole("tab", { name: "Fiddler", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("link", { name: "Void Drift", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("link", { name: "HANGAR", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Fiddler", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("link", { name: "Void Drift", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/);
});

test("Hangar opening", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/hangar");
  await expect(
    page.getByRole("heading", { name: "Hangar", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Playground", exact: true }),
  ).not.toBeChecked();
  await page.screenshot({ path: "artifacts/hangar-opening.png" });
});

test("compact header stays one row when Playground changes on landscape iPad", async ({
  page,
}) => {
  for (const [width, height] of [
    [1024, 768],
    [1180, 820],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/hangar");
    const header = page.locator(".hangar-header");
    const playground = header.getByRole("checkbox", {
      name: "Playground",
      exact: true,
    });
    await playground.uncheck();
    await expect(
      page.getByRole("heading", { name: "Hangar", exact: true }),
    ).toHaveCount(1);
    await expect(header.getByRole("link")).toHaveCount(1);
    await expect(
      header.getByRole("link", { name: "Void Drift", exact: true }),
    ).toHaveAttribute("href", "/");
    const before = await header.boundingBox();
    const logo = await header.getByRole("link").boundingBox();
    const control = await playground.boundingBox();
    if (!before || !logo || !control)
      throw new Error("Header control geometry missing");
    expect(
      Math.abs(logo.y + logo.height / 2 - control.y - control.height / 2),
    ).toBeLessThan(1);
    await playground.check();
    await expect(page.locator("footer").getByRole("status")).toHaveText(
      "Playground · Scoring off",
    );
    await expect(header.getByText(/Scoring off/i)).toHaveCount(0);
    const after = await header.boundingBox();
    if (!after) throw new Error("Header missing after enabling Playground");
    expect(after.height).toBeCloseTo(before.height, 1);
    await expect(page.locator("footer")).toHaveCSS("position", "sticky");
    await page.evaluate(() => document.fonts.ready);
    await header.evaluate(async (node) => {
      await Promise.all(
        node
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      );
    });
    await page.screenshot({ path: `artifacts/hangar-header-${width}-on.png` });
    await playground.uncheck();
    await expect(
      page
        .locator("footer")
        .getByText("Playground · Scoring off", { exact: true }),
    ).toHaveCount(0);
  }
});

test("ship tabs own the workbench and activate only on deliberate selection", async ({
  page,
}) => {
  await page.goto("/hangar");
  const row = page.getByRole("tablist", { name: "Choose chassis" });
  const wasp = row.getByRole("tab", { name: "Wasp", exact: true });
  const scout = row.getByRole("tab", { name: "Scout", exact: true });
  const corvette = row.getByRole("tab", { name: "Corvette", exact: true });
  const panel = page.getByRole("tabpanel");
  await expect(wasp).toHaveAttribute("aria-selected", "true");
  await expect(
    panel.getByRole("region", { name: "Ship assembly" }),
  ).toBeVisible();
  const panelId = await wasp.getAttribute("aria-controls");
  if (!panelId)
    throw new Error("Selected tab must control its workbench panel");
  await expect(panel).toHaveAttribute("id", panelId);
  await wasp.focus();
  await page.keyboard.press("ArrowRight");
  await expect(scout).toBeFocused();
  await expect(wasp).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter");
  await expect(scout).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(corvette).toBeFocused();
  await expect(corvette).toBeDisabled();
  await page.keyboard.press("Space");
  await expect(scout).toHaveAttribute("aria-selected", "true");
  await page.reload();
  await expect(scout).toHaveAttribute("aria-selected", "true");

  for (const [width, height] of [
    [1024, 768],
    [1180, 820],
    [1440, 1000],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    const off = await row.boundingBox();
    expect(off?.height).toBe(44);
    const geometry = await row.evaluate((node) => ({
      width: node.clientWidth,
      content: node.scrollWidth,
      tops: [...node.children].map(
        (child) => child.getBoundingClientRect().top,
      ),
    }));
    expect(geometry.content).toBeLessThanOrEqual(geometry.width + 1);
    expect(new Set(geometry.tops).size).toBe(1);
    await enablePreviewContent(page);
    await expect(corvette).toBeEnabled();
    expect((await row.boundingBox())?.height).toBe(off?.height);
    await expect(row.getByText(/unsanctioned/i)).toHaveCount(0);
    await chooseShip(page, "Corvette");
    await expect(corvette).toHaveAttribute("aria-selected", "true");
    await expect(
      panel.getByRole("heading", { name: "Mark II Escort Frigate" }),
    ).toBeVisible();
    await page.locator(".builder").evaluate(async (node) => {
      await Promise.all(
        node
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      );
    });
    await page.screenshot({ path: `artifacts/hangar-tabs-${width}-on.png` });
    await page
      .getByRole("checkbox", { name: "Playground", exact: true })
      .uncheck();
    await expect(corvette).toHaveAttribute("aria-selected", "true");
    await expect(corvette).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Practice", exact: true }),
    ).toBeDisabled();
    await page.locator(".builder").evaluate(async (node) => {
      await Promise.all(
        node
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      );
    });
    await page.screenshot({ path: `artifacts/hangar-tabs-${width}-off.png` });
    await chooseShip(page, "Scout");
  }
});
