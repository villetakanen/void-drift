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
