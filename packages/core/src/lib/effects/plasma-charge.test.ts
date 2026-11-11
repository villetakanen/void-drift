import { expect, it, vi } from "vitest";
import { paintPlasmaCharge } from "./plasma-charge";

it("caches the charge colours and tightens the bead as charge rises", () => {
  let canvases = 0;
  const cache = {
    createRadialGradient: () => ({ addColorStop() {} }),
    beginPath() {},
    arc() {},
    fill() {},
    fillStyle: "",
  };
  vi.stubGlobal("document", {
    createElement: () => {
      canvases++;
      return { width: 0, height: 0, getContext: () => cache };
    },
  });
  try {
    const widths: number[] = [];
    const ctx = {
      drawImage: (_image: unknown, _x: number, _y: number, width: number) =>
        widths.push(width),
    } as unknown as CanvasRenderingContext2D;
    paintPlasmaCharge(ctx, 0);
    const built = canvases;
    paintPlasmaCharge(ctx, 0.9);
    expect(built).toBeGreaterThan(1);
    expect(canvases).toBe(built);
    expect(widths[1]).toBeLessThan(widths[0]);
  } finally {
    vi.unstubAllGlobals();
  }
});
