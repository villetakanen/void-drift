import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { holdPad, Input, resolveAction, THRUST_PADS } from "./Input";

const KEYS = ["left", "right", "forward"] as const;

function subsets<T>(items: readonly T[]): T[][] {
  return items.reduce<T[][]>(
    (all, item) => all.concat(all.map((set) => [...set, item])),
    [[]],
  );
}

describe("inversion", () => {
  it("swaps left and right input before resolving, for every combination", () => {
    for (const keys of subsets(KEYS))
      for (const pads of subsets(THRUST_PADS)) {
        const held = { left: false, right: false, forward: false };
        for (const k of keys) held[k] = true;
        for (const pad of pads) holdPad(held, pad);
        const swapped = { ...held, left: held.right, right: held.left };
        expect(resolveAction(held, true)).toBe(resolveAction(swapped));
      }
  });
});

describe("Input", () => {
  let win: EventTarget;
  let doc: EventTarget & { hidden: boolean };
  let input: Input;
  const key = (type: "keydown" | "keyup", code: string) => {
    const event = new Event(type, { cancelable: true });
    Object.defineProperty(event, "code", { value: code });
    win.dispatchEvent(event);
  };

  beforeEach(() => {
    win = new EventTarget();
    doc = Object.assign(new EventTarget(), { hidden: false });
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", doc);
    vi.stubGlobal("HTMLElement", class {});
    input = new Input();
  });
  afterEach(() => {
    input.destroy();
    vi.unstubAllGlobals();
  });

  it("clears every key and press on blur and a hidden page", () => {
    for (const clear of [
      () => win.dispatchEvent(new Event("blur")),
      () => {
        doc.hidden = true;
        doc.dispatchEvent(new Event("visibilitychange"));
        doc.hidden = false;
      },
    ]) {
      key("keydown", "KeyA");
      input.setPointer(1, "rightLower");
      expect(input.getAction()).not.toBeNull();
      clear();
      expect(input.getEffectiveState()).toMatchObject({
        leftThruster: false,
        rightThruster: false,
      });
    }
  });
});
