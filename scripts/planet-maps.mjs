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
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "apps/web/public/planets");
const base = process.argv[2] ?? "http://localhost:4321";

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`${base}/lab/planet-inspector`);
  const maps = await page.evaluate(async () => {
    const materials = await import(
      "/src/lib/assets/rock-planets/authored-materials.ts"
    );
    const quilt = await import(
      "/src/lib/assets/rock-planets/quilted-material.ts"
    );
    const [mineral, , impact] = await materials.loadAuthoredRockMaterials();

    const canvas = (width, height) => {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      return c;
    };

    // Practice Mercury: the accepted seed-153 quilt of the mineral exemplar.
    const mercury = quilt.quiltMineralMaterial(mineral, 153);

    // The Cradle's ground: the Impact disc in the mirrored-tile mapping that
    // SphericalSurface "tile" uses, written out as a full cylindrical atlas.
    const ground = canvas(384, 192);
    {
      const size = impact.width;
      const src = impact.getContext("2d").getImageData(0, 0, size, size).data;
      const ctx = ground.getContext("2d");
      const img = ctx.createImageData(ground.width, ground.height);
      for (let y = 0; y < ground.height; y++)
        for (let x = 0; x < ground.width; x++) {
          const longitude = ((x + 0.5) / ground.width - 0.5) * 2 * Math.PI;
          let tile = ((longitude + Math.PI / 2) / Math.PI + 2) % 2;
          if (tile > 1) tile = 2 - tile;
          const latitude = (y + 0.5) / ground.height;
          const u = Math.max(
            0,
            Math.min(size - 1.001, (0.16 + 0.68 * tile) * size - 0.5),
          );
          const v = Math.max(
            0,
            Math.min(size - 1.001, (0.16 + 0.68 * latitude) * size - 0.5),
          );
          const ix = Math.floor(u),
            iy = Math.floor(v),
            fx = u - ix,
            fy = v - iy;
          const a = (iy * size + ix) * 4,
            b = a + 4,
            d = a + size * 4,
            e = d + 4;
          const at = (y * ground.width + x) * 4;
          for (let c = 0; c < 3; c++)
            img.data[at + c] =
              (src[a + c] * (1 - fx) + src[b + c] * fx) * (1 - fy) +
              (src[d + c] * (1 - fx) + src[e + c] * fx) * fy;
          img.data[at + 3] = 255;
        }
      ctx.putImageData(img, 0, 0);
    }

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

    return {
      "mercury-ground.png": mercury.toDataURL("image/png"),
      "cradle-ground.png": ground.toDataURL("image/png"),
      "cradle-clouds.png": clouds.toDataURL("image/png"),
    };
  });
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
