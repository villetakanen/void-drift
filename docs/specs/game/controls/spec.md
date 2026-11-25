---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-25T08:37:38Z"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-25T09:16:37+02:00"
---

# Controls

## Blueprint

### Context

A pilot flies with five actions: turn left (`L`), turn right (`R`), forward
(`LR`, also called `F`), and forward while turning left or right (`LF`, `RF`).
Keyboard and touch players reach all five. On touch, each thumb can turn or
burn on its own side without crossing the screen, and the pads show which
action is held. Every input source drives the same simulation, so replays and
scores do not depend on how the player flew.

### Architecture

- `packages/core/src/lib/entities/Input.ts` resolves keyboard and pointer input
  into one of the five actions, exposes it for pad feedback, and writes the
  simulation's `InputState` (`leftThruster`, `rightThruster`, `fire`).
- Which engines an action fires depends on the chassis, stabilizers and linked
  engines; `packages/mode-a/src/lib/build-flight.ts` owns that mapping.
- `apps/web/src/components/controls/ThrustPads.svelte` draws the pads in the
  side gutters and turns pointer positions into pad presses. `/lab/controls`
  demonstrates both assemblies over the production starfield.
- [Game screen](../game-screen/spec.md) owns the gutters, gesture containment,
  focus, and clearing input when flight is blocked or paused. This contract owns
  the actions, how input resolves to them, and the pads' arrangement and
  appearance.
- [Options](../options/spec.md) owns the `invertControls` setting; this
  contract applies it.

### Constraints

#### Actions

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

#### Automatic weapons command

- The pilot's choice is Auto or Off. Every new run and retry starts in Auto;
  the choice is run-local and survives pause, resume and energy emergency.
- Ranked and unranked Survival have no player toggle. Practice offers it as
  soon as flight is active, with no arrival leg. In Derelicts and Gauntlet,
  arrival starts with the player's weapons locked and their choice fixed at
  Auto. The lock ends when the centre of the player's ship first crosses
  inside the circular arena boundary (1,150 world units from the arena centre).
  The toggle then becomes available subject to the other availability rules.
- In active flight, click or tap the operable Weapons flap, or press and
  release either Shift key on its own, to reverse the simulation's choice.
  Shift acts once, on release; holding and repeat do not act. A chord does
  not count: a held Ctrl, Alt, Meta or other Shift blocks it, and a different
  key pressed before release cancels it, including Tab. Thrust already held
  when Shift goes down may continue, including
  repeat. A pointer press before release also cancels the shortcut; a click
  or tap on Weapons still issues its own command.
- An unavailable command is ignored, not queued. Standby, pause, [energy
  emergency](../parts/spec.md#weapon-operation), loss of flight focus or
  visibility, and run replacement cancel any pending Shift. Returning to
  active, operable flight requires a fresh activation.
- [Game Screen](../game-screen/spec.md) owns the flap readout; [Parts](../parts/spec.md#weapon-operation)
  owns weapon execution and the energy check.

#### Touch pads

- Each side gutter holds one pad assembly across its full width: an upper turn
  pad (`L` or `R`) and a lower burn pad (`LF` or `RF`) in the bottom corner, nested at 84%
  of the gutter width and 54% of the assembly height. A 60° seam, sloping 30°
  down from the bezel inward, divides them.
- The assembly stands at the bottom of its gutter, 320 CSS px tall. The pads
  are the only touch thrust; there are no other engine buttons.
- The whole gutter width is touchable. Each pointer maps to the pad under it,
  and a thumb sliding across the seam switches pad without lifting. A
  pointer that leaves the assembly releases its press.
- Independent pointers work together, on one side or both. Release,
  cancellation and lost pointer capture clear that pointer's press.

#### Feedback

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

- Every combination of held keys and pads resolves to the action the
  resolution rule gives, from keyboard, touch and both together.
- `L` fires the left thruster, `R` the right, and `LR`, `LF` and `RF` both;
  `invertControls` swaps left and right input, never engine outputs.
- Touches in the central fly area issue no action.
- A pointer sliding across the seam switches pad without lifting; leaving
  the assembly, release, cancellation and lost capture clear that pointer's
  press; independent pointers combine.
- Pads light for the resolved action from any source, `LR` on the burn pads
  only.
- Each side gutter shows the pad assembly with the arrangement, glass
  states and markings above.
- Each assembly stands at the bottom of its gutter, 320 CSS px tall; no
  other touch control fires an engine.

### Regression guardrails

- Recorded thrust inputs resolve to the same thrust actions on replay.
  The weapons command is separate from recorded thrust input.
- Keyboard play needs no pointer, and touch play needs no keyboard.
- Blur, a hidden page, pause and the aspect gate clear every held key and press
  before another simulation step.

### Scenarios

```gherkin
Scenario Outline: Each input reverses the same run-local choice
  Given active flight in Practice with weapons in Auto
  When I activate Weapons using <input>
  Then weapons switch to Off
  When I activate Weapons again using <input>
  Then weapons switch to Auto

  Examples:
    | input                     |
    | a standalone Shift release |
    | a mouse click             |
    | a touch tap               |

Scenario: Release confirms a standalone Shift, including during thrust
  Given operable Weapons in Auto and a thrust key already held
  When I press and hold either Shift through keyboard repeat
  Then thrust continues and the choice stays Auto
  When I release Shift without another key or pointer press
  Then weapons switch to Off once and thrust continues

Scenario: Shift+Tab moves focus without changing weapons
  Given operable Weapons in Auto
  When I hold Shift, press Tab, then release Shift
  Then focus moves backwards and weapons stay in Auto

Scenario Outline: Only a fresh activation can act after an interruption
  Given operable Weapons in Auto and a pending Shift press
  When <interruption> occurs and ends before I release Shift
  Then weapons stay in Auto through release
  And a fresh standalone Shift press and release switches weapons Off

  Examples:
    | interruption                              |
    | flight standby                            |
    | pause                                     |
    | energy emergency                          |
    | a pointer press away from the Weapons flap |

Scenario: Clicking Weapons with Shift held toggles once
  Given operable Weapons in Auto and a pending Shift press
  When I click Weapons and then release Shift
  Then the click switches weapons Off and release leaves them Off

Scenario Outline: Entry lock ends at arena crossing
  Given a <mode> run in its arena entry leg with an otherwise valid shot
  When I press Shift before the ship centre crosses into the arena
  Then the choice stays Auto and the entry lock prevents the shot
  When the ship centre crosses into the arena and I release Shift
  Then ordinary weapon operation is allowed but the choice stays Auto
  When I issue a fresh weapons command
  Then the choice switches to Off

  Examples:
    | mode      |
    | Derelicts |
    | Gauntlet  |

Scenario Outline: Survival has no toggle
  Given active flight in a <run> Survival run
  When I press Shift or click or tap the weapons status
  Then automatic weapon operation remains selected

  Examples:
    | run      |
    | ranked   |
    | unranked |

Scenario: Only a fresh run resets the choice
  Given weapons are Off in active flight
  When I pause and resume
  Then weapons remain Off
  When I start a new run or retry
  Then weapons start in Auto

Scenario: Emergency ignores commands without erasing the choice
  Given weapons are Off in active flight
  When energy emergency begins and I try Shift, mouse or touch
  Then weapons remain Off and no command is queued
  When the emergency ends
  Then the operable flap returns in Off

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

Scenario: Cancelled touch
  Given a thumb holding the right lower pad
  When the touch is cancelled or loses pointer capture
  Then no action is held and no pad lights

Scenario: Inverted controls
  Given invertControls is on
  When the player holds the left upper pad
  Then the action is R, the right thruster fires and the right turn pad lights
```
