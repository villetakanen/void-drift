import { expect, test } from "../helpers/local-browser";

test("production and reference plasma thrust are inspectable at the same flight instant", async ({
  page,
}) => {
  await page.goto("/lab/plasma-thrust-comparison");
  const production = page.getByRole("figure", {
    name: "Production plasma thrust",
  });
  const reference = page.getByRole("figure", {
    name: "Accepted plasma thrust reference",
  });
  for (const scene of [production, reference]) {
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute("data-rendered", "true");
    const slider = scene.getByRole("slider", { name: "Time" });
    await slider.evaluate((element: HTMLInputElement) => {
      element.value = "0.8";
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await expect(scene).toHaveAttribute(
      "data-drawn-tick",
      String(Math.round(0.8 * 60)),
    );
  }
  const { active, different, total } = await page.evaluate(() => {
    const pixels = (label: string) => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        `figure[aria-label="${label}"] canvas[data-layer="fx"]`,
      );
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) throw new Error("FX canvas unavailable");
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const a = pixels("Production plasma thrust"),
      b = pixels("Accepted plasma thrust reference");
    let active = 0,
      different = 0,
      total = 0;
    for (let i = 0; i < a.length; i += 4) {
      if (a[i] || a[i + 1] || a[i + 2]) active++;
      for (let c = 0; c < 3; c++) {
        total += Math.max(a[i + c], b[i + c]);
        different += Math.abs(a[i + c] - b[i + c]);
      }
    }
    return { active, different, total };
  });
  expect(active).toBeGreaterThan(0);
  expect(total).toBeGreaterThan(0);
  console.log(
    `Plasma comparison: ${active} lit pixels; relative channel difference ${different / total}`,
  );
});
