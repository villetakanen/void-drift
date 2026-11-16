import { AIR_DEPTH, type AtmosphereTreatment } from "./atmosphere";
import type { CloudFields } from "./cloud-materials";
import {
  type CloudCoverage,
  type CloudOpacity,
  makeCloudPainter,
} from "./clouds";

// Study-only fresh LFX highlight. World owns the existing material/shadow;
// this adds incident colour without repainting the accepted emission rim.
export function makeSunlightPainter(
  cloudFields: CloudFields = new Map(),
  cloudMaterial: () => string = () => "Procedural",
) {
  const size = 128;
  const mask = document.createElement("canvas");
  const stamp = document.createElement("canvas");
  mask.width = mask.height = stamp.width = stamp.height = size;
  const ctx = mask.getContext("2d");
  const light = stamp.getContext("2d");
  if (!ctx || !light) throw new Error("Sunlight canvas unavailable");
  const pixels = light.createImageData(size, size);
  const clouds = makeCloudPainter(cloudFields, cloudMaterial, size);
  let previous = "";
  return (
    target: CanvasRenderingContext2D,
    radius: number,
    x: number,
    y: number,
    angle: number,
    colour: string,
    seconds: number,
    treatment: AtmosphereTreatment,
    coverage: CloudCoverage,
    opacity: CloudOpacity,
  ) => {
    const extent = radius + AIR_DEPTH * 0.42;
    const key = `${angle}:${colour}`;
    if (previous !== key) {
      previous = key;
      const rgb = [1, 3, 5].map(
        (start) => Number.parseInt(colour.slice(start, start + 2), 16) / 255,
      );
      for (let py = 0; py < size; py++)
        for (let px = 0; px < size; px++) {
          const nx = ((px + 0.5) / size) * 2 - 1;
          const ny = ((py + 0.5) / size) * 2 - 1;
          const facing = Math.max(
            0,
            nx * Math.cos(angle) * 0.88 +
              ny * Math.sin(angle) * 0.88 +
              Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)) * 0.475,
          );
          const at = (py * size + px) * 4;
          // Hard-light neutral is 127.5: all channels stay above neutral,
          // so warm light adds warmth rather than painting cyan shadows.
          for (let channel = 0; channel < 3; channel++)
            pixels.data[at + channel] = 128 + 70 * rgb[channel];
          pixels.data[at + 3] = nx * nx + ny * ny < 1 ? 255 * facing : 0;
        }
      light.putImageData(pixels, 0, 0);
    }
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    clouds(ctx, size / 2, treatment, seconds, angle, coverage, opacity);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, ((size / 2) * radius) / extent, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalCompositeOperation = "source-in";
    ctx.drawImage(stamp, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    target.drawImage(mask, x - extent, y - extent, extent * 2, extent * 2);
  };
}
