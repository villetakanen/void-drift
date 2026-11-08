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
describe("Sun HUD screen-space geometry", () => {
  it("keeps stroke, dashes and coincident inset fixed across zoom, backing density and CSS stage scaling", () => {
    for (const zoom of [0.35, 0.8, 1.6])
      for (const density of [1, 2])
        for (const cssWidth of [720, 1440]) {
          const factor = (zoom * density * cssWidth) / (1920 * density);
          let radius = 0,
            dash: number[] = [];
          const strokes: {
            width: number;
            radius: number;
            dash: number[];
            color: string;
            alpha: number;
          }[] = [];
          const fills: { alpha: number; color: string }[] = [];
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
          drawSunFields(ctx as unknown as CanvasRenderingContext2D, star, {
            collecting: false,
            damaging: false,
          });
          expect(fills).toEqual([]);
          strokes.forEach((s) => {
            expect(s.width).toBeCloseTo(1);
          });
          expect(strokes[0].radius - strokes[1].radius).toBeCloseTo(2);
          expect(strokes[0].dash[0]).toBeCloseTo(5);
          expect(strokes[2].dash[1]).toBeCloseTo(4);
          expect(strokes[0].color).toBe(COLOR.countdown);
          expect(strokes[2].color).toBe(COLOR.resourceWarning);
          strokes.length = 0;
          drawSunFields(ctx as unknown as CanvasRenderingContext2D, star, {
            collecting: true,
            damaging: true,
          });
          expect(fills).toEqual([
            { alpha: 0.033, color: COLOR.countdown },
            { alpha: 0.11, color: COLOR.resourceDanger },
          ]);
          expect(strokes[1].alpha).toBe(1);
          expect(strokes[2].color).toBe(COLOR.resourceDanger);
        }
  });
});
