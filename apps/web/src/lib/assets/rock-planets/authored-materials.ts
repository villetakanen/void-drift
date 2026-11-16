import { RockBodyPainter, StripSphericalSurface } from "@void-drift/core";
import framing from "./art-029-framing.json";
import neutralFrame from "./art-030-framing.json";
import { quiltMineralMaterial } from "./quilted-material";
import { SphericalSurface } from "./spherical-surface";

/** Existing composed study art, normalized into reusable 192px material discs. */
export async function loadAuthoredRockMaterials() {
  return Promise.all(
    (["mineral", "highlands", "impact"] as const).map(async (id) => {
      const image = new Image();
      image.src = `/studies/mercury-2026-11-12/${id === "highlands" ? "art-030-neutral" : `art-029-${id}`}.png`;
      await image.decode();
      const frame = id === "highlands" ? neutralFrame : framing[id];
      const size = 192;
      const surface = document.createElement("canvas");
      surface.width = surface.height = size;
      const ctx = surface.getContext("2d");
      if (!ctx) throw new Error("Rock material canvas unavailable");
      ctx.drawImage(
        image,
        frame.x,
        frame.y,
        frame.side,
        frame.side,
        0,
        0,
        size,
        size,
      );
      const pixels = ctx.getImageData(0, 0, size, size);
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          const nx = ((x + 0.5) * 2) / size - 1,
            ny = ((y + 0.5) * 2) / size - 1;
          const r2 = nx * nx + ny * ny,
            at = (y * size + x) * 4;
          if (r2 >= 1) {
            pixels.data[at + 3] = 0;
            continue;
          }
          // A/C retain painted local relief. Approximate broad de-lighting only;
          // this does not recover measured albedo or allow changing relief normals.
          const baked =
            id === "highlands"
              ? 1
              : 0.66 +
                0.34 *
                  Math.sqrt(
                    Math.max(0, -0.88 * nx + Math.sqrt(1 - r2) * 0.475),
                  );
          for (let c = 0; c < 3; c++) pixels.data[at + c] /= baked;
          pixels.data[at + 3] = Math.min(
            pixels.data[at + 3],
            Math.min(1, ((1 - Math.sqrt(r2)) * size) / 2) * 255,
          );
        }
      ctx.putImageData(pixels, 0, 0);
      return surface;
    }),
  );
}

/** Reduced NASA PIA17386 global cylindrical map, retained for study comparison. */
export async function loadMercuryReferenceAtlas() {
  const image = new Image();
  image.src = "/studies/mercury-2026-11-12/nasa-pia17386-atlas.webp";
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Mercury atlas canvas unavailable");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const practiceMercury = new Map<
  boolean,
  ReturnType<typeof createPracticeMercury>
>();

/** Accepted seed-153 mineral atlas, prepared once and reused by Practice. */
function createPracticeMercury(browserRotation: boolean) {
  return loadAuthoredRockMaterials().then(([mineral]) => {
    const atlas = quiltMineralMaterial(mineral, 153);
    const surface = browserRotation
      ? new StripSphericalSurface(atlas)
      : new SphericalSurface(atlas, "atlas");
    return { painter: new RockBodyPainter([surface.canvas]), surface };
  });
}

export function loadPracticeMercury(browserRotation = false) {
  let asset = practiceMercury.get(browserRotation);
  if (!asset) {
    asset = createPracticeMercury(browserRotation);
    practiceMercury.set(browserRotation, asset);
  }
  return asset;
}
