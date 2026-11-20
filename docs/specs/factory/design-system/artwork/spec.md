---

title: "Spec: Ship part artwork"
status: draft
generated:
  by: "openai/gpt-6.1-sol"
  at: "2026-11-20T19:09:25Z"
verified:
- by: "openai-codex/gpt-6.1-sol"
  at: "2026-11-19T12:33:38+02:00"

---

# Spec: Ship part artwork

## Blueprint

### Context

The Parts page at `/lab/ds/parts` owns the shared part-design guidance;
family pages expose procedural artwork and its source masters to designers.

### Architecture

The Plasma rifle's canonical example is `/lab/ds/weapons`: it compares the
unlit SVG master with its derived Canvas paths, shared catalog drawing and
production hull fittings. `scripts/plasma-rifle-art-from-svg.mjs` derives paths,
transforms and conservative bounds from the master; `--check` verifies parity.
The charged study prototype is not production artwork.

Ship parts, the engines, weapons and support parts a player fits, are game art
drawn procedurally on canvas. [Parts](../../../game/parts/spec.md) requires each
new part's art to have an SVG master, technical artefacts converted from it and
a design-system page. This section says where those pages live and defines the
marks that ship part art shares. `/lab/ds/parts` presents these shared aesthetic
principles and links to the family examples; it is not a study or a gameplay
status inspector.

#### Pages

- Ship part art is shown by family, one page per family at `/lab/ds/<family>`:
  `/lab/ds/engines` for engines and `/lab/ds/weapons` for weapons. Each page lists its parts from the catalog.
- For each part with a master, the page shows the SVG master beside canvas
  renderings of its technical artefacts: every pose, the part on a ship, and
  for an engine its plume at full output. Parts without a master are listed
  as having none.
- The pages are part of the Design system group in
  `apps/web/src/data/lab-pages.ts` and follow its rules: each names its files
  and this section.

#### Testing-only marking

“Testing only” is fictional prose expressed through optional decorative art.
It suggests a machine's character, not an actual testing state. A designer may
include the marking in a part's master; the shared artwork then carries it
through its poses and Hangar card. It has no gameplay, ranked, ruleset or
sanctioning semantics and imposes no requirement that a part be used for testing.

- Parallel lines at 45° to the part's axis, rising to the right when the part
  is drawn nose up, in `COLOR.brand`.
- The gap between lines is twice the line width.
- The lines cover the outer half of one side of the part's body, from half its
  width to its edge, clipped to the body. Additions such as rails or mounts,
  and the nozzle, stay bare.
- The line width is set per part in its master, in the part's own units.
- In flight the marking is drawn from a cached stamp, not stroked line by line
  each frame.

### Constraints

- Each family page lists parts from the shared catalog.
- Master-derived artifacts stay consistent with their SVG source.
- Testing-only markings are optional aesthetic extras, not part status or gameplay rules.

## Contract

### Definition of Done

- Family pages show each available SVG master beside its rendered poses and fittings.
- Engines include a full-output plume example.
- Missing masters are identified explicitly.
- `/lab/ds/parts` explains the optional, purely aesthetic marking and links to family examples.
- When included in artwork, the marking follows the shared geometry and uses a cached flight stamp.

### Regression guardrails

- A marking conveys fictional character only; it creates no testing requirement or gameplay consequence.
- Production drawings consume shared artifacts rather than study-local artwork.

### Scenarios

```gherkin
Scenario: Inspect a mastered part
  Given a catalog part with an SVG master
  When I open its canonical family page
  Then I can compare the master, rendered poses and production fitting

Scenario: Read the part-design guidance
  Given I open the Parts design-system page
  When I read about the testing-only marking
  Then it is described as optional fictional decoration
  And it implies no required testing state or gameplay, ranked, ruleset or sanctioning meaning

Scenario: Inspect optional decorative artwork
  Given a part's master includes the testing-only marking
  When I compare its master and rendered poses on the family page
  Then the marking follows the shared geometry within the part's body
```
