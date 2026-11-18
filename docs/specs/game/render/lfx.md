# LFX layer

LFX holds fresh light redrawn each frame, above World and accumulated FX. It
defaults to CSS `hard-light` with no filter in production and the Lab. It
contains no image history. Plasma engines show their current charge as live
light at the outlet, with a faint trace emitted into FX. Ion cannon and
point-defence beams occupy this layer for their active 80 ms window; dispersed
light is separately emitted into FX. A ship in a planet's air carries the
[atmospheric heat](fx.md#atmospheric-heat) glow on its planet-facing side.

A [world body's](spec.md#world-bodies) light and dark side is also drawn here, as
one stamp per body through the shared `body-light` pass. It is the first thing
drawn on the layer, and its dark half may darken World and FX beneath it.

Bodies sharing incoming-light intensity, shadow intensity and incident-light
temperature share one prepared stamp. Its pixels are independent of star
direction; the Canvas transform turns it toward the star. The production default
is incoming intensity 1.35, shadow intensity 1.35 and neutral-reference temperature
5800 K. Incoming intensity affects only bright-side values above 0.5, shadow
intensity affects only dark-side values below 0.5, and temperature tints only
the bright side without lowering any channel below 0.5. The display mapping is
an approximation, not colorimetry or a stellar spectrum. Parameter tuples are
prepared before drawing and retained only while they have active users,
alongside the shared production default.

## Contract

- Memory is immediate: clear and redraw from current game state each frame.
- Pause redraws the same active light without adding persistent brightness.
- Reset/new simulation clears events and makes the layer fresh.
- LFX is composited inside the isolated stage, above FX and below Deck controls.
- World body stamps are drawn before every other mark on the layer.
- The shared `body-light` pass draws all prepared body appearances before other
  LFX passes; an appearance that draws light supplies inclusive world-coordinate
  bounds for the complete light composition.
- Drawing a body stamp never prepares or rebuilds pixel data.
- Changing a prepared body-light parameter does not advance simulation or orbit.

A funded plasma discharge shows a brief connected hot streak from muzzle to endpoint, followed by the live eruption core. Both follow simulation time. The freshest target-loss fumes carry short hot marks on the two outlet axes. Their positions follow the emitted fumes in world space. [Plasma rifle](../plasma-rifle/spec.md)
