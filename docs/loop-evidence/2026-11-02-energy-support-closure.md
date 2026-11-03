# Extra-energy support study — closed

Closed 2026-11-02 at the owner’s request. The owner explicitly called this study
“completely and utterly failed”; registry status is `stopped`, phase `exploration`.
No visual design was accepted for implementation. This record collects evidence,
not general lessons or new workflow rules.

## Intent and delivered work

The initial request was to establish extra-energy equipment’s nature, name and
appearance alongside the production ships and engines, retaining support-family
identity and static above/below-hull mounting.

Sources: this chat; [study source](../../apps/web/src/pages/lab/studies/energy-support-2026-11-02.astro);
[registry](../../apps/web/src/data/studies.ts). Review route:
`/lab/studies/energy-support-2026-11-02`.

- 01 recorded normal +85 and large +140 capacity, intrinsic ship capacity 100,
  and large mass twice normal. The sizes must remain recognizably the same device.
- 02.1 supplied paired construction sketches. The owner found the step useful as
  evidence that form exploration preceded understanding, and explicitly requested
  its retention with that finding.
- 02.2 explored names and fictional storage principles. The owner rejected the
  introduced “pilot’s benefit” framing. It was removed, and an owner-requested
  example was added to [writing-pruning](../writing-pruning.md) for a possible
  future writing-review loop. No such loop was created.
- 02.3 developed Void capacitor and Potential well descriptions and sketches.
  The owner selected Void capacitor with multiple lattices separated by void
  wells during that round. Naming and that fiction were later reopened; they
  were not carried into the final restart brief as givens.
- 02.4 supplied normal/large procedural drawings with production ship renderers,
  mount coordinates, engine choices and layer controls. The owner rejected the
  visuals as unrelated to the support family and faux-3D low-poly language.
- 02.5 proposed a containment-housing pivot in text. The owner then declared the
  study failed and requested a prompt for another chat, rather than further
  recovery work here.

Retained components: `EnergyReserveForms.astro` and `VoidCapacitorMounts.astro`.
Production gameplay and artwork definitions were not changed by this study.
Readiness and scope were not reached.

## Restart brief and owner feedback

The owner clarified that the design task is to establish diegetic identity,
name and purpose, write a part-list blurb, then design an appearance fitting the
ships and support family. The resource abstracts ship operation and sustenance,
including propulsion, oxygen and heat; it is not only engine fuel. Its basic
capacity-increasing function was already given.

The final chat prompt preserved these facts and the capacity/mass constraints,
requested direct inspection of production artwork and authoritative guidance,
and defined a fresh cycle through its starting sources. It removed speculative
construction requirements and named discarded concepts from that boundary.
The prompt is retained in the chat writing block `82516`; it was not saved as a
separate repository artifact.

At closure the owner reported: “good work on the promt, the other cycle nailed
it.” This is owner-reported success of a separate cycle, not acceptance of this
study’s drawings. The separate cycle’s design, checks and status were not audited
or modified as part of this closure.

The owner attributed drift to repeatedly questioning givens. Earlier assistant
explanations of visual failure were hypotheses, not investigated causes or adopted
factory lessons. No general process changes are promoted by this record.

## Checks and evidence limits

Chat tool results record successful iteration builds and a successful `pnpm check`
(Astro: 139 files, zero errors, warnings or hints). A targeted Biome check initially
failed on a callback return; it passed after repair. These checks applied to their
then-current uncommitted trees, not a retained source fingerprint.

Browser access failed during some rounds. Later screenshots directly established
that the study and mounted drawings rendered, including the restored 02.3 content.
Rendering did not establish design acceptance. Full verification, full browser
suite, Firebase checks and gameplay testing were not run for this study.

At closure, `/tmp/energy-study-build.log` was directly inspected and reports a
successful 48-page build. This mutable temporary log has no retained revision
fingerprint and is not durable proof of the final tree. Historical checks were not
rerun to fill that gap. Closure validation is limited to changed metadata and
record/page consistency; no new gameplay correctness claim is made.

## Revision and publication

Directly inspected closure HEAD: `a73728b667d3fa654c788d2730310e0cc7e73b12`.
The study page and its two components are untracked; the registry has shared
uncommitted changes. Numerous unrelated changes and separate-cycle artifacts are
present and preserved. No commit, push, deployment or live verification was
performed by this chat. Closure changes only this record, this study’s registry
status and its page notice.
