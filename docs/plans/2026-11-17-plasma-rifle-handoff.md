# Plasma rifle: physical reference and charged-LFX prototype

17 November 2026. Accepted output of the plasma fitting study after 02.29 was
judged good enough. This handoff supplies hardware to `plasma-projector-2026-11-16`;
it does not implement weapon behaviour or approve final LFX.

## Authoritative artifacts

All paths below are in
`apps/web/public/studies/plasma-projector-fitting-2026-11-17/`:

- `050-plasma-rifle-source.svg`: original supplied Inkscape document, unchanged.
- `050-plasma-rifle-pair.png`: supplied screenshot identifying the charged
  prototype at left and final unlit rifle at right.
- `050-plasma-rifle.svg`: isolated final unlit/right assembly.
- `050-plasma-rifle-charged-prototype.svg`: isolated charged/left assembly,
  including its World artwork and three hard-light gradients.

The exports preserve source geometry and paint order; only an outer translation
aligns each assembly to a common frame. There is no newly drawn or scaled part.
No 80% or 120% housing variant was selected. The final supplied unlit drawing
is the physical reference, rather than a switch setting or earlier proposal.

## Frames, dimensions and mouths

Both isolated SVGs use nose-up source coordinates with attachment at (0, 0),
+x right and +y aft. Their viewBox is `-8 -26 16 40`; that is framing, not the
weapon bounds. The provisional attachment is the receiver-centred anchor used
for the 02.29 comparison, translated to the new source copies. In the original
document it is (118.95351, 98.1683415) for the unlit drawing and
(103.54513, 98.1683415) for the charged prototype. The source contains no explicit
mount mark: confirm this anchor before production adoption.

The comparison uses the cannon’s source-to-world conversion,
`16 / 19.501797` world units per source unit. Convert a nose-up point (x, y)
to ship-local (forward, across) as `(-y × scale, x × scale)`. The existing 0.65
build/flight convention is applied by the renderer, not a second resizing of
the master. The artwork’s measured envelope is approximately 14.31585 source
units wide × 34.41998 long, or 11.745 wide × 28.239 long world units. These
are measured drawing extents, not mass, collision or reach decisions.

| Reference          | Nose-up source offset: right, aft | Ship-local world offset: forward, across |
| ------------------ | --------------------------------- | ---------------------------------------- |
| Attachment         | 0.00000, 0.00000                  | 0.00000, 0.00000                         |
| Primary mouth      | 0.00000, -23.31042                | 19.12474, 0.00000                        |
| Left outlet mouth  | -4.93795, -8.57817                | 7.03785, -4.05128                        |
| Right outlet mouth | 4.88341, -8.57817                 | 7.03785, 4.00653                         |

The primary mouth is the midpoint between the forward blade tips. The paired
outlet mouths are the midpoints between each pair of rail tips; their source
groups are `g16-1` and `g16-5-1` in the charged drawing. These are derived
geometric references for the next fixture, not settled FX offsets or thrust
vectors. Slight source asymmetry is retained. Source-to-world conversion and the
provisional attachment must stay shared when the reference is consumed.

## Charged prototype boundary

Three hard-light gradients show luminous material in the central channel and
paired side outlets. The source IDs are `rect2-6-3-3-8-3`,
`rect2-6-3-3-8-9-0` and `rect2-6-3-3-8-9-7-0`. The composite retains the source
ordering that lets World shapes cover parts of those rectangles. It is not a
ready-to-use isolated LFX stamp: layer separation, masking and ship/hull
occlusion need resolving in the effects study. Its static charged appearance
does not establish a time curve, brightness on the production blend stack,
release plume, residue, residual thrust, recoil or damage.

The unlit drawing has no hard-light rectangles. Its small orange marker is
part of the authored World artwork. The 02.29 fitting comparison also has no
simulated LFX and is preserved in five static captures on the fitting study.

## Integration boundary

A possible near-term integration is a decorative, unsanctioned Playground rifle
with a positive mass still to be selected. Ordinary fitted mass would affect
ship statistics. The item would not target, charge, fire, consume energy, damage,
push or emit LFX. The current `plasma` catalog ID denotes the engine and cannot
be reused. Parts, Playground and Hangar contracts and the Zod catalog would need
project decisions before such an integration. No production code or living
spec changes are made by this handoff.

The receiving effects study retains its own unresolved action and physics
inquiries. Providing the physical reference removes the missing-artwork blocker;
this update documents the handoff without resuming its experiment.
