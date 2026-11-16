import {
  DEFAULT_ROCK_BODY_LIGHTING,
  type RockBodyLighting,
  RockBodyLightingSchema,
} from "../schemas/rock-body-lighting";

/** Solid material and live hard-light mask share the same unit disc. */
export class RockBodyPainter {
  private static readonly lights = new Map<
    string,
    { canvas: HTMLCanvasElement; users: number; permanent?: boolean }
  >();
  private preparedLighting: Readonly<RockBodyLighting> =
    DEFAULT_ROCK_BODY_LIGHTING;
  private disposed = false;

  constructor(private readonly materials: readonly HTMLCanvasElement[]) {
    RockBodyPainter.acquire(DEFAULT_ROCK_BODY_LIGHTING, true);
  }

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
    shadowIntensity = this.preparedLighting.shadowIntensity,
  ) {
    if (this.disposed)
      throw new Error("Cannot draw with a disposed rock painter");
    const intensity = RockBodyPainter.normalizeLegacyIntensity(shadowIntensity);
    if (intensity !== this.preparedLighting.shadowIntensity)
      throw new Error(
        `Shadow intensity ${intensity} was not prepared by this painter`,
      );
    const prepared = RockBodyPainter.lights.get(
      RockBodyPainter.key(this.preparedLighting),
    );
    if (!prepared)
      throw new Error("Prepared lighting stamp was released before drawing");
    const angle = Math.atan2(sunY - y, sunX - x);
    ctx.save();
    try {
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.drawImage(prepared.canvas, -radius, -radius, radius * 2, radius * 2);
    } finally {
      ctx.restore();
    }
  }

  /** Build/acquire the next canonical stamp before releasing the current one. */
  prepareLighting(input: unknown) {
    if (this.disposed)
      throw new Error("Cannot prepare a disposed rock painter");
    const next = Object.freeze(RockBodyLightingSchema.parse(input));
    if (
      RockBodyPainter.key(next) === RockBodyPainter.key(this.preparedLighting)
    )
      return { ...this.preparedLighting };
    RockBodyPainter.acquire(next);
    RockBodyPainter.release(this.preparedLighting);
    this.preparedLighting = next;
    return { ...next };
  }

  /** Preserve the historical intensity-only API for study and production callers. */
  prepareShadowIntensity(shadowIntensity: number) {
    const intensity = RockBodyPainter.normalizeLegacyIntensity(shadowIntensity);
    return this.prepareLighting({
      ...this.preparedLighting,
      shadowIntensity: intensity,
    });
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    RockBodyPainter.release(this.preparedLighting);
  }

  private static normalizeLegacyIntensity(value: number) {
    if (!Number.isFinite(value))
      throw new RangeError("Shadow intensity must be finite");
    return Math.max(0, Math.min(2, value));
  }

  private static key(lighting: Readonly<RockBodyLighting>) {
    return `${lighting.incomingIntensity}|${lighting.shadowIntensity}|${lighting.temperatureK}`;
  }

  private static acquire(
    lighting: Readonly<RockBodyLighting>,
    permanent = false,
  ) {
    const key = RockBodyPainter.key(lighting);
    const existing = RockBodyPainter.lights.get(key);
    if (existing) {
      if (!permanent) existing.users++;
      return existing.canvas;
    }
    const canvas = RockBodyPainter.mask(lighting);
    RockBodyPainter.lights.set(key, {
      canvas,
      users: permanent ? 0 : 1,
      ...(permanent ? { permanent: true } : {}),
    });
    return canvas;
  }

  private static release(lighting: RockBodyLighting) {
    const key = RockBodyPainter.key(lighting);
    const entry = RockBodyPainter.lights.get(key);
    if (!entry || entry.permanent) return;
    entry.users--;
    if (entry.users === 0) RockBodyPainter.lights.delete(key);
  }

  private static mask(lighting: Readonly<RockBodyLighting>) {
    const size = 128;
    const image = document.createElement("canvas");
    image.width = image.height = size;
    const ctx = image.getContext("2d");
    if (!ctx) throw new Error("Rock light stamp canvas unavailable");
    const pixels = ctx.createImageData(size, size);
    const tint = RockBodyPainter.temperatureTint(lighting.temperatureK);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const nx = ((x + 0.5) * 2) / size - 1;
        const ny = ((y + 0.5) * 2) / size - 1;
        const r2 = nx * nx + ny * ny;
        if (r2 >= 1) continue;
        const diffuse = Math.max(0, nx * 0.88 + Math.sqrt(1 - r2) * 0.475);
        const baseline = 0.29 + 0.36 * Math.sqrt(diffuse);
        const value =
          baseline < 0.5
            ? 0.5 - (0.5 - baseline) * lighting.shadowIntensity
            : 0.5 + (baseline - 0.5) * lighting.incomingIntensity;
        const at = (y * size + x) * 4;
        for (let channel = 0; channel < 3; channel++) {
          const tinted =
            baseline >= 0.5
              ? Math.max(0.5, 0.5 + (value - 0.5) * tint[channel])
              : value;
          pixels.data[at + channel] = tinted * 255;
        }
        pixels.data[at + 3] =
          Math.min(1, ((1 - Math.sqrt(r2)) * size) / 2) * 255;
      }
    ctx.putImageData(pixels, 0, 0);
    return image;
  }

  /** Approximate warm-to-cool display tint, neutral-normalized at 5800 K. */
  private static temperatureTint(
    kelvin: number,
  ): readonly [number, number, number] {
    const warm = [255, 172, 106];
    const neutral = [255, 255, 255];
    const cool = [151, 183, 255];
    const sample = (a: number[], b: number[], t: number) =>
      a.map((value, index) => (value + (b[index] - value) * t) / 255);
    const rgb =
      kelvin <= 5800
        ? sample(warm, neutral, (kelvin - 3500) / (5800 - 3500))
        : sample(neutral, cool, (kelvin - 5800) / (10000 - 5800));
    return [rgb[0], rgb[1], rgb[2]];
  }
}
