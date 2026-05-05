export interface PerformanceSnapshot {
  fps: number;
  frameTimeMs: number;
  physicsMs: number;
  renderMs: number;
  particleCount: number;
}

export class PerformanceMonitor {
  private frameStart = 0;
  private physicsStart = 0;
  private renderStart = 0;

  private frameCount = 0;
  private lastFpsTimestamp = 0;

  private frameTimeMs = 0;
  private physicsMs = 0;
  private renderMs = 0;
  private fps = 0;

  constructor(private readonly smoothing = 0.2) {}

  beginFrame(timestamp: number): void {
    this.frameStart = timestamp;
    if (this.lastFpsTimestamp === 0) {
      this.lastFpsTimestamp = timestamp;
    }
  }

  beginPhysics(timestamp: number): void {
    this.physicsStart = timestamp;
  }

  endPhysics(timestamp: number): void {
    const sample = timestamp - this.physicsStart;
    this.physicsMs = this.smooth(this.physicsMs, sample);
  }

  beginRender(timestamp: number): void {
    this.renderStart = timestamp;
  }

  endRender(timestamp: number): void {
    const sample = timestamp - this.renderStart;
    this.renderMs = this.smooth(this.renderMs, sample);
  }

  endFrame(timestamp: number): void {
    const sample = timestamp - this.frameStart;
    this.frameTimeMs = this.smooth(this.frameTimeMs, sample);
    this.frameCount += 1;

    const elapsed = timestamp - this.lastFpsTimestamp;
    if (elapsed >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsTimestamp = timestamp;
    }
  }

  getSnapshot(particleCount: number): PerformanceSnapshot {
    return {
      fps: this.fps,
      frameTimeMs: round2(this.frameTimeMs),
      physicsMs: round2(this.physicsMs),
      renderMs: round2(this.renderMs),
      particleCount,
    };
  }

  private smooth(current: number, sample: number): number {
    if (current === 0) {
      return sample;
    }
    return current + (sample - current) * this.smoothing;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
