# Ion engine study — failed and closed

Date: 2026-10-31 (Europe/Helsinki).
Outcome: owner-declared failure; study deleted at the owner's request.

## Intent and scope

The owner requested an ion engine design study covering its characteristics,
appearance and relationship to the established visual-effects layer. Explicit
character: precise single directed stream, decisive on/off response and reliable
baseline engine. Acceleration should diminish toward an engine speed ceiling;
exact mechanics and values had not been agreed.

## Delivered work and changes of direction

This chat created `/lab/studies/ion-stream`, its metadata entry, and two dedicated
Svelte examples. Section 02.1 compared a constant glowing line with a shortening
line using existing engine impulse calculations. The owner said, “Shortening
stream is clearly better.” This records a preference within that comparison,
not acceptance of a complete engine design or the existing acceleration curve.

The assistant moved to readiness and integration planning. The owner objected
that engine behavior and effects had not been sufficiently discussed. The
assistant then set those sections aside and added 02.2: a moving Fighter with
one Small ion engine firing, distance markers, manual thrust and a replay.
Existing thrust, mass and taper values were labeled as hypotheses.

The owner asked about the “sfx layer.” The assistant first interpreted this as
sound; the owner clarified “the visual effects layer.” Subsequent chat responses
acknowledged that the glowing-line examples had not been connected to the
established effects design. These explanations did not restore a shared study
progression, according to the owner's closing feedback.

## Human assessment

Final owner feedback: “this study completely failed” and “We are in some sort of
weird looping state.” Instruction: “close loop, log failure, delete study”.

The earlier preference for the shortening line and “thats nice” response to the
moving example are retained as bounded feedback. Neither supersedes the owner's
final assessment. No complete engine design or production integration was accepted.

## Revisions and publication

Closure inspected branch `feat/0-4-0`, HEAD
`1bf9908c1aa9ed7be8b3f6b2d9d90618139457ae`. Study work was uncommitted in a dirty
workspace containing substantial unrelated engine, ship and builder changes that
predated this study. No study commit, push, deployment or live-release verification
was performed in this chat. Shared production physics and effect code were not
changed by the study.

Closure removed the study metadata entry, main page, premature integration archive,
`IonStreamTrial.svelte`, and `IonMotionTrial.svelte`, plus their identified generated
page/bundle files. Unrelated working changes were preserved. The evidence record
is retained; the deleted study is not an active design contract.

## Checks and observed failures

Checks apply to intermediate, uncommitted working trees, not a released revision:

- Initial formatting checks failed; subsequent formatting runs passed after fixes.
- An Astro prop-type error on `client:load` was repaired before later checks passed.
- `pnpm check:types` passed in the chat; retained `/tmp/ion-types.log` and
  `/tmp/ion-motion-check.log` show zero Astro and Svelte errors/warnings.
- `pnpm exec vitest run packages/mode-a/src/lib/build-flight.test.ts` passed 12
  existing engine tests; confirmed in `/tmp/ion-tests.log`. These did not test the
  design study's usefulness or its browser loading.
- `pnpm build` passed; `/tmp/ion-motion-build.log` records 30 generated pages.
- Browser inspection was initially unavailable. Later browser logs showed the
  interactive component failing hydration with an undefined `source` property.
  Two Astro servers were observed for the workspace. After stopping the duplicate
  servers and clearing Vite cache, the component rendered and its controls worked.
  This sequence was observed; the exact cause was not independently isolated.
- Browser evidence in this chat showed 02.1 at 494/500 speed, release at zero
  acceleration, and keyboard replay. For 02.2 it showed moving markers and stream,
  reset to rest, and keyboard release retaining speed while acceleration became zero.
- Formatting, contract and whitespace checks passed in the chat. Full `pnpm verify`,
  backend checks and a complete responsive/touch matrix were not run for this study.

Passing technical checks did not establish study success; the owner's assessment
is failure. No historical tests were rerun to fill evidence gaps during closure.

## Evidence limits

Primary sources are this conversation, inspected source before deletion, current
Git state and the temporary logs named above. No immutable fingerprint was retained
for each dirty-tree check. Temporary logs and chat screenshots are not guaranteed
long-term artifacts. The removed examples are described here rather than archived
as usable study pages. Generated study-index HTML may still reflect the preceding
build until the next normal build; source registration and study pages were removed.
No signals, lessons, causal conclusions or standing process changes are adopted by
this closure record.
