# Controls

## Blueprint

### Context

A pilot flies with five actions: turn left (`L`), turn right (`R`), forward
(`LR`, also called `F`), and forward while turning left or right (`LF`, `RF`).
Keyboard and touch players reach all five. On touch, each thumb can turn or
burn on its own side without crossing the screen, and the pads show which
action is held. Every input source drives the same simulation, so replays and
scores do not depend on how the player flew.

### Architecture and boundaries

- `packages/core/src/lib/entities/Input.ts` resolves keyboard and pointer input
  into one of the five actions, exposes it for pad feedback, and writes the
  simulation's `InputState` (`leftThruster`, `rightThruster`, `fire`).
- Which engines an action fires depends on the chassis, stabilizers and linked
  engines; `packages/mode-a/src/lib/build-flight.ts` owns that mapping.
- The thrust-pad component (built in the Lab, used in
  `apps/web/src/components/FlightDeck.svelte`) draws the pads in the side
  gutters and turns pointer positions into pad presses.
- [Game screen](../game-screen/spec.md) owns the gutters, gesture containment,
  focus, and clearing input when flight is blocked or paused. This contract owns
  the actions, how input resolves to them, and the pads' arrangement and
  appearance.
- [Options](../options/spec.md) owns the `invertControls` setting; this
  contract applies it.

### Actions

| Action     | Keyboard                           | Touch                                |
| ---------- | ---------------------------------- | ------------------------------------ |
| `L`        | `A` / `←`                          | upper pad, left gutter               |
| `R`        | `D` / `→`                          | upper pad, right gutter              |
| `LR` (`F`) | `W` / `↑`, `A` + `D`, or all three | a pad in each gutter, upper or lower |
| `LF`       | `W` + `A`                          | lower pad, left gutter               |
| `RF`       | `W` + `D`                          | lower pad, right gutter              |
- Everything held, from every source, resolves to one action: left only is
  `L`; right only is `R`; forward alone, or anything on both sides, is `LR`;
  forward with left only is `LF`; forward with right only is `RF`.
- Today `LF` and `RF` fire the same engines as `LR` on every chassis, so the
  `InputState` contract and replay input chunks are unchanged. A chassis that
  gives `LF` or `RF` their own engine mapping needs `InputState` and its replay
  schema extended first.
- `invertControls` swaps the player's left and right input before it
  resolves, so `L` and `R` swap, and so do `LF` and `RF`. It never remaps
  engines; the engine mapping sees only the resolved action. The pads light for
  that action.
- Thrust comes only from the pads; touches in the central fly area issue no
  action.

### Touch pads

- Each side gutter holds one pad assembly across its full width: an upper turn
  pad (`L` or `R`) and a lower burn pad (`LF` or `RF`) in the bottom corner, nested at 84%
  of the gutter width and 54% of the assembly height. A 60° seam, sloping 30°
  down from the bezel inward, divides them.
- The whole gutter width is touchable. Each pointer maps to the pad under it,
  and a thumb sliding across the seam switches pad without lifting. A
  pointer that leaves the assembly releases its press.
- Independent pointers work together, on one side or both. Release,
  cancellation and lost pointer capture clear that pointer's press.

### Feedback

- Pads are borderless, disjoint panes of translucent glass that let the stars
  show through. At rest they are blue (`--color-elev-3`), the burn pad denser
  than the turn pad. A lit pad turns to a thin yellow wash
  (`--color-selected`), again denser on the burn pad.
- Pads light for the resolved action, whatever the source: `L` or `R` lights
  that side's turn pad; `LR` lights both burn pads, even when it comes from
  the two upper pads, so forward always looks the same; `LF` or `RF` lights
  both burn pads and that side's turn pad.
- Each pad carries a white (`--color-text`) two-line marking, an arrow and a
  caption (`◀ TURN · LEFT ENGINE`, `▶ TURN · RIGHT ENGINE`,
  `▲ BURN · BOTH ENGINES`), set at the same distance from the screen edge on
  both pads.

## Contract

### Definition of Done

- [ ] Every combination of held keys and pads resolves to the action the
  resolution rule gives, from keyboard, touch and both together.
- [ ] `L` fires the left thruster, `R` the right, and `LR`, `LF` and `RF` both;
  `invertControls` swaps left and right input, never engine outputs.
- [ ] Touches in the central fly area issue no action.
- [ ] A pointer sliding across the seam switches pad without lifting; leaving
  the assembly, release, cancellation and lost capture clear that pointer's
  press; independent pointers combine.
- [ ] Pads light for the resolved action from any source, `LR` on the burn pads
  only.
- [ ] Each side gutter shows the pad assembly with the arrangement, glass
  states and markings above.

### Regression guardrails

- `InputState` and replay input chunks are unchanged; identical inputs replay
  identically.
- Keyboard play needs no pointer, and touch play needs no keyboard.
- Blur, a hidden page, pause and the aspect gate clear every held key and press
  before another simulation step.

### Scenarios

```gherkin
Scenario: Forward from two thumbs
  Given a touch player in flight
  When they hold the left and right upper pads
  Then the action is LR and both thrusters fire
  And only the two burn pads light

Scenario: Forward while turning
  Given a touch player in flight
  When they hold the left lower pad
  Then the action is LF
  And both burn pads and the left turn pad light

Scenario: Keyboard forward while turning
  Given a keyboard player in flight
  When they hold W and A
  Then the action is LF and lights the same pads as the left lower pad

Scenario: Slide across the seam
  Given a thumb holding the left upper pad
  When it slides onto the left lower pad without lifting
  Then the action changes from L to LF

Scenario: Fly area is inert
  Given a touch player in flight
  When they touch the central fly area
  Then no action is held and no thruster fires

Scenario: Inverted controls
  Given invertControls is on
  When the player holds the left upper pad
  Then the action is R, the right thruster fires and the right turn pad lights
```
