import { describe, expect, it } from "vitest";
import type { Camera } from "../physics/Camera";
import type { Planet, Star } from "../physics/Physics";
import { Vec2 } from "../physics/Physics";
import { assignPlanetSystemPositions } from "../physics/planets";
import { drawSunFields } from "./sun-fields";
import { drawWorldHud, worldHudUserUnitsPerCssPixel } from "./world-hud";

function context({
  width = 2000,
  height = 1000,
  cssWidth = 1000,
  cssHeight = 500,
  scaleX = 1,
  scaleY = 1,
}: {
  width?: number;
  height?: number;
  cssWidth?: number;
  cssHeight?: number;
  scaleX?: number;
  scaleY?: number;
} = {}) {
  const canvas = {
    width,
    height,
    getBoundingClientRect: () => ({ width: cssWidth, height: cssHeight }),
  } as unknown as HTMLCanvasElement;
  return {
    canvas,
    getTransform: () => ({ a: scaleX, b: 0, c: 0, d: scaleY }),
  } as unknown as CanvasRenderingContext2D;
}

describe("World HUD CSS sizing", () => {
  it("accounts for backing-store density and current transform", () => {
    expect(
      worldHudUserUnitsPerCssPixel(
        context({ width: 2560, height: 1440, cssWidth: 1280, cssHeight: 720 }),
      ),
    ).toBe(2);
  });

  it("gives no scale for a zero-sized canvas", () => {
    expect(
      worldHudUserUnitsPerCssPixel(
        context({ width: 0, height: 0, cssWidth: 0, cssHeight: 0 }),
      ),
    ).toBeUndefined();
  });

  it("keeps stroke widths and label size unchanged across camera zoom", () => {
    const strokeWidths: number[] = [];
    const textFonts: string[] = [];
    let currentLineWidth = 0;
    let currentFont = "";
    const ctx = {
      ...context({ width: 2560, height: 1440, cssWidth: 1280, cssHeight: 720 }),
      get lineWidth() {
        return currentLineWidth;
      },
      set lineWidth(value: number) {
        currentLineWidth = value;
      },
      get font() {
        return currentFont;
      },
      set font(value: string) {
        currentFont = value;
      },
      save() {},
      restore() {},
      setLineDash() {},
      beginPath() {},
      arc() {},
      moveTo() {},
      lineTo() {},
      stroke() {
        strokeWidths.push(currentLineWidth);
      },
      strokeText() {
        textFonts.push(currentFont);
      },
      fillText() {},
    } as unknown as CanvasRenderingContext2D;
    const planet = {
      pos: { x: 20, y: 0 },
      orbitCenter: { x: 0, y: 0 },
      orbitRadius: 20,
      orbitAngle: 0,
      initialAngle: 0,
      orbitSpeed: 0,
      radius: 5,
      mass: 100,
      color: "#fff",
      type: "rock",
      displayName: "Mercury",
      systemPosition: 1,
    } as Planet;
    const star = {
      pos: { x: 0, y: 0 } as Vec2,
      radius: 5,
      mass: 10,
      influenceRadius: 20,
      color: "#fff",
      glowColor: "#fff",
      type: "G",
      pulseSpeed: 1,
      powerMultiplier: 1,
      burnMultiplier: 1,
    } as Star;

    const pixel = worldHudUserUnitsPerCssPixel(ctx);
    const fonts: string[][] = [];
    for (const zoom of [1, 16]) {
      strokeWidths.length = 0;
      textFonts.length = 0;
      drawWorldHud(
        ctx,
        {
          zoom,
          worldToScreen: (x: number, y: number) => ({ x, y }),
        } as unknown as Camera,
        star,
        [planet],
      );
      expect(strokeWidths.length).toBeGreaterThan(0);
      expect(strokeWidths.every((width) => width === pixel)).toBe(true);
      fonts.push([...textFonts]);
    }
    expect(fonts[1]).toEqual(fonts[0]);
  });

  it("draws Sun field strokes at one CSS pixel on a dense backing store", () => {
    const strokeWidths: number[] = [];
    let currentLineWidth = 0;
    const ctx = {
      ...context({ width: 2560, height: 1440, cssWidth: 1280, cssHeight: 720 }),
      get lineWidth() {
        return currentLineWidth;
      },
      set lineWidth(value: number) {
        currentLineWidth = value;
      },
      font: "",
      save() {},
      restore() {},
      setLineDash() {},
      beginPath() {},
      arc() {},
      stroke() {
        strokeWidths.push(currentLineWidth);
      },
      fill() {},
      fillText() {},
    } as unknown as CanvasRenderingContext2D;
    const star = {
      pos: new Vec2(0, 0),
      radius: 5,
      mass: 10,
      influenceRadius: 20,
      color: "#fff",
      glowColor: "#fff",
      type: "G",
      pulseSpeed: 1,
      powerMultiplier: 1,
      burnMultiplier: 1,
      designation: "G7 Sun",
    } as Star;

    drawSunFields(ctx, star, { collecting: false, damaging: false });
    expect(strokeWidths.length).toBeGreaterThan(0);
    expect(
      strokeWidths.every(
        (width) => width === worldHudUserUnitsPerCssPixel(ctx),
      ),
    ).toBe(true);
  });

  it("keeps full-system numbering after filtering and uses explicit fallback names", () => {
    const labels: string[] = [];
    const ctx = {
      ...context(),
      lineWidth: 1,
      save() {},
      restore() {},
      setLineDash() {},
      beginPath() {},
      arc() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      strokeText() {},
      fillText(text: string) {
        labels.push(text);
      },
    } as unknown as CanvasRenderingContext2D;
    const namedInner = {
      pos: new Vec2(10, 0),
      orbitCenter: new Vec2(0, 0),
      orbitRadius: 10,
      orbitSpeed: 0,
      orbitAngle: 0,
      initialAngle: 0,
      radius: 2,
      mass: 10,
      color: "#fff",
      type: "rock",
      displayName: "Inner",
    } as Planet;
    const unnamedOuter = {
      pos: new Vec2(30, 0),
      orbitCenter: new Vec2(0, 0),
      orbitRadius: 30,
      orbitSpeed: 0,
      orbitAngle: 0,
      initialAngle: 0,
      radius: 2,
      mass: 10,
      color: "#fff",
      type: "rock",
    } as Planet;
    const namedMiddle = {
      pos: new Vec2(20, 0),
      orbitCenter: new Vec2(0, 0),
      orbitRadius: 20,
      orbitSpeed: 0,
      orbitAngle: 0,
      initialAngle: 0,
      radius: 2,
      mass: 10,
      color: "#fff",
      type: "rock",
      displayName: "Middle",
    } as Planet;
    const fullSystem = [unnamedOuter, namedMiddle, namedInner];
    assignPlanetSystemPositions(fullSystem);
    expect(unnamedOuter.systemPosition).toBe(3);
    const inspectorSelection = fullSystem.filter(
      (planet) => planet.systemPosition === 3,
    );
    const camera = {
      zoom: 1,
      worldToScreen: (x: number, y: number) => ({ x, y }),
    } as unknown as Camera;
    const sun = {
      pos: new Vec2(0, 0),
      radius: 5,
      mass: 10,
      influenceRadius: 20,
      color: "#fff",
      glowColor: "#fff",
      type: "G",
      pulseSpeed: 1,
      powerMultiplier: 1,
      burnMultiplier: 1,
      name: "Sun",
    } as Star;

    drawWorldHud(ctx, camera, sun, inspectorSelection);
    expect(labels).toEqual(["Sun.3"]);
    labels.length = 0;
    drawWorldHud(
      ctx,
      camera,
      { ...sun, name: undefined, denomination: "G11" },
      inspectorSelection,
    );
    expect(labels).toEqual(["G11.3"]);
    labels.length = 0;
    unnamedOuter.displayName = "Far World";
    drawWorldHud(ctx, camera, sun, inspectorSelection);
    expect(labels).toEqual(["Far World"]);
  });
});
