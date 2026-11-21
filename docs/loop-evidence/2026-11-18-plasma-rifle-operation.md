# Plasma rifle operation

## Finding recorded during 02.2 · 18 November 2026

The designer reported a recurring problem with study steps. Describing what a comparison explores or isolates is welcome, but instructions for operating the tools and accounts of the study’s internal discussion make the steps tedious to read. They described this prose as “4/5 longer than we'd need to have for each step.” The 02.1–02.2 draft, for example, directed the reader to pause, switch treatments and scrub across target loss.

Source: designer feedback during [the plasma rifle operation study](../../apps/web/src/pages/lab/studies/plasma-rifle-operation-2026-11-18.mdx). The length estimate is the designer’s assessment.

## Closure · 18 November 2026

The loop explored how a pilot reads a fitted rifle charging, losing its target and firing. The designer requested both Wasp under-carriage and Fighter top-mount views after the top view hid the bead shape. They preferred brightening over growth, and direct length and position controls settled the primary bead. Later trials retired those controls and retained the two ships. The shared Flight inspector gained a selectable scene readout clear of the scale buttons, with study controls in the hamburger pane.

The designer accepted the operating model and five-slice Playground scope with “scope looks good. let's accept the study.” The [static study](../../apps/web/src/pages/lab/studies/plasma-rifle-operation-2026-11-18.mdx) and [registry](../../apps/web/src/data/studies.ts) record that decision. The rifle remains an inert Playground fitting. A separate shared-game change in this loop prevents automatic weapons from firing at 10 power or less.

### Accepted operating decisions

A ship or derelict in the muzzle sector starts charging. Debris can take damage without triggering acquisition. Charging costs 5 power/s for up to 0.7 s. Release requires 13.5 available and spends 3.5. A lost charge vents in proportion to its fill, taking 0.3 s from full. Cooldown lasts 2.1 s after venting or after the 0.7 s firing phase. A surviving target can trigger another cycle without leaving the sector.

Both sprays inherit release velocity and add 300 u/s along their outlets. Vent force and the release kick scale with fitted mass. The kick is 0.7 s at 70% of one plasma engine’s thrust. Each body takes one primary hit measured from its nearest material, with 75, 50 and 25 damage through 10, 26 and 42 u respectively. Entry into the combined fume area deals 3.

### Evidence and limits

- The [final capture pair](../../apps/web/public/studies/plasma-rifle-operation-2026-11-18/029-charge.jpg) shows the Wasp B1 pass at 93% charge and 95.5 power at 0.65 s. At [0.90 s](../../apps/web/public/studies/plasma-rifle-operation-2026-11-18/029-contact.jpg) the 75-point strike removed the wreck’s remaining 37 hull. The readout recorded 50 splash and 3 fume damage. The designer parked 02.1 without capture.
- Before instrument retirement, local Vitest reported 30 passes across rifle, salvage and energy-floor tests. After adding the repeat-cycle case, the nine rifle tests passed and `pnpm exec tsc -p tsconfig.check.json` exited successfully. These were separate working-tree runs. The study harness and its tests were retired at acceptance.
- The acceptance run verified 15 retained image references. Its local `pnpm build` log recorded 111 pages built successfully. The run log was inspected at closure in `/private/tmp/void-rifle-accepted-build.log`, a temporary artifact.
- Closure inspection found the accepted page, captures and registry changes in the local working tree over `2b24c35d2e61c366179b8bbba2da6e8c14043fa8`. No publication commit, push, deployment or hosted verification was recorded. Live ship damage and frame cost with several rifles firing remain unverified.
