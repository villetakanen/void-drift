/** Solid material and live hard-light mask share the same unit disc. */
export class RockBodyPainter {
  private readonly lights = new Map<number, HTMLCanvasElement>();
  constructor(private readonly materials: readonly HTMLCanvasElement[]) {}

  body(
    ctx: CanvasRenderingContext2D,
    material: number,
    x: number,
    y: number,
    radius: number,
  ) {
    const image = this.materials[material];
    if (image)
      ctx.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
  }

  light(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    sunX: number,
    sunY: number,
  ) {
    const angle = Math.atan2(sunY - y, sunX - x);
    const bin = ((Math.round((angle * 256) / (2 * Math.PI)) % 256) + 256) % 256;
    let mask = this.lights.get(bin);
    if (!mask) {
      mask = this.mask((bin * 2 * Math.PI) / 256);
      // Bounded angular cache; surfaces are independent of body radius.
      if (this.lights.size >= 24)
        this.lights.delete(this.lights.keys().next().value ?? bin);
      this.lights.set(bin, mask);
    }
    ctx.drawImage(mask, x - radius, y - radius, radius * 2, radius * 2);
  }

  private mask(angle: number) {
    const size = 128;
    const image = document.createElement("canvas");
    image.width = image.height = size;
    const ctx = image.getContext("2d");
    if (!ctx) return image;
    const pixels = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const nx = ((x + 0.5) * 2) / size - 1;
        const ny = ((y + 0.5) * 2) / size - 1;
        const r2 = nx * nx + ny * ny;
        if (r2 >= 1) continue;
        const diffuse = Math.max(
          0,
          nx * Math.cos(angle) * 0.88 +
            ny * Math.sin(angle) * 0.88 +
            Math.sqrt(1 - r2) * 0.475,
        );
        const value = (0.29 + 0.36 * Math.sqrt(diffuse)) * 255;
        const at = (y * size + x) * 4;
        pixels.data[at] = pixels.data[at + 1] = pixels.data[at + 2] = value;
        pixels.data[at + 3] =
          Math.min(1, ((1 - Math.sqrt(r2)) * size) / 2) * 255;
      }
    ctx.putImageData(pixels, 0, 0);
    return image;
  }
}
