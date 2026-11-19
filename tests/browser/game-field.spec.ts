import { expect, test } from "../helpers/local-browser";

// A resize must not regenerate the expensive background, while replacing the
// system must start a fresh preparation and show only the current result.
test("system sky survives resize and replaces an obsolete request", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    (window as unknown as { skyPreparations: number }).skyPreparations = 0;
    window.Worker = class extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        if (String(url).includes("flight-sky/prepare.worker"))
          (window as unknown as { skyPreparations: number }).skyPreparations++;
      }
    };
  });
  await page.goto("/lab/system-instrument");
  const plane = page.locator("[data-flight-sky] .plane");
  await expect(plane).toBeVisible();
  const count = () =>
    page.evaluate(
      () => (window as unknown as { skyPreparations: number }).skyPreparations,
    );
  const before = await count();
  expect(before).toBe(1);
  const original = await plane.evaluate(
    (element) => getComputedStyle(element).backgroundImage,
  );
  await page.setViewportSize({ width: 1500, height: 850 });
  await expect.poll(count).toBe(before);
  expect(
    await plane.evaluate(
      (element) => getComputedStyle(element).backgroundImage,
    ),
  ).toBe(original);
  const seed = page.getByRole("spinbutton", { name: "Seed" });
  const generate = page.getByRole("button", { name: "Generate" });
  await seed.fill("12345");
  await generate.click();
  await seed.fill("67890");
  await generate.click();
  await expect(page.getByText("Seed 67890 · tick 0")).toBeVisible();
  await expect(plane).toBeVisible();
  await expect.poll(count).toBe(3);
  expect(
    await plane.evaluate(
      (element) => getComputedStyle(element).backgroundImage,
    ),
  ).not.toBe(original);
});
