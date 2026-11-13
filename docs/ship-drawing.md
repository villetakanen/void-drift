# Ship drawing

The construction guide for Void Drift's ship artwork. Overall experience and
art direction live in [Design](design.md); this guide applies that direction to
the planar hull language. Natural bodies and effects have their own drawing
languages.

## Character and construction

Every ship poses a character. A player must identify it at a glance and feel
something about it before flying it: the Scout is an angry little firefly, the
Corvette overwhelming power, the Wasp a slim, fast trainer that is mostly
engine. The faux-3D low-poly drawing is the means. Use this order whenever a
chassis is drawn or studied.

1. **Character before geometry.** Write the ship's character in one sentence and
   name the one or two features that carry it: a stance, a silhouette move, a
   part the ship is built around. Everything else is restraint.
2. **Build it as an object.** A ship is a few solid parts: body, wings or blades,
   canopy, and whatever it is built around, such as an engine or a bridge. Give
   each part a shape in three dimensions before drawing anything. The top-down
   drawing is that object seen from above; a sketch's outer line is its
   projected silhouette and the interior lines are the object's real edges,
   not folds in a flat sheet.
3. **Planes from edges.** Each part becomes a few flat planes meeting at the
   object's edges: ridges, chines, wing roots. Light comes from the ship's left
   and above. Planes facing it take the light tones of the shared palette,
   planes falling away take the dark ones, and the highest ridge carries the
   brightest strip. Hull planes use flat fills only: no gradients, outlines or
   textures. Approved cockpit materials are the scoped exception.
4. **As few planes as carry the character.** Six to twelve is typical. Remove
   any plane the silhouette and the light can do without. Wings are thin; only
   the body has height. A bulky result means body has leaked into the wings.
5. **Canopy and fittings are their own objects.** The canopy is compact and marks
   the front and the scale. Approved manufacturer glass uses the
   [cockpit material language](specs/factory/cockpit-materials/spec.md); other
   canopies remain black. Slots, engines and weapons sit on the chassis; keep
   the areas under them calm.
6. **Check at both scales.** Enlarged in the builder and at the 0.65 flight
   scale, where a small ship is under 30 pixels long. A detail that reads only
   when enlarged is not part of the ship.
7. **Judge character, not rendering.** A body that renders correctly can still
   pose no one. The design study decides whether the ship is identifiable and
   has its feeling; automated checks only establish that it draws.
