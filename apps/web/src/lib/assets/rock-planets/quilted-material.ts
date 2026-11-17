/** Exemplar quilting: overlap matching and minimum-error cuts.
 * Uses only existing mineral-mosaic texels, with no palette or contrast changes.
 * Inspired by Efros & Freeman, Image Quilting (SIGGRAPH 2001).
 */
export function quiltMineralMaterial(
  material: HTMLCanvasElement,
  seed: number,
) {
  const width = 384,
    height = 192,
    block = 72,
    overlap = 20,
    stride = block - overlap;
  const input = material.getContext("2d");
  if (!input) throw new Error("Mineral exemplar unavailable");
  const src = input.getImageData(0, 0, material.width, material.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Mineral quilt canvas unavailable");
  const output = ctx.createImageData(width, height),
    dst = output.data;
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  // Central square stays inside the opaque disc; preserves the established
  // material scale without importing its shaded limb or transparent corners.
  const margin = Math.ceil(material.width * 0.16);
  const extent = material.width - margin * 2 - block;
  const sampleAt = (sx: number, sy: number, x: number, y: number) =>
    ((sy + y) * src.width + sx + x) * 4;
  for (let oy = 0; oy < height; oy += stride)
    for (let ox = 0; ox < width; ox += stride) {
      const bw = Math.min(block, width - ox),
        bh = Math.min(block, height - oy);
      const error = (sx: number, sy: number, x: number, y: number) => {
        const a = sampleAt(sx, sy, x, y),
          b = ((oy + y) * width + ox + x) * 4;
        let sum = 0;
        for (let c = 0; c < 3; c++) sum += (src.data[a + c] - dst[b + c]) ** 2;
        return sum;
      };
      const candidates = Array.from({ length: 32 }, () => {
        const sx = margin + Math.floor(random() * (extent + 1)),
          sy = margin + Math.floor(random() * (extent + 1));
        let score = 0;
        for (let y = 0; y < bh; y += 3)
          for (let x = 0; x < bw; x += 3)
            if ((ox > 0 && x < overlap) || (oy > 0 && y < overlap))
              score += error(sx, sy, x, y);
        return { sx, sy, score };
      }).sort((a, b) => a.score - b.score);
      const eligible = candidates.filter(
        (c) => c.score <= candidates[0].score * 1.12 + 1,
      );
      const { sx, sy } = eligible[Math.floor(random() * eligible.length)];
      // Dynamic-programming cut, vertical for left overlap, horizontal for top.
      const cut = (horizontal: boolean) => {
        const length = horizontal ? bw : bh;
        const band = Math.min(overlap, horizontal ? bh : bw);
        const costs = new Float64Array(length * band);
        const parents = new Int16Array(length * band);
        for (let t = 0; t < length; t++)
          for (let k = 0; k < band; k++) {
            let previous = k;
            if (t > 0)
              for (
                let next = Math.max(0, k - 1);
                next <= Math.min(band - 1, k + 1);
                next++
              )
                if (
                  costs[(t - 1) * band + next] <
                  costs[(t - 1) * band + previous]
                )
                  previous = next;
            costs[t * band + k] =
              error(sx, sy, horizontal ? t : k, horizontal ? k : t) +
              (t ? costs[(t - 1) * band + previous] : 0);
            parents[t * band + k] = previous;
          }
        const seam = new Int16Array(length);
        let k = 0;
        for (let next = 1; next < band; next++)
          if (
            costs[(length - 1) * band + next] < costs[(length - 1) * band + k]
          )
            k = next;
        for (let t = length - 1; t >= 0; t--) {
          seam[t] = k;
          k = parents[t * band + k];
        }
        return seam;
      };
      const left = ox > 0 ? cut(false) : null,
        top = oy > 0 ? cut(true) : null;
      for (let y = 0; y < bh; y++)
        for (let x = 0; x < bw; x++) {
          if ((left && x < left[y]) || (top && y < top[x])) continue;
          const a = sampleAt(sx, sy, x, y),
            b = ((oy + y) * width + ox + x) * 4;
          for (let c = 0; c < 3; c++) dst[b + c] = src.data[a + c];
          dst[b + 3] = 255;
        }
    }
  // Longitude closure: make both edges meet over a narrow 8px strip. This is
  // explicitly a small blend; interior patch joins use cuts, not global blur.
  const edgeWidth = 8;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < edgeWidth; x++) {
      const a = (y * width + x) * 4,
        b = (y * width + width - 1 - x) * 4;
      const amount = (1 - x / edgeWidth) * 0.5;
      for (let c = 0; c < 3; c++) {
        const left = dst[a + c],
          right = dst[b + c];
        dst[a + c] = left * (1 - amount) + right * amount;
        dst[b + c] = right * (1 - amount) + left * amount;
      }
    }
  ctx.putImageData(output, 0, 0);
  return canvas;
}
