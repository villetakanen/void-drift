/** Native-image sphere turn: scroll longitude, squeeze columns, then rows.
 * The atlas is unlit and cylindrical. Latitude resampling and geometry are
 * prepared once; a turn uses drawImage only, including for transparent maps.
 * Kept beside SphericalSurface while the Practice trial is evaluated.
 */
export class StripSphericalSurface {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly map: HTMLCanvasElement;
  private readonly buffer: CanvasRenderingContext2D;
  private readonly columns: {
    x: number;
    width: number;
    u: number;
    span: number;
  }[] = [];
  private readonly rows: { x: number; width: number }[] = [];
  private phase: number | undefined;

  constructor(atlas: HTMLCanvasElement, size = 192) {
    const canvas = (width: number, height: number) => {
      const element = document.createElement("canvas");
      element.width = width;
      element.height = height;
      const context = element.getContext("2d");
      if (!context) throw new Error("Strip sphere canvas unavailable");
      return context;
    };
    this.ctx = canvas(size, size);
    this.canvas = this.ctx.canvas;
    this.buffer = canvas(size, size);
    // Three copies let any visible half-turn cross longitude zero without a
    // split draw or clamped sampling at the atlas edge.
    const map = canvas(atlas.width * 3, size);
    this.map = map.canvas;
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
    this.draw(0);
  }

  draw(phase: number) {
    if (phase === this.phase) return;
    this.phase = phase;
    const size = this.canvas.width;
    const turn = (((phase / (2 * Math.PI) + 0.5) % 1) + 1) % 1;
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
  }
}
