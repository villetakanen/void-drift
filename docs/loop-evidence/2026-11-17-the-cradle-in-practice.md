# The Cradle in Practice

## Intent and decisions

On 17 November 2026 the designer asked to bring placeholder Earth, named "The
Cradle" in the HUD, into Practice and the Planet Inspector Lab tool. The
rock-atmospheres study (`rock-atmospheres-2026-11-15`) was to be read as
designer-led fantasy and its intent mapped onto the game. The plan is
[2026-11-17-the-cradle-in-practice.md](https://github.com/villetakanen/void-drift/blob/9e1e7a2e861ba43db58b536339421da586e3e928/docs/plans/2026-11-17-the-cradle-in-practice.md).

Decisions the designer stated in chat, 17 November 2026:

- Practice takes no damage: "practice cant, and wont take damage". Damage
  rates are out of scope.
- Ground and clouds are "two 2d images rotating _independently_", the clouds
  semi-translucent. The only render-model addition is allowing two surfaces,
  one semi-translucent.
- The study's light and shadow values are outdated; the current shared light
  applies.
- Rim and haze: yes. Air has drag.
- Air depth within 4–22u (first transcribed as "22-4u", then corrected to
  "air depth: 22u-4u"); clouds at 2/5 of the air depth, closer to the ground.
- The heat cue shows on air entry; "practice is god-mode, so damage is
  _ignored_. its still shown."
- No Lab tuning tool for the air now. Body numbers as recommended.
- Save point before the work: "commit all, tag the commit, then start this
  work".
- Mid-loop: an Inspector replica titled "Earth" with
  `output/imagegen/earth-2300-tryouts/earth-plate-b.png` as its ground.
- Mid-loop rotation change: "clouds faster, planet slower, and perhaps make
  both 1/3 slower?" Built as ground 93.9 s, clouds 46.95 s.
- Performance: measure it, then do options 1 (two-pixel turn steps) and 2
  (alternate-tick redraw of ground and clouds), "mark 1 in the code as an
  experiment".
- The Cradle's ground replaced by the post-war Earth plate; the designer named
  `earth-postwar/earth-postwar-plate.png` after the first file name given
  (`exec-a349384c-….png`) was not found in the repository.
- Option 1 removed: "visually the 2x at a time does not work".
- The air-sample spec wording fixed at the designer's "yeah, fix the spec".

## Delivered changes

Local commits on `main`, in order (save point tag
`save/2026-11-17-before-cradle` on `830d145f`):

- `e8800702` docs: render, planets, gravity-field, test-flight, FX, LFX and
  Planet Inspector specs for The Cradle, two-surface bodies and drag.
- `fce78034` feat: production planet maps in `apps/web/public/planets/` from
  `scripts/planet-maps.mjs`, with `provenance.json`; Mercury loads from there.
- `f5e7eb72` feat: The Cradle in Practice (ground, Cirrus clouds, haze, rim),
  atmosphere schema, drag in physics, air sample in the simulation, Inspector
  `cradle` and `earth` references.
- `ba76f2ac` perf: two-pixel turn steps (marked experiment) and alternate-tick
  ground/cloud redraws; render spec stagger sentence.
- `ef06750c` feat: The Cradle's ground from the post-war Earth plate.
- `dacffc78` revert: one-pixel turn steps restored; alternate ticks kept.
- `3c8c2eff` feat: atmospheric heat cue (FX band, LFX glow) in
  `packages/core/src/lib/effects/atmospheric-heat.ts`; FX spec Contract heading
  restored.
- `ee06a472` docs(specs): air sample described as schema-shaped, not parsed.

`f5e7eb72`, `ba76f2ac`, `ef06750c` and `3c8c2eff` also carry other sessions'
in-flight files (Plasma Projector study, Earth image folders), staged whole per
the commit-messages skill; their SVG formatting was fixed forward in this loop.
The commits between `e8800702` and `ba76f2ac` that convert studies to static
records are other sessions' work.

## Checks

All runs on macOS (Darwin 25.6.0), local checkout, 17 November 2026.

| Check                                               | Revision                           | Outcome                                                                          |
| --------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| `pnpm vitest run`                                   | tree committed as `ba76f2ac`       | 263 passed (reported in session before context compaction)                       |
| TypeScript check                                    | tree committed as `ba76f2ac`       | passed (reported in session before context compaction)                           |
| `pnpm vitest run`                                   | tree committed as `dacffc78`       | 263 passed                                                                       |
| `pnpm check:types` (astro check, svelte-check, tsc) | dirty tree committed as `3c8c2eff` | exit 0, 0 errors, 0 warnings                                                     |
| `pnpm vitest run`                                   | dirty tree committed as `3c8c2eff` | 268 passed                                                                       |
| lefthook biome + commitlint                         | each commit                        | passed after fixing other sessions' SVG format failures (`ef06750c`, `3c8c2eff`) |
| Type check / tests                                  | `ee06a472` (spec text only)        | not run                                                                          |

Browser checks were headless Chromium (Playwright) against the dev server at
`localhost:4321`, run outside the sandbox:

- Planet Inspector The Cradle and Earth at 1× and 8×, and Practice, after
  `ef06750c`'s map change: no page or console errors; map requests were the
  four `/planets/*.png` files.
- Heat cue, before `3c8c2eff`: a Practice simulation with the ship placed in
  The Cradle's air (skim: density ≈0.59, relative speed ≈134 u/s; deep:
  density ≈0.73, ≈242 u/s), layers composited with `screen` and `hard-light`
  but without the FX bloom filter; no errors.

Not checked: live play in a visible browser, keyboard and touch input, the
stock fallback when maps fail, Survival, Derelicts and Gauntlet by hand.

## Measurements

Headless Chromium 156, 14 cores, DPR 1; JavaScript draw time of the `planets`
pass. Harness: `artifacts/measurements/2026-11-17-cradle/measure.cjs` and
`redraw.cjs` (git-ignored).

| Case                                 | Before `ba76f2ac` | With `ba76f2ac` |
| ------------------------------------ | ----------------- | --------------- |
| The Cradle close, 4 px/u, mean       | 1.87 ms           | 0.99 ms         |
| Venus close, 4 px/u, mean            | 0.82 ms           | 0.41 ms         |
| Mercury close, 4 px/u, mean          | 0.46 ms           | 0.24 ms         |
| The Cradle, 8 px/u (Inspector), mean | 12.1 ms           | 6.2 ms          |

Before figures come from the session before context compaction; only the
`ba76f2ac` run is kept, in `results.json` (12:10). Per-redraw cost was reported
as depending on on-screen diameter (≈0.2 / 0.8 / 2.3 / 8.5 ms at 100 / 200 /
400 / 800 px). The configuration after `dacffc78` (one-pixel steps, alternate
ticks kept) was not measured.

## Publication

- Local commits only. `main` is 18 commits ahead of `origin/main` at
  `ee06a472`, including other sessions' commits.
- Not pushed, not deployed, no live verification.

## Human feedback

- "it looks superb" — The Cradle and Earth after the rotation change, before
  the performance work.
- "visually the 2x at a time does not work" — two-pixel turn steps; led to
  `dacffc78`.
- "it still looks good on practice, though?" — after the revert; phrased as a
  question or remark about Practice, not further detailed.
- No feedback recorded on the heat cue or the post-war ground in play.

## Findings

- The Cirrus cloud cover was observed as heavy in Inspector stills; it hides
  much of the ground. Not changed.
- The heat band in stills: strongest on the planet side, faint arc on the far
  side, glow on the planet-facing hull. Appearance with bloom in play unknown.
- Heat cue brightness is new (a strength curve with a density floor), not the
  study's accepted 180% brightness; the study's 150% width was carried over.
- The post-war plate's generator notes say its wrap seam was not validated.
- `cradle-ground.png` grew from about 140 KB to about 710 KB.
- The FX spec's Contract heading had been lost in `e8800702` and was restored
  in `3c8c2eff`.

## Evidence gaps

- Headless screenshots and harness scripts lived in the session scratchpad
  (`/private/tmp/claude-503/…/scratchpad/`), temporary and not retained.
- Measurement artifacts are git-ignored under `artifacts/measurements/`; the
  pre-change run was overwritten.
- Pre-compaction check results are the session's own report, not re-inspected
  logs.
- The file `exec-a349384c-2f54-4a2a-a64a-78ce3a6a03ed.png` was never located.
