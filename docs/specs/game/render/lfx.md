# LFX layer

LFX holds fresh light redrawn each frame, above World and accumulated FX. It
defaults to CSS `hard-light` in production and the Lab. It contains no image
history and has no filter in production. Current ion cannon and point-defence
beams occupy this layer for their active 80 ms window; dispersed light is
separately emitted into FX.

## Contract

- Memory is immediate: clear and redraw from current game state each frame.
- Pause redraws the same active flash without adding persistent brightness.
- Reset/new simulation clears events and makes the layer fresh.
- LFX is composited inside the isolated stage, above FX and below Deck controls.
