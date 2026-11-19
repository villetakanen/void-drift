import {
  ATMOSPHERE_BOUNDS_MARGIN,
  CloudBodyPainter,
  drawAtmosphere,
  type Planet,
  type RockBodyPainter,
} from "@void-drift/core";
import {
  type BodyAppearance,
  type FlightFrame,
  MERCURIAL_ROCK_SPIN_SECONDS,
  PRACTICE_CRADLE_CLOUD_HEIGHT,
  PRACTICE_CRADLE_CLOUD_SPIN_SECONDS,
  PRACTICE_CRADLE_SPIN_SECONDS,
  PRACTICE_VENUS_SPIN_SECONDS,
  STEP,
} from "@void-drift/mode-a";

type Surface = {
  draw(phase: number, diameter?: number): void;
};

type RockMaterial = { painter: RockBodyPainter; surface: Surface };
type CloudMaterial = { painter: CloudBodyPainter; surface: Surface };
type CloudedMaterial = RockMaterial & {
  clouds: Surface & { canvas: CanvasImageSource };
};

/**
 * Adapts prepared planet materials to the shared data-driven body passes.
 * The map is created when materials or simulation setup change, never per frame.
 */
export function planetAppearances(
  planets: readonly Planet[],
  materials: {
    mercury?: RockMaterial;
    venus?: CloudMaterial;
    cradle?: CloudedMaterial;
  },
): ReadonlyMap<number, BodyAppearance> {
  const positions = new Set<number>();
  for (const planet of planets) {
    const position = planet.systemPosition;
    if (position === undefined) continue;
    if (!Number.isInteger(position) || position <= 0 || positions.has(position))
      throw new Error(
        "Planet appearances require unique full-system positions",
      );
    positions.add(position);
  }

  const appearances = new Map<number, BodyAppearance>();
  add("moon", materials.mercury, MERCURIAL_ROCK_SPIN_SECONDS, false);
  add("venus", materials.venus, PRACTICE_VENUS_SPIN_SECONDS, true);
  addCradle(materials.cradle);
  return appearances;

  function find(id: string) {
    const matches = planets.filter((planet) => planet.id === id);
    if (matches.length > 1)
      throw new Error(`Planet appearance identity ${id} is ambiguous`);
    const planet = matches[0];
    if (!planet?.systemPosition) return undefined;
    if (appearances.has(planet.systemPosition))
      throw new Error(
        `Planet appearance position ${planet.systemPosition} is duplicated`,
      );
    return planet.systemPosition;
  }

  /** Ground, then clouds above it, then haze and rim out to the air's edge. */
  function addCradle(material: CloudedMaterial | undefined) {
    if (!material) return;
    const position = find("cradle");
    if (position === undefined) return;
    const depth = (target: Planet) => target.atmosphere?.depth ?? 0;
    const cloudRadius = (target: Planet) =>
      target.radius + depth(target) * PRACTICE_CRADLE_CLOUD_HEIGHT;
    const square = (target: Planet, extent: number) => ({
      left: target.pos.x - extent,
      top: target.pos.y - extent,
      right: target.pos.x + extent,
      bottom: target.pos.y + extent,
    });
    // The two surfaces take turns: the ground's turn advances on even ticks
    // and the clouds' on odd ticks, so they never redraw in the same tick.
    // The picture still depends only on the tick.
    const turn = (frame: FlightFrame, seconds: number, slot: 0 | 1) => {
      const ticks = frame.sim.ticks;
      const held = ticks - ((ticks + slot) % 2);
      return (held * STEP * 2 * Math.PI) / seconds;
    };
    appearances.set(position, {
      worldBounds(_frame, target) {
        return square(
          target,
          target.radius + depth(target) + ATMOSPHERE_BOUNDS_MARGIN,
        );
      },
      drawWorld(frame, ctx, target) {
        const zoom = frame.camera.zoom;
        const { x, y } = target.pos;
        material.surface.draw(
          turn(frame, PRACTICE_CRADLE_SPIN_SECONDS, 0),
          target.radius * 2 * zoom,
        );
        material.painter.body(ctx, 0, x, y, target.radius);
        const clouds = cloudRadius(target);
        material.clouds.draw(
          turn(frame, PRACTICE_CRADLE_CLOUD_SPIN_SECONDS, 1),
          clouds * 2 * zoom,
        );
        ctx.drawImage(
          material.clouds.canvas,
          x - clouds,
          y - clouds,
          clouds * 2,
          clouds * 2,
        );
        if (depth(target) > 0)
          drawAtmosphere(
            ctx,
            x,
            y,
            target.radius,
            depth(target),
            frame.sim.star.pos.x,
            frame.sim.star.pos.y,
            zoom,
          );
      },
      light: {
        bounds(_frame, target) {
          return square(target, cloudRadius(target));
        },
        draw(frame, ctx, target) {
          material.painter.light(
            ctx,
            target.pos.x,
            target.pos.y,
            cloudRadius(target),
            frame.sim.star.pos.x,
            frame.sim.star.pos.y,
          );
        },
      },
    });
  }

  function add(
    id: string,
    material: RockMaterial | CloudMaterial | undefined,
    spinSeconds: number,
    clouds: boolean,
  ) {
    if (!material) return;
    const matches = planets.filter((planet) => planet.id === id);
    if (matches.length > 1)
      throw new Error(`Planet appearance identity ${id} is ambiguous`);
    const planet = matches[0];
    if (!planet?.systemPosition) return;
    const position = planet.systemPosition;
    if (appearances.has(position))
      throw new Error(`Planet appearance position ${position} is duplicated`);

    const body = material.painter;
    const appearance: BodyAppearance = {
      worldBounds(_frame, target) {
        const halfWidth = clouds
          ? Math.max(0.65 / _frame.camera.zoom, target.radius * 0.065) / 2
          : 0;
        const extent = target.radius + halfWidth;
        return {
          left: target.pos.x - extent,
          top: target.pos.y - extent,
          right: target.pos.x + extent,
          bottom: target.pos.y + extent,
        };
      },
      drawWorld(frame, ctx, target) {
        material.surface.draw(
          (frame.sim.ticks * STEP * 2 * Math.PI) / spinSeconds,
          target.radius * 2 * frame.camera.zoom,
        );
        body.body(ctx, 0, target.pos.x, target.pos.y, target.radius);
        if (clouds && body instanceof CloudBodyPainter)
          body.atmosphere(
            ctx,
            target.pos.x,
            target.pos.y,
            target.radius,
            frame.sim.star.pos.x,
            frame.sim.star.pos.y,
            frame.camera.zoom,
          );
      },
      light: {
        bounds(_frame, target) {
          return {
            left: target.pos.x - target.radius,
            top: target.pos.y - target.radius,
            right: target.pos.x + target.radius,
            bottom: target.pos.y + target.radius,
          };
        },
        draw(frame, ctx, target) {
          body.light(
            ctx,
            target.pos.x,
            target.pos.y,
            target.radius,
            frame.sim.star.pos.x,
            frame.sim.star.pos.y,
          );
        },
      },
    };
    appearances.set(position, appearance);
  }
}
