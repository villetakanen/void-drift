import { expect, test } from "../helpers/local-browser";

test("canonical buttons share tokens, spacing, states and responsive composition", async ({
  page,
}) => {
  await page.goto("/lab/inputs");
  const vertical = page.getByTestId("vertical-buttons");
  const strip = page.getByTestId("strip-buttons");
  await expect(vertical).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const widths = await vertical
    .locator(".btn")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().width),
    );
  expect(new Set(widths).size).toBe(1);
  const primary = vertical.getByRole("button", { name: "Continue game" });
  await primary.focus();
  await expect(primary).toBeFocused();
  await expect(primary).not.toHaveCSS("outline-style", "none");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Continue game selected.");
  const save = page.getByRole("button", { name: "Save settings" });
  await save.click();
  await expect(page.getByRole("button", { name: "Saving…" })).toBeDisabled();
  await expect(page.getByRole("status")).toHaveText("Example saved.");
  await expect(save).toBeEnabled();
  const unavailable = page.getByRole("button", { name: "Unavailable" });
  await expect(unavailable).toBeDisabled();
  const disabledColor = await unavailable.evaluate(
    (element) => getComputedStyle(element).color,
  );
  await unavailable.hover();
  await expect(unavailable).toHaveCSS("color", disabledColor);
  // Shared spacing changes affect both padding and gap; local layout literals must not win.
  await page.evaluate(() =>
    document.documentElement.style.setProperty("--spacing-sm", "12px"),
  );
  await expect(vertical).toHaveCSS("padding-left", "12px");
  await expect(strip).toHaveCSS("gap", "12px");
  await page.evaluate(() =>
    document.documentElement.style.removeProperty("--spacing-sm"),
  );
  await page.setViewportSize({ width: 600, height: 390 });
  await expect(strip).toHaveCSS("display", "grid");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(primary).toHaveCSS("transition-duration", "0s");
});
