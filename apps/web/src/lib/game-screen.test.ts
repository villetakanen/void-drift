import { describe, expect, it } from "vitest";
import {
  fitGameScreen,
  GAME_GUTTER_PX,
  GAME_HEIGHT,
  GAME_MIN_RATIO,
  isNarrowerThanMinRatio,
} from "./game-screen";

const minRatio = GAME_MIN_RATIO.width / GAME_MIN_RATIO.height;
// Viewports at the minimum ratio, common wide ratios and ultra-wide.
const playable: Array<[number, number]> = [
  [1024, 768],
  [1200, 800],
  [1920, 1080],
  [2560, 1080],
  [3440, 1440],
  [5120, 1080],
];

describe("game screen geometry", () => {
  it("fills every viewport of the minimum ratio or wider", () => {
    for (const [width, height] of playable) {
      const screen = fitGameScreen(width, height);
      expect(screen.narrow).toBe(false);
      expect(screen.width).toBeCloseTo(width, 6);
      expect(screen.height).toBeCloseTo(height, 6);
      expect(screen.logicalHeight).toBe(GAME_HEIGHT);
      expect(screen.logicalWidth / screen.logicalHeight).toBeCloseTo(
        width / height,
        9,
      );
      expect(screen.width / screen.logicalWidth).toBeCloseTo(screen.scale, 9);
      expect(screen.height / screen.logicalHeight).toBeCloseTo(screen.scale, 9);
    }
  });

  it("keeps gutters constant in CSS pixels and centres the active area", () => {
    for (const [width, height] of playable) {
      const { gutter, active, ...screen } = fitGameScreen(width, height);
      expect(gutter).toEqual(GAME_GUTTER_PX);
      const { css } = active;
      expect(css.width + 2 * gutter.side).toBeCloseTo(screen.width, 6);
      expect(css.height + 2 * gutter.edge).toBeCloseTo(screen.height, 6);
      expect(css.x).toBeCloseTo(gutter.side, 6);
      expect(css.y).toBeCloseTo(gutter.edge, 6);
      expect(css.x * 2 + css.width).toBeCloseTo(screen.width, 6);
      expect(css.y * 2 + css.height).toBeCloseTo(screen.height, 6);
    }
  });

  it("exposes the active area in logical units through the stage scale", () => {
    for (const [width, height] of playable) {
      const { active, scale, logicalWidth, logicalHeight } = fitGameScreen(
        width,
        height,
      );
      const { css, logical } = active;
      for (const key of ["x", "y", "width", "height"] as const)
        expect(logical[key] * scale).toBeCloseTo(css[key], 6);
      expect(logical.x * 2 + logical.width).toBeCloseTo(logicalWidth, 6);
      expect(logical.y * 2 + logical.height).toBeCloseTo(logicalHeight, 6);
    }
  });

  it("widens the active area with the viewport while gutters hold", () => {
    const height = 1080;
    const narrower = fitGameScreen(height * minRatio, height);
    const wider = fitGameScreen(height * minRatio * 2, height);
    expect(wider.active.css.width - narrower.active.css.width).toBeCloseTo(
      wider.width - narrower.width,
      6,
    );
    expect(wider.active.css.height).toBeCloseTo(narrower.active.css.height, 6);
    expect(wider.gutter).toEqual(narrower.gutter);
  });

  it("flags viewports narrower than the minimum ratio, exactly at the boundary", () => {
    const height = GAME_MIN_RATIO.height * 256;
    const boundary = GAME_MIN_RATIO.width * 256;
    expect(isNarrowerThanMinRatio(boundary, height)).toBe(false);
    expect(fitGameScreen(boundary, height).narrow).toBe(false);
    expect(isNarrowerThanMinRatio(boundary - 1, height)).toBe(true);
    expect(fitGameScreen(boundary - 1, height).narrow).toBe(true);
    expect(fitGameScreen(boundary + 1, height).narrow).toBe(false);
    expect(fitGameScreen(height, boundary).narrow).toBe(true);
  });

  it("holds the minimum ratio stage inside a narrow viewport", () => {
    const [width, height] = [768, 1024];
    const screen = fitGameScreen(width, height);
    expect(screen.logicalWidth / screen.logicalHeight).toBeCloseTo(minRatio, 9);
    expect(screen.width).toBeLessThanOrEqual(width);
    expect(screen.height).toBeLessThanOrEqual(height);
  });

  it("never yields negative or non-finite geometry for empty viewports", () => {
    for (const [width, height] of [
      [0, 0],
      [-10, 400],
      [100, 50],
    ]) {
      const screen = fitGameScreen(width, height);
      for (const value of [
        screen.width,
        screen.height,
        ...Object.values(screen.active.css),
        ...Object.values(screen.active.logical),
      ]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
