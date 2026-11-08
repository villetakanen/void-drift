import { expect, test } from "../helpers/local-browser";

test("ship Lab changes the production drawing without live credentials", async ({
  page,
}) => {
  await page.goto("/lab/entities/ship");
  const canvas = page.locator("canvas").first();
  await expect(page.getByLabel("Chassis")).toBeVisible();
  await page.getByLabel("Chassis").selectOption("scout");
  const capture = () =>
    canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvas = element as HTMLCanvasElement;
        const pixels = canvas
          .getContext("2d")
          ?.getImageData(0, 0, canvas.width, canvas.height).data;
        return (
          pixels?.some((alpha, index) => index % 4 === 3 && alpha > 0) ?? false
        );
      }),
    )
    .toBe(true);
  // Allow the Lab's animation frame to consume the selected profile.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const scout = await capture();
  await page.getByLabel("Chassis").selectOption("corvette");
  await expect.poll(capture).not.toBe(scout);
});

test("unconfigured leaderboard explains unavailability", async ({ page }) => {
  await page.goto("/leaderboard");
  await expect(
    page.getByText("Shared scores are unavailable in this local session."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});

test("number keys do not change the title screen ship", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("4");
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.getByRole("button", { name: "PRESS START" }).click();
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-status",
    "PLAYING",
  );
});
