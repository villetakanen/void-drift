import {
  CloudBodyPainter,
  cloudAtlas,
  SphericalSurface,
  StripSphericalSurface,
} from "@void-drift/core";

/** Atlas generation is once per page; the projected surface belongs to this flight. */
let atlas: HTMLCanvasElement | undefined;
export function createPracticeVenus(browserRotation = false) {
  atlas ??= cloudAtlas(true, "amber");
  const surface = browserRotation
    ? new StripSphericalSurface(atlas)
    : new SphericalSurface(atlas, "atlas");
  return { surface, painter: new CloudBodyPainter([surface.canvas]) };
}
