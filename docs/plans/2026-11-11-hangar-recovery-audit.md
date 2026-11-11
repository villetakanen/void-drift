# Hangar recovery audit

Started 11 November 2026. The designer reports that the Hangar feels visually
broken, departs from the design system and contains confusing information.
Audit and repair one understood problem at a time. Passing functional checks
is separate from visual acceptance. No blanket rollback is agreed.

## Purpose and method

Preserve the intended choose, fit and fly behavior while recovering an
understandable composition. Compare designer observations, rendered evidence,
current shared components, specs and the recent diff. Earlier code and plans
are evidence, not automatically the right visual reference.

For each issue: identify the symptom, reproduce it, locate its owner, distinguish
new changes from existing defects, and check whether guidance is missing,
incorrect, or already present but not followed. Record hypotheses as such.
Then make one bounded repair, update its owning contract if necessary, inspect
it in the real page and check affected behavior. Keep further findings open.
Do not turn observations into standing factory rules without separate review.

## Problem map

| ID     | Observation                                                                                                | Evidence / likely cause                                                                                                                                                                                                                  | Owner and next action                                                                                                                                                               | State                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| HRA-01 | Experimental feels like a custom control rather than the expected on/off toggle.                           | Source uses the shared segmented `Toggle`. The Hangar spec prescribes Off/On segments, while the design system has a binary `Switch`. This is a component-choice and contract mismatch; it is not evidence that a new control is needed. | Hangar composition/spec: use the existing `Switch`, keeping setting persistence and launch gates.                                                                                   | Resolved at agreed scope (Playground decision)           |
| HRA-02 | “Only scored ships and parts can fly” is unexplained and distracting beneath the control.                  | Added in the active-ship change; uses provisional classification language as settled player-facing explanation.                                                                                                                          | Hangar copy: remove the Off-state sentence. Existing On marker remains provisional and is reviewed separately under HRA-04.                                                         | Resolved at agreed scope (Playground decision)           |
| HRA-03 | Header takes roughly one-fifth of the visible page; excessive space between navigation and workspace rows. | Designer observation. Source has stacked rows, heading block margins, navigation padding, and status content. Narrow pane inspected; size and spacing need comparison at desktop/iPad too.                                               | Hangar composition: measure the contributing boxes and agree a compact reference before adjusting spacing. Do not assume one padding value is the whole cause.                      | Implemented; designer says header is much better         |
| HRA-04 | Ship choices marked “in development” are unexpectedly darker; badges and facts break the line structure.   | New marker suffix and whole-option opacity interact with the detailed equal-width Toggle. At desktop, facts have inconsistent placement; in the narrow pane they wrap word by word. Marker wording/placement is not designer-accepted.   | Review classification intent separately from its presentation. Inspect shared disabled states and chooser composition. Decide what belongs inside each choice before repair.        | Shared Tabs applied; Hangar visual review open           |
| HRA-05 | Disabled choice appearance may violate the system; muted information becomes difficult to read.            | Toggle applies local `opacity: 0.58` to the entire option. Its hover selector still includes unavailable options although the written contract says disabled hover is suppressed.                                                        | Shared Toggle state implementation and canonical Lab example. Separate confirmed contract violation from the unresolved desired appearance.                                         | Open                                                     |
| HRA-06 | Launch row contains confusing A+D / arrow / aft-engine text.                                               | Designer observation; inherited contextual text remains beside mode actions. On Wasp, applicability needs checking against actual mounts/input.                                                                                          | Hangar information hierarchy and applicable ship guidance. Review purpose and placement before rewriting copy.                                                                      | Replaced by Playground scoring notice                    |
| HRA-07 | Sticky launch strip covers much of the ship in the current narrow pane.                                    | Observed at approximately 518px pane width. Bespoke footer/action flex rules, fixed minimum button widths and four actions consume substantial height.                                                                                   | Hangar layout. Compare with the shared action-strip pattern, including its existing container-width behavior. Wider inspection is required too.                                     | Designer retains behavior; pattern documentation pending |
| HRA-08 | Screen mixes design-system primitives with bespoke cards, typography, spacing and action layout.           | Source contains page-local styles and raw dimensions; the shared action-strip guidance already exists but this footer does not compose it. Individual values still require comparison before calling each one a defect.                  | Audit component usage against `/lab/inputs`, surfaces, tokens and current system rules. Fix implementation where guidance already exists; add guidance only for a demonstrated gap. | Open                                                     |
| HRA-09 | Functional completion was reported too broadly.                                                            | Previous gates proved execution, input, persistence and submission behavior. They did not establish visual coherence or designer acceptance.                                                                                             | Keep functional evidence, agent inspection and designer judgment distinct in recovery reporting.                                                                                    | Open                                                     |

## First repair: binary Experimental control

Acceptance: Experimental uses the same shared `Switch` as other binary settings,
has one visible label and a matching checkbox accessible name, works by pointer
and Space, persists, and keeps the active fitting and launch eligibility rules.
The unexplained Off-state sentence disappears. This repair does not settle the
remaining marker terminology or the overall header/chooser/action layout.

Update the Hangar contract to prescribe the binary shared control. Clarify the
existing design-system usage distinction: on/off setting uses `Switch`; choosing
one value from a set uses `Toggle`. Keep the real examples as reference.

## Subsequent order

1. Inspect and recover header density (HRA-03), using the repaired control.
2. Settle ship chooser content, shared states and line structure (HRA-04/05).
3. Recover launch-strip composition and remove or relocate irrelevant guidance
   (HRA-06/07), using existing shared patterns where they fit.
4. Continue through parts, systems, estimates and remaining screen styling.

This order is provisional and can change with evidence and designer feedback.
The first successful repair should test our understanding, not certify the page.


## First repair evidence

Experimental now uses the existing binary `Switch` with a visible label and
checkbox semantics. The Off-state sentence was removed. The Hangar contract and
design-system component-choice guidance were corrected in the same change.
Eleven focused Hangar/active-ship browser checks passed, including Space-key
operation, persistence, preserved fittings and launch gates. Recorded quick
verification passed contracts, lint, types and units:
[report](../../artifacts/verification/2026-11-11T06-17-21.876Z-5gAlCf/report.json).
This is partial verification; full browser/backend/build gates were not repeated
for this small repair. A fresh desktop capture was inspected at
`artifacts/hangar-opening.png`. Live browser inspection later became unavailable;
the fresh test capture is the visual evidence for this increment, not designer
acceptance of the whole Hangar.

## Scoring eligibility: clarified intent, 11 November 2026

The designer clarifies that the excluded ships and parts are outside the rules
for the core scored game. This is not a development-completion or quality
classification. An excluded item can be complete, desirable and intentionally
available for play, while unsuitable for the scored game's balance or rules.
It may remain outside those rules indefinitely. No promotion into scored play
is promised or required.

The setting permits those ships and parts, with scoring disabled for the run.
This keeps the agreed 0.6 behavior; it changes how we explain its purpose.
Current “in development” markers and the spec's completion-based explanation
misrepresent that intent. This is a confirmed documentation/meaning gap, beyond
an isolated styling defect. Record it as HRA-10: intent clarified; class names,
setting label and notices still under discussion. Do not treat proposed names
as adopted or rename more UI while the question is being settled.

The owning Experimental contract, adjacent ship/part classifications, the 0.6
plan and marker/naming study need reconciliation around this meaning. The name
`releaseClass` in code also needs review for its lifecycle implication. Internal
spelling alone must not define product intent.

### Naming research and proposals (not decisions)

- Minecraft uses “Allow Cheats” for command permissions; Bedrock achievements
  are disabled for that world. [Official Minecraft article](https://www.minecraft.net/en-us/article/minecraft-commands).
- No Man's Sky uses “Custom” for configurable game settings. This illustrates
  customization naming, not a claim that custom games universally lose scoring
  or achievements. [Waypoint update](https://www.nomanssky.com/waypoint-update/).
- Deep Rock Galactic distinguishes mod approval categories, including Sandbox,
  and separates compatible play. This is a closer analogy to eligibility than
  a promise of development progress. [Official modding FAQ](https://www.deeprockgalactic.com/modding-support-faq).

Candidate distinction: regulation eligibility versus unrestricted access.
“Unrestricted” (one word) and “Open class” (two words) are proposals for the
setting, not new flight modes. A separate concise consequence such as “Scores
off” states the current no-score rule; “Unranked” alone could imply a score is
still shown. Final words remain the designer's decision.


## Playground decision and first item settled — 11 November 2026

The designer accepts **Playground** for the shared binary switch. No explanation
is required beneath Off. The player-facing setting name is settled together
with the component choice; HRA-01/02 are resolved at this scope. “Scoring off”
communicates the existing no-score consequence at launch/flight; no warning
modal is introduced. Existing device settings are retained through their
current storage identifiers.

The owning Playground contract and adjacent game contracts now use the chosen
setting name and its scoring-eligibility meaning. The spec remains at its
existing `game/experimental/spec.md` path to preserve links. Internal API/storage
renaming and individual item-class terminology are separate concerns.

The designer identifies two contributors to the original failure: selecting
the wrong design-system control and treating unsettled planning terminology as
ready for product copy. Retain that observation here as a lesson candidate;
no standing factory rule is adopted from this audit.

Next discussion: ship chooser content and state presentation (HRA-04/05).
Determine what each choice must communicate, whether it needs an item badge,
and how unavailable items and facts align. Header density and the launch strip
remain open; this decision does not certify the whole page.

## Tabs ownership gap

The designer asks whether the ship chooser is a tabs pattern and whether the
system defines that pattern before discussing Hangar-specific contents.
Inspection finds no dedicated Tabs component, tablist/tabpanel implementation,
Tabs section in the design-system spec, or canonical Tabs Lab example.

What exists is `Toggle.svelte`, a native radio group. The design-system spec
documents its detailed selector variant, including facts and wrapping; Hangar
uses that variant and adds marker suffixes. It also makes the selected ship
active, so it carries a selection side effect as well as changing the workspace
being displayed. Calling the implementation a Toggle does not settle which
interaction pattern the product should expose.

Record HRA-11: a shared pattern/usage boundary is missing. Before another
Hangar-only arrangement, clarify tabs versus selection and whether changing the
visible ship also makes it active. Then define the shared presentation and
interaction contract: selected/focus/disabled states, consistent item structure,
height and spacing, permitted metadata, overflow at constrained widths and
panel association. Demonstrate the pattern in the Lab before composing it into
the Hangar. The Hangar owns which ship facts are useful; the design system owns
how supported content and states behave consistently. No Tabs design or change
to active-ship behavior is adopted by this finding.

## Header and scrolling take priority

The designer redirects the next discussion to the page's top area before tabs.
The minimum intended game surface is landscape iPad. Header wrapping and the
additional Playground-On line consume workbench space that should serve ship
selection and fitting.

Confirmed source contributors: the Hangar contract explicitly prescribes two
rows and a marker below the Playground control; ShipBuilder separately renders
“HANGAR / version” and an H1 “Hangar”, a duplicate title-return link, steady save
status, 22px navigation padding and heading block margins. The header/heading
flex containers wrap below 1000px. Playground On adds a line through a column
container. This is both a contract/composition question and an implementation
question. Removing the extra line cannot by itself settle scrolling behavior.

Proposed direction for discussion, not yet an adopted screen change:

- One compact header row: linked logo, one Hangar title, and the labeled shared
  Playground switch. Switching On/Off leaves header height unchanged.
- Scoring-off status belongs with launch/run feedback; it does not need another
  line under the Hangar switch. Quiet version/save information should not force
  header growth; storage failure must remain visible and truthful.
- Define the frame and scrolling together: a compact header, one vertically
  scrollable workspace, and a launch region with reserved space so it cannot
  cover workspace controls. Avoid independent column scrollbars as a default.
- Verify the supported iPad landscape fixtures, including 1024×768 and
  1180×820. Keep native touch targets. Define an explicit narrower fallback
  separately instead of accepting accidental wrapping as the policy.

Open decision: accept the single-row header and where persistent versus
exceptional status belongs. Then update the Hangar contract before implementing
this bounded repair. Tabs/component work follows the header/scroll decision.


## Header repair accepted scope

The designer accepts the compact single-row header: linked logo, one Hangar
heading, and Playground Switch. Remove the extra Playground line from this
header. Replace the engine-input explanation in the launch row with
“Playground · Scoring off” while On; Off shows no such notice. Exceptional
storage/loading messages stay available in that launch context, rather than
occupying the normal header.

The designer explicitly retains the existing sticky launch-action behavior,
including its current overlap and the need to scroll. That behavior has value
in the current experience. Do not implement the previously proposed separate
workspace scroll container, reserve a new footer region, or change sticky
positioning in this repair. Documenting the shared sticky-action pattern remains
future audit work. Tabs and chooser changes also remain separate.

Checks for this repair: one header row and one Hangar heading at 1024×768 and
1180×820; unchanged header height between Playground Off/On; native-size shared
switch and linked logo; warning only in launch context; logo navigation;
preserved settings, fitting and launch gates. Visual inspection and automated
checks are evidence for this small change, not whole-page visual acceptance.


Header repair implementation evidence: the one-row header and unchanged On/Off
height passed at 1024×768 and 1180×820; the logo remains a native-size keyboard
and pointer link. All 25 focused Hangar, active-ship, title and launch-navigation
checks passed. Fresh captures are `artifacts/hangar-header-1024-on.png` and
`artifacts/hangar-header-1180-on.png`. Sticky footer positioning and workspace
scroll rules were preserved. No tabs, item badges or chooser styling were repaired
in this increment.

The first quick run passed contracts/lint/types but one unrelated FX integration
unit timed out at its existing 5-second limit while browser checks were also
running. That failed result remains in
[its report](../../artifacts/verification/2026-11-11T06-51-04.176Z-E7xe9l/report.json).
The test and its timeout were not changed; quick verification is repeated
sequentially after browser checks. Quick verification remains partial and does
not stand in for full browser/backend/build verification.

## Tabs session handoff

The designer requests an isolated shared-pattern session, followed by Hangar
integration discussion here. The handoff is
[Tabs design-system brief](2026-11-11-tabs-design-system-brief.md). Its deliverable
is a dedicated design-system Lab reference and shared contract/component.
Hangar migration, final ship-choice contents and sticky/scrolling changes remain
outside that session's scope.


## Shared Tabs applied to Hangar — 11 November 2026

The designer brings the completed shared Tabs pattern back into this session
and asks to focus on integrating it before pursuing other audit areas. The
entire left column, parts list and estimates remain outside this repair.

The ship chooser now composes `inputs/Tabs.svelte`, documented at
`/lab/ds/tabs`. Each ship supplies its short name, slot count and chassis mass.
The shared row owns the workbench panel and its selected, unavailable, focus
and overflow treatment. The old chooser's badge suffix and whole-option dimming
are gone. No “in development” badge appears inside the ship tabs. Existing part
markers remain an unresolved meaning/presentation issue, not an accepted pattern.

Selecting a ship still makes it active immediately and restores its fitting.
Manual keyboard activation follows the shared consequential-selection guidance:
arrows move focus; Enter or Space selects. Pointer and touch select immediately.
Playground Off keeps an excluded active ship selected and unavailable, preserves
its fitting, and blocks launch until the player restores an eligible setup or
turns Playground On. The header and sticky launch behavior remain as agreed.

A shared-component accessibility mismatch surfaced during integration: facts
were included in each tab's accessible name, contrary to the shared contract.
The shared owner now explicitly names the tab from its label and keeps facts
as its accessible description. No page-specific tab styling was introduced.

Evidence: the tab row is 44px tall with Playground Off/On at 1024×768,
1180×820 and 1440×1000; all five tabs fit without wrapping or row overflow.
The focused browser run passed 23 of 24 checks, with the remaining check failing
while collecting a trace file that disappeared from the shared output folder.
That check passed when repeated with isolated output. The new integration case
covers deliberate keyboard activation, panel association, unavailable focus,
selection persistence and launch blocking; existing checks cover fitting,
launch/return and iPad touch. Type checks and focused formatting/lint pass.
Fresh captures are `artifacts/hangar-tabs-{1024,1180,1440}-{on,off}.png`.
Full verification was not repeated.

HRA-04's chooser wrapping/badges and HRA-05's Hangar disabled appearance now
use the shared Tabs contract; designer acceptance of this integration remains
open. The old Toggle's other consumers are not certified or migrated by this
repair. HRA-11 has a shared owner/reference and production composition now.
Reassess the rendered Hangar with the designer before taking on HRA-08's
remaining parts/systems/estimate styling. No further visual repairs are inferred.
