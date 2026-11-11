import { expect, it, vi } from "vitest";
import { paintPlasmaPlume } from "./plasma-plume";

it("caches complete frames, flares at release and respects decorative budget", () => {
  let canvases = 0;
  const cacheContext = {
    createRadialGradient: () => ({ addColorStop() {} }),
    beginPath() {},
    arc() {},
    fill() {},
    fillStyle: "",
    globalCompositeOperation: "",
  };
  vi.stubGlobal("document", {
    createElement: () => {
      canvases++;
      return { width: 0, height: 0, getContext: () => cacheContext };
    },
  });
  try {
    const sizes: number[] = [];
    let sparks = 0;
    const ctx = {
      save() {},
      restore() {},
      translate() {},
      scale() {},
      rotate() {},
      drawImage: (_image: unknown, _x: number, _y: number, width: number) =>
        sizes.push(width),
      fillRect: () => {
        sparks++;
      },
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D;
    paintPlasmaPlume(ctx, 1, 0, 3, () => true);
    const built = canvases;
    const fullSparks = sparks;
    paintPlasmaPlume(ctx, 1, 10, 4, () => false);
    expect(canvases).toBe(built);
    expect(built).toBeGreaterThan(1);
    expect(sizes[0]).toBeGreaterThan(sizes[1]);
    expect(fullSparks).toBeGreaterThan(0);
    expect(sparks).toBe(fullSparks);
    paintPlasmaPlume(ctx, 0.5, 10, 5, () => true);
    expect(sizes[2]).toBeLessThan(sizes[1]);
  } finally {
    vi.unstubAllGlobals();
  }
});
