#!/usr/bin/env node
/**
 * Prepares the production planet surface maps in apps/web/public/planets/
 * from their study sources. Run against a running dev server:
 *
 *   node scripts/planet-maps.mjs [http://localhost:4321]
 *
 * Every map is an unlit cylindrical atlas (longitude across, latitude down),
 * the form StripSphericalSurface turns with image drawing. Pixel work happens
 * here, once; play only loads the PNGs.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "apps/web/public/planets");
const base = process.argv[2] ?? "http://localhost:4321";
const plate = async (path) =>
  `data:image/png;base64,${(await readFile(resolve(root, path))).toString("base64")}`;
const plates = {
  earth: await plate("output/imagegen/earth-2300-tryouts/earth-plate-b.png"),
  cradle: await plate("output/imagegen/earth-postwar/earth-postwar-plate.png"),
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`${base}/lab/planet-inspector`);
  const maps = await page.evaluate(async (plates) => {
    const materials = await import(
      "/src/lib/assets/rock-planets/authored-materials.ts"
    );
    const quilt = await import(
      "/src/lib/assets/rock-planets/quilted-material.ts"
    );
    const [mineral] = await materials.loadAuthoredRockMaterials();

    const canvas = (width, height) => {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      return c;
    };

    // Practice Mercury: the accepted seed-153 quilt of the mineral exemplar.
    const mercury = quilt.quiltMineralMaterial(mineral, 153);

    // Unlit equirectangular plates are atlases already; resample to 768 x 384.
    const resample = async (src) => {
      const atlas = canvas(768, 384);
      const image = new Image();
      image.src = src;
      await image.decode();
      const ctx = atlas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, atlas.width, atlas.height);
      return atlas;
    };

    // The Cradle's ground: the post-war Earth plate.
    const ground = await resample(plates.cradle);

    // The Cradle's clouds: Cirrus luminance as density. Opacity rises over a
    // smooth step from density 0.1 to 0.5, giving opaque cores and clear
    // openings; colour stays near white with a little density detail. Unlit.
    const clouds = canvas(768, 384);
    {
      const image = new Image();
      image.src =
        "/studies/rock-atmospheres-2026-11-15/cloud-materials/cirrus.png";
      await image.decode();
      const ctx = clouds.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, clouds.width, clouds.height);
      const img = ctx.getImageData(0, 0, clouds.width, clouds.height);
      const p = img.data;
      for (let i = 0; i < p.length; i += 4) {
        const density = (p[i] + p[i + 1] + p[i + 2]) / 765;
        const t = Math.max(0, Math.min(1, (density - 0.1) / 0.4));
        const shade = 255 * (0.94 + 0.06 * density);
        p[i] = p[i + 1] = p[i + 2] = shade;
        p[i + 3] = 255 * t * t * (3 - 2 * t);
      }
      ctx.putImageData(img, 0, 0);
    }

    // Earth, the Lab's copy of The Cradle: the Earth 2300 plate.
    const earth = await resample(plates.earth);

    return {
      "earth-ground.png": earth.toDataURL("image/png"),
      "mercury-ground.png": mercury.toDataURL("image/png"),
      "cradle-ground.png": ground.toDataURL("image/png"),
      "cradle-clouds.png": clouds.toDataURL("image/png"),
    };
  }, plates);
  await mkdir(out, { recursive: true });
  for (const [name, url] of Object.entries(maps)) {
    await writeFile(
      resolve(out, name),
      Buffer.from(url.slice(url.indexOf(",") + 1), "base64"),
    );
    console.log(`wrote apps/web/public/planets/${name}`);
  }
} finally {
  await browser.close();
}
