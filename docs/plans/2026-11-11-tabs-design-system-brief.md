# Brief: shared tabs pattern in isolation

Written 11 November 2026 for a separate session. The designer wants to develop
the shared tabs pattern on its own design-system Lab page, then return to the
Hangar recovery conversation to discuss integration. This authorizes the shared
pattern and isolated reference work, not a Hangar redesign or migration.

## The question

What is Void Drift's reusable tabs pattern, and what guidance lets a screen
compose it correctly without inventing layout and state styling locally?

The Hangar exposed the gap. Its ship chooser looks like tabs between ship
workspaces, but is implemented with the detailed `Toggle` radio group. Adding
facts, availability and badge content created inconsistent wrapping and dimming.
There is no dedicated Tabs component, design-system entry or canonical example.
The current Toggle's name is not evidence that it is the right pattern for this
job. Equally, changing its name alone would not establish tabs behavior.

The desired result is a small understandable shared pattern, demonstrated in
isolation, with explicit use guidance. The Hangar motivates the work; it must
not dictate every component detail.

## Established decisions to preserve

- The shared `Switch` enables/disables a setting. Playground uses it.
- `Toggle` chooses one value from a set; simple examples include Plan/View.
- The Hangar's active ship changes immediately when a ship is selected. Merely
  defining tabs must not silently change this game behavior.
- Playground makes ships and parts outside scored-play rules available and
  disables scoring. Those items can remain outside the rules indefinitely;
  “in development” is the wrong explanation. Individual class/badge terminology
  is still open. Do not settle it incidentally in a tabs example.
- The Hangar now has one compact header: linked logo, one Hangar heading and
  Playground Switch. On does not add a header line.
- Its current sticky launch actions, including overlap with scrolling content,
  are intentionally retained. The launch row shows “Playground · Scoring off”
  while On. Further scrolling/layout policy is outside this work.

## Read only what is needed

1. `AGENTS.md` and `.agents/skills/shared-components/SKILL.md`.
2. `docs/design.md` and `docs/specs/factory/design-system/spec.md`, especially
   inputs, tokens, type, colour roles and interaction states.
3. `.agents/skills/design-study/SKILL.md` and
   `docs/specs/lab/design-studies/spec.md` for visual exploration and decision
   ownership; designer acceptance remains separate from functional checks.
4. `apps/web/src/components/inputs/Toggle.svelte`, `Switch.svelte`,
   `components/lab/LabInputs.svelte` and `/lab/inputs`.
5. `docs/specs/lab/spec.md`, `layouts/LabLayout.astro`,
   `components/lab/catalog.css`, and `data/lab-pages.ts`.
6. `docs/plans/2026-11-11-hangar-recovery-audit.md`, particularly HRA-04/05/11
   and the latest accepted header boundary. Older proposals there are historical.
7. Inspect `ShipBuilder.svelte` only to understand the motivating consumer;
   `docs/specs/game/hangar/spec.md` and `active-ship/spec.md` own its behavior.

Paths under `components`, `layouts` and `data` above are relative to
`apps/web/src/`. Plans can be stale: check current source and latest decisions.

## Scope and working approach

- Establish the distinction between tabs (associated panels) and value selection.
  Discuss the appropriate semantics and activation behavior before freezing an
  API. Consult current authoritative accessibility guidance; do not disguise a
  radio group with tab roles without the associated behavior.
- Develop the shared definition and a dedicated `/lab/tabs` reference page under
  the existing **Design system** group. Register the route in `lab-pages.ts` and
  use `LabLayout` and shared catalog styling. Follow the study workflow for
  exploration records where applicable; the reference page has a distinct role.
- Start with a small interactive example: a few labeled tabs and real associated
  fixture panels. Reuse the actual shared primitive in every example. Keep all
  state local; no game modes, saved player builds or leaderboard actions.
- Judge plain labels first. Explore supporting facts and unavailable states as
  explicit compositions, rather than accumulating arbitrary badges in each tab.
  A ship-flavored fixture may use real catalog names/data without choosing final
  Hangar content or writing player state.
- Use shared tokens and states. Resolve item alignment, spacing, height, active
  versus focused versus unavailable presentation, and constrained-width overflow.
  Decide how much content a tab may hold and when another pattern is preferable.
- Keep the example small enough to inspect and discuss. Bring concrete visuals
  back to the designer before treating a proposal as accepted. Avoid speculative
  variants and automatic agent/review loops unless the designer requests them.

The Lab is inspected at 1280px width and above. To exercise a narrower component
host, constrain an example container inside that supported Lab viewport. The
game's iPad requirement does not lower the Lab's viewport minimum.

## Done for this session

- A reviewable interactive `/lab/tabs` page, backed by shared code rather than a
  page-local visual imitation.
- The owning design-system entry explains when to use Tabs, Toggle or Switch;
  supported content, states, keyboard/focus/activation and overflow behavior are
  understandable from the example and contract.
- Relevant keyboard/pointer checks and visual inspection of the examples,
  including at 1280px Lab width. Verification is proportional to changed code;
  report functional checks, agent inspection and designer acceptance separately.
- A short handoff names the chosen pattern, remaining questions and implications
  for Hangar integration, without performing that integration.

## Boundaries and return

Do not modify Hangar composition, choose its final tab facts or badge copy,
change active-ship persistence, or change Playground/scoring/gameplay rules.
Do not redesign sticky actions or scrolling. Preserve concurrent checkout work;
no reset/revert of unrelated changes, new dependencies, push or publication.
Any change to existing Toggle consumers needs an explicit reason and regression
inspection; a new tabs pattern is not authority to migrate every consumer.

Return the reference URL, owning files, decisions and evidence to the Hangar
recovery conversation. There we will decide how the shared pattern applies to
this particular page and what each ship choice should communicate.
