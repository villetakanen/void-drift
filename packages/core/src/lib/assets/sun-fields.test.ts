import { describe, expect, it } from "vitest";
import { type Star, Vec2 } from "../physics/Physics";
import { COLOR } from "../ui/colors";
import { drawSunFields } from "./sun-fields";

const star: Star = {
  pos: new Vec2(0, 0),
  radius: 35,
  influenceRadius: 324,
  type: "G",
  mass: 1,
  powerMultiplier: 1,
  burnMultiplier: 1,
  pulseSpeed: 1,
  color: "white",
  glowColor: "white",
};

type Stroke = {
  width: number;
  radius: number;
  dash: number[];
  color: string;
  alpha: number;
};
type Fill = { alpha: number; color: string };

/** Draws the fields and reports every stroke in on-screen CSS pixels. */
function draw(
  zoom: number,
  density: number,
  cssWidth: number,
  effects: { collecting: boolean; damaging: boolean },
) {
  const factor = (zoom * density * cssWidth) / (1920 * density);
  let radius = 0,
    dash: number[] = [];
  const strokes: Stroke[] = [];
  const fills: Fill[] = [];
  const ctx = {
    canvas: {
      width: 1920 * density,
      getBoundingClientRect: () => ({ width: cssWidth }),
    },
    getTransform: () => ({ a: zoom * density, b: 0 }),
    save() {},
    restore() {},
    beginPath() {},
    arc(_x: number, _y: number, r: number) {
      radius = r;
    },
    lineWidth: 0,
    globalAlpha: 1,
    strokeStyle: "",
    fillStyle: "",
    lineCap: "butt",
    setLineDash(value: number[]) {
      dash = value;
    },
    stroke() {
      strokes.push({
        width: this.lineWidth * factor,
        radius: radius * factor,
        dash: dash.map((v) => v * factor),
        color: this.strokeStyle,
        alpha: this.globalAlpha,
      });
    },
    fill() {
      fills.push({ alpha: this.globalAlpha, color: this.fillStyle });
    },
  };
  drawSunFields(ctx as unknown as CanvasRenderingContext2D, star, effects);
  return { strokes, fills };
}

const idle = { collecting: false, damaging: false };
const active = { collecting: true, damaging: true };

describe("Sun HUD screen-space geometry", () => {
  it("keeps stroke, dashes and coincident inset fixed across zoom, backing density and CSS stage scaling", () => {
    const reference = draw(1, 1, 1920, idle).strokes;
    const inset = reference[0].radius - reference[1].radius;
    expect(inset).toBeGreaterThan(0);
    for (const s of reference) expect(s.width).toBeCloseTo(reference[0].width);
    expect(reference[0].dash.length).toBeGreaterThan(0);
    expect(reference[2].dash.length).toBeGreaterThan(0);
    for (const zoom of [0.35, 0.8, 1.6])
      for (const density of [1, 2])
        for (const cssWidth of [720, 1440]) {
          const { strokes } = draw(zoom, density, cssWidth, idle);
          expect(strokes).toHaveLength(reference.length);
          strokes.forEach((s, i) => {
            expect(s.width).toBeCloseTo(reference[i].width);
            s.dash.forEach((d, j) => {
              expect(d).toBeCloseTo(reference[i].dash[j]);
            });
          });
          expect(strokes[0].radius - strokes[1].radius).toBeCloseTo(inset);
        }
  });

  it("fills and brightens the fields the ship is collecting from or burning in", () => {
    const quiet = draw(1, 1, 1920, idle);
    expect(quiet.fills).toEqual([]);
    expect(quiet.strokes[0].color).toBe(COLOR.countdown);
    expect(quiet.strokes[2].color).toBe(COLOR.resourceWarning);
    const lit = draw(1, 1, 1920, active);
    expect(lit.fills.map((f) => f.color)).toEqual([
      COLOR.countdown,
      COLOR.resourceDanger,
    ]);
    for (const fill of lit.fills) expect(fill.alpha).toBeGreaterThan(0);
    expect(lit.strokes[1].alpha).toBeGreaterThan(quiet.strokes[1].alpha);
    expect(lit.strokes[2].color).toBe(COLOR.resourceDanger);
  });
});
