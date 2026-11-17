// Study assets: image luminance supplies density, never baked planet lighting.
export const CLOUD_MATERIALS = [
  "Procedural",
  "Cumulus",
  "Fronts",
  "Cellular",
  "Cirrus",
];
export const COVERAGE_MATERIALS = [
  "20% cover",
  "40% cover",
  "60% cover",
  "80% cover",
];
export interface CloudField {
  width: number;
  height: number;
  density: Float32Array;
  coverageThreshold?: number;
}
export type CloudFields = Map<string, CloudField>;
export async function loadCloudMaterials(
  names = [...CLOUD_MATERIALS.slice(1), ...COVERAGE_MATERIALS],
): Promise<CloudFields> {
  const entries = await Promise.all(
    names.map(async (name) => {
      const image = new Image();
      const file = name.endsWith("% cover")
        ? `cover-${Number.parseInt(name, 10)}`
        : name.toLowerCase();
      image.src = `/studies/rock-atmospheres-2026-11-15/cloud-materials/${file}.png`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Cloud material canvas unavailable");
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const density = new Float32Array(canvas.width * canvas.height);
      for (let i = 0; i < density.length; i++)
        density[i] =
          (((pixels[i * 4] + pixels[i * 4 + 1] + pixels[i * 4 + 2]) / 765) *
            pixels[i * 4 + 3]) /
          255;
      let coverageThreshold: number | undefined;
      if (name.endsWith("% cover")) {
        // Calibrate covered source-map area at alpha > 0.5. Quantized
        // luminance keeps this bounded; the current visible hemisphere varies.
        const histogram = new Uint32Array(1024);
        for (const value of density)
          histogram[Math.min(1023, Math.floor(value * 1023))]++;
        const clearPixels =
          density.length * (1 - Number.parseInt(name, 10) / 100);
        let cumulative = 0;
        for (let bin = 0; bin < histogram.length; bin++) {
          cumulative += histogram[bin];
          if (cumulative >= clearPixels) {
            coverageThreshold = (bin + 0.5) / 1023;
            break;
          }
        }
      }
      return [
        name,
        {
          width: canvas.width,
          height: canvas.height,
          density,
          coverageThreshold,
        },
      ] as const;
    }),
  );
  return new Map(entries);
}
