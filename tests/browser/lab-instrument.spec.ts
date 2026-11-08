import { expect, test } from "../helpers/local-browser";

// Contract: docs/specs/motion-instrument.md.
test.use({ viewport: { width: 1366, height: 1024 } });

test("switching the burn redraws the views and changes the document", async ({
  page,
}) => {
  await page.goto("/lab/instrument");
  const legend = page.getByRole("list", { name: "Vehicles" });
  await expect(legend.getByRole("listitem")).toHaveText([
    "Ion aft",
    "Plasma aft, 46k shared thrust",
  ]);
  await expect(page.locator(".graph")).toHaveCount(3);
  await expect(
    page.getByRole("img", { name: /^Plan view of every path/ }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: /^B1, Course/ })).toBeVisible();
  const speed = page.locator(".graph .head").first();
  const before = await speed.textContent();
  await page.getByRole("radiogroup", { name: "Burn" }).getByText("B2").click();
  await expect(page.getByRole("img", { name: /^B2, Turn/ })).toBeVisible();
  await expect(speed).not.toHaveText(before ?? "");
  await page.getByRole("button", { name: "Open values" }).click();
  await expect(page.locator(".pane pre")).toContainText('"burn": "turn"');
});

test("the pane opens, takes focus, and closes on Escape", async ({ page }) => {
  await page.goto("/lab/instrument");
  const pane = page.getByRole("complementary", {
    name: "Values under investigation",
  });
  await expect(pane).toBeHidden();
  await page.getByRole("button", { name: "Open values" }).click();
  await expect(pane).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close values" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(pane).toBeHidden();
  await expect(page.getByRole("button", { name: "Open values" })).toBeFocused();
});

test("an edited value updates the graphs and the document", async ({
  page,
}) => {
  await page.goto("/lab/instrument");
  const speed = page.locator(".graph .head").first();
  const before = await speed.textContent();
  await page.getByRole("button", { name: "Open values" }).click();
  const thrust = page.locator("#p-plasma-thrust");
  await thrust.fill("52000");
  await thrust.press("Tab");
  await expect(page.locator(".pane pre")).toContainText(
    '"plasma": {\n      "thrust": 52000',
  );
  await expect(speed).not.toHaveText(before ?? "");
});

test("each reference page renders its components", async ({ page }) => {
  await page.goto("/lab/inputs");
  await expect(
    page.getByRole("radiogroup", { name: "Path scale" }),
  ).toBeVisible();
  await expect(
    page.getByRole("slider", { name: "Plasma thrust" }),
  ).toBeAttached();

  await page.goto("/lab/graphs");
  await expect(
    page.getByRole("img", { name: /^Plan view of every path/ }),
  ).toBeVisible();
  await expect(page.locator(".graph")).toHaveCount(2);

  await page.goto("/lab/instrument-parts");
  await expect(page.getByRole("radiogroup", { name: "Burn" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Vehicles" })).toHaveCount(2);
  await page.getByRole("button", { name: "Open values" }).click();
  await expect(
    page.getByText("Pane content, filled by the host."),
  ).toBeVisible();

  await page.goto("/lab/surfaces");
  await expect(page.locator(".display").first()).toBeVisible();
});
