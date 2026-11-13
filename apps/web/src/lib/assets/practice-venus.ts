import {
  CloudBodyPainter,
  cloudAtlas,
  SphericalSurface,
} from "@void-drift/core";

/** Atlas generation is once per page; the projected surface belongs to this flight. */
let atlas: HTMLCanvasElement | undefined;
export function createPracticeVenus() {
  atlas ??= cloudAtlas(true, "amber");
  const surface = new SphericalSurface(atlas, "atlas");
  return { surface, painter: new CloudBodyPainter([surface.canvas]) };
}
