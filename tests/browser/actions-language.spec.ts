import { expect, test } from "@playwright/test";

test("normal actions share the design-system variant in the Lab and app", async ({
  page,
}) => {
  await page.goto("/lab/ds/actions");
  const specimen = page
    .getByTestId("actions-void")
    .locator(".btn-normal")
    .first();
  await expect(specimen).toBeVisible();
  const labGround = await specimen.evaluate((element) =>
    getComputedStyle(element).getPropertyValue("--button-ground").trim(),
  );
  expect(labGround).not.toBe("");

  await page.goto("/");
  const hangar = page.getByRole("link", { name: "HANGAR" });
  await expect(hangar).toHaveClass(/\bbtn-normal\b/);
  await expect(hangar).toBeVisible();
  await page.goto("/settings");
  await expect(
    page.getByRole("link", { name: /return to title screen/i }),
  ).toHaveClass(/\bbtn-normal\b/);
  await page.goto("/credits");
  await expect(
    page.getByRole("link", { name: /return to title screen/i }),
  ).toHaveClass(/\bbtn-normal\b/);
});
