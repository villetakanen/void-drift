# Inhabited worlds — stopped study

Closed 15 November 2026 by explicit designer instruction. Study: `apps/web/src/pages/lab/studies/inhabited-worlds-2026-11-15.astro`; registry status stopped, phase exploration. Work was local and uncommitted over HEAD `dd568eea5255c418e502d488383235867903563d`. No commit, push, deployment or production adoption was performed for this study.

## Intent and boundary

Investigate convincing inhabited Earth-like worlds at flight scale, using Earth first and the game's Sun, Mercury, Venus and Wasp as context. Read vision/design guidance and the Mercury (12 November) and Venus (13 November) studies. The earlier stopped Earth study of 14 November and its review, evidence, references and sketches were excluded and left intact. Gravity and solid-body contact motion were fixed; a small atmospheric heating zone was a possibility, not an accepted mechanic.

## Delivered work and designer feedback

Source: this conversation, 15 November 2026. The study page carries the detailed reasoning and original comparison conditions.

- 02.1: three generated concepts in a shared static game scene. Designer findings: familiar continents likely carry recognition but the exposed treatment feels uninhabited; weather makes a world feel alive/inhabited by something; realistic or semi-realistic lights are too small to read. These concern the demonstrated scenes, not all possible worlds.
- 02.2: exaggerated settlement treatments. Designer rejected detailed rendered planets as not belonging to/from the game. Proposals removed; no accepted appearance.
- 02.3: two original vector drawings. Designer found clouds apparently above ground promising, but otherwise judged them vector-style icons. Drawings removed; the spatial observation survives in writing.
- Scope discussion: designer questioned whether cloud appearance could be isolated from atmospheric gameplay. Encounter-at-the-edge inquiry proposed and authorized for exploration; damage/drag rules remained unsettled.
- 02.4: an encounter using Motion instrument graphs, burns and custom playback. Designer rejected this as misuse of the instrument, its specification, intended use and design system. Dedicated components removed before closure. No atmospheric-boundary or heating conclusion was accepted.
- Designer stopped the work: “we are looping”; “it seems like a model collapse on oversteering again.” Explicit follow-up requested stopped closure and a fresh-agent diagnostic brief, without another study.

## Interpretation already offered

The agent's conversation assessment was that corrections became successive directions without grounding the visual mismatch; narrowing displaced rather than resolved uncertainty. This is an attributed interpretation, not a demonstrated causal mechanism or adopted process lesson. Internal model collapse cannot be established from this record. No skill or contract was changed as a lesson.

## Evidence retained and gaps

Versioned study asset directory: `apps/web/public/studies/inhabited-worlds-2026-11-15/`. Original 02.1 images, prompts/provenance and fresh NASA references remain. `ocean-scene.jpg`, `weather-scene.jpg`, `settled-scene.jpg` are closure-day browser captures from the existing scene at 1280px before retiring its component. They are new captures, not proof of an earlier browser state. Conditions are documented in 02.1.

No durable image of the rejected vector drawings or settlement replacements is retained. No recording of the rejected encounter exists. Conversation screenshots and descriptions are the available historical evidence for those rounds; do not recreate them to fill this gap. No human playtesting record is requested or collected. No whole-study quality rating was commissioned.

## Checks and their limits

Earlier conversation tool output reported successful web builds and 1280px browser inspections. The encounter build log `/tmp/atmosphere-build.log` reported 103 pages built successfully; `/tmp/atmosphere-check2.log` reported two existing implicit-any errors in RockFlight015 and 34 warnings, with no errors in the two encounter components. Those temporary logs are not durable evidence and do not establish design-system compliance or human acceptance. The designer explicitly rejected the instrument usage despite these technical checks.

Closure replaces the static scene component with captured images, removes its sole consumer dependency and changes only study documentation/registry/assets. Closure validation is recorded separately after inspection; it does not reproduce or certify historical experiments.

## Separate next assignment

`docs/briefs/inhabited-worlds-visual-mismatch-diagnosis.md` is a diagnostic assignment only. The study remains stopped. No new study, artwork, simulation, shared instrument extension or production implementation has been started.

Closure validation (15 November, current uncommitted tree): Biome checked the study page and registry successfully; `git diff --check` passed. A fresh in-app browser inspection at 1280px showed the stopped status and closure summary, no horizontal overflow, all three retained scene images loaded and zero canvas elements. Consumer search found no remaining references to the retired study components. No historical test was rerun and no new production acceptance is implied.
