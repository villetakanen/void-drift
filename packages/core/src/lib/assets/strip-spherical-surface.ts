/** Native-image sphere turn: scroll longitude, squeeze columns, then rows.
 * The atlas is unlit and cylindrical. Latitude resampling and geometry are
 * prepared once; a turn uses drawImage only, including for transparent maps.
 * Kept beside SphericalSurface while the Practice trial is evaluated.
 */
export class StripSphericalSurface {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly map: HTMLCanvasElement;
  private readonly atlas: HTMLCanvasElement;
  private readonly buffer: CanvasRenderingContext2D;
  private readonly columns: {
    x: number;
    width: number;
    u: number;
    span: number;
  }[] = [];
  private readonly rows: { x: number; width: number }[] = [];
  private phaseBin: number | undefined;
  private redraws = 0;

  /** Completed surface projections, including preparation; observing never draws. */
  get redrawCount(): number {
    return this.redraws;
  }

  constructor(atlas: HTMLCanvasElement, size = 192) {
    this.atlas = atlas;
    this.canvas = document.createElement("canvas");
    this.ctx = this.context(this.canvas);
    this.buffer = this.context(document.createElement("canvas"));
    this.map = document.createElement("canvas");
    this.canvas.width = 0;
    this.draw(0, size);
  }

  private context(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Strip sphere canvas unavailable");
    return context;
  }

  private resize(size: number) {
    const atlas = this.atlas;
    this.canvas.width = this.canvas.height = size;
    this.buffer.canvas.width = this.buffer.canvas.height = size;
    this.map.width = atlas.width * 3;
    this.map.height = size;
    const map = this.context(this.map);
    this.columns.length = this.rows.length = 0;
    this.phaseBin = undefined;
    // Three copies let any visible half-turn cross longitude zero without a
    // split draw or clamped sampling at the atlas edge.
    for (let y = 0; y < size; y++) {
      const ny = ((y + 0.5) * 2) / size - 1;
      const v = (Math.asin(ny) / Math.PI + 0.5) * atlas.height;
      for (let copy = 0; copy < 3; copy++)
        map.drawImage(
          atlas,
          0,
          Math.max(0, Math.min(atlas.height - 1, v - 0.5)),
          atlas.width,
          1,
          copy * atlas.width,
          y,
          atlas.width,
          1,
        );
      const width = Math.sqrt(1 - ny * ny) * size;
      this.rows.push({ x: (size - width) / 2, width });
    }
    // Integer destination edges tile the buffer without strip gaps. Linear
    // image interpolation approximates longitude within each three-pixel strip.
    for (let x = 0; x < size; x += 3) {
      const width = Math.min(3, size - x);
      const left = Math.asin((x * 2) / size - 1) / (2 * Math.PI);
      const right = Math.asin(((x + width) * 2) / size - 1) / (2 * Math.PI);
      this.columns.push({
        x,
        width,
        u: left * atlas.width,
        span: (right - left) * atlas.width,
      });
    }
  }

  draw(phase: number, diameter = this.canvas.width) {
    // Coarser steps for close views avoid reallocating on small zoom changes.
    const step = diameter <= 128 ? 8 : diameter <= 512 ? 32 : 64;
    const size = Math.max(8, Math.ceil(diameter / step) * step);
    if (size !== this.canvas.width) this.resize(size);
    // Absolute phase bins make the image independent of which ticks were
    // actually drawn.
    // EXPERIMENT (2026-11-17): one bin moves the equator two buffer pixels,
    // not one, to halve redraws of large or fast surfaces (The Cradle's clouds
    // close up). If the turn looks steppy, return to `Math.PI * size`.
    const tau = 2 * Math.PI;
    const bins = Math.ceil((Math.PI * size) / 2);
    const cycle = ((phase % tau) + tau) % tau;
    const bin = Math.floor((cycle / tau) * bins + 1e-9) % bins;
    if (bin === this.phaseBin) return;
    this.phaseBin = bin;
    const turn = (bin / bins + 0.5) % 1;
    const width = this.map.width / 3;
    this.buffer.clearRect(0, 0, size, size);
    for (const column of this.columns)
      this.buffer.drawImage(
        this.map,
        width * (1 + turn) + column.u,
        0,
        column.span,
        size,
        column.x,
        0,
        column.width,
        size,
      );
    this.ctx.clearRect(0, 0, size, size);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    this.ctx.clip();
    for (let y = 0; y < size; y++) {
      const row = this.rows[y];
      this.ctx.drawImage(
        this.buffer.canvas,
        0,
        y,
        size,
        1,
        row.x,
        y,
        row.width,
        1,
      );
    }
    this.ctx.restore();
    this.redraws++;
  }
}
