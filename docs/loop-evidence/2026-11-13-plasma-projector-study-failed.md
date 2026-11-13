# Plasma Projector study closure — 13 November 2026

## Outcome and authority

The designer explicitly stopped the study and assessed it as failed: “This failed.
We didn't get it done.” This is distinct from an accepted design or a weapon ruled
out. Registry status is `stopped`, phase `exploration`. The designer wants the
original 01 premise preserved for another study elsewhere; none is started here.

The designer attributed the failure to exploring theoretical vectors and calculations
before establishing how the weapon should feel in the game, followed by too many
turns without progress on the design question. They also suggested model, harness
or context problems as possibilities. These are attributed assessments and hypotheses,
not an established causal diagnosis or adopted process change. No skill or standing
contract is changed by this closure.

## Intent, work and boundaries

The study asked how a close-range plasma discharge makes approach, devastation and
escape a distinct flying manoeuvre. Exploration moved through schematic discharge
structure, cancellation, funding, recovery, falloff, and local flight-scene light
and recoil trials. The designer retained intermediate decisions about primary and
cooling shoulders, cheap residue, differentiated recovery, full-shot affordability,
and liked the slowing and live/persistent light split. In-game appearance and feel
were never resolved. The final material and motion comparisons were rejected.

Closure preserves section 01 unchanged and consolidates the intermediate decisions,
provisional values, trial conditions and limitations on the
[study page](../../apps/web/src/pages/lab/studies/plasma-projector-2026-11-11.astro).
A static schematic is reconstructed from the original study paths, explicitly
labelled as a composition reference rather than production artwork or a replay
capture. Rejected visual replacements are discarded. Temporary study components,
painters and geometry fixtures were removed after checking their consumers.
Shared flight-scene schemas, staged impulses, simulation checks and the reusable
instrument remain; closure does not promote them into a production plasma weapon.

## Revisions, checks and publication

Closure was made in a shared dirty checkout based on HEAD
`6c252c591348741126c764ee49096f4c8d722688`. No isolated revision identifies all
exploration edits; unrelated work was left intact. No commit, push, deployment or
publication was performed for closure.

Prior session tool output reported 191 unit tests passing, including staged-impulse
replay/direction coverage; Astro checking passed after the material comparison.
Strict Svelte checking failed in unrelated rock-study components. Contract checks
and 15 factory tests passed earlier in the session. Those are historical execution
reports against changing dirty-tree states, not acceptance of the visuals and not
checks of this closure. They were not rerun to reconstruct historical evidence.
Closure validation is limited to the changed page, registry, retained asset,
consumer cleanup and documentation links; its results are recorded below.

## Evidence limits

No retained motion recording demonstrates the braking or former visual sequence.
The designer's feedback and prior simulation checks support the retained observation,
with the stated Wasp/course conditions. Temporary screenshots of rejected visuals
were under `/tmp`; they are not durable accepted references. The static structure
reference is newly reconstructed, not proof of a past rendered frame. Destruction,
combat energy spending, interception, balance and a satisfying final appearance
were not demonstrated. The earlier
[12 November loop record](2026-11-12-plasma-projector-exploration-loop.md) concerns a
separate reset and remains unchanged.

## Closure validation

- Biome checked the changed registry and Astro page; formatting applied.
- `node scripts/check-contracts.mjs` passed, including zero missing Markdown targets.
- Consumer search found no remaining imports of retired projector fixtures/painters.
- Local browser inspection at 1280×1000 confirmed `exploration / stopped`, the
  explicit failed outcome, preserved 01, consolidated record and rendered SVG.
- No gameplay tests or historical reproductions were run as part of closure.
