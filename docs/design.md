# Experience design

What playing Void Drift should feel and look like, and how the game presents itself.
It follows from the game's vision in `docs/vision.md`.

Read it when starting new design work: a design study, the look or feel of a new
feature, or a choice between options that conflict. It is not needed for development,
QA or planning. Exact values, component rules and behaviour belong in feature specs,
preferably in code: see [where details live](#where-details-live).

The owner decides what this document says. A design study proposes a change to it only
in its part 04 (scope), flagged prominently; nothing else changes it.

## Intent

A minimal, high-contrast neon space game with readable motion, satisfying inertia and
short, challenging survival runs. Three ships are understandable choices. Feel and
fidelity are judged by people playing; automated checks only establish that things work.

## Principles

- **Readable over realistic.** Favour responsive control, readable trails and measured
  impact feedback over physical realism. Motion aims for a steady 60 FPS.
- **Every control answers.** Controls drive the real game and show that they are active.
  Controls and instructions stay consistent with each other.
- **Keyboard first, the phone kept.** Laptop and desktop keyboard play is the primary
  experience; landscape phone play with two simultaneous touch controls stays.
  This is about play: the Lab targets screens 1280px wide and up ([development](development.md#visual-review-and-experience)).
- **Ships are characters.** A player identifies each ship at a glance and feels
  something about it before flying it (see [ship drawing](#ship-drawing-fundamentals)).

## Non-goals

- Shooting, or more buttons, without an agreed gameplay requirement.
- Player flight tuning. Players choose a ship; flight is tuned in the Lab.

## Camera and arena

The reference is the owner's Star Control 2: automatic framing and zoom together with
arena edge wrapping. Zoom jumps deliberately invite the player to reorient; effects in
the world stay attached to the scene through a jump.

## Art direction

High-contrast neon on the void. Hull planes use procedural flat fills; approved cockpit glass uses gradients and crisp reflections (see [cockpit materials](specs/cockpit-materials.md)). No
external image or audio assets unless there is no other way.

### Ship drawing fundamentals

Every ship poses a character. A player must identify it at a glance and feel
something about it before flying it: the Scout is an angry little firefly, the
Corvette overwhelming power, the Wasp a slim, fast trainer that is mostly
engine. The faux-3D low-poly drawing is the means. Use this order whenever a chassis
is drawn or studied.

1. **Character before geometry.** Write the ship's character in one sentence and name
   the one or two features that carry it: a stance, a silhouette move, a part the
   ship is built around. Everything else is restraint.
2. **Build it as an object.** A ship is a few solid parts: body, wings or blades,
   canopy, and whatever it is built around, such as an engine or a bridge. Give each
   part a shape in three dimensions before drawing anything. The top-down drawing is
   that object seen from above; a sketch's outer line is its projected silhouette and
   the interior lines are the object's real edges, not folds in a flat sheet.
3. **Planes from edges.** Each part becomes a few flat planes meeting at the object's
   edges: ridges, chines, wing roots. Light comes from the ship's left and above.
   Planes facing it take the light tones of the shared palette, planes falling away
   take the dark ones, and the highest ridge carries the brightest strip. Hull planes use flat fills only: no gradients, outlines or textures. Approved
   cockpit materials are the scoped exception.
4. **As few planes as carry the character.** Six to twelve is typical. Remove any
   plane the silhouette and the light can do without. Wings are thin; only the body
   has height. A bulky result means body has leaked into the wings.
5. **Canopy and fittings are their own objects.** The canopy is compact and marks the front and the scale. Approved manufacturer
   glass uses the [cockpit material language](specs/cockpit-materials.md); other
   canopies remain black. Slots, engines and weapons sit on the chassis;
   keep the areas under them calm.
6. **Check at both scales.** Enlarged in the builder and at the 0.65 flight scale,
   where a small ship is under 30 pixels long. A detail that reads only when enlarged
   is not part of the ship.
7. **Judge character, not rendering.** A body that renders correctly can still pose
   no one. The owner judges whether the ship is identifiable and has its feeling;
   automated checks only establish that it draws.

## Brand

- **The mark.** ∅·Δ reads "void · drift" and is the only brand mark; there is no
  wordmark.
- **Lime has two jobs.** It is the brand, and it marks what you can act on and what is
  selected. Information (eyebrows, tags, descriptions, values) is never lime. Name the
  job, not the colour.
- **Tone of voice.** Not yet decided.

## Where details live

- Tokens, type, colour roles, elevation, inputs, buttons, identity:
  [design system core](specs/design-system-core.md).
- Flight, controls, camera and the Flight Lab: [playable alpha](specs/playable-alpha.md).
- Player assembly and flight handoff: [Hangar](specs/hangar/spec.md).
- Recorded ship, engine and artwork decisions: [ship-builder history](history/ship-builder.md).
- The Lab instrument: [lab instrument](specs/lab-instrument.md).
- Lab practice and visual evidence: [development](development.md).
- How design studies run and end: [design studies](specs/design-studies.md).
