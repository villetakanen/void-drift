/** Sphere projection for rock and cloud materials. Default tiles use a central crop
 * with a mirrored second hemisphere; explicit global atlases use their complete
 * cylindrical map. Authored globe art is not inverse-projected into geography.
 */
export class SphericalSurface {
  readonly canvas: HTMLCanvasElement;
  private readonly source: ImageData;
  private readonly output: ImageData;
  private readonly ctx: CanvasRenderingContext2D;
  constructor(
    material: HTMLCanvasElement,
    private readonly mapping: "tile" | "atlas" = "tile",
  ) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.canvas.height =
      mapping === "atlas" ? 192 : material.width;
    const ctx = this.canvas.getContext("2d");
    const input = material.getContext("2d");
    if (!ctx || !input) throw new Error("Sphere canvas unavailable");
    this.ctx = ctx;
    this.source = input.getImageData(0, 0, material.width, material.height);
    // The artwork's cutout is not a perfect analytic circle. Extend the
    // nearest opaque texel into its transparent margin before projection;
    // texture alpha must not turn into holes on the visible sphere.
    const count = material.width * material.height;
    const queue = new Int32Array(count);
    const filled = new Uint8Array(count);
    const data = this.source.data;
    let head = 0,
      tail = 0;
    for (let i = 0; i < count; i++)
      if (data[i * 4 + 3] > 128) {
        filled[i] = 1;
        queue[tail++] = i;
      }
    while (head < tail) {
      const i = queue[head++],
        x = i % material.width;
      const neighbours = [
        x > 0 ? i - 1 : -1,
        x < material.width - 1 ? i + 1 : -1,
        i - material.width,
        i + material.width,
      ];
      for (const next of neighbours)
        if (next >= 0 && next < count && !filled[next]) {
          filled[next] = 1;
          queue[tail++] = next;
          for (let channel = 0; channel < 4; channel++)
            data[next * 4 + channel] = data[i * 4 + channel];
        }
    }
    this.output = ctx.createImageData(this.canvas.width, this.canvas.height);
    this.draw(0);
  }
  private phase: number | undefined;
  draw(phase: number) {
    if (phase === this.phase) return;
    this.phase = phase;
    const size = this.canvas.width,
      src = this.source.data,
      dst = this.output.data;
    const c = Math.cos(phase),
      s = Math.sin(phase);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const nx = ((x + 0.5) * 2) / size - 1;
        const ny = ((y + 0.5) * 2) / size - 1;
        const r2 = nx * nx + ny * ny;
        const out = (y * size + x) * 4;
        if (r2 >= 1) {
          dst[out + 3] = 0;
          continue;
        }
        // Inverse Y-axis rotation of the visible sphere normal. Surface features
        // compress at the limb; the circular silhouette itself never rotates.
        const nz = Math.sqrt(1 - r2);
        const sx = nx * c + nz * s;
        const sz = nz * c - nx * s;
        const longitude = Math.atan2(sx, sz);
        // One material tile per hemisphere, with a mirrored join. Use a central
        // square of source stone, avoiding the already-foreshortened image limb.
        let tile = ((longitude + Math.PI / 2) / Math.PI + 2) % 2;
        if (tile > 1) tile = 2 - tile;
        const latitude = Math.asin(ny) / Math.PI + 0.5;
        const tileU = Math.max(
          0,
          Math.min(size - 1.001, (0.16 + 0.68 * tile) * size - 0.5),
        );
        const tileV = Math.max(
          0,
          Math.min(size - 1.001, (0.16 + 0.68 * latitude) * size - 0.5),
        );
        const sw = this.source.width,
          sh = this.source.height;
        // A global cylindrical map uses its full longitude/latitude extent.
        // Existing authored crops keep their original mirrored-tile mapping.
        const u =
          this.mapping === "atlas"
            ? ((longitude / (2 * Math.PI) + 0.5) * sw + sw) % sw
            : tileU;
        const v =
          this.mapping === "atlas"
            ? Math.max(0, Math.min(sh - 1.001, latitude * sh - 0.5))
            : tileV;
        const ix = Math.floor(u),
          iy = Math.floor(v),
          fx = u - ix,
          fy = v - iy;
        const a = (iy * sw + ix) * 4,
          b = (iy * sw + ((ix + 1) % sw)) * 4,
          d = a + sw * 4,
          e = b + sw * 4;
        for (let channel = 0; channel < 3; channel++) {
          const top = src[a + channel] * (1 - fx) + src[b + channel] * fx;
          const bottom = src[d + channel] * (1 - fx) + src[e + channel] * fx;
          dst[out + channel] = top * (1 - fy) + bottom * fy;
        }
        dst[out + 3] = Math.min(1, ((1 - Math.sqrt(r2)) * size) / 2) * 255;
      }
    this.ctx.putImageData(this.output, 0, 0);
  }
}
