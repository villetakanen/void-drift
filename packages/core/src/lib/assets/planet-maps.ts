import { RockBodyPainter } from "./rock-body";
import { StripSphericalSurface } from "./strip-spherical-surface";

/**
 * Production planet surface maps: unlit cylindrical atlases prepared by
 * `scripts/planet-maps.mjs`, with provenance in `public/planets/provenance.json`.
 * Play loads planet surfaces only from here, never from a study folder.
 */
export const PLANET_MAPS = {
  mercuryGround: "/planets/mercury-ground.png",
  cradleGround: "/planets/cradle-ground.png",
  cradleClouds: "/planets/cradle-clouds.png",
  /** The Planet Inspector's Earth, a copy of The Cradle; not in play. */
  earthGround: "/planets/earth-ground.png",
} as const;
export type PlanetMap = (typeof PLANET_MAPS)[keyof typeof PLANET_MAPS];

const maps = new Map<string, Promise<HTMLCanvasElement>>();

/** Decodes a map once per page; the atlas canvas is shared and never changed. */
export function loadPlanetMap(url: PlanetMap): Promise<HTMLCanvasElement> {
  let map = maps.get(url);
  if (!map) {
    map = (async () => {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Planet map canvas unavailable");
      ctx.drawImage(image, 0, 0);
      return canvas;
    })();
    // A failed load may be retried by a later flight.
    map.catch(() => maps.delete(url));
    maps.set(url, map);
  }
  return map;
}

/** A turning surface and its rock painter; each flight gets its own projection. */
export async function createRockMaterial(url: PlanetMap) {
  const surface = new StripSphericalSurface(await loadPlanetMap(url));
  return { painter: new RockBodyPainter([surface.canvas]), surface };
}
