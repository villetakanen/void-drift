# Fitted starter fleet — 0.4.3

Owner request: replace default ships with Light ions in every side/aft slot,
one energy pack on Fighter and two on Tank, then release 0.4.3. The owner then
explicitly permitted deleting the old pre-alpha leaderboard.

Implementation `3755a45` was committed and pushed to `origin/feat/0-4-0`.
Main-game defaults now consume the shared assembled renderer and ion simulation:
Scout 3 engines / 100 energy; Fighter 4 engines / 1 extra battery / 200 energy;
Tank 5 engines / 2 extra batteries / 300 energy. Stabilizers remain off. Saved
builder ships and the two-side-ion Flight Lab fixture are unchanged. New scores
use `ion-1`, with namespace/ownership checks and the existing bounded queries.

All nine release gates passed with source unchanged during verification:
`artifacts/verification/2026-11-01T07-15-58.130Z-ivDDbt/report.json`.
This identifies pre-commit HEAD `419e637` and the tested dirty-tree fingerprint.
Results: contracts, commit lint, formatting, strict types, 90 unit tests, production
build, 19 Chromium browser tests, 10 Firestore rules tests and emulator competition.
Environment: macOS arm64, repository Node/pnpm and temporary Temurin Java 21.
Afterward, only spec prose was corrected to reflect the owner's newly authorized
leaderboard deletion; contracts, lint and diff checks passed for that correction.
Application and rules source were unchanged from verification. The commit hook and
post-commit commit-range check passed.

The authorized command `firebase firestore:delete artifacts/void-drift/scores
--recursive --force --project void-drift-alpha` exited successfully before deploy.
The live 0.4.2 leaderboard then displayed “No scores yet. Set the first mark.”
No new live scores were submitted. The new challenge isolates any later writes
from clients still running the old release.

Firebase Firestore rules/indexes and Hosting deployment completed successfully on
2026-11-01. Log: `artifacts/releases/0.4.3/deploy.log`. Live browser inspection after
reload showed SURVIVAL / 0.4.3, Fighter's four-ion/one-pack description and 200
capacity; selecting Tank showed its five-ion/two-pack description and 300 capacity,
and Scout showed 100. Initial navigation reused an old cached page; reload resolved
it. Local visual inspection showed the Fighter and all four firing engine outputs.

The deployment is implementation evidence, not human handling/balance approval.
Reports and screenshots are ignored local artifacts, not remote backups. Unrelated
`.claude/` files were preserved. This evidence-only follow-up does not alter the
released application. No process lessons are inferred.
