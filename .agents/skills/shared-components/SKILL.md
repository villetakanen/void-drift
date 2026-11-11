---
name: shared-components
description: Build or change interfaces and game visuals through shared primitives and composed components. Use for Lab and production UI, controls, ship views, slots, and other reusable visual or interactive parts.
---

# Shared components

Screens compose shared parts. Put a part’s appearance and behavior in its owner,
not in whichever screen first needs the change.

## Establish ownership

- Read the relevant feature spec, docs/design.md and current design-system rules.
- Start from the design-system overview at `/lab/ds` (the Design system group in
  `apps/web/src/data/lab-pages.ts`): each shared part with its page, files and
  contract section. A part missing there is flagged, not built in place.
- Inspect existing implementations and their canonical Lab examples.
- Search both Lab and production consumers before creating or changing a part.
- Identify the owning layer:
  - Design-system primitives: controls, typography, surfaces and interaction states.
  - Game primitives: ships, slots, fittings, effects and procedural rendering.
  - Composed instruments: explorers, editors and inspectors.
  - Screens: arrangement, supplied data, state and workflow wiring.
- Resolve conflicting contracts explicitly; do not silently invent a convention.

## Reuse, extend or extract

- Reuse a suitable shared definition before implementing another.
- Extend it when the request changes the same concept across consumers.
- Extract a shared owner when equivalent implementations already exist, or when
  geometry, rendering or interaction must remain consistent across contexts.
- Do not wait for repeated copies before recognizing shared ownership.
- Keep abstraction proportional: page wiring and layout need not become components.
- Express intentional differences through supported variants.
- Keep consumer code off private implementation details.
- Align consumers to the design system; changing the system is a separate decision.
- If extraction exceeds the requested scope, explain the boundary and proposed slice.

## Preserve the contract

- Before replacing a component, identify its information, states and interactions.
- Preserve supporting facts, accessibility, persistence and input behavior.
- Distinguish placement, containment, elevation and layer order in visual requests.
- Keep drawing, framing and hit targets on the same geometry and transforms.
- Authoring controls change values only through deliberate edits.
- Opening, selecting, resizing or changing views must preserve exported values.
- Show baseline-to-proposal differences before applying authored data to production.

## Verify the composition

- Check affected shared behavior and its relevant production and Lab consumers.
- Inspect the actual rendered page, meaningful states and responsive layouts.
- Verify intentional variants, not just the screen where the change began.
- Demonstrate shared-definition changes in the canonical Lab example.
- Update the owning contract; keep historical evidence separate from current rules.
- Report behavioral checks, visual inspection and the designer's acceptance separately.
- Leave ordinary design iteration open; passing tests do not establish visual fidelity.
