/** Offline atlas preparation; play only loads the resulting native images. */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const output = "apps/web/public/planets";
const concepts = `${output}/concepts-2026-11-19`;
const study =
  "apps/web/public/studies/rock-atmospheres-2026-11-15/cloud-materials";
const sources = [
  {
    name: "habitable-archipelago",
    source: `${concepts}/01-drowned-archipelago-map.png`,
    prompt: `${concepts}/01-drowned-archipelago-map.prompt.json`,
    clouds: false,
  },
  {
    name: "habitable-violet",
    source: `${concepts}/04-violet-biosphere-map.png`,
    prompt: `${concepts}/04-violet-biosphere-map.prompt.json`,
    clouds: false,
  },
  ...["fronts", "cover-20", "cover-40"].map((name) => ({
    name: `habitable-clouds-${name}`,
    source: `${study}/${name}.png`,
    prompt: `${study}/${name === "fronts" ? "prompts" : "coverage-prompts"}.json`,
    entry: name,
    clouds: true,
  })),
];
const inputs = await Promise.all(
  sources.map(async (source) => ({
    ...source,
    url: `data:image/png;base64,${(await readFile(source.source)).toString("base64")}`,
  })),
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const images = await page.evaluate(async (inputs) => {
    const result = [];
    for (const input of inputs) {
      const image = new Image();
      image.src = input.url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 768;
      canvas.height = 384;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, 768, 384);
      const data = ctx.getImageData(0, 0, 768, 384);
      const pixels = data.data;
      // A short mirrored blend joins longitude endpoints exactly; the interior
      // remains the selected art. This is load-independent asset preparation.
      for (let y = 0; y < 384; y++)
        for (let x = 0; x < 24; x++) {
          const a = (y * 768 + x) * 4,
            b = (y * 768 + 767 - x) * 4;
          const weight = 0.5 * (1 - x / 24) ** 2;
          for (let c = 0; c < 3; c++) {
            const left = pixels[a + c],
              right = pixels[b + c];
            pixels[a + c] = left * (1 - weight) + right * weight;
            pixels[b + c] = right * (1 - weight) + left * weight;
          }
        }
      // Collapse the last few polar rows smoothly to a longitude-independent cap.
      for (const pole of [0, 383]) {
        const mean = [0, 0, 0];
        for (let x = 0; x < 768; x++)
          for (let c = 0; c < 3; c++)
            mean[c] += pixels[(pole * 768 + x) * 4 + c] / 768;
        for (let dy = 0; dy < 6; dy++) {
          const y = pole === 0 ? dy : 383 - dy,
            weight = (1 - dy / 6) ** 2;
          for (let x = 0; x < 768; x++)
            for (let c = 0; c < 3; c++) {
              const i = (y * 768 + x) * 4 + c;
              pixels[i] = pixels[i] * (1 - weight) + mean[c] * weight;
            }
        }
      }
      if (input.clouds)
        for (let i = 0; i < pixels.length; i += 4) {
          const density = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 765;
          const t = Math.max(0, Math.min(1, (density - 0.1) / 0.4));
          pixels[i] =
            pixels[i + 1] =
            pixels[i + 2] =
              255 * (0.94 + 0.06 * density);
          pixels[i + 3] = 255 * t * t * (3 - 2 * t);
        }
      ctx.putImageData(data, 0, 0);
      result.push({ name: input.name, url: canvas.toDataURL("image/png") });
    }
    return result;
  }, inputs);
  for (const { name, url } of images) {
    await writeFile(
      resolve(output, `${name}.png`),
      Buffer.from(url.split(",")[1], "base64"),
    );
    const input = sources.find((source) => source.name === name);
    const promptData = JSON.parse(await readFile(input.prompt, "utf8"));
    const prompt = input.entry
      ? promptData.prompts.find((p) => p.name === input.entry).prompt
      : promptData.prompt;
    await writeFile(
      resolve(output, `${name}.prompt.json`),
      `${JSON.stringify(
        {
          image: `${name}.png`,
          method: "built-in image_gen; deterministic offline atlas preparation",
          source: input.source,
          originalPromptSource: input.prompt,
          prompt,
          dimensions: [768, 384],
          preparation:
            "Native image resampling; 24px symmetric longitude edge blend; 6px polar cap blend; clouds use the Cradle density-to-alpha smoothstep (0.1–0.5).",
          script: "scripts/prepare-habitable-maps.mjs",
        },
        null,
        2,
      )}\n`,
    );
  }
  console.log(
    "Prepared five Habitable atlases and adjacent prompt/provenance files.",
  );
} finally {
  await browser.close();
}
