# Digest: factory lessons for the Void Drift retrospective

Sources: the documents named in the task, plus the nine memory files under
the assistant memory directory for this project (outside the repository).
Paths below are relative to `docs/` unless noted.
Short names: LESSONS = `factory-building-lessons/`; 002 = `LESSONS/002-phased-design-studies.md`;
EVAL = `LESSONS/design-study-evaluation.md`; DERELICT = `LESSONS/2026-11-06-derelict-correction-loop.md`;
ALPHA = `factory-experiment-alpha.md`; BUTTONS = `factory-experiment-design-studies.md`;
SCOPE = `factory-experiment-planet-purpose-scope.md`; PLANETARY = `factory-experiment-planetary-study.md`;
FORMDRIFT = `factory-report-design-study-form-drift.md`; SKILL-DS = `.agents/skills/design-study/SKILL.md`;
EXPLORE = `.agents/skills/design-study/references/exploration.md`; MEM = memory file name.
The documents use "owner" for the human. This digest says "the designer" or "the human".
Note: the documents record decisions largely as "designer approved" or "owner approved" with a date; the
decisions themselves come from the human in conversation, so the evidence for most adoptions is the
conversation as summarized in the document, plus a `loop-evidence/` record where cited (not read here).

---

## 1. Lessons adopted

Product or design decisions (audit D1-D7, button spacing, gravity law) are left out unless they changed how the factory works.

### Design-study harness (skill and specification)

- Purpose before exploration before integration (three phases, recurring human judgment, agreements accumulate). Adopted in SKILL-DS and `specs/design-studies.md`. 29 Oct 2026. Evidence: 002 "Adopted change"; BUTTONS and PLANETARY as the contrast cases.
- Problem formulation is a legitimate deliverable; synthesize provisional purpose first, unknown mechanics are investigation items, not homework for the designer. SKILL-DS "01 / Develop the problem". 29 Oct. Evidence: PLANETARY lesson candidates 1-3 and "Second cycle"; 002.
- A page opens with one substantive numbered section 01 and an unfilled 02; no five-part comprehensive report; cycle zero (fresh cycle starts from current reality, earlier studies are informative, not contracts); historical study records moved to `specs/design-studies-history.md`. 29 Oct. Evidence: FORMDRIFT; 002 "Repair - progressive form and cycle zero".
- Short readable opening: token-based paragraph spacing, bounded prose width, two or three short paragraphs or a compact list, one concrete situation, one visible invitation. 29 Oct. Evidence: 002 "Trial feedback - readability and invitation" (the trial prose was kept as evidence, not rewritten).
- Define the real objects an experiment consumes but does not adjust (explicit ship, not "a generic ship"). Recorded in 002 as "a designer-supplied lesson for this loop, not ... an automatic change to standing skills" (29 Oct); the rule now appears in EXPLORE "Define consumed objects and conditions" and in the EVAL rubric. Evidence: 002 "Current-cycle lesson".
- Focus protection with explicit designer override (explain the diversion, recommend answering the current question, then comply once overridden). EXPLORE "Protect the current investigation's question". Date not stated for this repair (follows the 29 Oct planet-roles cycle in 002). Evidence: 002 "Repair - protect the question".
- Exploration must deliver a small concrete example in the active section before asking for judgment; prose, research and plans do not count; real blockers are reported as incomplete. EXPLORE "Make the question inspectable". 29 Oct. Evidence: 002 "Repair - exploration must deliver an example" (living-solar-system trial page).
- Readiness assessment (Ready / Conditional / Not ready per criterion, not averaged; the agent prepares, the designer judges) at the exploration-to-integration boundary. `specs/design-studies.md`; SKILL-DS "03". 29-30 Oct. Evidence: 002 "Addition - design readiness before integration".
- Readiness assessment lives in `/lab/reviews/<study>`, not on the study page; chat carries the conclusion. 30 Oct. Evidence: 002 "Repair - separate readiness assessment"; example `reviews/utility-machinery-2026-11-02.md`.
- Four bounded harness changes: bound a broad study by one decision; recommend taking an independently usable accepted result through readiness and scope before exploring the next subject; carry the exact accepted variant and settled properties into scope; judge alpha readiness against the intended delivery. SKILL-DS, `specs/design-studies.md`, EXPLORE. 30 Oct. Evidence: 002 "Adopted - four bounded harness changes" (SCOPE diagnosis; `loop-evidence/2026-10-30-ship-silhouettes.md`, `...-engine-effects.md`).
- Study pages explain design, alternatives, decisions and reasons; review questions and coordination go in chat. 31 Oct. Evidence: 002 "Adopted - documentation, replay references and retained evidence" (`loop-evidence/2026-10-31-ship-slot-language.md`).
- Motion references retain replay conditions (input/tick sequence, initial conditions, seed, camera) as well as appearance. EXPLORE; SKILL-DS "02". 31 Oct. Evidence: 002 (`loop-evidence/2026-10-31-ion-engines.md`).
- Verification writes each run's report and logs to a unique directory; `latest.json` is a convenience copy; closure links specific runs. 31 Oct. Evidence: 002; close-loop skill text "Link verification reports ... from their specific run directory".
- Discard and replace: an unusable proposal is removed and replaced in the same round; no apology, self-assessment or method repair in chat; useful discoveries survive, rejected drawings do not. EXPLORE "Discard and replace". 2 Nov. Evidence: 002 "Adopted - exploration guide and discard-and-replace recovery" (the designer identified "a recurring pattern of defensive explanation").
- Exploration extracted into a supporting guide loaded during part 02; older retained 02.x steps collapse into closed `<details>`. EXPLORE. 2 Nov. Evidence: 002; EXPLORE "Keep the page legible".
- Consolidate duplicated instructions into an ownership map (spec owns outputs and ending; skill owns procedure). `specs/design-studies.md#context-and-ownership`. 3 Nov. Evidence: 002 done-list; `loop-evidence/2026-11-03-factory-harness-amendments.md`.
- Study-quality rubric is optional for ordinary studies; a failed study can end successfully for the project with its failure recorded. `specs/design-studies.md`; SKILL-DS "Finish and verify". 3 Nov. Evidence: 002 done-list.
- Reuse production systems and the shared Motion instrument in studies; report automated correctness, visual inspection and human judgment separately. SKILL-DS. Date not stated. Evidence: BUTTONS (importing the production stylesheet fixed the rectangular-button error); ALPHA ("Lab uses the same simulation").
- Check the Lab only at 1280px and above. SKILL-DS "Finish and verify"; `/AGENTS.md` (CLAUDE.md is a symlink to it); `design.md`. Decision 4 Nov 2026 per `history/rebuild-charter.md` ("Lab targets large screens only ... owner decision, 2026-11-04").

### Delivery and verification machinery

- Short entry guide with detail in on-demand documents; AGENTS.md kept under 80 lines. Charter 2026-10-28; ALPHA step 2. Evidence: ALPHA (oversized-AGENTS.md probe failed its check). Memory says the check now warns and never blocks (MEM design-md-purpose, 2 Nov); `scripts/check-contracts.mjs` line 15-16 does only `warn`.
- `pnpm verify`: eight sequential stages, continues after failure, records revision, dirty state, source fingerprint, fails if source changes during the run. ALPHA "How the harness and gates work". 28 Oct. Evidence: ALPHA (CI run 40675444224; negative probe that ignored thrust multipliers failed one test).
- Repeatable release preparation and smoke (runner, environment/report schemas, built-site smoke), publishing the exact prepared artifact. LESSONS/001 "Done - prepared release artifacts". 3 Nov. Trigger: 0.4.9 passed checks but lacked production configuration (`releases/0.4.9.md`). Answers ALPHA friction item 1. "Done" explicitly means locally checked, not published.
- Deterministic fixed-step simulation shared by game and Lab; replay, pause, step, JSON export and shareable URL. ALPHA "Where determinism comes from". 28 Oct. Evidence: ALPHA.
- Graphics regression baseline updated only after inspecting the diff; tolerances not loosened. BUTTONS "Release evidence" section. 28 Oct.
- Local commit authority, push and publish need explicit authorization; local build is not a release. Charter "Development experience"; `/AGENTS.md` Authority. 2026-10-28.
- close-loop skill: collect evidence only; a finding is not a signal; no lessons, recommendations or skill edits during closure. `.agents/skills/close-loop/SKILL.md`. Date not stated. Evidence: charter "Review candidate lessons ... before promoting"; ALPHA question "How should lesson candidates be promoted".
- Spec skill: a spec states only the intended contract; no DEPRECATED markers, dated decisions, change logs or target markers; status lives in Definition of Done checkboxes. `.agents/skills/spec/SKILL.md` section 5 (commit f0be58f per MEM specs-carry-no-history). 4 Nov. Evidence: MEM specs-carry-no-history.
- design.md holds principles only; a study may propose a change only in its part 04, flagged. `design.md` header. 2 Nov. Evidence: MEM design-md-purpose ("drift on drift because every accepted study appended its record").

### Rules written into memory files

- Freeze an earlier study section's example before applying later decisions to a shared component. MEM study-sections-stay-historic. 1 Nov (lab-instrument study).
- design.md scope and anti-drift rules; vision.md to be actively maintained; size limits warn, never block; brand stays in design.md until it passes 200 lines. MEM design-md-purpose. 2 Nov.
- Tests assert relations and invariants, never design values, study outputs or frozen references; production code and tests never import from `apps/web/src/components/studies/`. MEM tests-assert-relations-not-design-values. 2 Nov (test triage).
- Do not invent a required human step or demand its evidence; no usability, readability or feel review items in specs, plans or Definition of Done. MEM feel-reviews-not-in-repo. 4 Nov. Recording trial feedback in loop-evidence is still fine.
- Specs carry no history. MEM specs-carry-no-history. 4 Nov.
- Never call the user "the owner" or attribute decisions to an owner role; write "Decisions (date)". MEM no-owner-role. 5 Nov. The memory quotes the human: "thats pure model slop."
- Never propose deleting `docs/project-vision.md`. MEM project-vision-is-kept. 5 Nov. The human said it "keeps coming up".
- Never offer `docs/plans/` files as delete actions; only "candidates for a separate review". MEM plans-need-review-before-deletion. 5 Nov.

---

## 2. Lessons proposed but not adopted, or explicitly deferred

I did not find a "staleness command" in the assigned documents; I could not source that example and have not listed it.

- DERELICT proposed constraint (restore a usable live visual comparison; replace a failed example in the same turn; do not substitute explanations, recovery menus or future-work promises; discuss model behavior only when requested). Status line: "requested analysis and proposed safeguards; not adopted factory policy". It adds: "The evidence does not establish a missing-rule problem" because EXPLORE already says this. To be "reviewed separately before editing skills".
- Writing-pruning technical-writer review loop: "That loop does not exist yet" (`writing-pruning.md`). It collects examples (001 / invented audience-benefit jargon, 2 Nov) to define scope later; "does not create a standing workflow or an automated gate".
- Comparative model evaluation (Luna, Terra, Sol; Frontier as "possible later control"): "No comparative model evaluation has been run yet" (LESSONS/README; EVAL; 002 "How we will evaluate it"). EVAL status: "optional protocol ready; no runs recorded".
- Replay of the exact prompt with the same model after the harness repairs: designer "will rerun" (EVAL, 002). Not run at time of writing.
- Rejection-and-replacement probe, diversion/override probe, button regression comparison: "planned, not yet run" (EVAL).
- ALPHA lesson candidates not recorded as adopted in the assigned documents (stated reason in ALPHA: "proposals for the next loop's contract, not work silently started here"):
  - reconcile contracts at closure (spec checklist lagged implementation);
  - keep large outcomes reviewable by separating mechanical cleanup from feature diffs;
  - readable retry state for provisioning delays (leaderboard index);
  - measure the bottleneck (competition stage took about 57 of 77 seconds) before optimizing; focused feedback during editing;
  - measure physical-phone frame rate and collect focused ship/camera feedback before claiming performance or balance;
  - durable evidence manifest by loop and revision (a `loop-evidence/` practice exists and is cited by 001/002, but ALPHA's retention caveat on ignored `artifacts/` runs is repeated in 002 as still open).
- Branch protection: "not configured: these checks report failure but do not yet enforce an unbypassable ... policy" (ALPHA). No later adoption seen.
- BUTTONS candidates ("for review; they do not automatically change the skill") not recorded as adopted: token-ownership classification before promotion (existing / missing foundation / private / structural / fixture); explicit consumer-migration at promotion with compatibility review; focused checks during iteration then one stable full gate; keep browser runs sequential; check known local tooling (Java) before concluding install is needed; check for stale status language when accepting. BUTTONS also says one pilot "does not yet justify more skills, agent roles, or workflow infrastructure".
- PLANETARY candidate 6 (use generic provenance prose as a context diagnostic) was not adopted as written. PLANETARY also leaves open "whether and when current-state evidence is useful" for normative design questions: "must be decided in a separate process review".
- ALPHA ASDLC question: external feedback to ASDLC maintainers drafted from findings; "No external feedback has been sent" (ALPHA; charter requires explicit authorization). No later record seen.
- ALPHA hypothesis that explicit contracts, shared examples and executable failure signals may reduce dependence on a high-capability model: "needs a comparable later loop".
- Human experience review of the writing and of the opening trial: 002 "Fresh human assessment of the writing remains open"; "fresh-cycle effectiveness untested".
- Prior planetary mechanics: nothing integrated; planet artwork, type treatment, sizes, rings, zoom, retained slingshot speed and broader difficulty "remain undecided" (SCOPE). Three narrower studies named (gravity wells, how planets look, a moon on a planet) are "not ... automatic authorization".
- Opening-screen audit (`audits/2026-11-01-opening-screen.md`): "Input for a design-system plan ... nothing here is implemented"; primitives T1-T8 and E1-E12 are plans, not lessons. Items 1, 2, 5, 7 are marked "Resolved by" decisions D1, D3, D6, D5; others unmarked.

---

## 3. Repeating themes (three or more documents)

1. **Form drift: producing the artifact or report instead of the design reasoning.**
   Documents: FORMDRIFT, 002, PLANETARY, SCOPE (page-level versus problem-level), EVAL, DERELICT, EXPLORE, SKILL-DS, MEM design-md-purpose.
   - FORMDRIFT: "an agent can satisfy the page instructions by producing a complete-looking report before a shared understanding has developed."
   - 002: "a wall of text instead of a solution to discuss."
   - EXPLORE: "Described alternatives, research summaries, and plans to build later are insufficient."
   - MEM design-md-purpose: "drift on drift" from every study appending its record.
     Also a mirror case: a polished page or passing build is not evidence ("Rendering checks cannot establish study progression", FORMDRIFT; "A polished artifact cannot compensate for unsupported purpose", EVAL).

2. **The agent explains itself, or discusses process, instead of delivering design evidence.**
   Documents: DERELICT, FORMDRIFT, PLANETARY, 002, EXPLORE, SKILL-DS, MEM feel-reviews-not-in-repo, EVAL.
   - DERELICT: "The agent allowed implementation troubleshooting and explanations of its own choices to become the study's subject."
   - FORMDRIFT: the designer "clarified that agent explanations were unwanted".
   - EXPLORE: "Do not default to apologies, self-assessment, speculative explanations of failure, method repair in chat".
   - PLANETARY: the agent "treated feedback as iteration on an artifact when the designer was challenging the frame".

3. **The human has to repeat the same correction.**
   Documents: FORMDRIFT ("after repeated attempts to correct the page"), PLANETARY ("failed again"), 002 ("again produced a wall of text"; 2 Nov "recurring pattern"), DERELICT (failure recurs after the 2 Nov rule), MEM project-vision-is-kept ("keeps coming up"), MEM no-owner-role, MEM design-md-purpose.
   - 002: "The designer reported that the living-solar-system cycle again produced a wall of text".
   - MEM project-vision-is-kept: the human "said ... this 'keeps coming up'".

4. **Invented jargon and role vocabulary presented as project terminology.**
   Documents: `writing-pruning.md` ("the pilot's benefit"), MEM no-owner-role, PLANETARY ("owner" as "a recognisable symptom" of a context gap), FORMDRIFT ("Process vocabulary becomes study content"), MEM feel-reviews-not-in-repo ("claiming water is wet"), 002 and charter (still use the word).
   - writing-pruning: "invented framing that has begun to sound like agreed project terminology."
   - MEM no-owner-role: "never defined and was invented by earlier sessions."
     Interpretations differ: PLANETARY says banning the word does not fix a context failure; MEM no-owner-role treats it as drift to remove.

5. **Specs and docs carry history, or go stale; history leaks into the current contract.**
   Documents: MEM specs-carry-no-history, `.agents/skills/spec/SKILL.md`, 002 (history moved to `specs/design-studies-history.md`), BUTTONS (old pilot-limit paragraph "remaining documentation debt"), ALPHA ("factory spec's unchecked checklist lagged the implementation"), `audits/2026-11-01-opening-screen.md` (item 17 "Specs are stale"; item 1 specs claim a logo and font that do not load), FORMDRIFT (mandatory spec reading carried failed planetary content), `history/rebuild-charter.md` (archived with a banner), `design.md` (changes only via part 04).
   - spec SKILL: "delete superseded text; git holds the history".
   - audit item 17: "menu-overlay.md ... describe a screen that no longer exists."

6. **Lessons are kept as candidates until reviewed; promotion is a separate step.**
   Documents: ALPHA, BUTTONS, PLANETARY, SCOPE, DERELICT, close-loop skill, charter, 002, EVAL, LESSONS/README.
   - close-loop: "Do not turn a finding, repeated finding ... into a signal ... general lesson".
   - DERELICT: "No skill or standing contract is changed here."
   - 002: "Promote further lessons separately."
     This is a repeated deliberate discipline. The opposite risk (promoted too early) appears in 002 itself: the required-reading and phase outline "invited a comprehensive report" (FORMDRIFT) after the phased method was promoted on 29 Oct, and the SCOPE diagnosis ("not that the current skill needed another repair").

7. **Adopted does not mean validated; effectiveness is untested.**
   Documents: LESSONS/README, 001, 002 (about ten statements), EVAL, DERELICT, ALPHA.
   - 002: "The harness repair is implemented; its effectiveness remains untested."
   - LESSONS/README: "completion does not imply empirical validation of workflow effectiveness."
   - 001: "Done means the tool is implemented and locally checked".

8. **Evidence is not durable, or is not captured.**
   Documents: ALPHA ("ignored, locally retained artifacts"; `latest.json` overwritten), 002 ("Run folders remain ignored local artifacts, not durable backup"), PLANETARY ("no exact runtime prompt composition was captured"), close-loop ("link large artifacts"; "Missing artifacts remain unavailable evidence"), SCOPE ("Temporary browser captures and logs may not survive"), EVAL ("Preserve failed runs").

9. **Broad scope inside one study or loop.**
   Documents: SCOPE ("too large for one study—potentially too large for twenty"), 002 (bound by one decision), SKILL-DS ("propose one decision the cycle can settle"), ALPHA (feature work, migration and formatting in one diff), EXPLORE (recommend finishing independently usable results).

10. **Human experience review: absent, deferred, or invented, depending on the document.**
    Documents: ALPHA and 001 (human assessment kept "separate from automated correctness"), design.md ("Feel and fidelity are judged by people playing"), `/AGENTS.md` ("Human experience review assesses feel and fidelity separately"), EVAL ("Human review must assess explanation and progressive form"), 002 ("Fresh human assessment ... remains open"), MEM feel-reviews-not-in-repo ("The project does not do or record usability reviews from users at all"), `reviews/utility-machinery-2026-11-02.md` (the "Human judgment" line is the designer's in-conversation choice, not a recorded review).
    - MEM: "never a usability/readability/feel review item in a spec, plan or Definition of Done."

11. **Memory loss and carry-over between sessions and cycles.**
    Documents: MEM design-md-purpose ("Not recorded in the repo"), MEM files generally (each correction came from a separate session ID), EVAL ("Prior study agreements are not inherited"), 002 (cycle zero), FORMDRIFT (mandatory reading re-imported failed content), ALPHA (short AGENTS.md; "explicit contracts ... may reduce dependence on the agent remembering and judging everything").
    This one cuts both ways: too little carried (corrections repeated) and too much carried (rejected drafts as foundation).

---

## 4. Factory maturity

What exists now (by document):
- Contracts and context: short entry guide, on-demand docs, ASDLC-style specs, a spec skill with a no-history rule, a design.md with anti-drift rules (ALPHA; charter; spec SKILL; design.md).
- Deterministic gates: eight-stage `pnpm verify`, behavioral, browser and emulator tests, source-fingerprint integrity, CI, a negative probe that proved a gate can fail (ALPHA). Tests must assert relations, not design values (MEM tests-assert-relations).
- Release machinery: repeatable release runner, schemas, built-site smoke (LESSONS/001, 3 Nov). Publication, deployment and live verification are kept as separate claims (ALPHA lessons table; `/AGENTS.md`).
- Design workflow: design-study skill with four parts, exploration guide, readiness and scope outputs, `/lab/reviews`, motion instrument, study registry (SKILL-DS; 002).
- Evidence records: `loop-evidence/` plus the close-loop skill, which collects evidence only (close-loop SKILL; 001/002 cite specific records).
- Lessons discipline: numbered improvement records that "are not automatically instructions" (LESSONS/README).

What the charter and ALPHA set out to have, and the stated open items:
- Charter wanted an honest baseline, deterministic verification, ship flight, camera, Firebase competition, playtests and "review what the factory taught us". ALPHA reports these delivered, with caveats: branch protection missing, physical-phone performance unmeasured, no granular balance study, "publication preceded the owner's positive experience review" (differs from the factory spec's idealized sequence).
- Human experience review: stays an open dimension. ALPHA: feedback was positive overall but "not a measured acceptance". 002: fresh human assessment of the writing "remains open". MEM feel-reviews-not-in-repo now says the project records no usability reviews, so this is a deliberate boundary, not a missing gate (see section 5).
- "No comparative model evaluation has been run yet" (LESSONS/README, EVAL, 002). The ALPHA model-capability hypothesis is unexamined.
- No replay trial of the repaired design-study harness is recorded; the next-trial protocol and probes are "planned, not yet run" (EVAL; 002).
- The charter's learning step (retain trigger, pattern, evidence, intervention, result, limits; draft maintainer feedback) has produced the lessons documents, but external feedback is unsent (ALPHA; charter).
- The 002 verification record says the overall result was "not a pass" on 29 Oct: an old planetary browser test failed, and Java was unavailable (002 "Implementation verification"). CLAUDE.md now has a Java 21 setup instruction.
- DERELICT (6 Nov) shows the correction-loop failure the 2 Nov discard-and-replace rule targeted occurring again, after that rule existed, in a later study (the "derelict" draft two). Whether the rule failed or was not applied is not established by the documents ("We can explain observable interaction patterns; we cannot establish internal model causes").
- Maturity is stronger on gates for code than on gates for design work. Design-study guidance is a repeatedly edited prompt-level procedure; EVAL says it can be validated only by a "fresh study and human assessment".

---

## 5. Contradictions or tensions

- Human experience review: `/AGENTS.md` ("Human experience review assesses feel and fidelity separately"), design.md ("judged by people playing"), LESSONS/001 and EVAL (human review of progressive form) versus MEM feel-reviews-not-in-repo ("The project does not do or record usability reviews from users at all ... never a ... feel review item"). The memory carves out only a human step "the owner, a skill or a spec actually calls for", and EVAL is a skill-level protocol that does call for human form review. Unresolved: what counts as a recorded review.
- The word "owner": MEM no-owner-role ("Never write 'owner-approved'") versus `.agents/skills/close-loop/SKILL.md` (three uses), `shared-components` and `fx-development` skills ("owner acceptance"), `history/rebuild-charter.md`, `audits/2026-11-01-opening-screen.md` ("Owner decisions"), `writing-pruning.md`, 002 (eleven mentions) and DERELICT (two). The memory file names "~75 files" with the word as of 5 Nov; several assigned documents still carry it.
- Spec history: LESSONS/001 links the "Factory specification" (`specs/voice-led-factory.md`) as holding "contracts and delivery history", while MEM specs-carry-no-history and the spec skill forbid history in specs. 002 also keeps history inside an archived spec (`specs/design-studies-history.md`), which is a spec-folder file outside the rule's wording. Not verified whether voice-led-factory.md has since been cleaned.
- Study rubric: 002 "Addition - design readiness" describes the eight-criterion rubric (purpose, investigation, alternatives, evidence fit, cumulative agreement, coherence, remaining uncertainty, integration implications) as the readiness rubric. Later 002 and SKILL-DS say the quality rubric is optional and "Readiness assesses feasibility, not study quality". The review `reviews/utility-machinery-2026-11-02.md` uses the same eight criteria and says it is "separate from readiness and scope", while SKILL-DS says "Do not generate a separate ratings report by default". The documents use "rubric" for two or three different things.
- Lab width: SKILL-DS and `/AGENTS.md` say never check the Lab below 1280px (decision 4 Nov per charter). `reviews/utility-machinery-2026-11-02.md` (dated 2 Nov, before that decision) reports a study check at 390px. `audits/2026-11-01-opening-screen.md` E4 says to verify a 390px phone fit "in the Lab". Timing may explain it; later guidance supersedes.
- Rejected attempts: EXPLORE says do not archive a rejected attempt "or create a retrospective unless requested". 002 and SCOPE keep failed planetary artifacts as "diagnostic evidence", until the designer ordered them deleted (002 "Cleanup"). MEM study-sections-stay-historic wants earlier examples frozen, which adds copies of components. These cover different cases (rejected versus accepted-but-superseded), but the boundary is left to judgment.
- Carry-over: FORMDRIFT and EVAL want failed history kept out of fresh studies (cycle zero), while MEM study-sections-stay-historic, EXPLORE ("Carry in ... useful current-cycle agreements") and close-loop want evidence retained. SKILL-DS reconciles it by limiting history to "a specific research question".
- AGENTS.md size check: ALPHA says an oversized AGENTS.md "failed its size check" (28 Oct). MEM design-md-purpose (2 Nov) says size limits "warn and never block", and `scripts/check-contracts.mjs` only calls `warn`. The gate was softened; the ALPHA table is stale on this point.
- Lesson promotion: ALPHA, PLANETARY and DERELICT say lessons stay candidates until reviewed. But 002 records approvals within the same conversation as the incident (for example 30 Oct "approved all four proposals after review of the closure evidence"), and the 2 Nov change was adopted on the designer's "workflow decision, not a proven causal explanation" (002). That is consistent with "review before promotion" only if the human approval counts as the review.
- DERELICT versus 002/EXPLORE: DERELICT says the existing exploration skill "already calls for" replacement of unusable attempts and "the evidence does not establish a missing-rule problem", yet the 2 Nov rule is the one being tested. 002 and EVAL say the repairs await a "fresh human-reviewed round" to show effectiveness. DERELICT is, in effect, such a round with an unfavorable first-turn result; it frames the next step as better application, not as a rule change.
- Diagnosis of the planetary failures: PLANETARY (designer): "context failure ... the agent worked as expected". SCOPE (designer): the problem "was too large for one study ... not that the current skill needed another repair". 002 repairs the skill anyway (phasing, one-decision bound). The documents carry both diagnoses as separate for different cycles; 002 says the observations "do not prove a single prompt caused the failures".
- design.md says "Tone of voice. Not yet decided." while MEM and `writing-pruning.md` police language drift without a defined voice; writing-pruning's own scope is "a future technical-writer agent ... does not exist yet".
