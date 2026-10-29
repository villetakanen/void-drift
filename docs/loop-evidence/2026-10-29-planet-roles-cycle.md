# Planet roles study — stopped cycle evidence

Removal update — 29 October 2026: the designer subsequently requested deletion of
all failed study application payloads. Their pages, dedicated demos, catalogue
entries, and obsolete test were removed. Historical artifact paths below identify
removed files, not retained deliverables. This later instruction supersedes earlier
artifact-retention instructions; written evidence and lessons remain available.

Date: 29 October 2026. Scope: this chat's fresh cycle at
`/lab/studies/planet-roles-2026-10-29`, not earlier planetary attempts.
Outcome: the designer stopped the study and requested a failure assessment.
Interpretation is separate in section 03 of that study page; this record collects
observations and attributed judgments only.

## Intent and decisions

The brief supplied three purposes: solar-system spectacle, gravitational slingshots
that enable extraordinary movement, and collision hazards. Planets orbit the sun;
moons orbit planets and share the same basic gameplay role. Moons of moons were
outside the proposed scope. The designer explicitly said the design problem was
well stated. No planetary solution was subsequently accepted.

Conversation sequence (source: this chat):

1. The agent opened a new study with one substantive purpose section. After purpose
   agreement, it added a written encounter investigation without an example. The
   designer challenged this as postulation and requested the expected example.
2. The agent built a production-physics diagnostic with generic ship handling,
   engines off and 400 units/s starting speed. The designer asked which ship was
   defined. Stock Balanced and a normal-flight baseline were then introduced.
3. The designer called that repair “very good,” then identified excessive
   acceleration. The study halved thrust without changing real ship definitions.
   The designer noticed reduced attained speed. After discussion of drag and the
   unchanged hard cap, a study-only slower powered velocity response replaced the
   half-thrust experiment.
4. The designer requested a one-engine turning phase, a five-second replay, two
   initial seconds of dual thrust, and extension of the turning phase to 3.5 s.
   It then requested matching updates to planetary approaches.
5. The designer found the setup complex and requested four coloured ships in one
   demo. It subsequently requested end acceleration, speed and line length in a
   table, and a sling trajectory that actually went around the planet.
6. The agent searched initial conditions and input durations using production
   physics. It initially assigned a different sequence to the sling. The designer
   required all four to use that sequence and vary their starting positions.
7. The final fixture uses four Balanced ships from rest at x = −180, with approach
   heights −270 (free), 210 (wide), 30 (crash), and 120 (sling). All receive both
   engines for 0.9 s, then coast to five seconds. All consume planet gravity.
   Trails were changed to planet-relative coordinates; table lengths remain in
   world space. The fixture retains the study-only powered response adjustment.
8. The designer stopped the study: “we ended up in some sort of a micro-interaction
   loop over insignificant details,” while saying the loop had succeeded up to a
   point. They requested assessment assuming the model and agent worked as expected.
9. During assessment the agent claimed the final example demonstrated a gravity
   turn. The designer corrected that: “the finall example does not demonstrate
   anything. the only usefull excample was the first.” The agent withdrew its
   claim. The designer further clarified: “we started looping over things that
   do not matter.” This record retains “first example” as the designer's wording;
   it does not assign an unconfirmed technical boundary to that reference.

The designer also explicitly supplied a loop lesson: define real objects consumed
by a study even when those objects are not being adjusted. It was recorded in
`docs/factory-building-lessons/002-phased-design-studies.md`. That record does not
establish generalized process effectiveness.

## Retained artifacts and inspected identity

- Study page: `apps/web/src/pages/lab/studies/planet-roles-2026-10-29.astro`.
- Final fixture: `apps/web/src/components/studies/PlanetEncounter.svelte`.
- Metadata: `apps/web/src/data/studies.ts` (exploratory/exploration; neither is
  acceptance or completion). Page closure now states stopped and failed explicitly.
- Base revision inspected at closure:
  `e31ba88d9cb0f7af9fd3b1b247f1ccff1f9dee42`, branch `feat/0-4-0`.
- Fixture SHA-256 inspected before report edits:
  `d6198efc786297e466d82c9cae9db3ed09d0efead73e2c35d014cc3d9796f4c9`.
- The working tree contains pre-existing modified/untracked material, including
  earlier study and factory artifacts. This cycle did not establish provenance
  for all of it. No commit was made for this cycle in this chat; no push or
  deployment was performed.

## Checks and their limits

Earlier turn outputs in this chat report successful scoped Biome, type, build and
browser checks on successive dirty-tree versions, with initial formatting/type
failures repaired. These were checks of evolving implementations, not evidence of
useful design results. The final fixture's type/build run completed successfully;
its final camera-position build also completed successfully before the stop.
Vitest reported 25 existing tests passed during this cycle; those tests do not
establish the usefulness of this study or specifically validate its new fixture.

Browser inspection of the final fixture reported a free path outside the well, a
wide path with no contact, a crash with one contact, and a sling path with no
contact. Its table reported end speeds of 60.8, 56.0, 40.5 and 44.8 units/s,
respectively. These are rendered diagnostic outputs, not accepted design findings;
the designer explicitly judged the final example uninformative. Prior claimed
speed gains from superseded fixtures are not results of the final fixture.

The temporary parameter-search test was removed; its output remains in chat only.
The surviving fixture source preserves the selected inputs and calculation method.
There is no exported full transcript, controlled process/model comparison, or
independent assessment of causal attribution. Browser screenshots were displayed
in tool output but not retained as tracked artifacts. Local preview availability
is temporary. No checks were rerun during closure to fill historical gaps; only
the added report/evidence documentation is validated for this closure.
