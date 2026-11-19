import { prepareSkyTile } from "@void-drift/core";

export interface SkyRequest {
  dustSeed: number;
  reaches: number[];
  size: 384 | 1536;
}

self.onmessage = async ({ data }: MessageEvent<SkyRequest>) => {
  try {
    const tiles: Blob[] = [];
    for (const reach of data.reaches) {
      const surface = prepareSkyTile(
        { reach, dustSeed: data.dustSeed },
        data.size,
      );
      tiles.push(await surface.convertToBlob());
    }
    self.postMessage({ tiles });
  } catch {
    self.postMessage({ error: "Could not prepare the sky image." });
  }
};
