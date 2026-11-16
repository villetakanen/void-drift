import {
  CloudBodyPainter,
  type Planet,
  type RockBodyPainter,
} from "@void-drift/core";
import {
  type BodyAppearance,
  PRACTICE_MERCURY_SPIN_SECONDS,
  PRACTICE_VENUS_SPIN_SECONDS,
  STEP,
} from "@void-drift/mode-a";

type Surface = {
  draw(phase: number, diameter?: number): void;
};

type RockMaterial = { painter: RockBodyPainter; surface: Surface };
type CloudMaterial = { painter: CloudBodyPainter; surface: Surface };

/**
 * Adapts the prepared Practice materials to the shared data-driven body passes.
 * The map is created when materials or simulation setup change, never per frame.
 */
export function practicePlanetAppearances(
  planets: readonly Planet[],
  materials: { mercury?: RockMaterial; venus?: CloudMaterial },
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
  add("moon", materials.mercury, PRACTICE_MERCURY_SPIN_SECONDS, false);
  add("venus", materials.venus, PRACTICE_VENUS_SPIN_SECONDS, true);
  return appearances;

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
