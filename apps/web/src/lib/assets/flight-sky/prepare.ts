import type { SkyRequest } from "./prepare.worker";

/** A changed request cancels pending work and releases its temporary URLs. */
export function prepare(
  request: SkyRequest,
  ready: (urls: string[]) => void,
  failed: (message: string) => void,
  delay = 0,
) {
  let worker: Worker | undefined;
  let active = true;
  const urls: string[] = [];
  const release = () => {
    worker?.terminate();
    worker = undefined;
    for (const url of urls.splice(0)) URL.revokeObjectURL(url);
  };
  const start = () => {
    try {
      worker = new Worker(new URL("./prepare.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onerror = () => {
        release();
        if (active) failed("Sky preparation failed.");
      };
      worker.onmessage = async ({
        data,
      }: MessageEvent<{ tiles?: Blob[]; error?: string }>) => {
        worker?.terminate();
        worker = undefined;
        if (!active) return;
        if (!data.tiles) {
          failed(data.error ?? "Sky preparation failed.");
          return;
        }
        try {
          for (const tile of data.tiles) urls.push(URL.createObjectURL(tile));
          await Promise.all(
            urls.map((url) => {
              const image = new Image();
              image.src = url;
              return image.decode();
            }),
          );
          if (active) ready(urls);
        } catch {
          release();
          if (active) failed("Could not display the sky image.");
        }
      };
      worker.postMessage(request);
    } catch {
      release();
      if (active) failed("Sky preparation is unavailable in this browser.");
    }
  };
  const timer = delay > 0 ? window.setTimeout(start, delay) : undefined;
  if (timer === undefined) start();
  return () => {
    active = false;
    clearTimeout(timer);
    release();
  };
}
