import { expect, test } from "../helpers/local-browser";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      value: async () => {
        throw new Error("Clipboard unavailable");
      },
    });
  });
  await page.goto("/lab/mount-planner");
  await expect(page.locator("[data-ready=true]")).toBeVisible();
});

test("mount layout editing, linked handoff, undo and invalid import", async ({
  page,
}) => {
  await page.getByLabel("Mount X", { exact: true }).fill("-18.125");
  await page.getByLabel("Mount X", { exact: true }).press("Tab");
  await page.getByRole("button", { name: "right ↔", exact: true }).click();
  await expect(page.getByLabel("Mount X", { exact: true })).toHaveValue(
    "-18.125",
  );
  await page.getByRole("button", { name: "Copy layout", exact: true }).click();
  const layoutDocument = page.getByLabel("Layout document");
  await expect(layoutDocument).toBeVisible();
  const exported = await page.getByLabel("Layout document").inputValue();
  const document = JSON.parse(exported);
  expect(document.mounts.map((m: { angle: number }) => m.angle)).toEqual(
    document.baseline.map((m: { angle: number }) => m.angle),
  );
  expect(
    JSON.parse(exported).mounts.find((m: { key: string }) => m.key === "left")
      .x,
  ).toBe(-18.125);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByLabel("Mount X", { exact: true })).not.toHaveValue(
    "-18.125",
  );
  await page.getByLabel("Layout document").fill(exported);
  await page
    .getByRole("button", { name: "Load document", exact: true })
    .click();
  await expect(page.getByLabel("Mount X", { exact: true })).toHaveValue(
    "-18.125",
  );
  await page.getByLabel("Layout document").fill("{}");
  await page
    .getByRole("button", { name: "Load document", exact: true })
    .click();
  await expect(page.getByLabel("Mount X", { exact: true })).toHaveValue(
    "-18.125",
  );
});

test("copy hands off routing edits without upgrading stale legacy data", async ({
  page,
}) => {
  const copy = page.getByRole("button", { name: "Copy layout" });
  const load = page.getByRole("button", { name: "Load document" });
  const document = page.getByLabel("Layout document");
  await page.getByRole("button", { name: "Crossbar right" }).press("Space");
  const x = page.getByRole("spinbutton", { name: /Crossbar X/ });
  const baselineX = Number(await x.inputValue());
  await x.fill(String(baselineX + 1.3));
  await x.press("Enter");
  await copy.click();
  await expect(document).toBeVisible();
  const { slotLinkLines, baselineSlotLinkLines, ...rest } = JSON.parse(
    await document.inputValue(),
  );
  expect(slotLinkLines.right).toBe(baselineX + 1.5);
  expect(baselineSlotLinkLines.right).toBe(baselineX);
  expect(rest.mounts).toEqual(rest.baseline);

  const legacy = { ...rest, version: 1 };
  for (const mount of legacy.baseline) mount.x -= 1;
  await document.fill(JSON.stringify(legacy));
  await load.click();
  await expect(page.getByRole("alert")).toContainText("Mount baseline:");
  await expect(page.getByLabel("Mount X", { exact: true })).toBeDisabled();
  await copy.click();
  expect(JSON.parse(await document.inputValue())).toEqual(legacy);
});
