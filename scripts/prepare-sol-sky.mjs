/** Freeze the procedural Practice material using the shared dev server on port 4321. */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = new URL("../", import.meta.url);
const modulePath = (path) => `/@fs${fileURLToPath(new URL(path, root))}`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto("http://localhost:4321/lab");
  const encoded = await page.evaluate(
    async ([recipePath, sightlinePath]) => {
      const { prepareSkyTile } = await import(recipePath);
      const { SOL_SKY } = await import(sightlinePath);
      const { reach, dustSeed } = SOL_SKY;
      const tile = prepareSkyTile({ reach, dustSeed }, 1536);
      const blob = await tile.convertToBlob({ type: "image/png" });
      const reader = new FileReader();
      const result = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
      });
      reader.readAsDataURL(blob);
      return (await result).split(",")[1];
    },
    [
      modulePath("packages/core/src/lib/assets/flight-sky.ts"),
      modulePath("packages/mode-a/src/lib/flight-sky.ts"),
    ],
  );
  const directory = new URL("apps/web/public/skies/", root);
  await mkdir(directory, { recursive: true });
  await writeFile(
    new URL("sol.png", directory),
    Buffer.from(encoded, "base64"),
  );
} finally {
  await browser.close();
}
