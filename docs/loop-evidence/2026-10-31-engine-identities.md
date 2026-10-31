# Engine identities and integration — loop evidence

Closed 2026-10-31 at the owner's request. Scope: engine-body exploration, fitting
on Fighter/Scout/battleship, initial behavior balance, integration and 0.4.0 publication.
Sources: this conversation, the engine study, and the local reports inspected below.
No bug investigation, reproduction, fixes or additional deployment is authorized by
this closure. The owner explicitly accepts leaving the reported issues for now.

## Decisions and delivery

The accepted bodies are small ion = 02.4/02 Medium needle, heavy ion = 02.4/03 Heavy,
fusion = 02.6 pale-strut braced chamber with acid chartreuse, and plasma = 02.9
simplified armored containment with amber. Charcoal low-poly/vector forms and the
ship's fake-3D shading were the aesthetic direction. Earlier plasma proposals were
rejected as toy-like or over-detailed. Engine appearances and the three ship fitting
treatments were approved in the study before integration.

The editor retains full-size bodies over a 70% hull, soft selected backlight,
per-slot background → part → border/labels, and side → aft → hull ordering.
Final mount adjustments were integrated. Scout engines sit beneath its hull in
flight; Fighter and battleship aft engines sit above. Shared artwork now serves
catalog, builder and custom flight. Charging/pulse HUD feedback and mount-relative
plume origins were connected; new plume aesthetics were outside this study.

Initial balance: small ion ceiling 500, heavy ion 750, fusion 550, plasma 700.
Fusion fires for 0.18s per 0.45s cycle; plasma charges 0.6s then sustains until
release. These are player-trial values, not established balance conclusions.
The owner explicitly discarded save compatibility: version-1 ship storage is
removed on opening the builder, with version-2 builds and no fission alias.
Stock ranked profiles remain unchanged; custom survival is unranked.
Study sections 03/04 and the ship-builder spec document readiness and integration.

## Verification and publication

The final [verification report](../../artifacts/verification/latest.json), inspected
at closure, records all nine gates passing on 2026-10-31, 17:16–17:17 Helsinki time:
contracts, commit-history checks, lint, types, 78 unit tests, build, 16 browser tests,
Firebase rules and competition. Node v24.14.0, darwin/arm64; backend checks used an
existing temporary Java 21 runtime. Source was unchanged during this final run.

The release came from a dirty working tree based on
`1bf9908c1aa9ed7be8b3f6b2d9d90618139457ae`, with fingerprint
`bb0cb096504d9f5d48d5195b58ab80a7e7eff7de6923d5cd4675decd43745b5f`.
No dedicated release commit or Git push was made in this chat. The tree included
parallel Scout/slot work; all shared-file changes cannot be attributed solely to
the engine loop.

Earlier attempts remain distinct: a browser server could not bind within the
sandbox; a save-reset test initially read before hydration; backend checks initially
lacked Java on PATH. Another release verification passed every check but failed
its source-stability guard when the parallel slot closure note appeared. The final
run above superseded those attempts, rather than making them retroactive passes.

Firebase CLI reported successful Hosting deployment to `void-drift-alpha`.
The [release manifest](../../artifacts/release-0.4.0.json) records version 0.4.0,
the same source fingerprint, asset hashes and live checks completed at 17:18 Helsinki.
The homepage, builder, engine study and version-module bytes matched the verified
bundle. Python's HTTPS check failed certificate validation; curl using system trust
completed those checks without disabling validation. Live byte matching establishes
publication identity, not visual quality or absence of gameplay bugs.

## Human feedback at closure

After viewing the published builder, the owner reported that “again we used lots
of texture that doesn't really seem to fit” and that integration introduced “a host
of bugs,” including “visual regressions.” No specific defects, screenshots or
reproduction steps were supplied with this closure request. These reports were not
independently investigated in this closure.

The owner also stated that “integrating two studies at the same time tends to
clearly kind of introduce a lot of bugs.” This is the owner's interpretation of the
experience, recorded for later review; this record does not establish concurrent
integration as the cause or adopt a new process rule. The owner said “right now
that's okay” and explicitly asked not to fix the issues here.

Earlier study approval and passing automated checks coexist with the subsequent
negative assessment of the integrated visuals. Neither the checks nor study
approval establishes acceptance of the published appearance as a whole.

## Evidence limits and closure boundary

The texture mismatch and regression scope remain unspecified. The responsible
changes, severity, and relationship between the two integrations are unverified.
Ignored reports, screenshots and the release manifest are mutable local artifacts;
there is no dedicated immutable source commit for this release. The essential
identifiers and outcomes are preserved here, but artifact retention is not assured.
No tests were rerun, production inspected anew, fixes made, or lessons promoted
for closure. Only this documentation record was added and validated.
