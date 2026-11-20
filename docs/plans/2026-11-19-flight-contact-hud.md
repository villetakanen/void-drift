# Bring the contact HUD into flight

The [accepted Offscreen contacts study](../../apps/web/src/pages/lab/studies/offscreen-information-2026-11-19.mdx) supplies the [02.6 visual settings](../../apps/web/public/studies/offscreen-information-2026-11-19/026-selected-configuration.json). Its motion capture exercised a rectangular visibility test. For play, use the circle on which the arrows sit.

## When a contact gets an arrow

Centre the invisible circle in the active box between the deck gutters. In CSS pixels its radius is half the shorter active-box dimension minus 22. Project each live target centre through the current camera and convert it to stage-local CSS pixels. Show the complete cue when its squared distance from the circle centre is greater than or equal to the squared radius. Hide it strictly inside. A visible pirate crossing a corner of the active box keeps its arrow. The arrow sits on the circle along the bearing from circle centre to target.

Apply this to living Gauntlet pirates, the Sun, intact wrecks and released free energy cells wherever each occurs in play. Drop a cue when its contact leaves the live roster. Use direct player-to-contact world distance for the clamped arc length, independent of camera framing and zoom. Preserve the study’s triangle, inward category glyph, palette, opacity and arc proportions.

## Use the browser as the drawing engine

[FlightDeck](../../apps/web/src/components/FlightDeck.svelte) already projects opponents in its frame sync and draws purple triangles as page elements. Replace those elements with one absolutely positioned inline SVG between the game field and deck controls, with pointer events disabled. A CSS triangle alone handles bearing easily. SVG also gives us native curved strokes and reusable glyphs in the same coordinate system.

Define the geometry once. Rotate a keyed group for each eligible contact around the circle centre. Use a short dash on a circular stroke for the distance arc, centring the dash on the bearing as its length changes. Use CSS tokens for ink and opacity. Update geometry from the existing frame and resize paths. The browser rasterises and composites the marks above the field. World, FX and LFX keep their existing passes.

This looks feasible with a small contact roster. The per-frame work is one projection and radius check per candidate, then attribute updates and browser paint for the visible cues. SVG transforms and dash changes can incur paint. Frame cost on iPad remains unmeasured. Coincident bearings also overlap under the selected geometry.

## Delivery order

1. Settle contact scope and overlay ownership in the render, game-screen and Gauntlet contracts before implementation. Use the accepted visual settings as reference.
2. Extract a read-only contact projection shared by play and the Lab. Replace the existing pirate cue first. Check immediately inside, exactly on and immediately outside the circle, including an on-screen corner. Repeat under resize and both camera modes.
3. Add the Sun, intact wrecks and free cells from the live simulation. Check removal on destruction, collection and system exit, and preserve keyboard and touch controls.
4. Compare the same busy flight with the HUD enabled and disabled on desktop and landscape iPad. Inspect frame time and paint while bearings and distance arcs move. Include several cells and closely aligned contacts to distinguish paint cost from legibility.
