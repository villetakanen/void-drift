# FX layer

FX holds accumulated light history in a persistent, full-stage-resolution
surface. It defaults to CSS `screen` with the shared static seeded Turbulent
bloom presentation (12 CSS px glow, 16 CSS px distortion, 90% strength). Screen
keeps black neutral over World; bloom preserves the source and screens an
attenuated displaced and blurred copy. The browser filter changes presentation
only; it does not alter the held canvas image, source marks or presentation
clock. An explicit layer filter override, including `none`, replaces the default.
For each elapsed timestep the surface first fades the whole held image with a
translucent black source-over fill, then adds fresh stamps. Its
current half-life is 0.1 seconds. Fading and emission happen only when game time
advances; empty or paused intervals preserve the image exactly.

History remains at its painted world position through camera changes. Camera
reprojection may use a bounded reusable spare buffer. Reprojection must preserve
the full image domain, including newly exposed edges, and may not translate,
erase, or join history incorrectly. Arena wrap starts fresh emission at the new
position. Reset and explicit seek/replay lifecycle changes may clear history.
There are no age windows, quiet-time clears, alpha thresholds, or other periodic
cleanup. 8-bit rounding may leave faint near-black residue or eventually settle
at the darkest representable value; that is allowed and must not disappear in a
cleanup pop.

The aperture-cut pass deliberately removes light over derelict openings after
the FX surface is composited into its canvas. It is a geometric reveal rule, not
history cleanup.

## Contract

- Memory is persistent and owned by the FX presentation surface, never the
  simulation.
- Equal elapsed game time gives equivalent decay within raster precision.
- Pause does not add light or fade it; reset clears the full history.
- Fresh source stamps have priority over secondary decoration under the shared
  scene budget.
- The FX CSS blend remains screen by default in play and Lab.
- Production play, the Render Model workbench and the render performance bench
  use the same reusable Turbulent bloom filter definition and defaults. The
  workbench may tune its values or select another filter for comparison.
