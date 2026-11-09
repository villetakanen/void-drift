export interface InputState {
  leftThruster: boolean;
  rightThruster: boolean;
  fire: boolean;
}

/** The five pilot actions; `LR` is forward (`F`). */
export type InputAction = "L" | "R" | "LR" | "LF" | "RF";

/** The four touch pads: an upper turn pad and a lower burn pad per gutter. */
export type ThrustPad = "leftUpper" | "leftLower" | "rightUpper" | "rightLower";

export const THRUST_PADS: readonly ThrustPad[] = [
  "leftUpper",
  "leftLower",
  "rightUpper",
  "rightLower",
];

/** Directions held across every source, before resolution. */
export interface HeldDirections {
  left: boolean;
  right: boolean;
  forward: boolean;
}

/** Folds a pad press into held directions; a lower pad is forward plus its side. */
export function holdPad(held: HeldDirections, pad: ThrustPad): void {
  if (pad === "leftUpper" || pad === "leftLower") held.left = true;
  else held.right = true;
  if (pad === "leftLower" || pad === "rightLower") held.forward = true;
}

/**
 * Resolves everything held into one action: left only is `L`; right only is
 * `R`; forward alone, or anything on both sides, is `LR`; forward with left
 * only is `LF`; forward with right only is `RF`. `invert` (`invertControls`)
 * swaps the left and right input before the rule applies.
 */
export function resolveAction(
  held: HeldDirections,
  invert = false,
): InputAction | null {
  const left = invert ? held.right : held.left;
  const right = invert ? held.left : held.right;
  if (left && right) return "LR";
  if (held.forward) return left ? "LF" : right ? "RF" : "LR";
  if (left) return "L";
  if (right) return "R";
  return null;
}

/** Writes the thrusters an action fires into `out`: `L` left, `R` right, the rest both. */
export function applyAction(action: InputAction | null, out: InputState) {
  out.leftThruster = action !== null && action !== "R";
  out.rightThruster = action !== null && action !== "L";
  return out;
}

const NO_PADS: readonly ThrustPad[] = Object.freeze([]);
const LIT_PADS = {
  L: Object.freeze(["leftUpper"] as const),
  R: Object.freeze(["rightUpper"] as const),
  LR: Object.freeze(["leftLower", "rightLower"] as const),
  LF: Object.freeze(["leftLower", "rightLower", "leftUpper"] as const),
  RF: Object.freeze(["leftLower", "rightLower", "rightUpper"] as const),
} satisfies Readonly<Record<InputAction, readonly ThrustPad[]>>;

/** Pads that light for a resolved action; forward always lights the burn pads only. */
export function litPads(action: InputAction | null): readonly ThrustPad[] {
  return action === null ? NO_PADS : LIT_PADS[action];
}

const KEY_DIRECTIONS: Readonly<Record<string, keyof HeldDirections>> = {
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  KeyW: "forward",
  ArrowUp: "forward",
};

export class Input {
  /** Thrusters for the action resolved without `invertControls`. */
  readonly state: InputState = {
    leftThruster: false,
    rightThruster: false,
    fire: false,
  };
  private effective: InputState = {
    leftThruster: false,
    rightThruster: false,
    fire: false,
  };
  private held: HeldDirections = { left: false, right: false, forward: false };
  private resolved: InputAction | null = null;
  private resolvedInverted: InputAction | null = null;
  private keys = new Set<string>();
  private pointers = new Map<number, ThrustPad>();
  /**
   * Pointer presses arrive from the pad UI through `setPointer`; touches
   * elsewhere issue no action. The optional element is ignored: it keeps
   * frozen design studies that still call `new Input(canvas)` compiling.
   */
  constructor(_legacyTarget?: HTMLElement) {
    window.addEventListener("keydown", this.handleKey);
    window.addEventListener("keyup", this.handleKey);
    window.addEventListener("blur", this.reset);
    document.addEventListener("visibilitychange", this.visibility);
  }
  private handleKey = (event: KeyboardEvent) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest("input,select,textarea")
    )
      return;
    if (!Object.hasOwn(KEY_DIRECTIONS, event.code)) return;
    event.preventDefault();
    if (event.type === "keydown") this.keys.add(event.code);
    else this.keys.delete(event.code);
    this.sync();
  };
  private visibility = () => {
    if (document.hidden) this.reset();
  };
  /** Presses `pad` for pointer `id`; call again to slide onto another pad, `null` releases. */
  setPointer(id: number, pad: ThrustPad | null) {
    if (pad) this.pointers.set(id, pad);
    else this.pointers.delete(id);
    this.sync();
  }
  private sync() {
    this.held.left = this.held.right = this.held.forward = false;
    for (const code of this.keys) this.held[KEY_DIRECTIONS[code]] = true;
    for (const pad of this.pointers.values()) holdPad(this.held, pad);
    this.resolved = resolveAction(this.held);
    this.resolvedInverted = resolveAction(this.held, true);
    applyAction(this.resolved, this.state);
  }
  reset = () => {
    this.keys.clear();
    this.pointers.clear();
    this.sync();
  };
  /** The action held input resolves to, with `invertControls` applied to the input; drives pad feedback. */
  getAction(invert = false): InputAction | null {
    return invert ? this.resolvedInverted : this.resolved;
  }
  /** The simulation's `InputState`, derived only from the resolved action. */
  getEffectiveState(invert = false) {
    return applyAction(this.getAction(invert), this.effective);
  }
  destroy() {
    this.reset();
    window.removeEventListener("keydown", this.handleKey);
    window.removeEventListener("keyup", this.handleKey);
    window.removeEventListener("blur", this.reset);
    document.removeEventListener("visibilitychange", this.visibility);
  }
}
