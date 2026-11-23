import { expect, it } from "vitest";
import { RockBodyLightingSchema } from "../schemas/rock-body-lighting";
import { RockBodyPainter } from "./rock-body";

it("draws prepared stamps without creating or writing pixels, and releases the last user's stamp", () => {
  const created: FakeCanvas[] = [];
  const priorDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => {
        const canvas = new FakeCanvas();
        created.push(canvas);
        return canvas;
      },
    },
  });

  try {
    const painter = new RockBodyPainter([]);
    painter.prepareShadowIntensity(2);
    const canvases = created.length;
    const puts = () =>
      created.reduce((sum, canvas) => sum + canvas.context.putCount, 0);
    const written = puts();
    const ctx = new FakeContext();
    // The star direction changes between draws; only the transform follows it.
    for (const [starX, starY] of [
      [20, 0],
      [0, 20],
      [-20, -20],
    ])
      painter.light(
        ctx as unknown as CanvasRenderingContext2D,
        0,
        0,
        5,
        starX,
        starY,
        2,
      );
    expect(created.length).toBe(canvases);
    expect(puts()).toBe(written);
    expect(new Set(ctx.drawn.map((d) => d.image)).size).toBe(1);
    expect(ctx.depth).toBe(0);

    painter.dispose();
    const later = new RockBodyPainter([]);
    const beforeReacquire = created.length;
    later.prepareShadowIntensity(2);
    expect(created.length).toBeGreaterThan(beforeReacquire);
    later.dispose();
  } finally {
    if (priorDocument)
      Object.defineProperty(globalThis, "document", { value: priorDocument });
    else Reflect.deleteProperty(globalThis, "document");
  }
});

it("keeps its current stamp when replacement preparation fails", () => {
  const priorDocument = globalThis.document;
  let permitContext = true;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => new FakeCanvas(() => permitContext),
    },
  });
  try {
    const painter = new RockBodyPainter([]);
    permitContext = false;
    expect(() => painter.prepareShadowIntensity(1.25)).toThrow(
      "stamp canvas unavailable",
    );
    permitContext = true;
    expect(() =>
      painter.light(
        new FakeContext() as unknown as CanvasRenderingContext2D,
        0,
        0,
        1,
        1,
        0,
      ),
    ).not.toThrow();
    painter.dispose();
  } finally {
    if (priorDocument)
      Object.defineProperty(globalThis, "document", { value: priorDocument });
    else Reflect.deleteProperty(globalThis, "document");
  }
});

it("prepares shared lighting tuples with independent warm and cool stamps", () => {
  const created: FakeCanvas[] = [];
  const priorDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => {
        const canvas = new FakeCanvas();
        created.push(canvas);
        return canvas;
      },
    },
  });
  try {
    const first = new RockBodyPainter([]);
    const second = new RockBodyPainter([]);
    first.prepareLighting({
      incomingIntensity: 1,
      shadowIntensity: 1,
      temperatureK: 3500,
    });
    second.prepareLighting({
      incomingIntensity: 1,
      shadowIntensity: 1,
      temperatureK: 3500,
    });
    first.prepareLighting({
      incomingIntensity: 1,
      shadowIntensity: 1,
      temperatureK: 10000,
    });
    const stampCount = created.length;
    first.light(
      new FakeContext() as unknown as CanvasRenderingContext2D,
      0,
      0,
      1,
      1,
      0,
    );
    second.light(
      new FakeContext() as unknown as CanvasRenderingContext2D,
      0,
      0,
      1,
      1,
      0,
    );
    expect(created).toHaveLength(stampCount);
    const firstDraw = new FakeContext();
    const secondDraw = new FakeContext();
    first.light(
      firstDraw as unknown as CanvasRenderingContext2D,
      0,
      0,
      1,
      1,
      0,
    );
    second.light(
      secondDraw as unknown as CanvasRenderingContext2D,
      0,
      0,
      1,
      1,
      0,
    );
    expect(firstDraw.drawn[0].image).not.toBe(secondDraw.drawn[0].image);
    first.dispose();
    second.dispose();
  } finally {
    if (priorDocument)
      Object.defineProperty(globalThis, "document", { value: priorDocument });
    else Reflect.deleteProperty(globalThis, "document");
  }
});

it("keeps dark pixels neutral at shadow zero and applies temperature only to lit pixels", () => {
  const created: FakeCanvas[] = [];
  const priorDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => {
        const canvas = new FakeCanvas();
        created.push(canvas);
        return canvas;
      },
    },
  });
  try {
    const latestPixels = () => {
      const pixels = created.at(-1)?.context.data;
      if (!pixels) throw new Error("Expected a prepared stamp");
      return pixels;
    };
    const painter = new RockBodyPainter([]);
    painter.prepareLighting({
      incomingIntensity: 1,
      shadowIntensity: 0,
      temperatureK: 3500,
    });
    const warm = latestPixels();
    painter.prepareLighting({
      incomingIntensity: 1,
      shadowIntensity: 0,
      temperatureK: 10000,
    });
    const cool = latestPixels();
    const dark = (64 * 128 + 32) * 4;
    const lit = (64 * 128 + 110) * 4;
    expect([warm[dark], warm[dark + 1], warm[dark + 2]]).toEqual([
      128, 128, 128,
    ]);
    expect([cool[dark], cool[dark + 1], cool[dark + 2]]).toEqual([
      128, 128, 128,
    ]);
    expect(warm[lit]).toBeGreaterThan(warm[lit + 1]);
    expect(warm[lit + 1]).toBeGreaterThan(warm[lit + 2]);
    expect(cool[lit + 2]).toBeGreaterThan(cool[lit + 1]);
    expect(cool[lit + 1]).toBeGreaterThan(cool[lit]);
    painter.prepareLighting({
      incomingIntensity: 0,
      shadowIntensity: 0,
      temperatureK: 3500,
    });
    const neutral = latestPixels();
    expect([neutral[lit], neutral[lit + 1], neutral[lit + 2]]).toEqual([
      128, 128, 128,
    ]);
    painter.dispose();
  } finally {
    if (priorDocument)
      Object.defineProperty(globalThis, "document", { value: priorDocument });
    else Reflect.deleteProperty(globalThis, "document");
  }
});

it("rejects non-finite, out-of-range and unknown lighting settings", () => {
  for (const settings of [
    { incomingIntensity: Number.NaN, shadowIntensity: 1, temperatureK: 5800 },
    { incomingIntensity: 1, shadowIntensity: 1, temperatureK: 10001 },
    {
      incomingIntensity: 1,
      shadowIntensity: 1,
      temperatureK: 5800,
      extra: true,
    },
  ])
    expect(RockBodyLightingSchema.safeParse(settings).success).toBe(false);
});

it("does not expose the painter's leased settings to caller mutation", () => {
  const priorDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: () => new FakeCanvas() },
  });
  try {
    const painter = new RockBodyPainter([]);
    const returned = painter.prepareLighting({
      incomingIntensity: 1.5,
      shadowIntensity: 0.5,
      temperatureK: 6500,
    });
    returned.incomingIntensity = 0;
    painter.light(
      new FakeContext() as unknown as CanvasRenderingContext2D,
      0,
      0,
      1,
      1,
      0,
      0.5,
    );
    expect(() =>
      painter.light(
        new FakeContext() as unknown as CanvasRenderingContext2D,
        0,
        0,
        1,
        1,
        0,
        1,
      ),
    ).toThrow("not prepared");
    painter.dispose();
  } finally {
    if (priorDocument)
      Object.defineProperty(globalThis, "document", { value: priorDocument });
    else Reflect.deleteProperty(globalThis, "document");
  }
});

class FakeCanvas {
  width = 0;
  height = 0;
  context = new FakeRasterContext();
  constructor(private readonly permitContext = () => true) {}
  getContext() {
    return this.permitContext() ? this.context : null;
  }
}

class FakeRasterContext {
  putCount = 0;
  data?: Uint8ClampedArray;
  createImageData(width: number, height: number) {
    this.data = new Uint8ClampedArray(width * height * 4);
    return { data: this.data };
  }
  putImageData() {
    this.putCount++;
  }
}

class FakeContext {
  depth = 0;
  angle = 0;
  drawn: { image: CanvasImageSource; angle: number }[] = [];
  save() {
    this.depth++;
  }
  restore() {
    this.depth--;
  }
  translate() {}
  rotate(angle: number) {
    this.angle = angle;
  }
  drawImage(image: CanvasImageSource) {
    this.drawn.push({ image, angle: this.angle });
  }
}
