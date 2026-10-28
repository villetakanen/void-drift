# Design study loop retrospective

Closed for learning on 28 October 2026, after publishing 0.3.3. This loop proved a
small path from spoken design intent to an interactive study, accepted decisions,
shared UI, and a verified release. It also exposed where the agent introduced
unnecessary assumptions and repeated work.

The lesson candidates below are for review. They do not automatically change the
skill or agent instructions. Explicit owner decisions already adopted in architecture
and design guidance are identified separately.

## What the loop delivered

The owner wanted a conversation-driven design workspace for questions that can be
explored without playing the game. The first pilot was button hierarchy and grouping.
The implementation used one repository skill, a reusable study layout, an index at
`/lab/studies`, and a stable `/lab/studies/buttons` page. No database, comment system,
or orchestration service was added. One agent performed this loop; multi-agent
exploration was discussed but not exercised.

The study moved through explanation, interactive comparison, owner corrections,
token audit, acceptance, and integration. Its outcome became the canonical
`/lab/buttons` page and shared styles used by the application. The study retains its
decision history and pre-promotion audit, with a separate record of what was implemented.

The owner explicitly endorsed the situation-first explanation, later approved the
baseline and its documentation, and authorized promotion and publication. This is
acceptance of the button baseline and this pilot workflow, not proof that the workflow
will fit every design problem.

## Product and architecture decisions established

- Buttons serve game-state navigation and actions on application data. Navigation
  such as Start or Continue can be primary; technical HTML categories do not determine
  the user's hierarchy.
- Game screens, player tools, settings, and Lab tooling share a visual language.
- Use transparent vertical groups with equal-width buttons, or solid-background
  horizontal strips with anchored groups. Background transparency does not remove padding.
- Padding matches the minimum button gap. The owner rejected 16px vertical spacing;
  the accepted baseline uses 8px for both layouts.
- Existing angled corners and colors remain the visual baseline.
- Public tokens express shared design contracts. Component-owned aliases, derived
  values, and composition details may use private `--_name` properties. CSS privacy
  is a convention, not an enforced boundary.

These decisions are recorded in [design guidance](design.md),
[architecture](architecture.md), and the [study specification](specs/design-studies.md).

## Lessons from design iteration

### Explain the situations before proposing appearance

The owner specifically praised the opening explanation and asked that its value be
recorded after the loop. It made the problem understandable before comparing examples.
However, the first explanation still used generic confirmation-dialog categories.
The owner clarified that the main cases were startup, pause, setup, and mode states,
plus saving or resetting application data.

Candidate: keep a brief situation inventory at the start of a study, grounded in the
application's actual user goals. Treat it as a reviewable interpretation, not a taxonomy
that the agent can settle from technical terminology alone.

### Start from the actual shared implementation

The first examples used rectangular custom buttons despite existing angled shared
styles. The owner had to request restoration. Importing the production stylesheet
made the examples recognizable and focused discussion on composition.

Candidate: reuse existing primitives by default; make visual departures explicit
experiments. Isolating experimental CSS should not become a reason to recreate a
component unnecessarily.

### Study the container as well as the component

The initial comparison was anchored groups versus equal-width horizontal strips.
The owner instead identified the useful pair: vertical menu groups and anchored
horizontal strips. The background and padding belonged to those containers. Even after
that clarification, the first 16px spacing felt too loose and was reduced to 8px.

Candidate: show realistic compositions, including the space around controls, rather
than relying on a gallery of isolated variants. Explain token values, but let visual
review determine whether they fit. A valid token does not make a value appropriate.

### Audit token ownership before promotion

The inventory exposed literal widths, focus offsets, opacity, and motion values.
The initial audit pushed too many component-specific values toward global tokens.
The owner clarified the private-property convention and the audit was revised.

Candidate: classify each value as an existing shared contract, a missing shared
foundation, private composition, structural CSS, or a fixture. Record derivations and
ownership. Do not reuse an unrelated token just because its number matches, and do
not create global tokens for every literal.

### Preserve decisions without confusing history with current guidance

The stable page supported several correction rounds, but accumulated revisions and
large audit tables made it longer. During promotion, some wording still described
accepted decisions as open or pending and needed correction. The specification also
contains an old pilot-limit paragraph saying promotion is pending, despite its current
integrated status; that is remaining documentation debt, not a current limitation.

Candidate: lead with the current decision and status, keep historical evidence clearly
labeled, and check for stale status language when accepting or integrating a study.
Preserve a compact promotion record rather than silently rewriting the original audit.

## Lessons from integration and verification

Promotion needed more than copying the examples into the Lab. Shared focus, disabled,
selected, and motion behavior had to be reconciled with production. Existing public
`--button-*` properties were retained as compatibility aliases. Study-only horizontal
minimum widths were removed; vertical groups retained equal widths. Existing settings
persistence and specialized engine controls were preserved.

Candidate: make promotion an explicit consumer migration with a canonical reference,
compatibility review, and tests of shared behavior. The new browser check verifies
that changing a spacing token changes both group padding and gap, alongside keyboard,
busy, disabled, responsive, and reduced-motion behavior.

Several verification costs were avoidable:

- Java was initially reported unavailable because it was absent from the default
  environment. An existing runtime was later found under temporary tooling and used
  successfully. Check known local tooling before concluding that installation is needed.
- Starting a preview on a reserved test port created a collision risk. Keep previews
  separate from the ports owned by verification.
- A visual baseline changed because the pause-menu button composition changed. The
  difference was inspected, the baseline deliberately updated, and the comparison
  rerun without update mode. Tolerances were not loosened.
- The first responsive test assumed a 740px viewport meant a container below 580px.
  It did not. Test the component's available width, not an inferred device category.
- Files changed during a verification run. All individual checks eventually passed,
  but the source-fingerprint gate correctly rejected the overall result. Finish edits
  before the final verification and keep the source unchanged until it completes.
- A separate browser run overlapped an emulator run and the failing run reported missing
  trace files. Shared output-directory interference was a plausible contributor, not a
  proven cause of its timeout. Subsequent sequential verification passed.

Candidate: use focused checks during visual iteration, then one stable full release
gate. Keep browser runs with shared output directories sequential. Report failed or
unavailable checks honestly, while distinguishing environment failures from regressions.

## Release evidence

- `6603cfa`: accepted study and reusable workflow checkpoint.
- `41658d2`: canonical Lab, shared controls, tokens, and application integration.
- `f3d81d6`, tagged `v0.3.3`: synchronized workspace version and published release.
- Full verification passed, including browser, Firestore rules, and two-player emulator checks.
- Firebase Hosting deployment succeeded. Live smoke checks confirmed version 0.3.3,
  game start/pause, button layouts, integrated study, deterministic flight replay,
  anonymous authentication, and leaderboard reads, with no observed runtime errors.
- Database rules were unchanged; deployment covered Hosting only. No live test scores
  were submitted by the release smoke check.

The [live button reference](https://void-drift-alpha.web.app/lab/buttons) and
[study](https://void-drift-alpha.web.app/lab/studies/buttons) are public artifacts.
Local ignored evidence is in `artifacts/verification/latest.json` and
`artifacts/verification/release-0.3.3-smoke.json`; those files are not durable Git evidence.

## Candidates to try in the next loop

Start with a situation inventory and existing primitives. Compare a small number of
meaningful compositions, then audit token ownership before acceptance. At promotion,
update consumers, the canonical Lab, and current guidance together; retain the study's
rationale. Finish with stable verification and distinct commit, push, and deployment evidence.

Review these candidates before changing the skill. One successful button pilot does
not yet justify more skills, agent roles, or workflow infrastructure. A different study
will provide better evidence of what the scaffold is missing.
