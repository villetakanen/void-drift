import { expect, test } from "../helpers/local-browser";

test("Derelicts shows frozen time and destruction facts without a score", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const random = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = ((array: ArrayBufferView) => {
      if (array instanceof Uint32Array && array.length === 1) {
        array[0] = 157;
        return array;
      }
      return random(array);
    }) as typeof crypto.getRandomValues;
  });
  await page.goto("/hangar?chassis=wasp");
  await page.getByRole("button", { name: "Derelicts", exact: true }).click();
  await page.clock.runFor(3400);
  await expect(page.locator(".timer")).toHaveCount(0);
  await expect(page.getByText(/points\./)).toHaveCount(0);
  const saved = await page.evaluate(() =>
    JSON.stringify(Object.entries(localStorage).sort()),
  );
  for (
    let i = 0;
    i < 40 &&
    (await page.locator(".flight-page").getAttribute("data-status")) !==
      "GAME_OVER";
    i++
  )
    await page.clock.runFor(1000);
  const result = page.getByRole("dialog", { name: "Run complete" });
  await expect(result).toBeVisible();
  const heading = result.getByRole("heading");
  await expect(heading).toHaveText(/\d+\.\d seconds\./);
  await expect(result.getByText(/\d+ derelicts destroyed/)).toBeVisible();
  await expect(result.getByText(/points\.|^Score /)).toHaveCount(0);
  const final = (await heading.textContent()) ?? "";
  await page.clock.runFor(1000);
  await expect(heading).toHaveText(final);
  await expect(page.getByRole("button", { name: "Save Score" })).toHaveCount(0);
  await expect(result.getByRole("link", { name: "Top Scores" })).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      JSON.stringify(Object.entries(localStorage).sort()),
    ),
  ).toBe(saved);
  await result.getByRole("button", { name: "Return to Hangar" }).click();
  await expect(
    page.getByRole("button", { name: "Derelicts", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Derelicts", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Run complete" })).toHaveCount(
    0,
  );
  await expect(page.getByText(/points\./)).toHaveCount(0);
});
