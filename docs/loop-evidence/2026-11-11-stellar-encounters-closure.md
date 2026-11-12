# Stellar encounters — stopped study

Closed: 11 November 2026. End state: **stopped**. Designer assessment:
**failed to answer the intended design question**. The user explicitly requested
closure after discussing the mismatch. Recording and ending the work does not
reclassify the study's design quality as successful.

## Intent and observed direction

The intended inquiry was distinct stellar characters grounded in science and
readable at arcade scale: different opportunities and dangers communicated through
colour, surface behaviour and aura. The established standard Sun was the reference;
system travel was an adjacent future possibility.

The delivered exploration compared a standard Sun, a quiet orange dwarf and a cool
giant through field geometry, local resource rates and analytical motion. It then
drafted readiness and implementation scope for that narrower direction.

Human feedback from this chat, in order:

- The designer accepted spatial variation as one interesting ingredient. The
  dwarf's compact collection space could demand careful manoeuvring under gravity;
  the giant's broad field could support staying and fighting.
- The designer questioned the incremental value of the second experiment, while
  describing the presentation as useful and the apparent compatibility as a possible
  finding. That observation was not a verified balance result.
- After the readiness/scope draft, the designer said this was “not the expected
  result of this study” and requested discussion before deciding whether to stop.
- The clarified intent included examples such as a white giant, a blue dwarf and
  a violent star where harvesting necessarily causes damage, with recognition
  through colour, aura and surface behaviour. These were prompts, not accepted
  scientific classifications or chosen mechanics.
- The designer described the unwanted narrowing as “not just three different
  sizes of sun”. The assistant acknowledged treating acceptance of one spatial
  ingredient as a broader answer and advancing into delivery scope prematurely.
- Following a proposal to retain the failed exploration honestly and close it,
  the user instructed: “close loop”.

These interpretations are attributed conversational judgments, not independently
established causes or generalized factory lessons.

## Retained outputs and decisions

- [Closed study page](../../apps/web/src/pages/lab/studies/stellar-encounters-2026-11-11.astro),
  at `/lab/studies/stellar-encounters-2026-11-11`.
- [Historical question test](../../apps/web/src/pages/lab/reviews/stellar-encounters-2026-11-11.astro):
  One subject Pass, Grounded Pass with findings, Consequence Pass. The corrected
  opening was not retested. These stamps do not override the designer's assessment.
- [Original 02.1 capture](../../apps/web/public/studies/stellar-encounters-2026-11-11/021-fields-160.png)
  and [field report](../../apps/web/public/studies/stellar-encounters-2026-11-11/021-reference.json).
  Closure copied the existing ignored artifacts into versioned study assets;
  no historical experiment was rerun to obtain them.
- [02.2 configuration and results](../../apps/web/public/studies/stellar-encounters-2026-11-11/022-reference.json),
  plus original [dwarf](../../apps/web/public/studies/stellar-encounters-2026-11-11/022-dwarf.png),
  [standard Sun](../../apps/web/public/studies/stellar-encounters-2026-11-11/022-sun.png)
  and [giant](../../apps/web/public/studies/stellar-encounters-2026-11-11/022-giant.png)
  captures. Conditions, provenance and limitations are captioned on the closed page.

Only the limited value of spatial variation is retained as an accepted design
judgment. The roster, exact fields, appearance and activity mappings, proposed
dwarf/giant mass ratios of 0.7/1.0, and delivery scope were **not accepted**.
No gameplay implementation is authorized by the abandoned scope.

The separate
[Stellar characters study](../../apps/web/src/pages/lab/studies/stellar-characters-2026-11-11.astro)
already exists and was not edited by this closure. This record does not prescribe
its outcome or promote this cycle's proposals into its requirements.

## Observations and limits

The local field example at 160 u, with 0.8 E/s coasting consumption, showed
1.05 E/s gross collection and zero exposure for the dwarf, versus 11.17 E/s and
2.10 hull/s for the giant. It had no gravitational motion or resource feedback.

The motion reference used the same production mass, cutoff and falloff for all
three candidates. Radiation-free collection spans that pay for full forward
thrust were approximately 38 u wide for the dwarf, 152 u for the Sun and 241 u
for the giant; about 147 u of the giant's span lay beyond gravity's cutoff.
These are radial spans, not safe orbits.

With B1, a Wasp at 120 u/s, x −400 u and offsets +80/+160/+260 u, the closest
approach contacted the Sun but cleared the dwarf by about 5.4 u. The giant's
160 u approach cleared its body by about 7.5 u with a 1.86 hull exposure budget.
Energy and exposure never changed these paths. Capacity, depletion, enemies and
combat were excluded; full-trace budgets also include travel after collection.

The captured configuration names base revision
`449c8ff43854821c531960ceb3c84e410f7b4289` with a **dirty tree**, source hashes,
original definitions, input sequence, initial states and a 1280 × 1000 viewport.
Images use the 1.5 s cursor and 0.2 px/u path view. They preserve paths and
readings, not perceived motion or player-controlled flight. No motion clip exists.

## Revision and publication evidence

Direct inspection at closure found the earlier study work in local commits
`335da098` and `d718d29b`. Pre-closure HEAD was
`d718d29bfd169bae421410246cbfb168ed6b21bb`; the original page and retired source
remain retrievable there. Other sessions had unrelated working changes. Those
were not included in this closure's scope.

Closure changes are working changes unless saved by a later commit. No commit,
push, publication or deployment was performed as part of closure. Historical
remote and deployment identities were not audited; no publication status is
inferred from the local commits or their release-related titles.

## Check evidence

Historical evidence inspected during closure:

- The field JSON reports production-Sun rate parity, no browser errors and
  keyboard/control checks. It lacks an exact source fingerprint.
- The motion JSON records passing budget/motion isolation, matching pre-contact
  paths, contact termination and invalid-settings checks, with no browser errors.
  These guards establish the fixture's stated boundaries, not design success.
- [Motion build log](artifacts/2026-11-11-stellar-encounters/motion-build.log):
  `pnpm build` completed, 88 pages, 11 November at 20:17 UTC. The log does not
  itself bind the build to a stable source fingerprint.
- [Scope contract log](artifacts/2026-11-11-stellar-encounters/scope-contracts.log):
  `pnpm check:contracts` completed, including 15 factory tests. An AGENTS.md length
  warning was advisory. The log lacks an exact tested-tree fingerprint.
- Prior chat tool outputs report later passing full type checks and focused
  formatting checks. Earlier outputs contained Fission/Gauntlet type failures and
  development-server hydration errors before subsequent passing checks. Not all
  outputs were retained as standalone artifacts; those remain reported evidence.
- Full `pnpm verify`, complete gameplay/browser suites and backend checks were
  not run for this study. No balance, release-readiness or sustained combat pass
  is claimed.

Closure validation is new evidence for the static document and cleanup only:

- Focused `pnpm exec biome check` passed for the registry, closed page and historical
  review after formatting.
- `node scripts/check-contracts.mjs` passed: 207 Markdown files, no missing link
  targets, and shared colour/type/Lab contracts intact. Existing context-length
  warnings remained advisory. Factory and gameplay tests were not rerun.
- [Static closure-page check](artifacts/2026-11-11-stellar-encounters/closure-page-check.json)
  passed at 1280 × 1000: HTTP 200, stopped metadata, zero interactive islands,
  four loadable images, two readable JSON records, historical review label and
  no browser errors. This verifies the replacement document, not the old experiments.
- Consumer search after cleanup found no remaining executable imports of the
  retired study components or calculation modules. Historical source hashes and
  this record deliberately retain their names.

These checks concern closure working changes based on `d718d29b`, alongside
unrelated concurrent work. No historical experiment or complete verification suite
was rerun to fill an evidence gap.

## Closure changes and remaining gaps

The registry is marked stopped. The page now embeds original static evidence and
states the failed intent, accepted observation and unaccepted scope. The question
review is labeled historical. Consumer searches found no users outside this
study for `FieldComparison.svelte`, `MotionComparison.svelte`, `fields.ts` or
`flight.ts` in its dedicated component directory; all four were retired. Shared
production systems and reusable Lab instruments were preserved.

Unresolved: the intended range of stellar characters, their scientific mappings
and visible cues, final tuning, resource-limited flight, and combat/score balance.
No new factory lesson, standing rule or quality rating was adopted. A successful
closure record does not certify a successful study.
