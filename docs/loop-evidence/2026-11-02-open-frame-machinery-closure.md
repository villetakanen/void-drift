# Open-frame machinery — closed exploration

Closed 2 November 2026 on the owner's explicit “close loop” instruction. Registry status is `stopped`, phase `exploration`. No utility design was accepted. Source: this chat, `01a19cdd-aa4a-7dd0-9926-6a3022e93345`.

## Intent and delivered evidence

The brief asked for visual discovery across energy storage, solar charging, gravity charging and automatic repair, grounded in established ship and engine artwork, with exposed engineered machinery, small-scale identity and enlarged top-down low-poly construction. Earlier utility studies were initially excluded from reading; the owner later explicitly requested their review while developing a restart prompt.

[Study source](../../apps/web/src/pages/lab/studies/open-frame-machinery-2026-11-02.astro), route `/lab/studies/open-frame-machinery-2026-11-02`, contains:

- 02.1: four open-frame proposals alongside production Wasp hull and ion engine polygons, enlarged and small. Owner found these flat and icon-like rather than convincing faux-3D objects. Preserved in details.
- 02.2: twin vessels, plate stack and split accumulator storage proposals. Owner called this better than previous examples because it communicated solid objects existing in the world. No individual format was accepted. Preserved in details.
- Original 02.3: one housing with closed, recessed and exposed variants. Owner found arbitrary polygons and unclear construction, and explicitly said this contributed no value or finding about the design problem. Removed at owner request; its component was deleted. Assistant explanations about projection and incoherent volume were hypotheses, not established causes.
- Replacement 02.3: four roles sharing a proposed solid construction. Delivered in source; the owner then identified a loop state and requested restart-prompt discussion. No positive design judgment was established for this replacement.

Components retained for this cycle: `MachineryFamily.astro`, `StorageVolumes.astro`, `SolidUtilityFamily.astro` in `apps/web/src/components/studies/`.

## Human assessment and discussion outcomes

The owner identified 02.2 as the last step that produced value and described the cycle as “the most successful run this far.” The owner interpreted the later work as trying to avoid mistakes rather than creating the intended result. That interpretation is attributed, not proven as a general causal explanation. At closure the owner called the exchange “A very good lesson.” This record does not promote a factory lesson or standing rule.

The requested restart discussion reviewed all three study pages and the opening prompts of the two earlier chats. The positive quality carried into the proposed prompt was substantial physical presence, expressed through top-down faux-3D construction alongside established artwork. Particular utility shapes remained open.

The owner proposed putting all four ships and all four engines into the next study's question section as persistent visual context, with engine exhaust pointing down. The assistant supported this and proposed enlarged and gameplay-scale views, ships nose-up. The proposal was discussed, not implemented or tested in this cycle.

## Restart prompt developed in chat

> Start a new design study following the repository’s design-study workflow.
>
> How could a family of utility machinery look compelling alongside Void Drift’s established ships and engines?
>
> Explore energy storage, solar charging, gravity charging and automatic repair. Give the family its own character as deliberately engineered machinery with visible working parts and a substantial physical presence.
>
> Use the current ship and engine artwork as the visual foundation. The Wasp hull and ion engine convey solid objects through top-down, faux-3D low-poly construction. Bring that same sense of volume, weight and deliberate assembly to the utilities. Their silhouettes should remain identifiable at small gameplay scale, and their construction should feel convincing when enlarged.
>
> Begin the visual exploration with concrete proposals in a fresh Lab study page, shown beside the established artwork. Explore the impressions these objects create and develop the promising qualities through discussion.
>
> The purpose is visual discovery: finding machinery that feels like it exists in Void Drift’s world. Each round should contribute a visible proposal that helps us understand some part of that question. Discovering which qualities belong is valuable progress.

Subsequent proposed addition:

> In 01 / Problem, establish a visual reference panel using the current production artwork for all four ships and all four engines. Orient ships nose-up and engines with their exhaust pointing down. Show enlarged and gameplay-scale views so we can see both their physical construction and their small-scale presence.
>
> Keep this panel available as the shared visual background throughout the exploration. Develop the utility proposals alongside it, using the established objects to discuss volume, character, proportions and belonging.

These are the drafts delivered in chat, retained as discussion evidence rather than a new standing instruction.

## Revision, checks and gaps

Directly inspected HEAD at closure: `4fa66afba7c09b83f4a9b2bf0144c189700999b6`. This cycle's files remain untracked and registry changes uncommitted, alongside pre-existing changes from the two earlier studies. No commit, push, publication or deployment was performed for this cycle.

Conversation tool results record passing `pnpm build` runs for the initial page, 02.2, original 02.3 and replacement 02.3 (47 pages for the later runs). Temporary logs: `/tmp/machinery-build.log`, `/tmp/machinery-22-build.log`, `/tmp/machinery-23-build.log`, `/tmp/machinery-family-build.log`. These ran against changing dirty source without retained source fingerprints; they are historical build evidence, not verification of the closure revision. Formatting checks ran on changed study sources. Full verification and automated browser, rules and competition suites were not run for this cycle.

Initial browser inspection showed the opening prose, production references and first utility drawings. Subsequent browser inspection attempts failed with unavailable browser access. Later visual rendering therefore remains unverified by the assistant. Small samples are provisional scale comparisons, not evidence of fitted gameplay readability. Removed original 02.3 drawings have no durable visual capture in this record.

Closure validates only its changed documentation, page and metadata. No historical tests are rerun. Readiness, implementation scope, formal study-quality review and human acceptance of a utility family remain unreached. Earlier studies retain their separate closure records.
