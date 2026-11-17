> Superseded on 16 November 2026 by the accepted study’s closure and production scope:
> `/lab/studies/rock-atmospheres-2026-11-15#04`. Impact/Cirrus is selected as
> placeholder Earth for Practice, with soft planet-facing LFX, curved-band FX
> at 180% brightness / 150% width, 1 hull/s in the outer 30% of atmosphere,
> 2 hull/s deeper, and small direction-preserving deceleration. Production
> installation remains pending; Earth exploration is deferred. The continuation
> instructions below preserve the earlier 02.4 handoff and are no longer current.

# Continue the rock-atmosphere study at 02.4

Work in `/Users/ville.takanen/dev/void-drift`. Use `design-study` and
`flight-scene-study`; use shared-components and FX guidance where needed.
Continue the existing study, not a fresh cycle:
`apps/web/src/pages/lab/studies/rock-atmospheres-2026-11-15.astro`.
Review URL: `http://127.0.0.1:4321/lab/studies/rock-atmospheres-2026-11-15#02-3`.
Start the local server if needed.

The question is how an atmosphere can make the existing rotating rock worlds
more appealing and create a readable, engaging interaction during flight.
Preserve Mercury's three composed imagegen-derived rock materials and rotation.
Surface redesign, Earth-like geography, habitation and a broader planet taxonomy
are outside scope.

## Established direction

- 02.1 was a successful, usable step. The actual Flight scene instrument gives
  standard game look and feel with a real Wasp and predictable scenarios.
- Studies use that shared instrument: B1–B3 burns, timeline, views and options in
  its burger pane. Never add manual piloting or a custom flight loop.
- The shared pane is now the smaller golden-ratio share of its containing CSS
  container: about 38.1966%, not a fraction of the viewport or logical canvas.
- 02.2 found shadow up to 1.45× works for bare rock and the initial atmosphere
  without making the planet feel plastic or rendered. Impact is the default
  material; 1.45× remains the agreed shadow baseline. Keep the slider available.
- 02.3 compares Limb haze, Thin veil and Layered air. No treatment is selected
  as the outcome. It is a good, useful round; preserve its findings.

## Latest findings and next question

1. There may be room for shadow around 1.75×, but this is tentative. Keep 1.45×.
2. It is hard to identify where atmosphere starts without a visible boundary.
   Explore a thin upper layer or other ways to make its extent readable.
3. Cloudless gas feels very thin. It looks cool but may not be right for the game.
   Compare ways to give the atmosphere substance, including clouds, without
   concealing or redesigning the existing rock.

Develop 02.4 as a small comparison of distinct visual approaches addressing
boundary readability and atmospheric substance. These findings invite experiments;
they do not select a hard ring, clouds or a final appearance. Keep the current
baseline available for comparison. Hold depth, drag and flight conditions fixed.
Judge approach, entry and exit beside the ship at flight scale; use Follow 4×
to explain construction, then return to Follow.

Move the live instrument to 02.4. Preserve 02.3's useful conclusions and suitable
captures first; label new reconstructions rather than presenting them as earlier
observations. Keep 02.3 and 02.4 visible, collapse older retained rounds, and avoid
retaining duplicate live instruments without a named comparison purpose.

## Implementation and verification

Read current files before editing:
- `apps/web/src/components/studies/rock-atmospheres/`: wrapper, fixture and painters.
- `apps/web/src/lib/flight-scene/`: shared staging and replay.
- `docs/specs/lab/flight-scene-instrument/spec.md`.
- Project vision and design principles.

The shared fixture uses a Venus-sized body (r40.33u), 10u radial air depth and
provisional drag 0.8/s at full density. The original rock turns every 31.3s.
The ship starts 82u left and 100u above the planet. All three burns enter and exit
the air without solid contact; B1 opens inside it at 0.5s. Entry starts around
0.37s; B1/B2 leave by 0.55s, B3 by 0.58s. Do not widen the atmosphere to manufacture
entry. Verify event activation after any relevant setup change; mere final-state
inequality can be floating-point noise. Use the actual shared fixture in checks.

Validate option changes at the same burn/time, pause and backward seek, and
unchanged flight across visual alternatives. Inspect at 1280px or wider, never
below. Recent build, replay and browser checks passed; broader type checks had
unrelated existing errors in older Mercury components and the Practice preview.
Report current results honestly. Leave unrelated working-tree changes alone.

Do not read or reuse either failed Earth-like study (`earth-2026-11-14` or
`inhabited-worlds-2026-11-15`) or its reviews, evidence, references or sketches.
Leave those artifacts intact. This handoff does not close the study or authorize
production rollout, commits, publication or deployment.
