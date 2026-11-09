import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyAction,
  type HeldDirections,
  holdPad,
  Input,
  type InputAction,
  litPads,
  resolveAction,
  THRUST_PADS,
  type ThrustPad,
} from "./Input";

const KEYS = ["left", "right", "forward"] as const;

function subsets<T>(items: readonly T[]): T[][] {
  return items.reduce<T[][]>(
    (all, item) => all.concat(all.map((set) => [...set, item])),
    [[]],
  );
}

// The spec's rule restated per side: a gutter or key counts for its side, a
// lower pad or forward key counts as forward.
function expected(
  keys: readonly (typeof KEYS)[number][],
  pads: readonly ThrustPad[],
): InputAction | null {
  const onLeft =
    keys.includes("left") || pads.some((p) => p.startsWith("left"));
  const onRight =
    keys.includes("right") || pads.some((p) => p.startsWith("right"));
  const forward =
    keys.includes("forward") || pads.some((p) => p.endsWith("Lower"));
  if (onLeft && onRight) return "LR";
  if (forward && onLeft) return "LF";
  if (forward && onRight) return "RF";
  if (forward) return "LR";
  if (onLeft) return "L";
  if (onRight) return "R";
  return null;
}

const side = (pad: ThrustPad) => (pad.startsWith("left") ? "left" : "right");
const isTurn = (pad: ThrustPad) => pad.endsWith("Upper");

describe("action resolution", () => {
  it("resolves every combination of keys and pads per the rule", () => {
    let cases = 0;
    for (const keys of subsets(KEYS))
      for (const pads of subsets(THRUST_PADS)) {
        const held: HeldDirections = {
          left: keys.includes("left"),
          right: keys.includes("right"),
          forward: keys.includes("forward"),
        };
        for (const pad of pads) holdPad(held, pad);
        expect(resolveAction(held), `${keys} + ${pads}`).toBe(
          expected(keys, pads),
        );
        cases++;
      }
    expect(cases).toBe(2 ** (KEYS.length + THRUST_PADS.length));
  });

  it("resolves keyboard left, right and forward together to LR", () => {
    expect(resolveAction({ left: true, right: true, forward: true })).toBe(
      "LR",
    );
    expect(
      resolveAction({ left: true, right: true, forward: true }, true),
    ).toBe("LR");
  });

  it("gives a lower pad the same action as forward with its side key", () => {
    for (const pad of THRUST_PADS.filter((p) => !isTurn(p))) {
      const fromPad = { left: false, right: false, forward: false };
      holdPad(fromPad, pad);
      const fromKeys = { left: false, right: false, forward: true };
      fromKeys[side(pad)] = true;
      expect(resolveAction(fromPad)).toBe(resolveAction(fromKeys));
    }
  });
});

describe("inversion", () => {
  const MIRROR: Record<InputAction, InputAction> = {
    L: "R",
    R: "L",
    LR: "LR",
    LF: "RF",
    RF: "LF",
  };
  it("swaps left and right input before resolving, for every combination", () => {
    for (const keys of subsets(KEYS))
      for (const pads of subsets(THRUST_PADS)) {
        const held = { left: false, right: false, forward: false };
        for (const k of keys) held[k] = true;
        for (const pad of pads) holdPad(held, pad);
        const swapped = { ...held, left: held.right, right: held.left };
        const inverted = resolveAction(held, true);
        expect(inverted).toBe(resolveAction(swapped));
        const plain = resolveAction(held);
        expect(inverted).toBe(plain === null ? null : MIRROR[plain]);
        // Inverting the inverted input is the identity.
        expect(resolveAction(swapped, true)).toBe(plain);
      }
  });
  it("turns left input into R and the lower-left pad into RF", () => {
    expect(
      resolveAction({ left: true, right: false, forward: false }, true),
    ).toBe("R");
    const lowerLeft = { left: false, right: false, forward: false };
    holdPad(lowerLeft, "leftLower");
    expect(resolveAction(lowerLeft, true)).toBe("RF");
  });
});

describe("thrusters per action", () => {
  it("fires one side for a turn and both for every forward action", () => {
    const state = (a: InputAction | null) =>
      applyAction(a, { leftThruster: true, rightThruster: true, fire: false });
    expect(state("L")).toMatchObject({
      leftThruster: true,
      rightThruster: false,
    });
    expect(state("R")).toMatchObject({
      leftThruster: false,
      rightThruster: true,
    });
    for (const a of ["LR", "LF", "RF"] as const)
      expect(state(a)).toMatchObject({
        leftThruster: true,
        rightThruster: true,
      });
    expect(state(null)).toMatchObject({
      leftThruster: false,
      rightThruster: false,
    });
  });
});

describe("lit pads", () => {
  const burnPads = THRUST_PADS.filter((p) => !isTurn(p));
  it("lights the turn pad for a turn and both burn pads for forward", () => {
    expect(litPads(null)).toHaveLength(0);
    expect(litPads("L")).toEqual(["leftUpper"]);
    expect(litPads("R")).toEqual(["rightUpper"]);
    expect([...litPads("LR")].sort()).toEqual([...burnPads].sort());
    expect(litPads("LR").some(isTurn)).toBe(false);
  });
  it("lights both burn pads and one matching turn pad while turning forward", () => {
    for (const [action, s] of [
      ["LF", "left"],
      ["RF", "right"],
    ] as const) {
      const lit = litPads(action);
      for (const pad of burnPads) expect(lit).toContain(pad);
      const turns = lit.filter(isTurn);
      expect(turns).toHaveLength(1);
      expect(side(turns[0])).toBe(s);
    }
  });
  it("lights the same pads for a lower pad and its keyboard equivalent", () => {
    const pad = { left: false, right: false, forward: false };
    holdPad(pad, "leftLower");
    expect(litPads(resolveAction(pad))).toEqual(
      litPads(resolveAction({ left: true, right: false, forward: true })),
    );
  });
});

describe("Input", () => {
  let win: EventTarget;
  let doc: EventTarget & { hidden: boolean };
  let input: Input;
  class FakeElement {
    constructor(private tag: string) {}
    closest(selector: string) {
      return selector.split(",").includes(this.tag) ? this : null;
    }
  }
  const key = (
    type: "keydown" | "keyup",
    code: string,
    target?: FakeElement,
  ) => {
    const event = new Event(type, { cancelable: true });
    Object.defineProperty(event, "code", { value: code });
    if (target) Object.defineProperty(event, "target", { value: target });
    win.dispatchEvent(event);
  };

  beforeEach(() => {
    win = new EventTarget();
    doc = Object.assign(new EventTarget(), { hidden: false });
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", doc);
    vi.stubGlobal("HTMLElement", FakeElement);
    input = new Input();
  });
  afterEach(() => {
    input.destroy();
    vi.unstubAllGlobals();
  });

  // The spec's keyboard column, restated: each key held alone.
  const SPEC_KEYS: [string, InputAction][] = [
    ["KeyA", "L"],
    ["ArrowLeft", "L"],
    ["KeyD", "R"],
    ["ArrowRight", "R"],
    ["KeyW", "LR"],
    ["ArrowUp", "LR"],
  ];

  it("resolves each key held alone to its action", () => {
    for (const [code, action] of SPEC_KEYS) {
      key("keydown", code);
      expect(input.getAction(), code).toBe(action);
      key("keyup", code);
      expect(input.getAction(), code).toBeNull();
    }
  });

  it("treats a repeated keydown as one held key", () => {
    key("keydown", "KeyA");
    key("keydown", "KeyA");
    key("keydown", "KeyA");
    key("keyup", "KeyA");
    expect(input.getAction()).toBeNull();
  });

  it("keeps forward held while either forward key stays down", () => {
    key("keydown", "KeyW");
    key("keydown", "ArrowUp");
    key("keyup", "KeyW");
    expect(input.getAction()).toBe("LR");
    key("keyup", "ArrowUp");
    expect(input.getAction()).toBeNull();
  });

  it("ignores keys typed into form fields", () => {
    for (const tag of ["input", "textarea", "select"]) {
      key("keydown", "KeyA", new FakeElement(tag));
      expect(input.getAction(), tag).toBeNull();
    }
    key("keydown", "KeyA");
    key("keyup", "KeyA", new FakeElement("textarea"));
    expect(input.getAction()).toBe("L");
  });

  it("switches action when a pointer slides across the seam", () => {
    input.setPointer(1, "leftUpper");
    expect(input.getAction()).toBe("L");
    input.setPointer(1, "leftLower");
    expect(input.getAction()).toBe("LF");
    expect(input.getEffectiveState()).toMatchObject({
      leftThruster: true,
      rightThruster: true,
    });
  });

  it("combines independent pointers and releases each on its own", () => {
    input.setPointer(1, "leftUpper");
    input.setPointer(2, "rightUpper");
    expect(input.getAction()).toBe("LR");
    input.setPointer(1, null);
    expect(input.getAction()).toBe("R");
    input.setPointer(2, null);
    expect(input.getAction()).toBeNull();
  });

  it("combines keyboard and pointer into one action", () => {
    key("keydown", "KeyW");
    input.setPointer(1, "rightUpper");
    expect(input.getAction()).toBe("RF");
    key("keyup", "KeyW");
    expect(input.getAction()).toBe("R");
  });

  it("inverts input sides and derives InputState from the resolved action", () => {
    input.setPointer(1, "leftUpper");
    expect(input.getAction(true)).toBe("R");
    expect(input.getEffectiveState(true)).toEqual(
      applyAction("R", {
        leftThruster: false,
        rightThruster: false,
        fire: false,
      }),
    );
    input.setPointer(1, "leftLower");
    expect(input.getAction(true)).toBe("RF");
    expect(input.getEffectiveState(true)).toEqual(
      applyAction("RF", {
        leftThruster: false,
        rightThruster: false,
        fire: false,
      }),
    );
  });

  it("clears every key and press on blur, hidden page and reset", () => {
    for (const clear of [
      () => win.dispatchEvent(new Event("blur")),
      () => {
        doc.hidden = true;
        doc.dispatchEvent(new Event("visibilitychange"));
        doc.hidden = false;
      },
      () => input.reset(),
    ]) {
      key("keydown", "KeyA");
      input.setPointer(1, "rightLower");
      expect(input.getAction()).toBe("LR");
      clear();
      expect(input.getAction()).toBeNull();
      expect(input.getEffectiveState()).toMatchObject({
        leftThruster: false,
        rightThruster: false,
      });
    }
  });

  it("returns the same state object every frame", () => {
    expect(input.getEffectiveState()).toBe(input.getEffectiveState(true));
  });
});
