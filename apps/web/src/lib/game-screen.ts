/** Logical stage height; the logical width follows the viewport ratio. */
export const GAME_HEIGHT = 1080;
/** Narrowest playable stage ratio (width : height). Narrower viewports block flight. */
export const GAME_MIN_RATIO = { width: 4, height: 3 } as const;
/** Fixed gutters in CSS pixels, at every stage size. */
export const GAME_GUTTER_PX = { side: 180, edge: 48 } as const;

export interface GameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameScreen {
  /** Stage size in CSS pixels. */
  width: number;
  height: number;
  /** Stage size in logical units. */
  logicalWidth: number;
  logicalHeight: number;
  /** CSS pixels per logical unit. */
  scale: number;
  /** Gutters in CSS pixels: `side` at left and right, `edge` at top and bottom. */
  gutter: { side: number; edge: number };
  /** The centred active area inside the gutters, relative to the stage origin. */
  active: { css: GameRect; logical: GameRect };
  /** The available viewport is narrower than the minimum ratio; flight is blocked. */
  narrow: boolean;
}

/** True when a viewport is narrower than the minimum stage ratio; exactly 4:3 plays. */
export function isNarrowerThanMinRatio(width: number, height: number) {
  return width * GAME_MIN_RATIO.height < height * GAME_MIN_RATIO.width;
}

/**
 * Screen geometry only; camera framing and control layout consume these bounds.
 * `width` and `height` are the safe viewport in CSS pixels.
 */
export function fitGameScreen(width: number, height: number): GameScreen {
  const availableWidth = Math.max(0, width);
  const availableHeight = Math.max(0, height);
  const minRatio = GAME_MIN_RATIO.width / GAME_MIN_RATIO.height;
  const narrow = isNarrowerThanMinRatio(availableWidth, availableHeight);
  // A narrower (or empty) viewport holds the minimum-ratio stage behind the gate.
  const ratio = Math.max(
    minRatio,
    availableWidth / Math.max(1, availableHeight),
  );
  const logicalWidth = GAME_HEIGHT * ratio;
  const scale = Math.min(
    availableWidth / logicalWidth,
    availableHeight / GAME_HEIGHT,
  );
  const stageWidth = logicalWidth * scale;
  const stageHeight = GAME_HEIGHT * scale;
  const { side, edge } = GAME_GUTTER_PX;
  const activeWidth = Math.max(0, stageWidth - side * 2);
  const activeHeight = Math.max(0, stageHeight - edge * 2);
  const css: GameRect = {
    x: (stageWidth - activeWidth) / 2,
    y: (stageHeight - activeHeight) / 2,
    width: activeWidth,
    height: activeHeight,
  };
  const toLogical = (value: number) => (scale > 0 ? value / scale : 0);
  return {
    width: stageWidth,
    height: stageHeight,
    logicalWidth,
    logicalHeight: GAME_HEIGHT,
    scale,
    gutter: { side, edge },
    active: {
      css,
      logical: {
        x: toLogical(css.x),
        y: toLogical(css.y),
        width: toLogical(css.width),
        height: toLogical(css.height),
      },
    },
    narrow,
  };
}
