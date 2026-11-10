import { FxPass } from "./arcade-fx";

/** One game-time decay shared by every source's painted light. */
export const FX_HALF_LIFE = 0.1;
export function fxRetention(seconds: number) {
  return 2 ** (-Math.max(0, seconds) / FX_HALF_LIFE);
}

function sameCamera(a: DOMMatrix, b: DOMMatrix) {
  return (
    a.a === b.a &&
    a.b === b.b &&
    a.c === b.c &&
    a.d === b.d &&
    a.e === b.e &&
    a.f === b.f
  );
}
function buffer(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("FX surface requires Canvas 2D");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  return ctx;
}

/**
 * One black image remembers light, never individual trail objects. Its contents
 * fade continuously in game time. A reusable spare handles camera reprojection.
 */
export class FxSurface {
  readonly pass = new FxPass();
  private history?: CanvasRenderingContext2D;
  private camera?: DOMMatrix;
  private spare?: CanvasRenderingContext2D;
  private time: number | undefined;

  clear() {
    if (this.history) {
      this.history.resetTransform();
      this.history.fillStyle = "#000";
      this.history.globalAlpha = 1;
      this.history.globalCompositeOperation = "source-over";
      this.history.fillRect(
        0,
        0,
        this.history.canvas.width,
        this.history.canvas.height,
      );
    }
    this.camera = undefined;
    this.time = undefined;
    this.pass.budget.reset();
  }

  draw(
    target: CanvasRenderingContext2D,
    gameTime: number,
    emit: (ctx: CanvasRenderingContext2D, pass: FxPass) => void,
    additive = true,
  ) {
    if (!Number.isFinite(gameTime) || gameTime < 0) return;
    const { width, height } = target.canvas;
    if (!width || !height) return;
    if (
      !this.spare ||
      this.spare.canvas.width !== width ||
      this.spare.canvas.height !== height
    ) {
      this.history = buffer(width, height);
      this.spare = buffer(width, height);
      this.camera = undefined;
      this.clear();
    }
    if (this.time !== undefined && gameTime < this.time) this.clear();
    let history = this.history;
    let spare = this.spare;
    if (!history || !spare) return;
    const camera = target.getTransform();
    const elapsed =
      this.time === undefined
        ? Math.min(gameTime, 1 / 60)
        : gameTime - this.time;
    this.time = gameTime;
    if (elapsed > 0) {
      const retention = fxRetention(elapsed);
      let ctx = history;
      if (this.camera && !sameCamera(camera, this.camera)) {
        const next = spare;
        next.resetTransform();
        next.fillStyle = "#000";
        next.globalAlpha = 1;
        next.globalCompositeOperation = "source-over";
        next.fillRect(0, 0, width, height);
        next.setTransform(camera.multiply(this.camera.inverse()));
        next.globalAlpha = retention;
        next.drawImage(ctx.canvas, 0, 0);
        spare = ctx;
        history = next;
        this.spare = spare;
        this.history = history;
        ctx = next;
      } else {
        ctx.resetTransform();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1 - retention;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
      }
      this.camera = camera;
      ctx.setTransform(camera);
      // Integrate fresh emission over game time, with no catch-up queue.
      this.pass.begin(
        ctx,
        true,
        Math.min(1, 2.2 * (1 - fxRetention(Math.min(elapsed, 0.1)))),
      );
      try {
        emit(ctx, this.pass);
      } finally {
        this.pass.end(ctx);
      }
    }
    target.save();
    try {
      // Black is neutral under both additive and screen composition. Source-over
      // would let the opaque backing black cover the caller's existing world.
      target.globalCompositeOperation = additive ? "lighter" : "screen";
      target.globalAlpha = 1;
      target.shadowBlur = 0;
      target.shadowColor = "transparent";
      target.shadowOffsetX = target.shadowOffsetY = 0;
      target.filter = "none";
      target.resetTransform();
      target.fillStyle = "#000";
      target.fillRect(0, 0, width, height);
      if (this.camera && !sameCamera(camera, this.camera))
        target.setTransform(camera.multiply(this.camera.inverse()));
      else target.resetTransform();
      target.drawImage(history.canvas, 0, 0);
    } finally {
      target.restore();
    }
  }
}
