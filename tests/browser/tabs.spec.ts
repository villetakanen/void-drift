import { expect, test } from "../helpers/local-browser";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/lab/ds/tabs");
  // The row is server-rendered; drive it only once it has hydrated.
  await page.waitForSelector("astro-island:not([ssr])");
});

test("a tab shows its own panel, by pointer and by arrow keys", async ({
  page,
}) => {
  const host = page.getByTestId("tabs-plain");
  const tabs = host.getByRole("tab");
  const panel = host.getByRole("tabpanel");
  const scout = host.getByRole("tab", { name: "Scout" });
  await expect(scout).toHaveAttribute("aria-selected", "true");
  await expect(panel).toHaveAccessibleName("Scout");

  await host.getByRole("tab", { name: "Fighter" }).click();
  await expect(panel).toHaveAccessibleName("Fighter");
  await expect(host.getByRole("tab", { selected: true })).toHaveCount(1);
  // The panel is the element its tab controls.
  const controls = await host
    .getByRole("tab", { name: "Fighter" })
    .getAttribute("aria-controls");
  await expect(panel).toHaveAttribute("id", controls ?? "");

  // Automatic activation: focus and selection move together and wrap.
  await page.keyboard.press("ArrowRight");
  await expect(tabs.last()).toBeFocused();
  await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(tabs.first()).toBeFocused();
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(tabs.last()).toBeFocused();
  await page.keyboard.press("Home");
  await expect(tabs.first()).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(tabs.last()).toBeFocused();

  // The row is one tab stop; the next stop is the panel.
  await expect(host.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(panel).toBeFocused();
});

test("manual activation moves focus without changing the panel", async ({
  page,
}) => {
  const host = page.getByTestId("tabs-manual");
  const panel = host.getByRole("tabpanel");
  const first = host.getByRole("tab").first();
  await first.focus();
  const before = await panel.getAttribute("aria-labelledby");
  await page.keyboard.press("ArrowRight");
  const second = host.getByRole("tab").nth(1);
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute("aria-selected", "false");
  await expect(panel).toHaveAttribute("aria-labelledby", before ?? "");
  await page.keyboard.press("Enter");
  await expect(second).toHaveAttribute("aria-selected", "true");
  await expect(panel).toHaveAttribute(
    "aria-labelledby",
    (await second.getAttribute("id")) ?? "",
  );
});

test("an unavailable tab takes focus, explains itself and is never selected", async ({
  page,
}) => {
  const host = page.getByTestId("tabs-detailed");
  const unavailable = host.getByRole("tab", { disabled: true });
  await expect(unavailable).toHaveCount(1);
  // Its facts stay readable as the tab's description.
  await expect(unavailable).toHaveAccessibleDescription(/\S/);
  const selected = host.getByRole("tab", { selected: true });
  const name = await selected.getAttribute("id");

  // Playwright will not press an aria-disabled control unless forced.
  await unavailable.click({ force: true });
  await expect(selected).toHaveAttribute("id", name ?? "");
  await selected.focus();
  await page.keyboard.press("End");
  await expect(unavailable).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(unavailable).toHaveAttribute("aria-selected", "false");
  await expect(selected).toHaveAttribute("id", name ?? "");

  // Made available by the fixture, the same tab selects normally.
  await host.getByRole("checkbox").check();
  await expect(host.getByRole("tab", { disabled: true })).toHaveCount(0);
  await host.getByRole("tab").last().click();
  await expect(host.getByRole("tab").last()).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("a row wider than its host scrolls inside itself and follows focus", async ({
  page,
}) => {
  const host = page.getByTestId("tabs-narrow");
  const list = host.getByRole("tablist");
  const tabs = host.getByRole("tab");
  const fits = () =>
    list.evaluate((node) => node.scrollWidth <= node.clientWidth);
  expect(await fits()).toBe(false);
  // Tabs keep one row: none wraps below another.
  const tops = await tabs.evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().top)),
  );
  expect(new Set(tops).size).toBe(1);
  // The overflow stays in the row; neither the host nor the page grows.
  expect(
    await host.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);

  await tabs.first().focus();
  await page.keyboard.press("End");
  const inView = await tabs.last().evaluate((node) => {
    const tab = node.getBoundingClientRect();
    const row = node.parentElement?.getBoundingClientRect();
    return !!row && tab.left >= row.left - 1 && tab.right <= row.right + 1;
  });
  expect(inView).toBe(true);

  // Facts never make a row taller than a plain one.
  const height = (id: string) =>
    page
      .getByTestId(id)
      .getByRole("tablist")
      .evaluate((node) => node.getBoundingClientRect().height);
  expect(await height("tabs-detailed")).toBe(await height("tabs-plain"));

  // Stretched tabs fill their host.
  const stretch = page.getByTestId("tabs-stretch").getByRole("tablist");
  expect(
    await stretch.evaluate((node) => {
      const last = node.lastElementChild?.getBoundingClientRect();
      return (
        !!last && Math.abs(last.right - node.getBoundingClientRect().right) < 1
      );
    }),
  ).toBe(true);
});
