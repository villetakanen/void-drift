import { RockBodyPainter } from "./rock-body";

// Fixed analytic, periodic atlas. This is an authored visual fixture, not weather.
export function cloudAtlas(
  structure: boolean,
  palette: "ivory" | "amber" | "orange",
) {
  const atlas = document.createElement("canvas");
  atlas.width = 384;
  atlas.height = 192;
  const ctx = atlas.getContext("2d");
  if (!ctx) throw new Error("Cloud atlas canvas unavailable");
  const pixels = ctx.createImageData(384, 192);
  const base = {
    ivory: [241, 229, 199],
    amber: [246, 195, 113],
    orange: [245, 157, 89],
  }[palette];
  for (let y = 0; y < 192; y++) {
    const lat = (y / 191 - 0.5) * Math.PI;
    for (let x = 0; x < 384; x++) {
      const lon = (x / 384) * Math.PI * 2;
      const veil = Math.sin(lon * 2 + Math.sin(lat * 3)) * Math.cos(lat * 2);
      // Broad oblique regions rather than repeated latitude belts.
      const regions =
        Math.sin(lon * 3 + 2 * Math.sin(lat * 2)) *
        Math.cos(lat * 5 + Math.sin(lon * 2));
      const detail = structure
        ? 11 * regions + 3 * Math.sin(lon * 9 + lat * 11) * Math.cos(lat) ** 2
        : 0;
      const i = (y * 384 + x) * 4;
      pixels.data[i] = base[0] + 3 * veil + detail;
      pixels.data[i + 1] = base[1] + 4 * veil + detail;
      pixels.data[i + 2] = base[2] + 5 * veil + detail;
      pixels.data[i + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return atlas;
}

/** Accepted cloud envelope: body on World, directional mask on LFX. */
export class CloudBodyPainter extends RockBodyPainter {
  atmosphere(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    sunX: number,
    sunY: number,
    zoom = 1,
    rimWidth = 0.065,
  ) {
    const shift = Math.atan2(sunY - y, sunX - x) - Math.atan2(-160, -400);
    ctx.save();
    ctx.strokeStyle = "rgba(255,239,201,0.65)";
    ctx.lineWidth = Math.max(0.65 / zoom, radius * rimWidth);
    ctx.beginPath();
    ctx.arc(x, y, radius, Math.PI * 0.92 + shift, Math.PI * 1.64 + shift);
    ctx.stroke();
    ctx.restore();
  }
}
