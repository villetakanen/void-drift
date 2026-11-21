import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const dir = fileURLToPath(new URL(".", import.meta.url));
const names = [
  "01-drowned-archipelago",
  "02-fractured-ice",
  "03-oxidised-seas",
  "04-violet-biosphere",
  "05-the-meridian",
];
const maps = await Promise.all(
  names.map(async (name) => ({
    name,
    url:
      "data:image/png;base64," +
      (await readFile(`${dir}${name}-map.png`)).toString("base64"),
  })),
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1320 },
    deviceScaleFactor: 1,
  });
  await page.goto("http://localhost:4321/lab/planet-inspector");
  const report = await page.evaluate(async (maps) => {
    const { StripSphericalSurface } = await import(
      "/@fs/Users/ville.takanen/dev/void-drift/packages/core/src/lib/assets/strip-spherical-surface.ts"
    );
    document.body.innerHTML = "";
    document.body.style.cssText =
      "margin:0;background:#080912;color:#eee;font:15px monospace;padding:24px;";
    const title = document.createElement("h1");
    title.textContent = "Planet surface atlases / four longitudes";
    title.style.fontSize = "20px";
    document.body.append(title);
    const report = [];
    for (const { name, url } of maps) {
      const img = new Image();
      img.src = url;
      await img.decode();
      if (img.width !== img.height * 2)
        throw new Error(`${name}: expected 2:1 atlas`);
      const atlas = document.createElement("canvas");
      atlas.width = img.width;
      atlas.height = img.height;
      atlas.getContext("2d").drawImage(img, 0, 0);
      const surface = new StripSphericalSurface(atlas, 192);
      const row = document.createElement("div");
      row.style.cssText =
        "display:flex;align-items:center;gap:52px;margin:16px 0;";
      const label = document.createElement("div");
      label.style.cssText = "width:180px;";
      label.textContent = name;
      row.append(label);
      for (let phase = 0; phase < Math.PI * 2; phase += Math.PI / 2) {
        surface.draw(phase, 192);
        const c = document.createElement("canvas");
        c.width = c.height = 192;
        c.getContext("2d").drawImage(surface.canvas, 0, 0);
        row.append(c);
      }
      document.body.append(row);
      report.push({
        name,
        width: img.width,
        height: img.height,
        projections: 4,
      });
    }
    return report;
  }, maps);
  await page.screenshot({ path: `${dir}atlas-wrap-check.png`, fullPage: true });
  await writeFile(
    `${dir}validation.json`,
    `${JSON.stringify(
      { renderer: "StripSphericalSurface", maps: report },
      null,
      2,
    )}\n`,
  );
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
