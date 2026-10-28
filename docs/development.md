# Development and verification

Use conversation to request changes, inspect evidence, and review the game/Lab.
An IDE is optional. Read [architecture](architecture.md) for implementation boundaries
and [design](design.md) for experience changes.

## Setup

Use Node 22 or newer and pnpm 10.33.0 (pinned in `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm dev
```

Open `http://localhost:4321` for the game and `/lab` for design examples. Missing
Supabase credentials permit local game/Lab use; shared scores show unavailable.
Existing configured sessions still use the legacy backend pending the Firebase migration.

## Checks

```sh
pnpm verify
```

This runs every stage, records individual results, and exits unsuccessfully if any
stage fails or source files change during verification. It never auto-fixes source.

| Stage                  | Scope                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm check:contracts` | Agent guide under 80 lines; referenced context paths exist                                   |
| `pnpm lint`            | Biome formatting, imports, and recommended rules; warnings fail                              |
| `pnpm check:types`     | Astro diagnostics plus explicit workspace TypeScript checking                                |
| `pnpm test`            | Unit tests in packages                                                                       |
| `pnpm build`           | Production static build                                                                      |
| `pnpm test:browser`    | Chromium: local ship selection/start/input feedback, Lab drawing changes, unavailable scores |

Browser tests launch their own local server on port 4322, blank backend credentials,
and block external browser requests. They do not reuse a potentially stale server.
Failures retain traces/screenshots; the Lab test attaches a drawing capture.
Run `pnpm exec playwright show-report` to inspect browser evidence.

`artifacts/verification/latest.json` records commands, statuses, log paths, revision,
working-tree state, environment, and a source fingerprint including nonignored new files.
Logs and browser artifacts are local ignored output. Evidence describes the tested
working tree; a later change requires fresh verification. It is not deployment evidence.

GitHub Actions is configured to run the same command and upload evidence even on failure.
It only runs after an explicitly authorized push; branch protection is not configured here.

## Adoption status

This is an initial, deliberately strict gate. Existing lint and type failures remain
visible until repaired; it is not a fully green baseline. New tooling files are checked
separately during introduction. A failed legacy stage does not suppress other stages.

The browser checks currently cover UI input feedback, not proof of a specific ship
trajectory. Deterministic simulation/replay, touch cancellation, game-over/restart,
camera framing/wrap, Firebase rules, and visual regression baselines still need their
own contracts and checks. Captured Lab images are evidence, not approved golden images.

Do not turn off rules or auto-update visual baselines to conceal failures. Repair
legacy debt in reviewable increments, preserving the owner's pre-existing changes.
