import { expect, test } from "../helpers/local-browser";

test("mount layout editing, linked handoff, undo and invalid import", async ({
  page,
}) => {
  await page.goto("/lab/mount-planner");
  await expect(page.locator("[data-ready=true]")).toBeVisible();
  await page.getByLabel("Mount X", { exact: true }).fill("-18.125");
  await page.getByLabel("Mount X", { exact: true }).press("Tab");
  await page.getByRole("button", { name: "right ↔", exact: true }).click();
  await expect(page.getByLabel("Mount X", { exact: true })).toHaveValue(
    "-18.125",
  );
  await page.getByRole("button", { name: "Copy layout", exact: true }).click();
  await page.getByText("Load / inspect document", { exact: true }).click();
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
