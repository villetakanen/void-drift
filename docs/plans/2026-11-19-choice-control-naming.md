---

generated:
by: "openai-codex/gpt-6.1-sol"
at: "2026-11-19T12:32:56+02:00"
verified:
- by: "openai-codex/gpt-6.1-sol"
  at: "2026-11-19T12:33:38+02:00"

---

# Choice controls: naming review and search/replace plan

**Date:** 2026-11-19  
**Status:** Implemented following the owner's 2026-11-19 instruction to amend the codebase and migrate affected specs. The initial review and planned sequence below remain the rationale; the delivery section records the actual scope.  
**Scope:** Shared controls, design-system guidance, current feature specs, production and Lab consumers, and study imports of shared controls.

## Delivery — 2026-11-19

- Renamed shared Toggle to SegmentedControl across every production, current-Lab and study consumer; removed the obsolete global private-class selector.
- Standardised all current non-study independent checkbox settings on Switch, including FX-bench Weapons/FX/camera/overload and Motion energy analysis. Preserved weapon fitting/reset and validated energy-configuration side effects through functional bindings.
- Converted leaderboard score/time ordering from pressed buttons to SegmentedControl, preserving the loaded membership and sorting rules. Updated its backend journey locators and the FX review-capture locators.
- Retained native checkbox semantics for Switch, Tabs panel semantics, command buttons, fitted-part/slot selection buttons, held thrust interactions, boolean inversion helpers and study-local experiments.
- Suppressed hover treatment on unavailable segmented options, as the existing contract requires.
- Updated canonical Lab copy, registry file references and contract anchors. Preserved historical study anchors and written evidence.
- Migrated affected feature specs to the new template with actual model provenance and draft status. Extracted design-system domains into focused child specs (actions, artwork, choices, colour, identity, inputs, surfaces and typography), leaving a roughly 100-line overview. Existing integrated instrument/effects contracts remain longer to preserve their established simulation, rendering, staging and lifecycle detail; this delivery does not redesign those systems. Model source checks are not human approval.

Verification:

- Edited spec subtrees: format lint passes. Repository links, registry coverage and canonical anchors: contract check passes (16 factory tests).
- Final type checks and the 116-page production build pass.
- Six retained offline smoke journeys pass: active ship, control persistence/failure, and modal pause.
- One-off runtime review passes across Choices, Tabs, Hangar, FX, Motion, Flight scene, Planet Inspector, overview, Render model, Derelict and a shared-control study; no uncaught browser errors. Lab review includes 1280px and 1440px widths; a separate 1024×768 touch context operates Options and Hangar successfully. Captures are under ignored `artifacts/choice-controls/`, not required correctness gates.
- A separate emulator-backed review verifies leaderboard pointer and arrow-key sorting through the new control; it passes. This review is local/opt-in rather than a new permanent test obligation.
- Backend rules pass; the unranked competition journey passes. The ranked journey stops before reaching leaderboard assertions because its existing seeded-flight expectation is below 1000 ticks while the current simulation predicts 1559. No flight assertion was weakened. Details: `artifacts/verification/backend-7QfB1G/test-competition.log`.
- Full unit suite: 384 pass, 2 fail in `solar-system.test.ts` and `tuning.test.ts`, involving the concurrently edited Outer Mercurial generation/tuning. Those production files and assertions were left unchanged by this task.
- Shared preview was restarted once after a stale blank Hangar, then re-inspected successfully. A concurrent Render model ID edit was merged by reusing its existing instance ID for setting labels.

Assumptions and limits: “all” applies to current shared-control usage, not rewriting historical studies or turning every selection button into a switch. Existing unrelated feature clauses were retained during format migration; their complete product behavior is not newly certified. In particular, Motion's existing spec says there is no designer-facing import workflow while its current DocumentPanel exposes Load a document; that pre-existing intent conflict remains outside this naming amendment. Human spec verification and approval are not invented.

## Finding

There is real terminology drift, but `Switch` and `Toggle` are not simply reversed.

- `apps/web/src/components/inputs/Toggle.svelte` is a **single-select segmented control**: `role="radiogroup"`, native radios, string `value`, and two or more named options. It is not an on/off toggle or a toggle button.
- `apps/web/src/components/inputs/Switch.svelte` is an **on/off setting control**: a native checkbox, boolean `checked`, an OFF/ON marker, and an external label. Its component name describes its visual and interaction purpose correctly.
- `apps/web/src/components/inputs/Tabs.svelte` owns tab panels and uses the tabs pattern. Its similar appearance does not make it interchangeable with either input.
- The design-system spec explicitly distinguishes these purposes, but calls the segmented control `Toggle`. That name invites confusion with the binary `Switch` and with genuine pressed-state buttons.
- Some current feature prose uses “switch” for a segmented choice: Planet Inspector's five-value Zoom, Flight scene's camera-view selector, and the graph scale selector. Other prose uses “toggle” for a genuine boolean action. A blanket word replacement would corrupt these distinctions.
- The design-system spec also has stale consumption claims: it says the Hangar ship chooser uses `Toggle` and its detailed variant. The current `ShipBuilder.svelte` uses `Tabs` for ship workspaces and `Toggle` only for Plan/View. Fix the stale claims rather than preserving them under a new name.

**Recommendation:** Rename `Toggle` to `SegmentedControl`. Keep `Switch` and `Tabs`. Use “toggle” as an action verb or as part of the explicit term “toggle button”, not as the name of the single-choice radio primitive.

This is a naming and documentation correction first, not a visual redesign or a reason to change all boolean controls at once.

## Proposed vocabulary and usage

| Name               | Question answered                      | State/API                   | Semantics                  | Examples                                                                                      |
| ------------------ | -------------------------------------- | --------------------------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| `Switch`           | Is this independent setting on?        | boolean `checked`           | Currently native checkbox  | Playground, Speed camera, Ion stabilizers, Linked engines, layer visibility                   |
| `SegmentedControl` | Which one of these values?             | string `value`, `options`   | Native radio group         | Plan/View, zoom, burn, falloff, framing mode                                                  |
| `Tabs`             | Which sibling workspace/panel is open? | selected tab id plus panels | tablist/tab/tabpanel       | Hangar ship workspaces                                                                        |
| Toggle button      | Is this button's mode/action engaged?  | boolean pressed state       | button with `aria-pressed` | A deliberately designed toolbar mode; not the name of the radio primitive                     |
| Checkbox           | Is this item selected/included?        | boolean or membership       | Native checkbox            | Selection lists and form choices where inclusion, rather than enabling a setting, is the task |
| Command button     | What should happen now?                | command                     | button                     | Reset, Burst, Pause/Resume                                                                    |

Rules to add to the owning design-system contract after agreement:

1. Choose by user task, not the number of visible labels, visual similarity, or the storage type.
2. Two values such as Plan/View, Draft/Original or inverse/inverse-square are still a segmented choice. A boolean backing variable does not require a Switch.
3. Off/On for one independent setting uses Switch, not a two-radio imitation.
4. Changing drawing parameters in one persistent preview is a value choice; opening separate content panels is Tabs. Do not automatically turn every control labelled “View” into Tabs.
5. “Toggle” alone is not a shared component name. “Toggle the switch” remains ordinary valid English, as do code helpers that invert a boolean.
6. A toggle button is not a radio segment. Preserve fitting, slot-selection and command semantics instead of treating every `aria-pressed` as a Switch migration.

## Reviewed state and evidence

### Shared implementation

- `Toggle.svelte`: `options`, bindable `value`, `label`, `stretch`, `details`, `disabledOptions`, `optionSuffix`; native radio names and descriptions. Root class `.toggle`; generated group-name prefix `toggle-`.
- `Switch.svelte`: optional `id`, `aria-describedby`, bindable `checked`, `disabled`; native checkbox, external accessible label; decorative OFF/ON text hidden from assistive technology. No explicit `role="switch"`.
- `Tabs.svelte`: its introductory comment refers to “Toggle's cut button”; update that vocabulary, not its behavior.
- `packages/core/src/lib/styles/tokens.css`: corner-cut comment says “the toggle”.
- `packages/core/src/lib/styles/flight.css:290`: `.flight-card .ship-select .toggle` is the only non-component `.toggle` selector found outside studies. No current `ship-select` consumer was found in apps/packages outside studies. Treat it as a likely stale rule; confirm before removal rather than mechanically perpetuating it.

### Scope measured in the current working tree

- 42 Svelte files import shared `inputs/Toggle.svelte`: 11 production/current-Lab files and 31 study consumers.
- These files contain 90 `<Toggle` instances.
- 24 Svelte files import shared `inputs/Switch.svelte`; their component name does not need changing.
- `apps/web/src/data/lab-pages.ts` also names the shared Toggle source path and the current `#toggle-and-switch` contract anchor.

Counts are a snapshot, not an acceptance test. Re-discover at implementation time because this is an actively edited checkout.

### Current non-study segmented-control consumers

All paths below are under `apps/web/src/components/`:

| File                                              | Choices                                                            | Proposed action                                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `ShipBuilder.svelte`                              | Plan/View                                                          | Rename component only; ship workspaces remain Tabs                                                   |
| `lab/LabChoices.svelte`                           | Canonical examples: zoom, ships/details/availability, scale, burns | Rename examples and explanatory copy; retain all demonstrated capabilities                           |
| `lab/LabTabs.svelte`                              | Tabs/value/on-off comparison                                       | Rename component, `compareToggle` → `compareSegmentedValue`, headings, captions and comparison table |
| `lab/LabThrustPads.svelte`                        | Shown thrust-pad state                                             | Rename only                                                                                          |
| `lab/flight-scene/FlightSceneInstrument.svelte`   | Camera View                                                        | Rename only; call it view selector in prose                                                          |
| `lab/flight-scene/FlightSceneLab.svelte`          | Scene, approach, star colour, targets                              | Rename only                                                                                          |
| `lab/gravity-tuning/GravityPanel.svelte`          | Falloff model                                                      | Rename only                                                                                          |
| `lab/instrument/BurnRow.svelte`                   | Burn                                                               | Rename only                                                                                          |
| `lab/instrument/PathPane.svelte`                  | Fit all/Default scale                                              | Rename only; call it scale selector in prose                                                         |
| `lab/mount-planner/MountPlanner.svelte`           | Ship, Draft/Original, mount contents                               | Rename only; retain existing value mapping and edit behavior                                         |
| `lab/planet-inspector/PlanetInspectorView.svelte` | Zoom, named planet, family                                         | Rename only; retain selection side effects and current state mappings                                |

## Implementation sequence

### 1. Settle the vocabulary in the design-system spec

Owning file: `docs/specs/factory/design-system/spec.md`.

- Replace current normative `Toggle` component references with `SegmentedControl`.
- Rename “Toggle and switch” to “Segmented control and switch”.
- Update the source-of-truth path and the Tabs control-selection table.
- Replace shape descriptions such as “the toggle's shape” with “the segmented control's shape”.
- State the task-based rules above, including the difference between radios, Switch, Tabs and pressed-state buttons.
- Correct the stale Hangar ship-chooser claims: ship workspaces use Tabs; Plan/View uses SegmentedControl. Keep detailed-selector examples described as available variants, not as current Hangar usage.
- Record this as a naming correction with unchanged appearance, input semantics and consumer state contracts.
- Do not silently change Switch from checkbox semantics to the ARIA switch role. That is a separate accessibility decision; see below.

### 2. Rename the shared component and its internal vocabulary

Move:

`apps/web/src/components/inputs/Toggle.svelte` → `apps/web/src/components/inputs/SegmentedControl.svelte`.

Targeted changes inside it:

| Search                                | Replace                     | Boundary                                  |
| ------------------------------------- | --------------------------- | ----------------------------------------- |
| Root `class="toggle"`                 | `class="segmented-control"` | Shared component only                     |
| Root CSS `.toggle`                    | `.segmented-control`        | Shared component only                     |
| Generated group-name prefix `toggle-` | `segmented-control-`        | Internal radio group/description IDs only |

Keep every prop, snippet signature, binding, native input type, description link, disabled-option rule and CSS value unchanged. No new Zod/data contract is needed for a pure component rename. If implementation expands into stored data changes, define the schema change first instead.

Use one atomic repository migration; do not leave a second public `Toggle` wrapper/alias that sustains two names. If an external consumer is discovered, stop and decide compatibility explicitly.

### 3. Migrate all shared-component consumers, including studies

Use import-aware replacements in the 42 discovered Svelte files:

| Search                                      | Replace                                                     |
| ------------------------------------------- | ----------------------------------------------------------- |
| Import path ending `/inputs/Toggle.svelte`  | Same relative path ending `/inputs/SegmentedControl.svelte` |
| Default local import `Toggle` for that path | `SegmentedControl`                                          |
| `<Toggle` element name                      | `<SegmentedControl`                                         |
| `</Toggle>`                                 | `</SegmentedControl>`                                       |

Do not replace only self-closing tags: `LabChoices.svelte` supplies an `optionSuffix` snippet with a closing tag.

Study policy:

- Study consumers of the shared primitive receive the import/tag migration so they continue to compile.
- This does not promote study decisions or change their local behavior.
- Do **not** rename study-local `OptionToggle.svelte`, `OptionToggleComparison.svelte`, local `.toggle` styles, comparison labels, or historical study anchors as part of this migration. Those are records/local experiments, not the shared API.
- Preserve existing links such as `/lab/studies/lab-instrument-2026-11-01#toggle`.
- Review any comment mentioning the shared component separately; distinguish present API guidance from historical terminology.

### 4. Update canonical Lab guidance and registry

- `apps/web/src/components/lab/LabChoices.svelte`: “Segmented control” heading, API name and purpose; explain single-select radio behavior rather than toggling. Keep Switch examples off/on/disabled and accessible supporting copy.
- `apps/web/src/components/lab/LabTabs.svelte`: use “Tabs, SegmentedControl or Switch” and update all comparison text. Keep the purpose distinction and existing Tabs demonstrations.
- `apps/web/src/components/inputs/Tabs.svelte`: update the shared-shape comment.
- `apps/web/src/pages/lab/ds/choices.astro`: update its component-naming comment. Keep `/lab/ds/choices` and its title; no route move is necessary.
- `apps/web/src/data/lab-pages.ts`: update Choices purpose, `defines` path, spec anchor to `#segmented-control-and-switch`, and Tabs purpose.
- `apps/web/src/components/lab/LabSurfaces.svelte`: update “Buttons and toggle” token-use copy.
- `apps/web/src/components/lab/LabGraphs.svelte` and `lab/instrument/PathPane.svelte`: “scale switch” → “scale selector”.
- `apps/web/src/components/lab/flight-scene/FlightSceneInstrument.svelte`: “view switch” → “view selector” in its layout comment.
- `packages/core/src/lib/styles/tokens.css`: update the corner-cut comment only; do not rename tokens.
- `packages/core/src/lib/styles/flight.css`: confirm the `.ship-select .toggle` rule has no consumer, then remove that rule alone. If a live consumer is found, preserve spacing through its layout owner rather than adding another dependency on a component's private class.

Find all links to `#toggle-and-switch`; update current guidance together with the renamed heading. Preserve historical evidence; decide a compatibility anchor if retained inbound links require one.

### 5. Correct living feature-spec vocabulary

| File                                             | Planned correction                                                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `docs/specs/game/hangar/spec.md`                 | Plan/View consumes `SegmentedControl`; ship workspaces remain Tabs; Playground remains Switch              |
| `docs/specs/game/hangar/mount-planner/spec.md`   | Shared `Toggle` reference → `SegmentedControl`                                                             |
| `docs/specs/lab/motion-instrument/spec.md`       | Shared component table name/path; examine selector prose                                                   |
| `docs/specs/lab/planet-inspector/spec.md`        | Zoom “switch” → “segmented control” or “selector”; boolean world/FX/LFX/HUD switches remain switches       |
| `docs/specs/lab/flight-scene-instrument/spec.md` | View “switch” → “view selector”; layer and light switches remain switches                                  |
| `docs/specs/factory/effects/spec.md`             | Weapons is currently a pressed button, so call it “Weapons toggle button”, not the renamed radio primitive |

Review, but do not mechanically rewrite, game/options, camera/speed-camera, experimental and hangar specs that already correctly say Switch.

Do not rewrite old plans, release notes, `docs/history/`, loop evidence or study findings to pretend the new component name existed at the time.

### 6. Separate usage inconsistencies from the safe rename

The wider audit found controls that bypass shared Switch:

- `lab/FxBench.svelte`: Weapons, FX, camera movement and Overload are `aria-pressed` buttons. Run/Pause, Reset and Burst are commands.
- Native checkboxes occur in `lab/LabShipInspector.svelte`, `lab/LabSurfaces.svelte`, `lab/PointDefenceEncounter.svelte`, `lab/IonCannonEncounter.svelte`, `lab/SunFlightBench.svelte`, `lab/LabDerelict.svelte`, `lab/LabDerelictDamage.svelte`, `lab/RenderModel.svelte` and `lab/instrument/EnergyPanel.svelte`.
- Pressed buttons in PartCard, slot selection, partner selection, leaderboard ordering and flight-pad experiments do not all mean independent on/off preferences.

These are **usage-review candidates**, not approved mass replacements. For each current non-study control:

1. Classify its task using the vocabulary table.
2. For a genuine independent enable/disable setting, propose shared Switch and check layout/touch footprint; 88×44px is not interchangeable with a compact checkbox.
3. For mutually exclusive choices, consider SegmentedControl only if its layout and selection semantics fit.
4. Preserve pressed action/selection buttons and command buttons where those are the actual task. Do not convert Run/Pause to a setting merely because it flips a boolean.
5. Preserve side effects. Weapons changes fitting through `toggleWeapons`; Energy analysis creates/removes a structured configuration through a handler. A bare `bind:checked` substitution would lose behavior.
6. Update the relevant feature contract before any behavior/composition change, and implement this as a separate slice from the naming migration.

**Accessibility decision, explicitly deferred:** `Switch` currently exposes checkbox semantics, deliberately documented in the design-system contract and used by browser tests. Adding `role="switch"` is reasonable to evaluate for an immediate on/off setting, but is not a naming fix. If accepted later, update the owning contract, relevant accessibility prose, and role-based locators together. Do not add redundant `aria-checked` to a native checkbox or change `checked` to string `value` as part of this plan.

## Search/replace boundaries

Safe after inspecting each match:

- Shared component file/import/tag names.
- Current canonical API names, registry paths and spec links.
- `.toggle` only in the renamed shared component, plus the separately assessed global rule.
- `compareToggle` in the current Lab comparison example.

Never run repository-wide `toggle → switch`, `switch → toggle`, or `Toggle → Switch`.

Leave alone:

- TypeScript `switch` statements, target-switch scenarios and ordinary verbs.
- Boolean inversion helpers such as `toggleWeapons`.
- Persistent keys, URLs, query values, enum values, labels and externally visible data.
- Historical records, study-local controls and `#toggle` study anchors.
- Correct existing Switch imports, `.switch` CSS, checkbox locators and Tabs roles.

Useful discovery commands at implementation time:

```sh
rg -n 'inputs/Toggle\.svelte|<Toggle\b|</Toggle>' apps packages tests scripts
rg -n 'Toggle|toggle-and-switch|scale switch|view switch|Zoom switch' apps/web/src docs/specs packages/core/src
rg -n '\.toggle\b|toggle-' apps packages tests scripts
rg -n 'aria-pressed|type="checkbox"|role="switch"' apps/web/src/components --glob '*.svelte'
```

Classify residual matches; zero occurrences of the English word “toggle” is not the goal.

## Verification and completion

For the naming migration:

1. Inspect the diff: rename, imports/tags, targeted internal names, current guidance and stale claims only. No unrelated files or existing user edits overwritten.
2. Confirm no imports of the removed shared `inputs/Toggle.svelte`, no live `<Toggle>` elements using it, and no registry entry pointing at the old file/heading.
3. Run `pnpm check:contracts`, `pnpm check:types`, and `pnpm build`. The build must include study consumers, not merely the main game.
4. Use the shared preview via `pnpm dev:ensure` / `pnpm dev:status`; reload affected surfaces. If stale, restart once and inspect logs as repository guidance prescribes.
5. Inspect `/lab/ds`, `/lab/ds/choices`, `/lab/ds/tabs`, Hangar, Flight scene, Motion and Planet Inspector. Lab viewports must be at least 1280px wide. Inspect one representative study importing the renamed primitive too.
6. Check segmented-control arrow-key selection, group names, selected/unselected and disabled options, supporting descriptions, suffix content, stretched and detailed variants. Confirm a selected disabled option is not silently changed.
7. Confirm Switch still works by label/pointer/Space, preserves on/off/disabled/description behavior, and still exposes the existing checkbox role. Confirm Tabs still controls its panels and keyboard activation modes.
8. Confirm Plan/View, camera view, zoom, burn and planet selection retain their prior state mappings and side effects. No setting defaults, persistence or authored data changes.
9. Existing `tests/browser/control-default.spec.ts` and `tests/browser/dialogs.spec.ts` use checkbox locators; those should not need changing for this migration. A cosmetic local variable called `toggle` is not evidence of a broken API. Run relevant existing smoke checks through the repository's browser harness; do not add a naming-only browser suite.
10. Report static/build results, browser behavior and visual inspection separately. No backend journey is required for a UI rename; no human-playtest evidence is requested.

Done means one clear current shared name for each purpose, consistent canonical examples and living specs, all consumers compiling, and no input/visual/state regression. Broader checkbox/toggle-button standardisation and any ARIA role change remain separately decided work.

## Working-tree caution

This review ran against a dirty checkout with unrelated ongoing changes, including `PlanetInspectorView.svelte` and its spec. Re-read current contents before editing; merge targeted changes rather than restoring files or applying an old bulk patch. The initial review added only this plan and did not verify runtime behavior. The authorised implementation and its checks are recorded in Delivery above.
