import { expect, it } from "vitest";
import {
  DEFAULT_ROCK_BODY_LIGHTING,
  RockBodyLightingSchema,
} from "../schemas/rock-body-lighting";
import { RockBodyPainter } from "./rock-body";

it("shares prepared intensity stamps and only rotates during drawing", () => {
  const created: FakeCanvas[] = [];
  const priorDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement(name: string) {
        if (name !== "canvas") throw new Error(`Unexpected element: ${name}`);
        const canvas = new FakeCanvas();
        created.push(canvas);
        return canvas;
      },
    },
  });

  try {
    const first = new RockBodyPainter([]);
    const second = new RockBodyPainter([]);
    first.prepareShadowIntensity(0);
    second.prepareShadowIntensity(0);
    first.prepareShadowIntensity(2);
    const a = new FakeContext();
    const b = new FakeContext();

    first.light(
      a as unknown as CanvasRenderingContext2D,
      10,
      20,
      5,
      0,
      20.00001,
      2,
    );
    second.light(
      b as unknown as CanvasRenderingContext2D,
      10,
      20,
      5,
      0,
      19.99999,
      0,
    );
    first.prepareShadowIntensity(1);
    const preparedCanvasCount = created.length;
    first.light(
      a as unknown as CanvasRenderingContext2D,
      10,
      20,
      5,
      0,
      20.00001,
      1,
    );

    expect(created.length).toBe(preparedCanvasCount);
    expect(created.map((canvas) => canvas.context.putCount)).toEqual([
      1, 1, 1, 1,
    ]);
    expect(a.drawn).toHaveLength(2);
    expect(b.drawn).toHaveLength(1);
    expect(a.drawn[0].image).toBe(created[2]);
    expect(a.drawn[1].image).toBe(created[3]);
    expect(b.drawn[0].image).toBe(created[1]);
    expect(a.drawn[0].angle).toBeCloseTo(Math.PI, 5);
    expect(b.drawn[0].angle).toBeCloseTo(-Math.PI, 5);
    expect(a.depth).toBe(0);
    expect(b.depth).toBe(0);

    first.dispose();
    second.dispose();
    const beforeReacquire = created.length;
    const later = new RockBodyPainter([]);
    later.prepareShadowIntensity(0);
    expect(created).toHaveLength(beforeReacquire + 1);
    later.dispose();
    expect(() =>
      first.light(a as unknown as CanvasRenderingContext2D, 0, 0, 1, 1, 0),
    ).toThrow("disposed");
  } finally {
    if (priorDocument)
      Object.defineProperty(globalThis, "document", { value: priorDocument });
    else Reflect.deleteProperty(globalThis, "document");
  }
});

it("does not let one painter draw another painter's prepared intensity", () => {
  const priorDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: () => new FakeCanvas() },
  });
  try {
    const painter = new RockBodyPainter([]);
    expect(() =>
      painter.light(
        new FakeContext() as unknown as CanvasRenderingContext2D,
        0,
        0,
        1,
        1,
        0,
        1.37,
      ),
    ).toThrow("not prepared by this painter");
    expect(() => painter.prepareShadowIntensity(Number.NaN)).toThrow("finite");
    painter.dispose();
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

it("validates lighting settings and keeps shared defaults separate from unit multipliers", () => {
  expect(DEFAULT_ROCK_BODY_LIGHTING).toEqual({
    incomingIntensity: 1.35,
    shadowIntensity: 1.35,
    temperatureK: 5800,
  });
  expect(RockBodyLightingSchema.parse({})).toEqual(DEFAULT_ROCK_BODY_LIGHTING);
  expect(
    RockBodyLightingSchema.safeParse({
      incomingIntensity: Number.NaN,
      shadowIntensity: 1,
      temperatureK: 5800,
    }).success,
  ).toBe(false);
  expect(
    RockBodyLightingSchema.safeParse({
      incomingIntensity: 1,
      shadowIntensity: 1,
      temperatureK: 10001,
    }).success,
  ).toBe(false);
  expect(
    RockBodyLightingSchema.safeParse({
      incomingIntensity: 1,
      shadowIntensity: 1,
      temperatureK: 5800,
      extra: true,
    }).success,
  ).toBe(false);
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
