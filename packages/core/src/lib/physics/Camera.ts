import { Vec2 } from "./Physics";
/** Arena radius the whole-system level fits, in world units. */
export const CAMERA_ARENA_RADIUS = 1200;
/** Smallest fitting box side in logical units; an empty active area uses it. */
export const CAMERA_MIN_FIT = 1;
/** Scale of the closest zoom level. */
export const CAMERA_CLOSEST_ZOOM = 1.6;
/** Speed framing tuning: the widest level in CSS pixels per world unit, speed
 * in world units/second, clearance in logical pixels, response rates in
 * inverse seconds. */
const SPEED_CAMERA = {
  widestCssPerUnit: 0.5,
  wideSpeed: 400,
  closeSpeed: 100,
  clearance: 16,
  centreRate: 0.5,
  velocityMatchRate: 1.5,
  settlePixels: 0.05,
  widenRate: 8,
  standardTightenRate: 2,
  inwardMagnifications: [1, 2, 4, 8],
  inwardHoldSeconds: 1.5,
};
export interface CameraOptions {
  smoothing?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  /** Fitting box (the active area) in logical units; defaults to the viewport. */
  fitWidth?: number;
  fitHeight?: number;
}
export class Camera {
  public pos = new Vec2(960, 540);
  public zoom = 1;
  public zoomLevel = 0;
  public zoomLevels: number[] = [];
  public viewportWidth: number;
  public viewportHeight: number;
  /**
   * The centred box that framing fits ship, star and arena into, in logical
   * units. `null` fits the full viewport. Rendering always covers the viewport.
   */
  public fitWidth: number | null;
  public fitHeight: number | null;
  /** CSS pixels per logical unit of the stage; speed levels are fixed in CSS. */
  public cssScale = 1;
  public speedFraming = false;
  private returning = false;
  // Ship displacement from the view centre, in logical screen units.
  private speedPan = new Vec2(0, 0);
  private panVelocity = new Vec2(0, 0);
  private previousPanSubject = new Vec2(0, 0);
  private widenFilterZoom: number | null = null;
  private lastSpeed: number | null = null;
  private accelerating = false;
  private inwardCandidate: number | null = null;
  private inwardSeconds = 0;
  private subject: { x: number; y: number; radius: number } | null = null;
  private target = new Vec2(960, 540);
  private targetZoom = 1;
  private smoothing: number;
  private offset = new Vec2(0, 0);
  private view = { x: 0, y: 0 };
  private viewRect = { x: 0, y: 0, width: 0, height: 0 };
  constructor(options: CameraOptions = {}) {
    this.smoothing = options.smoothing ?? 4;
    this.viewportWidth = options.viewportWidth ?? 1920;
    this.viewportHeight = options.viewportHeight ?? 1080;
    this.fitWidth = options.fitWidth ?? null;
    this.fitHeight = options.fitHeight ?? null;
  }
  /** Width of the box framing fits into. */
  get activeWidth() {
    // A collapsing fitting box shrinks continuously to a minimum instead of
    // jumping back to the full viewport.
    return this.fitWidth === null
      ? this.viewportWidth
      : Math.max(CAMERA_MIN_FIT, this.fitWidth);
  }
  /** Height of the box framing fits into. */
  get activeHeight() {
    return this.fitHeight === null
      ? this.viewportHeight
      : Math.max(CAMERA_MIN_FIT, this.fitHeight);
  }
  /** The 1× speed level in logical pixels per world unit. */
  get speedWidestZoom() {
    return SPEED_CAMERA.widestCssPerUnit / this.cssScale;
  }
  /** The 1×, 2×, 4× and 8× speed levels in logical pixels per world unit. */
  get speedZoomLevels() {
    const widest = this.speedWidestZoom;
    return SPEED_CAMERA.inwardMagnifications.map((level) => widest * level);
  }
  /** Hold the upper label until the next outward level is reached. */
  get speedZoomMode() {
    const magnification = this.zoom / this.speedWidestZoom;
    const levels = SPEED_CAMERA.inwardMagnifications;
    return (
      levels.find((level) => magnification <= level * (1 + 1e-10)) ??
      levels[levels.length - 1]
    );
  }
  /**
   * Sets the centred fitting box; `null` fits the full viewport again.
   * `cssScale` is the stage's CSS pixels per logical unit.
   */
  setActiveArea(
    width: number | null,
    height: number | null,
    cssScale = this.cssScale,
  ) {
    const scale = cssScale > 0 && Number.isFinite(cssScale) ? cssScale : 1;
    if (
      this.fitWidth !== width ||
      this.fitHeight !== height ||
      this.cssScale !== scale
    ) {
      this.resetSpeedEligibility();
      this.widenFilterZoom = null;
    }
    this.fitWidth = width;
    this.fitHeight = height;
    this.cssScale = scale;
    this.containShip();
  }
  setTarget(x: number, y: number) {
    this.target.set(x, y);
  }
  setOffset(x: number, y: number) {
    this.offset.set(x, y);
  }
  frame(
    shipX: number,
    shipY: number,
    starX: number,
    starY: number,
    padding: number,
    smoothing: number,
    snap = false,
    zoomSteps = 5,
    previewLevel: number | null = null,
  ) {
    this.resetSpeedEligibility();
    this.widenFilterZoom = null;
    this.lastSpeed = null;
    const previous = { x: this.pos.x, y: this.pos.y, zoom: this.zoom };
    if (this.speedFraming) this.returning = !snap;
    this.speedFraming = false;
    if (snap) this.returning = false;
    this.smoothing = smoothing;
    this.target.set((shipX + starX) / 2, (shipY + starY) / 2);
    // Framing fits the active area; the active area and the viewport share a
    // centre, so the render transform below stays centred on `pos`.
    const width = this.activeWidth;
    const height = this.activeHeight;
    const fit = Math.min(
      width / (Math.abs(shipX - starX) + padding * 2),
      height / (Math.abs(shipY - starY) + padding * 2),
    );
    // The widest view contains the full 1200-unit-radius arena. Levels are
    // evenly spaced by scale ratio, from the whole system to close flight.
    const minimum =
      Math.min(width, height) / (CAMERA_ARENA_RADIUS * 2 + padding * 2);
    if (
      this.zoomLevels.length !== zoomSteps ||
      this.zoomLevels[0] !== minimum
    ) {
      this.zoomLevels = Array.from(
        { length: zoomSteps },
        (_, i) =>
          minimum * (CAMERA_CLOSEST_ZOOM / minimum) ** (i / (zoomSteps - 1)),
      );
      snap = true;
    }
    let level = 0;
    for (let i = 1; i < this.zoomLevels.length; i++) {
      // Require 8% spare room to zoom back in; zoom out as soon as needed.
      const margin = !snap && i > this.zoomLevel ? 1.08 : 1;
      if (this.zoomLevels[i] * margin <= fit) level = i;
    }
    if (previewLevel !== null)
      level = Math.max(0, Math.min(zoomSteps - 1, previewLevel));
    if (previewLevel === 0) this.target.set(starX, starY);
    this.targetZoom = this.zoomLevels[level];
    if (snap || level !== this.zoomLevel) {
      this.pos.set(this.target.x, this.target.y);
    }
    this.zoomLevel = level;
    this.zoom = this.targetZoom;
    if (this.returning) {
      this.pos.set(previous.x, previous.y);
      this.zoom = previous.zoom;
      this.containShip();
    } else this.subject = null;
  }
  /**
   * Speed selects zoom; motion matching and residual centring select pan.
   * `entrance` is the star on a new run: the first view then contains both
   * the star and the ship, and the ordinary inward rule takes over from it.
   */
  frameSpeed(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    radius: number,
    snap = false,
    entrance: { x: number; y: number; radius: number } | null = null,
  ) {
    const entering = !this.speedFraming;
    if (entering || snap) {
      this.resetSpeedEligibility();
      this.widenFilterZoom = null;
      this.lastSpeed = null;
      this.panVelocity.set(0, 0);
      this.previousPanSubject.set(x, y);
    }
    this.speedFraming = true;
    this.returning = false;
    this.subject = { x, y, radius };
    const speed = Math.hypot(velocityX, velocityY);
    this.accelerating = this.lastSpeed !== null && speed > this.lastSpeed;
    if (this.accelerating) this.resetSpeedEligibility();
    this.lastSpeed = speed;
    const influence = Math.max(
      0,
      Math.min(
        (speed - SPEED_CAMERA.closeSpeed) /
          (SPEED_CAMERA.wideSpeed - SPEED_CAMERA.closeSpeed),
        1,
      ),
    );
    // Equal speed bands halve desired magnification: 8x through 100u/s,
    // 4x at 200u/s, 2x at 300u/s and 1x at 400u/s. Demand stays continuous.
    this.targetZoom = this.speedWidestZoom * 8 ** (1 - influence);
    if (snap && entrance) {
      // Centre the bounding box of both bodies and fit it within the safe area.
      const left = Math.min(x - radius, entrance.x - entrance.radius);
      const right = Math.max(x + radius, entrance.x + entrance.radius);
      const top = Math.min(y - radius, entrance.y - entrance.radius);
      const bottom = Math.max(y + radius, entrance.y + entrance.radius);
      const shortSide = Math.min(this.activeWidth, this.activeHeight);
      const clearance = Math.min(SPEED_CAMERA.clearance, shortSide / 4);
      const fit = Math.min(
        (this.activeWidth / 2 - clearance) / Math.max((right - left) / 2, 1),
        (this.activeHeight / 2 - clearance) / Math.max((bottom - top) / 2, 1),
      );
      this.zoom = Math.min(this.targetZoom, fit);
      this.pos.set(
        (left + right) / 2 - this.offset.x,
        (top + bottom) / 2 - this.offset.y,
      );
    } else if (snap) {
      this.zoom = this.targetZoom;
      this.pos.set(x - this.offset.x, y - this.offset.y);
    }
    // Preserve the current transform until the next simulation-time update.
    // Containment measures displacement for motion matching and anchored zoom.
    this.containShip();
  }
  /** Clear pending qualification without moving the camera, including in Pause. */
  resetSpeedEligibility() {
    this.inwardCandidate = null;
    this.inwardSeconds = 0;
  }
  private placeSpeedCamera() {
    if (!this.subject) return;
    this.pos.set(
      this.subject.x + this.speedPan.x / this.zoom - this.offset.x,
      this.subject.y + this.speedPan.y / this.zoom - this.offset.y,
    );
    this.containShip();
  }
  private shipFitZoom() {
    if (!this.subject) return Number.POSITIVE_INFINITY;
    const shortSide = Math.min(this.activeWidth, this.activeHeight);
    const clearance = Math.min(SPEED_CAMERA.clearance, shortSide / 4);
    return (shortSide / 2 - clearance) / Math.max(this.subject.radius, 1);
  }
  private updateSpeedZoom(dt: number) {
    if (this.targetZoom < this.zoom) {
      this.resetSpeedEligibility();
      // Two equal-rate filters give a critically damped step response: zero
      // initial slope, then acceleration and a gentle settle. Integrate exactly
      // for simulation-time equivalence; retarget within the outward interval.
      const filtered = Math.max(
        this.targetZoom,
        Math.min(this.zoom, this.widenFilterZoom ?? this.zoom),
      );
      const decay = Math.exp(-SPEED_CAMERA.widenRate * dt);
      this.zoom = Math.min(
        this.zoom,
        this.targetZoom +
          (this.zoom -
            this.targetZoom +
            SPEED_CAMERA.widenRate * (filtered - this.targetZoom) * dt) *
            decay,
      );
      this.widenFilterZoom =
        this.targetZoom + (filtered - this.targetZoom) * decay;
      return;
    }
    this.widenFilterZoom = null;
    const candidate = this.speedZoomLevels.find(
      (level) => level > this.zoom * (1 + 1e-10),
    );
    if (
      this.accelerating ||
      candidate === undefined ||
      candidate > this.targetZoom * (1 + 1e-10) ||
      candidate > this.shipFitZoom()
    ) {
      this.resetSpeedEligibility();
      return;
    }
    if (candidate !== this.inwardCandidate) {
      this.resetSpeedEligibility();
      this.inwardCandidate = candidate;
    }
    this.inwardSeconds += dt;
    if (this.inwardSeconds + 1e-9 >= SPEED_CAMERA.inwardHoldSeconds) {
      this.zoom = candidate;
      this.resetSpeedEligibility();
    }
  }
  /** Refresh the subject during standard-policy transitions and geometry changes. */
  keepShipVisible(x: number, y: number, radius: number) {
    if (!this.speedFraming && !this.returning) return;
    this.subject = { x, y, radius };
    this.containShip();
  }
  private containShip() {
    if (!this.subject) return;
    const { x, y, radius } = this.subject;
    const shortSide = Math.min(this.activeWidth, this.activeHeight);
    // Retain positive clearance even while the aspect gate collapses the box.
    const clearance = Math.min(SPEED_CAMERA.clearance, shortSide / 4);
    this.zoom = Math.min(this.zoom, this.shipFitZoom());
    const halfX = (this.activeWidth / 2 - clearance) / this.zoom - radius;
    const halfY = (this.activeHeight / 2 - clearance) / this.zoom - radius;
    this.pos.x =
      Math.max(x - halfX, Math.min(x + halfX, this.pos.x + this.offset.x)) -
      this.offset.x;
    this.pos.y =
      Math.max(y - halfY, Math.min(y + halfY, this.pos.y + this.offset.y)) -
      this.offset.y;
    if (this.speedFraming) {
      this.speedPan.set(
        (this.pos.x + this.offset.x - x) * this.zoom,
        (this.pos.y + this.offset.y - y) * this.zoom,
      );
    }
  }
  /** Exact coupled velocity matching and centring for one constant-motion step. */
  private followAxis(
    displacement: number,
    movement: number,
    axis: "x" | "y",
    dt: number,
  ) {
    const velocity = movement / dt;
    // Do not carry faster or reversed camera travel into a brake/reversal.
    // At rest this removes momentum, leaving monotonic residual centring.
    const tracked =
      velocity >= 0
        ? Math.max(0, Math.min(velocity, this.panVelocity[axis]))
        : Math.min(0, Math.max(velocity, this.panVelocity[axis]));
    const centreDecay = Math.exp(-SPEED_CAMERA.centreRate * dt);
    const velocityDecay = Math.exp(-SPEED_CAMERA.velocityMatchRate * dt);
    const relativeVelocity = tracked - velocity;
    const rateDifference =
      SPEED_CAMERA.centreRate - SPEED_CAMERA.velocityMatchRate;
    const response =
      Math.abs(rateDifference) < 1e-9
        ? dt * centreDecay
        : (velocityDecay - centreDecay) / rateDifference;
    // frameSpeed receives the position AFTER the simulation step. Recover its
    // starting displacement, then integrate both responses over that step.
    const result =
      (displacement + movement * this.zoom) * centreDecay +
      relativeVelocity * this.zoom * response;
    this.panVelocity[axis] = velocity + relativeVelocity * velocityDecay;
    return Math.abs(result) < SPEED_CAMERA.settlePixels &&
      Math.abs(relativeVelocity) * this.zoom * dt < SPEED_CAMERA.settlePixels
      ? 0
      : result;
  }
  update(dt: number) {
    if (this.speedFraming) {
      if (dt <= 0 || !this.subject) return;
      // Use actual unwrapped travel for pan; world velocity still selects zoom.
      // Reset/wrap set the baseline directly, so neither invents camera speed.
      this.speedPan.x = this.followAxis(
        this.speedPan.x,
        this.subject.x - this.previousPanSubject.x,
        "x",
        dt,
      );
      this.speedPan.y = this.followAxis(
        this.speedPan.y,
        this.subject.y - this.previousPanSubject.y,
        "y",
        dt,
      );
      this.previousPanSubject.set(this.subject.x, this.subject.y);
      this.updateSpeedZoom(dt);
      // Zoom anchors the ship independently of ordinary follow pan; safety wins.
      this.placeSpeedCamera();
      return;
    }
    const amount = 1 - Math.exp(-this.smoothing * dt);
    this.pos.x += (this.target.x - this.pos.x) * amount;
    this.pos.y += (this.target.y - this.pos.y) * amount;
    if (this.returning) {
      const rate =
        this.targetZoom < this.zoom
          ? SPEED_CAMERA.widenRate
          : SPEED_CAMERA.standardTightenRate;
      this.zoom += (this.targetZoom - this.zoom) * (1 - Math.exp(-rate * dt));
      this.containShip();
      if (
        this.returning &&
        Math.abs(this.zoom - this.targetZoom) < 0.00001 &&
        Math.hypot(this.target.x - this.pos.x, this.target.y - this.pos.y) <
          0.01
      ) {
        this.zoom = this.targetZoom;
        this.returning = false;
        this.subject = null;
      }
    }
  }
  getViewOffset() {
    this.view.x =
      this.pos.x - this.viewportWidth / (2 * this.zoom) + this.offset.x;
    this.view.y =
      this.pos.y - this.viewportHeight / (2 * this.zoom) + this.offset.y;
    return this.view;
  }
  /** The visible world rectangle over the full viewport; reused, not copied. */
  getViewRect() {
    const offset = this.getViewOffset();
    this.viewRect.x = offset.x;
    this.viewRect.y = offset.y;
    this.viewRect.width = this.viewportWidth / this.zoom;
    this.viewRect.height = this.viewportHeight / this.zoom;
    return this.viewRect;
  }
  worldToScreen(x: number, y: number) {
    const offset = this.getViewOffset();
    return { x: (x - offset.x) * this.zoom, y: (y - offset.y) * this.zoom };
  }
  screenToWorld(x: number, y: number) {
    const offset = this.getViewOffset();
    return { x: x / this.zoom + offset.x, y: y / this.zoom + offset.y };
  }
  applyTransform(ctx: CanvasRenderingContext2D) {
    const offset = this.getViewOffset();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-offset.x, -offset.y);
  }
  resetTransform(ctx: CanvasRenderingContext2D) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
