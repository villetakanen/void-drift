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

test("plasma charge draws live and persistent light and pause and reset preserve lifecycle", async ({
  page,
}) => {
  await page.goto("/lab/plasma-thrust-comparison");
  const scenes = [
    page.getByRole("figure", { name: "Production plasma thrust" }),
    page.getByRole("figure", { name: "Accepted plasma thrust reference" }),
  ];
  const tick = 6;
  for (const scene of scenes) {
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute("data-rendered", "true");
    await scene
      .getByRole("slider", { name: "Time" })
      .evaluate((el: HTMLInputElement, seconds) => {
        el.value = String(seconds);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }, tick / 60);
    await expect(scene).toHaveAttribute("data-drawn-tick", String(tick));
  }
  const sample = async (label: string) =>
    page.evaluate((name) => {
      const figure = document.querySelector(`figure[aria-label="${name}"]`);
      if (!figure) throw new Error("Scene unavailable");
      return ["fx", "lfx"].map((layer) => {
        const canvas = figure.querySelector<HTMLCanvasElement>(
          `canvas[data-layer="${layer}"]`,
        );
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) throw new Error("Canvas unavailable");
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 4)
          sum += data[i] + data[i + 1] + data[i + 2];
        return sum;
      });
    }, label);
  const before = await sample("Production plasma thrust");
  const ref = await sample("Accepted plasma thrust reference");
  expect(before[0]).toBeGreaterThan(0);
  expect(before[1]).toBeGreaterThan(0);
  expect(ref[0]).toBeGreaterThan(0);
  expect(ref[1]).toBeGreaterThan(0);
  console.log(
    `Charge comparison FX/LFX sums: production ${before}, reference ${ref}`,
  );
  await page.waitForTimeout(200);
  expect(await sample("Production plasma thrust")).toEqual(before);
  const slider = scenes[0].getByRole("slider", { name: "Time" });
  await slider.evaluate((el: HTMLInputElement) => {
    el.value = "0";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(scenes[0]).toHaveAttribute("data-drawn-tick", "0");
  expect(await sample("Production plasma thrust")).toEqual([0, 0]);
});

test("multi-engine ships show charging light at their production mounts", async ({
  page,
}, info) => {
  await page.goto("/lab/plasma-thrust-comparison");
  for (const name of ["Scout plasma charge", "Corvette plasma charge"]) {
    const scene = page.getByRole("figure", { name });
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute("data-rendered", "true");
    const light = await scene
      .locator('canvas[data-layer="lfx"]')
      .evaluate((canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let sum = 0;
        for (let i = 0; i < pixels.length; i += 4)
          sum += pixels[i] + pixels[i + 1] + pixels[i + 2];
        return sum;
      });
    expect(light).toBeGreaterThan(0);
    await scene.screenshot({
      path: info.outputPath(`${name.split(" ")[0].toLowerCase()}.png`),
    });
  }
});
