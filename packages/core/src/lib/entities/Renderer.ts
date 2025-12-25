import type { GameObject, Star } from "../physics/Physics";
import type { Camera } from "../physics/Camera";
import { drawShip } from "../assets/ship";
import { drawStar } from "../assets/star";
import { SURVIVAL_CONFIG } from "../config";

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  private stars: Array<{ x: number; y: number; size: number; alpha: number }> = [];

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D context");
    this.ctx = ctx;
    this.resize(canvas.width, canvas.height);

    // Generate static background stars
    // Spread them within a square covering the R=1200 circle (2400x2400)
    // Add some buffer for overscan
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 3000 + 1920 / 2, // Centered around logical center
        y: (Math.random() - 0.5) * 3000 + 1080 / 2,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.ctx.canvas.width = w;
    this.ctx.canvas.height = h;
  }

  clear() {
    this.ctx.fillStyle = "#050510"; // --color-void
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawBackground() {
    this.ctx.fillStyle = "#ffffff";
    for (const star of this.stars) {
      this.ctx.globalAlpha = star.alpha;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;
  }

  drawArenaBoundary(radius: number) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private cameraBounds: { minX: number; maxX: number; minY: number; maxY: number } | null = null;

  /**
   * Begin camera-space rendering.
   * Call this before drawing game objects.
   */
  beginCamera(camera: Camera) {
    this.ctx.save();
    camera.applyTransform(this.ctx);

    // Cache camera bounds for wrapping checks
    const offset = camera.getViewOffset();
    this.cameraBounds = {
      minX: offset.x,
      maxX: offset.x + camera.viewportWidth,
      minY: offset.y,
      maxY: offset.y + camera.viewportHeight,
    };
  }

  /**
   * End camera-space rendering.
   * Call this after drawing all game objects.
   */
  endCamera() {
    this.ctx.restore();
    this.cameraBounds = null;
  }

  /**
   * Helper to draw an object (and its ghosts if visible)
   * Note: Ghost rendering disabled for Circular Arena topology (no seamless tiling).
   */
  private renderWrapped(x: number, y: number, radius: number, draw: (offX: number, offY: number) => void) {
    draw(0, 0);
  }

  drawShip(ship: GameObject) {
    this.renderWrapped(ship.pos.x, ship.pos.y, ship.radius, (offX, offY) => {
      drawShip(this.ctx, {
        x: ship.pos.x + offX,
        y: ship.pos.y + offY,
        rotation: ship.rotation,
        color: "#00ffcc",
      });
    });
  }

  drawStar(star: Star, time: number) {
    this.renderWrapped(star.pos.x, star.pos.y, star.radius * 4, (offX, offY) => { // Use larger radius for star glow
      drawStar(this.ctx, {
        x: star.pos.x + offX,
        y: star.pos.y + offY,
        radius: star.radius,
        color: star.color,
        time: time,
        pulseSpeed: 1.0,
        powerZoneRadius: SURVIVAL_CONFIG.POWER_ZONE_3_RADIUS,
      });
    });
  }

  drawPlanet(planet: any) { // Using any to avoid circular dependency import issues if Planet isn't exported from here
    // Draw Orbit Path (Faint)
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(planet.orbitCenter.x, planet.orbitCenter.y, planet.orbitRadius, 0, Math.PI * 2);
    this.ctx.stroke();

    this.renderWrapped(planet.pos.x, planet.pos.y, planet.radius, (offX, offY) => {
      const cx = planet.pos.x + offX;
      const cy = planet.pos.y + offY;

      // Draw Planet Body
      this.ctx.fillStyle = planet.color;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, planet.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}
