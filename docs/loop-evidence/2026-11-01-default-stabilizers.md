# Standard-flight defaults — 0.4.4

Owner requested Fighter as the default ship and enabled stabilizers on all ships
in default flights. Implementation `57d9769` was committed and pushed to
`origin/feat/0-4-0`. Main-game entry/reload now selects Fighter regardless of stored
selection. All fixed starter loadouts enable stabilizers; session ship choice,
engine/battery fittings, saved builder ships and optional Lab settings remain intact.

Full `pnpm verify` passed all nine gates with source unchanged:
`artifacts/verification/2026-11-01T07-28-48.430Z-uXUJbC/report.json`.
The report identifies pre-commit HEAD `f0599b6` and the tested dirty source fingerprint.
Results: contracts, commit checks, formatting, strict types, 90 unit tests, production
build, 19 Chromium browser tests, 10 Firestore rule tests and emulator competition.
Environment: macOS arm64, repository Node/pnpm, Chromium and temporary Temurin Java 21.
The first commit attempt failed its message line-length hook; the message was wrapped
and the hook plus post-commit commit checks passed without changing application source.

Firebase Hosting deployment completed successfully on 2026-11-01; rules/data were
not redeployed or deleted. Log: `artifacts/releases/0.4.4/deploy.log`.
Live browser inspection confirmed SURVIVAL / 0.4.4, Fighter selected initially,
and `data-stabilizers=true` after selecting each of Scout, Fighter and Tank.
Reload after selecting Tank returned to `balanced` (the Fighter identifier).
No live scores were submitted. Existing ion-1 scores remain in use.

Human handling/balance review remains separate from these checks. Ignored local
reports and logs are not remote backups. Unrelated `.claude/` files remain untouched.
This evidence-only follow-up does not alter the deployed application; no process
lessons are inferred.
