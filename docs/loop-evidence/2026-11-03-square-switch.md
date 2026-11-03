# Square Switch design-system loop

## Intent and scope

Explore an on/off control for binary Hangar settings in the Inputs design-system
page. Keep it visually distinct from the multi-option Toggle, then carry the
approved option into the shared control and a Hangar checkbox.

The owner requested three labeled-track options, removed round shapes, then
selected the square sliding marker. Their feedback was: “the button visual, and
physical height do not need to match”; “remove border, make it a bit higher”; and
“can it be a bit narrower. like 4px or 8px, then remove wildcard”. The owner
approved the square slider: “Square slider approved. les keep it.”

## Delivered revision

- Commit `a1fb69b` (`feat(web): add square on-off switch control`) on
  `feat/0-4-0`; pushed to `origin/feat/0-4-0`.
- Added `apps/web/src/components/inputs/Switch.svelte`: native checkbox semantics,
  88×44px hit area, 80×30px cut-corner track, square sliding marker, explicit
  ON/OFF states, no track border, and token-based focus, hover, disabled and
  reduced-motion styling.
- Added on, off and disabled examples to `/lab/inputs`.
- Replaced the committed Hangar Ion stabilizers checkbox with the shared Switch.
- Documented the control in `docs/specs/design-system-core.md`.

## Checks and publication

| Evidence                | Outcome                                                                                                                                                                                                     | Source                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Staged whitespace check | Passed before commit                                                                                                                                                                                        | `git diff --cached --check` (reported in session)                                                                          |
| Commit message hook     | Passed                                                                                                                                                                                                      | `lefthook` Conventional Commit check during `a1fb69b`                                                                      |
| Commit whitespace check | Passed; no output                                                                                                                                                                                           | `git show --format= --check a1fb69b`                                                                                       |
| Tests/build             | Not run                                                                                                                                                                                                     | No test or build run was requested or recorded for this change                                                             |
| Local visual review     | Reported passed in prior session: `/lab/inputs` showed Ion stabilizers on, Linked engines off, and Forced on disabled. Browser screenshot was displayed in-session but no retained image path is available. | Prior-session report; not independently rerun for this closure                                                             |
| Push                    | Confirmed                                                                                                                                                                                                   | Push output advanced `origin/feat/0-4-0` from `b21de8e` to `a1fb69b`; later branch status showed `HEAD` and origin aligned |
| Deployment/live site    | Not verified                                                                                                                                                                                                | No deployment evidence was collected                                                                                       |

## Owner decision

The square sliding marker was accepted for this design-system iteration. This
records the decision for this control; it does not establish that the treatment
generalizes to other controls.

## Findings and limits

- In the committed revision, the Hangar's Ion stabilizers input uses the shared
  Switch. The shared component retains native checkbox behavior.
- The committed design-system spec says the Hangar uses Switch for both Ion
  stabilizers and Linked engines. However, the committed `ShipBuilder.svelte`
  diff converts only Ion stabilizers. At closure, the worktree contains
  uncommitted Hangar and spec edits that include Linked engines; those edits are
  outside `a1fb69b`. Therefore Linked engines use is not evidenced by the pushed
  revision, and the spec wording is broader than that revision supports.
- The exact rendered page was inspected in-session, but there is no retained
  screenshot artifact and no recorded automated browser or accessibility test.
- Many unrelated workspace edits remain uncommitted. The pushed commit was
  isolated from them; this closure record itself is a new local edit.
