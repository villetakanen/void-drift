# Voice-led development factory

Status: implemented alpha gates; human experience review remains open. Created 2026-10-28.
Authority: the latest agreed project decisions. Origin: the archived
[rebuild charter](../../history/rebuild-charter.md).

Loop 1 outcome and learning: [alpha retrospective](../../factory-experiment-alpha.md).
Post-release experience feedback was positive overall; detailed balance
and physical-device performance assessments remain open.

## Context

Development uses conversational speech transcripts and browser inspection. The factory must turn that input into traceable changes and trustworthy evidence without requiring manual IDE operation.

Historical files remain reference material; their unfinished items are not commitments. Existing code is evidence of implementation, not proof of intended behavior.

ASDLC patterns are design inputs, evaluated for their usefulness here: [Specs](https://asdlc.io/patterns/the-spec/), [Agent Constitution](https://asdlc.io/patterns/agent-constitution/), [Experience Modeling](https://asdlc.io/patterns/experience-modeling/) and [Compound Loop](https://asdlc.io/patterns/compound-loop/).

## Architecture

UI and game-visual implementation uses the `shared-components` skill at
`.agents/skills/shared-components/SKILL.md` for ownership, reuse/extraction,
composition and consumer verification. `AGENTS.md` routes portable agents to it;
`CLAUDE.md` links to that entry point and `.claude/skills` links to `.agents/skills`,
so Claude reads the same skill without a separate copy. The `fx-development` skill
adds the game-time, scene-budget and profiling workflow for effects; the living
[FX spec](effects/spec.md) retains its behavior and acceptance authority.

Flow: spoken intent → concise contract → bounded implementation → deterministic gates → browser/Lab evidence → human experience review → local commit → explicitly authorized publication.

The repository holds durable contracts and configuration. The Lab uses the same simulation, procedural assets, camera, and validated ship profiles as production. Test adapters control time, randomness, input, and network outcomes. Live services are exercised separately from deterministic checks.

Existing schema anchors:
- `packages/mode-a/src/lib/schemas/ship-profile.ts`
- `packages/mode-a/src/lib/schemas/game-state.ts`
- `packages/mode-a/src/lib/schemas/settings.ts`
- `packages/mode-a/src/schemas/highscore.ts`

New simulation/replay/network contracts require Zod schemas before game logic. Firebase data lives under `artifacts/{appId}/...`; incoming network data is parsed before use. Access rules must be tested, including rejected writes. Client validation alone does not establish score authenticity.

## Contract

### Definition of done

- [ ] One documented command runs the required automated gates and exits nonzero on failure, locally and in CI.
- [ ] Gates cover formatting/lint rules, strict types across workspace code, schema/behavior tests, production build, and browser gameplay smoke checks.
- [ ] Each check produces a named pass/fail result; skipped or unavailable checks are explicit and cannot count as passes.
- [ ] Check evidence identifies revision, dirty working-tree state, commands, and environment. A subsequent edit invalidates affected evidence.
- [ ] A known failing contract is detected by the gate; correcting it restores success without weakening the assertion.
- [ ] A clean checkout can launch the local game and Lab with documented setup and no live backend credentials.
- [ ] Fixed seed, simulation steps, configuration, and input sequence reproduce the same gameplay state in the supported test runtime.
- [ ] Browser checks exercise ship selection, keyboard movement, two simultaneous touch controls, release/cancel of inputs, game over, and restart.
- [ ] Lab scenarios have reproducible identifiers and configuration export suitable for sharing in conversation.
- [ ] Visual comparisons hold viewport, seed, simulation time, and browser environment fixed. Baseline changes require visual review; captures are never silently refreshed to hide failures.
- [ ] A playable checkpoint includes links to the relevant game/Lab scenario, automated results, known gaps, and a focused experience-review question.
- [ ] Commit and release status reports distinguish working changes, local commit, pushed revision, and verified deployed revision. Unknown remote/deployment state is reported as unknown.
- [ ] A factory experiment can be reconstructed from its intent, change, checks, human assessment, and resulting lesson candidate.

Verification reports and stage logs are retained per invocation under
`artifacts/verification/<timestamp>-<unique-suffix>/`; `latest.json` is only a
convenience copy. Closure records link the specific run. This local retention does
not back up artifacts or make browser traces immutable.

### Quick verification and worktree browser ports

`pnpm verify:quick` uses the recorded verification runner for contracts, lint, strict
types and unit tests. It exits nonzero for any selected failure or source mutation.
Its console and report explicitly identify partial verification and list omitted
stages. `selectedChecksPassed` describes the selected checks; `passed` remains false
for quick runs, even on exit zero. Full `pnpm verify` retains all required stages. Command errors and signals fail
even if the child reports exit zero. The expanded browser suite has a ten-minute
deadline; other foreground checks retain three minutes.
Factory regression tests run within the contracts gate and exercise successful,
failed and source-mutating runner fixtures without substituting for real checks.

`PLAYWRIGHT_PORT` and `PLAYWRIGHT_FIREBASE_PORT` configure offline-browser and
competition servers, defaulting to 4322 and 4323. The Zod contract in
`packages/core/src/lib/schemas/verification-ports.mjs` rejects malformed,
out-of-range or equal ports before checks start. Both Playwright configurations
use the resolved URL for navigation and server readiness, start their own server,
and retain `reuseExistingServer: false`. Verification reports retain both URLs.
Port overrides do not isolate Firebase emulator ports.

### Pruned verification and review captures

The full runner retains all nine named gate results. Rules and competition share
one owned Firestore/Auth emulator lifecycle, run sequentially, and start competition
with cleared test data. Each suite retains its own outcome, duration and log;
`backendLifecycle` records the shared command outcome, inclusive duration and
setup/cleanup overhead. A lifecycle failure fails full verification. Startup/shutdown
is bounded, and an interrupted or malformed backend report produces named failures
rather than losing the final verification report. A failing rules suite does not hide the competition result, and
an unavailable stage cannot count as passed. Standalone rules/competition commands
remain available; `pnpm test:backend` exercises the shared lifecycle directly.

Browser correctness checks own real input-to-simulation wiring, persistence,
hydration, focus and Canvas semantics. Numerical matrices stay in unit tests.
`pnpm test:capture` owns deliberate review screenshots with explicit scenario,
viewport and simulation time; it is opt-in and produces run-local artifacts.
Failure screenshots and traces remain part of ordinary browser verification.
Captures do not establish human acceptance, and synthetic Canvas pixel probes
verify compositing/lifecycle behavior without freezing expressive artwork.

Every browser context, including manually created touch contexts and the independent
leaderboard reader, blocks non-local network requests and records uncaught page
errors. Competition uses the demo backend. Astro and Svelte warnings fail type
verification; browser harness and configuration TypeScript are included explicitly.

Factory regression fixtures assert the identities of the required commands, inspect
retained logs/reports, and exercise independent backend-suite and startup failures.
The existing source fingerprint and partial/full distinction remain authoritative.
CI runs on pushes to `main`, on release tags and on pull requests, cancels
superseded runs for the same event/ref, and is the required check on `main`.

### Prepared release artifacts

`pnpm release:prepare` validates production Firebase settings through
`packages/core/src/lib/schemas/release.mjs` before building. Local `.env.local` supplies
unset environment values; explicit environment values take precedence. Production
project is `void-drift-alpha`, emulators must be explicitly false, and the API key/app ID
must be nonempty. Normal offline verification remains independent of these values.

A unique run contains one production build, copied rules/indexes and deployment config,
build log, browser smoke evidence and a validated preparation report. The smoke exercises
built keyboard flight/pause and FX Lab interaction, fails on page/local asset errors,
and blocks external traffic. It does not establish live Auth/Firestore availability.
The production identifiers must appear in the built JavaScript. Failed builds, smoke
checks or source mutation cannot yield `status: prepared`.

The report records revision, dirty state, source fingerprint, version, environment,
smoke outcome, per-file hashes and artifact fingerprint. Full correctness gates and
human review remain separate prerequisites/evidence; preparation is not a full-suite pass.
`release:check <run>` validates the report and complete bundle contents without publishing.

Following explicit publication authorization, `release:publish <run>` validates the
same bundle and deploys its Hosting files and Firestore snapshots without rebuilding
or taking inputs from the current checkout. Each attempt records its outcome separately;
actual live verification remains required. Missing/changed/added files block publication.
No command in this workflow commits, pushes or tags source automatically.

Factory tests exercise invalid settings, build/smoke/source-change failures, artifact
mutation and publication arguments with controlled fixtures. A real preparation run
provides separate browser/build evidence. Ignored local artifacts are not durable backup.

### Context-document warnings

`pnpm check:contracts` warns, and never fails, when a context document outgrows its
scope. The owner decided on 2026-11-02 that these limits warn rather than block.

- `AGENTS.md` at 80 lines or more. Missing context links still fail the gate.
  Relative Markdown links in tracked `*.md` files also fail the gate when their target
  is missing; links into `artifacts/` are exempt.
- `docs/design.md` above 200 lines (consider moving brand into its own document).
- In `docs/design.md`: a version or date in a heading, a `/lab/studies/` link, or a
  source path. These mark records, study history and values that belong in feature
  specs or code.

Warnings print as `WARNING:` lines in the contracts log. They are signals for the
owner and agents to act on, not passes or failures.

### Regression guardrails

- Rules and tests change when intent changes, with a reason; passing results alone do not justify weakening a contract.
- Performance observations report device/browser and scenario. A 60 FPS target is evaluated as a measurement, not treated as a hardware-independent deterministic assertion.
- Human approval of feel and fidelity remains distinct from automated behavioral correctness.
- Existing unrelated work survives iteration and is not silently absorbed into a new commit.
- Only approved lessons become standing guidance; experiment notes remain evidence rather than instructions.

### Scenarios

```gherkin
Scenario: Voice request becomes a playable change
  Given the owner describes a flight problem conversationally
  When the agent implements the agreed behavior
  Then the contract and executable checks describe the same outcome
  And the owner can inspect a reproducible Lab trial and play the real game

Scenario: Automated verification detects a regression
  Given a required flight contract is deliberately broken
  When the verification command runs
  Then it exits unsuccessfully and names the failed contract
  And the agent repairs the implementation or resolves an explicit intent change

Scenario: Live backend is unavailable
  Given no live service credentials or a failed service connection
  When the developer opens the local game and Lab
  Then flight and design trials remain available
  And shared scores clearly show their unavailable state
  And synthetic scores are identified as fixtures

Scenario: Owner asks whether a change is released
  Given a change exists in a local commit
  When the owner asks for release status
  Then the agent inspects repository and available deployment evidence
  And reports local, pushed, and deployed states separately
```

## Baseline evidence — 2026-10-28

Inspected working tree: branch `feat/0-4-0`, HEAD `ac6abe4`, with pre-existing uncommitted ship-selection work. These observations are not a passing factory acceptance report.

- `pnpm test`: 13 tests passed across two physics test files.
- `pnpm check`: succeeded; Astro reported zero errors, zero warnings, and two hints. The command invokes the web package's Astro check, not the advertised Biome lint gate.
- `pnpm build`: succeeded, producing ten static pages. This does not verify browser playability or a deployed release.
- Root scripts contain no browser gameplay gate or unified verification command.
- `GameWrapper.svelte` selects a ship profile for rendering; its `updateShip` call does not pass the profile's flight multipliers.
- The game loop uses frame delta time, `Math.random()`, and wall-clock elapsed time; deterministic replay needs explicit controls.
- The Supabase module throws at import time if credentials are absent; local development needs an isolated service boundary during the Firebase transition.
- Camera code supports tracking and translation; automatic zoom needs an explicit contract and shared Lab implementation.

## First bounded implementation

Establish the verification command and baseline coverage, isolate local boot from live services, and prove a browser can select a ship, start flight, and restart. Retain existing flight constants. Additional test dependencies require the owner's approval before installation. Ship behavior differences, camera design, and Firebase competition follow as separately reviewable increments.

## Factory foundation delivered — 2026-10-28

- Owner approved Playwright and Biome installation, and the context split into a minimal
  `AGENTS.md`, `docs/architecture.md`, and `docs/design.md`.
- `pnpm verify` runs contracts, strict Biome checks, Astro/workspace types, unit tests,
  build, and browser smoke tests; it retains per-stage logs and working-tree evidence.
- `docs/development.md` describes exact setup, coverage, and remaining gaps.
- Local game and Lab boot now tolerate absent legacy backend credentials; shared
  scores explicitly report unavailability. Firebase migration remains outstanding.
- Initial Chromium checks exercise all three ship selections, start/input feedback,
  changed Lab drawing, and unavailable shared scores. They do not yet verify trajectories,
  touch, or game-over/restart; those remain open acceptance criteria.
- An oversized `AGENTS.md` was injected temporarily: the contract gate rejected it,
  then passed after restoration. This verifies the entry-point size gate, not all gates.
- Explicit workspace type checking exposed a broken game-state import and an invalid
  legacy score-query method order; both were repaired without changing flight constants.
- Existing lint debt is intentionally visible as a failing stage, rather than waived.
  The full factory definition of done above remains open.

## Alpha implementation — 2026-10-28

The historical baseline above is superseded by the shared fixed-step simulation,
flight Lab and Firebase implementation in [playable-alpha.md](../game/spec.md).
The required command now includes Svelte diagnostics, rules tests and two-player
emulator competition. See [development](../../development.md) for current coverage.
Checkboxes above remain a review checklist, not an assertion of human acceptance.

## Commit-message gate — 2026-10-28

Conventional Commit syntax is checked locally by Lefthook and commitlint.
The short commit-messages skill guides semantic classification and breaking-change
disclosure. The factory's `pnpm verify` also checks committed history after the
documented adoption baseline; CI uses a full checkout. Malformed messages must
fail both paths, while older history remains unchanged. Hooks do not prepare
releases or publish. Meaning and compatibility still require diff review.

## Design-study experiment — 2026-10-28

Conversation can branch into an exploratory [design study](../lab/design-studies/spec.md) before
implementation. `/lab/studies` indexes stable review pages. The button pilot explores
situations and action composition first. Owner acceptance and production integration
are separate states; studies preserve decision rationale. The first iteration and
promotion remain to be exercised with the owner.

## Phased design inquiry — 2026-10-29

Design studies develop purpose, explore solutions, then integrate accepted choices.
Human judgment participates in framing and each substantive iteration as well as
acceptance. Unknowns are investigation inputs, not necessarily missing requirements.
The [study contract](../lab/design-studies/spec.md) owns this workflow;
[factory building lessons](../../factory-building-lessons/README.md) record its rationale
and pending evaluation. The button pilot is integrated; the planetary attempts failed
and do not establish a validated replacement workflow.
