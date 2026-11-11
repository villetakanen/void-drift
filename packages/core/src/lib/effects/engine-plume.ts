import { z } from "zod";
import type { GameObject } from "../physics/Physics";
import type { FxPass } from "./arcade-fx";
import { FxSurface } from "./fx-surface";
import { type PlumeStyle, paintBeam } from "./ion-beam";
import { paintPlasmaPlume } from "./plasma-plume";

export const PlumeProportionsSchema = z.object({
  length: z.number().positive().max(4).default(1),
  width: z.number().positive().max(4).default(1),
  opacity: z.number().min(0).max(1).default(1),
});
export type PlumeProportions = z.infer<typeof PlumeProportionsSchema>;
const DEFAULT_PROPORTIONS = PlumeProportionsSchema.parse({});
export type FxVisibilityTransform = (
  x: number,
  y: number,
  radius: number,
) => { x: number; y: number; radius: number };
export const ENGINE_CUTOFF = 750;
const MAX_EMITTERS = 8;
export interface PlumeEmitter {
  style?: PlumeStyle;
  x: number;
  y: number;
  angle: number;
  output: number;
  charge?: number;
  thrustSeconds?: number;
}
export interface PlumeOutlet {
  style: PlumeStyle;
  x: number;
  y: number;
  angle: number;
  size: number;
  charge?: number;
  thrustSeconds?: number;
}

/** Current outlet state only. Painted light belongs to the scene's FxSurface. */
export class EnginePlume {
  private readonly outlets: PlumeOutlet[] = Array.from(
    { length: MAX_EMITTERS },
    () => ({
      style: "default",
      x: 0,
      y: 0,
      angle: 0,
      size: 0,
    }),
  );
  private active = 0;
  private time = 0;
  private revision = 0;
  private readonly previews = new WeakMap<
    HTMLCanvasElement,
    { surface: FxSurface; revision: number }
  >();
  private readonly legacy: PlumeEmitter[] = [-1, 1].map((side) => ({
    x: -8,
    y: side * 5,
    angle: (-side * Math.PI) / 15,
    output: 0,
  }));
  get activeCount() {
    return this.active;
  }
  clear() {
    this.active = 0;
    this.revision++;
  }
  inspect(visit: (outlet: Readonly<PlumeOutlet>) => void) {
    for (let i = 0; i < this.active; i++) visit(this.outlets[i]);
  }
  step(dt: number, ship: GameObject, left: number, right: number) {
    this.legacy[0].output = left;
    this.legacy[1].output = right;
    this.stepMounted(dt, ship, this.legacy);
  }
  stepMounted(dt: number, ship: GameObject, emitters: readonly PlumeEmitter[]) {
    if (!(dt > 0) || !Number.isFinite(dt)) return;
    this.time += dt;
    const cos = Math.cos(ship.rotation),
      sin = Math.sin(ship.rotation);
    this.active = 0;
    for (let i = 0; i < Math.min(MAX_EMITTERS, emitters.length); i++) {
      const emitter = emitters[i];
      const thrusting = emitter.output > 0 && Number.isFinite(emitter.output);
      const charging =
        emitter.charge !== undefined &&
        Number.isFinite(emitter.charge) &&
        emitter.charge >= 0 &&
        emitter.charge <= 1;
      if (!thrusting && !charging) continue;
      const outlet = this.outlets[this.active++];
      outlet.style = emitter.style ?? "default";
      outlet.x = ship.pos.x + emitter.x * cos - emitter.y * sin;
      outlet.y = ship.pos.y + emitter.x * sin + emitter.y * cos;
      outlet.angle = ship.rotation + emitter.angle;
      outlet.size = thrusting ? Math.sqrt(Math.min(1, emitter.output)) : 0;
      outlet.charge = emitter.charge;
      outlet.thrustSeconds = emitter.thrustSeconds;
    }
  }
  /** Stamp current outlets once into the scene; the surface supplies persistence. */
  stamp(
    ctx: CanvasRenderingContext2D,
    pass: FxPass,
    proportions: PlumeProportions = DEFAULT_PROPORTIONS,
    painter?: (ctx: CanvasRenderingContext2D, size: number) => void,
    transformVisibility?: FxVisibilityTransform,
  ) {
    const radius = 80 * Math.max(proportions.length, proportions.width);
    for (let i = 0; i < this.active; i++) {
      const outlet = this.outlets[i];
      if (!(outlet.size > 0)) continue;
      const outletRadius = outlet.style === "plasma" ? radius * 1.5 : radius;
      const visible = transformVisibility
        ? (() => {
            const bounds = transformVisibility(
              outlet.x,
              outlet.y,
              outletRadius,
            );
            return pass.visible(bounds.x, bounds.y, bounds.radius);
          })()
        : pass.visible(outlet.x, outlet.y, outletRadius);
      if (!visible || !pass.budget.take(true)) continue;
      ctx.save();
      ctx.translate(outlet.x, outlet.y);
      ctx.rotate(outlet.angle);
      ctx.scale(proportions.length, proportions.width);
      ctx.globalAlpha = pass.opacity * proportions.opacity;
      if (painter) painter(ctx, outlet.size);
      else if (outlet.style === "plasma")
        paintPlasmaPlume(
          ctx,
          outlet.size,
          outlet.thrustSeconds ?? 0,
          Math.round(this.time * 60),
          () => pass.budget.take(),
        );
      else paintBeam(ctx, outlet.size, outlet.style);
      ctx.restore();
    }
  }
  /** Standalone one-ship previews use the same surface; play supplies a scene pass. */
  draw(
    ctx: CanvasRenderingContext2D,
    proportions: PlumeProportions = DEFAULT_PROPORTIONS,
    painter?: (ctx: CanvasRenderingContext2D, size: number) => void,
  ) {
    let view = this.previews.get(ctx.canvas);
    if (!view) {
      view = { surface: new FxSurface(), revision: this.revision };
      this.previews.set(ctx.canvas, view);
    }
    if (view.revision !== this.revision) {
      view.surface.clear();
      view.revision = this.revision;
    }
    view.surface.draw(ctx, this.time, (light, pass) =>
      this.stamp(light, pass, proportions, painter),
    );
  }
}
