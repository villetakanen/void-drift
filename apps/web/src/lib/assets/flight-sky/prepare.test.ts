import { afterEach, describe, expect, it, vi } from "vitest";
import { prepare } from "./prepare";

describe("sky preparation lifetime", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("cannot bind a decoded image after cancellation and revokes its URL", async () => {
    vi.useFakeTimers();
    let worker!: {
      onmessage: (event: unknown) => void;
      terminate: ReturnType<typeof vi.fn>;
      postMessage: ReturnType<typeof vi.fn>;
    };
    let finishDecode!: () => void;
    const revoke = vi.fn();
    vi.stubGlobal("window", globalThis);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:sky");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(revoke);
    vi.stubGlobal(
      "Image",
      class {
        src = "";
        decode() {
          return new Promise<void>((resolve) => {
            finishDecode = resolve;
          });
        }
      },
    );
    vi.stubGlobal(
      "Worker",
      class {
        onmessage = (_event: unknown) => {};
        terminate = vi.fn();
        postMessage = vi.fn();
        constructor() {
          worker = this;
        }
      },
    );
    const ready = vi.fn();
    const cancel = prepare(
      { dustSeed: 1, reaches: [0.5], size: 1536 },
      ready,
      vi.fn(),
    );
    worker.onmessage({ data: { tiles: [new Blob()] } });
    cancel();
    finishDecode();
    await Promise.resolve();
    await Promise.resolve();
    expect(ready).not.toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledExactlyOnceWith("blob:sky");
    expect(worker.terminate).toHaveBeenCalled();
  });

  it("releases partially created URLs when preparation fails", () => {
    let worker!: {
      onmessage: (event: unknown) => void;
      terminate: ReturnType<typeof vi.fn>;
    };
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    vi.spyOn(URL, "createObjectURL")
      .mockReturnValueOnce("blob:first")
      .mockImplementationOnce(() => {
        throw new Error("allocation failed");
      });
    vi.stubGlobal(
      "Worker",
      class {
        onmessage = (_event: unknown) => {};
        terminate = vi.fn();
        postMessage = vi.fn();
        constructor() {
          worker = this;
        }
      },
    );
    const failed = vi.fn();
    const ready = vi.fn();
    const cancel = prepare(
      { dustSeed: 1, reaches: [0, 1], size: 384 },
      ready,
      failed,
    );
    worker.onmessage({ data: { tiles: [new Blob(), new Blob()] } });
    expect(revoke).toHaveBeenCalledExactlyOnceWith("blob:first");
    expect(failed).toHaveBeenCalledOnce();
    expect(ready).not.toHaveBeenCalled();
    cancel();
    expect(revoke).toHaveBeenCalledOnce();
  });

  it("terminates a worker that reports an error", () => {
    let worker!: { onerror: () => void; terminate: ReturnType<typeof vi.fn> };
    vi.stubGlobal(
      "Worker",
      class {
        onerror = () => {};
        terminate = vi.fn();
        postMessage = vi.fn();
        constructor() {
          worker = this;
        }
      },
    );
    const failed = vi.fn();
    const cancel = prepare(
      { dustSeed: 1, reaches: [0.5], size: 1536 },
      vi.fn(),
      failed,
    );
    worker.onerror();
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(failed).toHaveBeenCalledOnce();
    cancel();
  });
});
