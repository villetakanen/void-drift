# Path instrument study — closure evidence

Closed 2026-11-01 during exploration: **incomplete and failed**, by explicit owner instruction. This is a bounded evidence record. It does not state causes, lessons or process changes; the owner requested a separate causal analysis and a restart prompt, which are not part of this record.

## Intent and scope

Owner brief (paraphrased from the first message): a design study for a design-study tool that is also a Lab tool. It draws speed, acceleration, turning acceleration and the paths of several vehicles, with a way to choose configurations. All controls sit in a side pane that can be minimized or maximized. The instrument expects its own container and treats it as a screen at least iPad Pro-sized, in laptop proportions; scrolled into view it snaps into place; in the Lab it fills the whole screen; it can sit inside a CSS container in flowing text.

Source: this chat's owner messages. Study page `apps/web/src/pages/lab/studies/path-instrument-2026-11-01.astro`, local route `/lab/studies/path-instrument-2026-11-01`, metadata entry in `apps/web/src/data/studies.ts` (status `closed`, phase `exploration`).

## Sequence and human feedback

Quotes are short owner extracts; paraphrases are attributed.

1. Agent opened the study as a "flight bench" (slug `flight-bench-2026-11-01`, never committed). Owner: "this is not a flight bench… it's not a flight bench." Agent renamed the study to `path-instrument-2026-11-01`.
2. Owner: "we want to … calculate flight paths, not simulate them … There needs to be no animation. Just static drawing."
3. Owner stated the core problem: when studies compare "ship velocity or weight or engine thrust", agents "guess and try to figure out a new kind of instrumentation there. So it makes that comparing them completely impossible." Section 01 was rewritten around comparability.
4. Owner: "Yes, explore it." Agent delivered 02.1 (two studies drawn on fitted axes and on one fixed instrument). Owner: "this is already very useful, the 2.1." Owner stated the lesson: the path view needs two formats, auto-zoom to all paths, and a default scale that can be moved around with the mouse; "just for the flight paths view."
5. Agent delivered 02.2 (toggle and pan). Owner: both modes work; "very, very simple and usable"; "Right now it works perfectly"; default scale value still undecided.
6. Agent proposed marking the path/trace correspondence. Owner proposed a time slider with a tick on each path and measurement graph: "very graph-like, not very game-like." Agent delivered 02.3. Owner: tenth and hundredth of a second steps, "both"; asked for a tangent line at the marker; "I think it's very good. I like it." Owner said a better slider exists in other studies and should become a design-system component "after this study".
7. Owner on the marker line: "now … along the line, not tangential? as in 90 deg. Its also very … overpowering"; then "now its too short to notice"; then "now that's good. but we are quite deep in the weeds … I'm more concerned about how the css container works, and how do we make these readable."
8. Agent began 02.4 (container reflow and scale comparison, 1100 px docking threshold, 24rem minimum view width). Owner interrupted the tool call: "what are we even doing here? … this topic is either too broad, or then the design study is too nuanced … why would those things be in question? like at all? … ask questions on how is that inline-size css container supposed to work?"
9. Agent listed questions in chat. Owner: "ask questions, here in chat"; then "you have been listing the questions now a couple of times, how about asking them?" Agent used the question tool once; owner chose: scale the whole screen down, fixed screen shape, pane slides over the views. Owner then: "i thought I gave those as constraints in the original brief. they are not to discover."
10. Agent built a fixed 1440×900 screen with a slide-over pane and a resizable-frame demo. Owner: "why would that matter?" (about 600 px readability), then: "the column is either full-container on lab, or full-container-width, with scroll-snap to 'center' on flowing text. these are given, not part of exploration. I do not understand how 02.4 relates to topics we want to explore." Agent removed 02.4 from the page.
11. Owner: "more concerned of the layout itself. Do we know what elements fit to the 'roughly ipad pro (or macbook pro smaller) sized' screen comfortably?" Agent answered with approximate device sizes from memory (not looked up). Owner: "we are deep in the weeds … those are pixels. We don't have physical screens anyway. So it needs to be readable on … my iPad screen, even … on the lab screen." Agent attempted the iOS Simulator; unavailable (see checks). Owner interrupted: "We're kind of completely looping … what is this discussion about?"
12. Owner closed the study: "This design study completely failed. This is an utter failure. That's a success in itself." Owner asked for it to be logged incomplete and failed, kept in the repo, a close-loop check, a cause analysis, and a new prompt for Sonnet 5.5 or Opus 5.5. Owner also described the failure as a finding about testing the design skills.
13. Owner statement, attributed and untested: "we now know that essentially running the design skill with Sonnet 5.5 will not work. The model is not simply powerful enough." Agent stated in chat that this run does not isolate model capability. No comparison run on another model exists at closure.

## Changes delivered

Revision basis: branch `feat/0-4-0`, HEAD `f401feda48eb6ee6da12cf42204d29ad1c1c4377`, plus uncommitted study changes. Pre-existing untracked `.claude/` is unrelated and not included.

- Study metadata and page: `studies.ts` entry; page with closure section, 01, 02.1–02.3, and a "03 / Not reached" placeholder. 02.4 was removed from the page and is not retained.
- Study sources under `apps/web/src/components/studies/`: `path-instrument.ts` (Zod series schema, fixed scales, derived traces), `PathInstrument.svelte`, `PathView.svelte`, `path-fixtures.ts`, `PathComparisonRows.svelte`, `PathViewDemo.svelte`, `PathTraceDemo.svelte`.
- Drafted after 02.3 and unreferenced by any page: `InstrumentScreen.svelte` (fixed 16:10 screen, slide-over pane, `scroll-snap-align: center`) and `InstrumentContainerDemo.svelte` (resizable frame).
- The path calculations reuse `simulateRotation` from `rotation-bench.ts`; no production code, tuning value or shared design-system file was changed.

## Checks

Commands run from the repository root on the dirty tree; environment: local macOS shell.

- `pnpm lint` (Biome): passed in the final run (339 files, no fixes needed). Earlier runs failed on formatting and on two accessibility rules (non-interactive element with tabindex; role on div) and were repaired.
- `pnpm --filter web exec svelte-check --tsconfig ./tsconfig.json --fail-on-warnings`: failed once (variable `derived` collided with the `$derived` rune; 9 errors), repaired; final run 714 files, 0 errors, 0 warnings.
- `pnpm check` (astro check): **agent's earlier reports of a pass were wrong.** From the 02.3 turn until after 02.4 was drafted, the output contained an error (ts(2322): `client:load` on components without props) that the agent's output filter did not display. It was found when duplicate-import errors prompted a full read; fixed by adding optional `label` props to `PathTraceDemo.svelte` and `InstrumentContainerDemo.svelte`. Final run after 02.4's removal: 0 errors, 0 warnings.
- Not run: `vitest`, Playwright browser tests, `pnpm build`, `pnpm check:types` as a whole (its `tsc -p tsconfig.check.json` step), contract check, `pnpm verify`.
- Unavailable: iOS Simulator. `xcode-select` points to the Command Line Tools; `xcrun simctl` is not found; the control tool reported that a full Xcode install is needed. No iPad, touch or physical-device check was made.
- Browser inspection in the in-app preview (local dev server; configured port 4330 was unavailable, port 4333 used): rendering and spacing of 01 and 02.1; 375 px layouts of 02.1 and 02.3; 02.2 toggle, mouse drag, arrow buttons and Recenter; 02.3 slider values, markers, cursor, and the measured tick angle (within about 1° of perpendicular at three markers); the 02.4 draft at 960 px (scale 0.665) and 600 px (scale 0.415) with the pane open. Keyboard use was checked only through the buttons. Console showed a 404 resource error (not identified) and a stale hot-reload error for a deleted component.
- Screenshots and tool outputs were temporary and are not retained here.

## Publication

Nothing pushed, deployed or published. A local commit is created with this record; its identifier is the commit that adds this file.

## Findings (observations only)

- 02.1–02.3 each delivered an inspectable static example for a question the owner had stated or proposed; the owner's feedback on each is quoted above.
- The first framing and the first 02.4 draft were each followed by the owner rejecting them as unrelated to their intent (items 1, 8, 10).
- The original brief (item above) contains the container-as-screen, side-pane and snapping statements. In the chat, those points were turned into three questions the owner answered, then the owner said they were constraints.
- Two questions the owner asked to have asked were first delivered as chat lists (item 9).
- The agent reported astro check as passing while it had an error (checks section).
- Device dimensions in the agent's layout answer were stated from memory, without a lookup (item 11).
- Final owner assessment: failed and incomplete; the owner's model-capability statement (item 13) is the owner's inference, untested.

## Unknowns and evidence gaps

- Causes of the failure have not been investigated in this record.
- No evidence on iPad or Lab-screen readability of the composed instrument; trace scale fit-versus-fixed, configuration selection, pane contents and default scale value remain undecided.
- No run of the same brief on another model or with different instructions exists.
- Page versions before closure, screenshots and the full transcript are not retained as artifacts here.

## Requested follow-ups (not inferred by this record)

Owner requested a cause analysis and a new prompt to restart the work on Sonnet 5.5 or Opus 5.5. Both were delivered in chat as the assistant's interpretation and are unreviewed; they are not standing rules and no skill or contract was changed.
