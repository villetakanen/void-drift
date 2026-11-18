# World layer

The World canvas holds opaque scene content and the World HUD. It is cleared and
redrawn each frame from current simulation state. World uses normal CSS blending
and no filter in production. It is the bottom canvas in the isolated flight
stage; solid objects never sit above FX or LFX.

The void clear covers the full stage. World passes use world coordinates under
the camera except the clear, which uses stage coordinates. Derelict aperture
fills are drawn here so the later FX aperture cut can reveal World.

## Contract

- Immediate: no image survives a frame.
- Drawing World never reads or changes presentation history.
- The stage's isolated blend group keeps content behind the stage out of the
  layer composition.
- Planet orbits, gravity boundaries and names are drawn by the shared
  screen-space `world-hud` pass before the planets pass draws any body. The
  star's field rings and designation remain in the world-space `sun-fields`
  pass. World HUD lines remain 1 CSS px and text remains 14 CSS px as the camera
  zooms; each pass derives its scale from the displayed canvas and current
  transform once.
- A plasma rifle’s illuminated channels are part of the fitted weapon artwork.
  Draw their current charge colour in the mount’s World draw order so plating
  in front of the rifle covers the channels. The charge indication follows
  the fitting and leaves no image history. [Plasma rifle](../plasma-rifle/spec.md)
