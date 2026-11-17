# Speed camera: entrance view and fixed zoom levels

Status: plan, 2026-11-16. Nothing here is applied, and it is not scheduled. It came
out of the [Practice planets render review](2026-11-16-practice-planets-render-remediation.md),
which needed the camera's zoom limits to size planet frames.

## What was found

Two places where the speed camera differs from the feature as intended. Both were
stated on 16 November 2026 and are taken as drift from a spoken description. They
were read from `docs/specs/game/camera/speed-camera/spec.md` and
`packages/core/src/lib/physics/Camera.ts`; the camera was not flown.

### Zoom levels

- Intent: the four inward levels, shown as 1×, 2×, 4× and 8×, are 0.5, 1, 2 and 4
  pixels per world unit.
- Today: the levels are relative. `SPEED_CAMERA.wideExtent` is 2100, the widest view
  is the active area's short side divided by 2100, and the others are 2, 4 and 8
  times that. On a 1080-high stage that is about 0.47, 0.94, 1.87 and 3.75 px/u,
  and it varies by a few percent between screens.
- The spec says the levels are "relative magnifications, not absolute renderer zoom
  values", so the spec and the code agree with each other and both differ from the
  intent.
- The speed points are not in question: 8× through 100 units per second, 4× at 200,
  2× at 300 and 1× at 400.

### Entrance to a star system

- Intent: when a run starts in a new star system, whatever the system's size, the
  first view shows the sun and the ship. After 1.5 seconds it cuts to 1×, if 1× is
  the level the speed calls for.
- Today: a new run sets the scale directly from speed demand, in the `snap` branch
  of the speed framing method in `Camera.ts`. The ship arrives at 600 units per
  second, above the 400 cap, so the view starts at exactly 1×. There is no wider
  entrance view.
- The spec allows this: "This discontinuity may initialise scale directly from
  continuous speed demand."

## Steps

1. Settle the open questions below.
2. Update `docs/specs/game/camera/speed-camera/spec.md` to state the intended
   contract: absolute levels, and the entrance view with its cut to 1×. Check
   `docs/specs/game/camera/spec.md` and `docs/specs/game/game-screen/spec.md` for
   text that depends on the relative levels, such as the ZOOM readout.
3. Change `SPEED_CAMERA` and the speed framing in `Camera.ts` to match, and the
   tests in `packages/core/src/lib/physics/Camera.test.ts`. Tests assert relations
   between levels and speeds, not the tuning values.
4. Check in the browser with Speed camera On: the entrance view, the cut to 1×, and
   the four levels through braking.

Size: small for the levels, small to medium for the entrance view.

## Open questions

1. Do reset and arena wrap also get the entrance view, or only a new run?
2. What happens when the view that shows the sun and the ship is already closer
   than 1×?
3. Does the cut from the entrance view use the same 1.5 second hold as the other
   inward cuts, and does accelerating during it cancel the cut as it does for them?
4. With absolute levels, the amount of world shown at 1× follows the screen's size
   instead of always being 2100 units. Is that accepted? The difference is a few
   percent on current screens.
5. Does the standard camera move onto the same levels? Its closest level is
   1.6 px/u today, with five levels spaced down to the whole-system view.

## What depends on this

The planet plan sizes its baked rotation frames by these levels. At 4 px/u Mercury
is 216 px across and Venus 323 px. If the levels stay as they are today the sizes
are about 6% smaller, which does not change that plan.
