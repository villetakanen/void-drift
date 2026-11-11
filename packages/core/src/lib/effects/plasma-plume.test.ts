import { expect, it, vi } from "vitest";
import { paintPlasmaPlume } from "./plasma-plume";

it("draws no decorative sparks the budget refuses", () => {
  const cacheContext = {
    createRadialGradient: () => ({ addColorStop() {} }),
    beginPath() {},
    arc() {},
    fill() {},
    fillStyle: "",
    globalCompositeOperation: "",
  };
  vi.stubGlobal("document", {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => cacheContext,
    }),
  });
  try {
    let sparks = 0;
    const ctx = {
      save() {},
      restore() {},
      translate() {},
      scale() {},
      rotate() {},
      drawImage() {},
      fillRect: () => {
        sparks++;
      },
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D;
    paintPlasmaPlume(ctx, 1, 0, 3, () => true);
    const fullSparks = sparks;
    expect(fullSparks).toBeGreaterThan(0);
    paintPlasmaPlume(ctx, 1, 10, 4, () => false);
    expect(sparks).toBe(fullSparks);
  } finally {
    vi.unstubAllGlobals();
  }
});
