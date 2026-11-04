# Architecture

Read for changes to structure, simulation, or data flow. Product intent belongs in
[vision](vision.md); verification belongs in [development](development.md).

## Current implementation

- pnpm workspace; strict TypeScript, Astro routes, Svelte 5 and Vite.
- Core owns physics, camera, input, procedural drawing and shared styles.
- Mode A owns the fixed 60 Hz `Simulation`, seeded trials, ship profiles and Firebase boundary.
- `FlightDeck.svelte` composes the same systems for the game and `/lab/flight`.
- The FX correction accumulates new stamps on a shared persistent Canvas surface
  above ships/world and below HUD. Overlap adds light; the whole image decays with
  game time. Core owns buffers, stamp caches, bounded moving sparks and scene budgets;
  mode supplies actual engine and collector activity. Engines retain only current
  outlets, not trail history. `/lab/fx` exercises six production simulations together.
  The [FX contract](specs/sfx-canvas.md) owns lifecycle and performance acceptance.
- Replay takes validated settings and ordered input/tick chunks. Rendering reads state;
  simulation time drives orbits and animation. Camera zoom frames the ship and star,
  with an explicit snap when crossing the circular arena boundary.
- `packages/mode-a/src/schemas/highscore.ts` defines the strict score contract.
- Production is a static Astro build; package manifests own dependency versions.

## Agreed boundaries

- Core remains independent of the web application and survival mode. Mode may use
  core; web composes both. Use existing packages rather than a new engine framework.
- The current renderer uses `CanvasRenderingContext2D`. Reuse vectors/buffers in
  hot loops; prefer scalar arithmetic and `Math.hypot` where appropriate.
  Owner decision, 2026-11-03: the [FX layer](specs/sfx-canvas.md) may use a different
  backend when its behavior, performance and experience justify it. Its dependency
  boundaries and simulation authority remain unchanged. Backend alternatives are
  still proposals in the [FX investigation](plans/2026-11-03-fx-framework-triage.md).
- The target simulation accepts explicit time, randomness, configuration, and input
  so scenarios can be replayed. Rendering consumes simulation state.
- Lab and game consume the same simulation, camera, configuration, and drawing code.
- Zod schemas define changed data contracts before their consumers are implemented.
  Parse network data at the boundary; keep internal computation strictly typed.
- Use Svelte 5 Runes for new reactive component state. Existing store integration
  is migration context. Use Astro routes for pages and local state for game screens.
- Controls update the simulation immediately. If networked moving entities are
  introduced, interpolate snapshots and reconcile meaningful disagreement; send
  essential state. Arena wraps and resets have explicit transition contracts.

## Backend and trust

Firebase Auth (anonymous) and Firestore replace the legacy Supabase runtime.
The new `void-drift-alpha` project uses Spark, with no billing upgrade. Old SQL and
migration documents remain historical; scores are not migrated.

- Documents live at `artifacts/void-drift/scores/{CHALLENGE}_{uid}_{shipId}`; `CHALLENGE`
  (`packages/mode-a/src/schemas/highscore.ts`) is currently `ion-1`.
- A user retains one personal best per ship for the current challenge (seed 2026). Earlier
  challenges (`alpha-1`, `gravity-1`) retain their IDs.
- `CHALLENGE` changes once per release, only when rules or tuning differ from the previous
  release; see `docs/development.md#release`.
- Zod checks network data; tested Firestore rules enforce ownership, exact fields,
  bounds, challenge identity and increasing scores. Queries are bounded to 20 rows.
- Scores are **client-reported casual competition**, not cheat-resistant records.
  An attacker can fabricate a plausible score; no server simulation or rate limiting exists.
- Lab tuning is unranked. Only stock game configuration offers submission.
- No credentials are needed for local flight/Lab; unavailable scores are explicit.
- Auth/Firestore emulator competition is a separate gate from live release checks.

## Change discipline

Record significant architecture decisions with context and consequences. Keep current
implementation and planned targets distinct. Read relevant feature specs on demand;
historical roadmaps do not define current architecture requirements.

## Design tokens and component-private values

Owner decision, 2026-10-28: public design-system tokens express shared visual
contracts (palette, spacing, typography, control accessibility, motion and states).
Components may also own private custom properties named `--_name`. These are not
part of the public design-token API and need not be promoted merely because they
are CSS variables.

Declare private properties on the owning component/container selector, not `:root`.
Use them for component composition, local aliases, and values derived from system
tokens, for example `--_group-spacing: var(--spacing-sm)` used for both padding and
gap. A button's radius alias or pseudo-element inset may be private while its shared
shape or border foundation remains public. Component-only constants can be private
when they encode implementation rather than a cross-application design decision.
Do not hide shared color, spacing, typography, focus or accessibility choices behind
private literals to avoid defining their system contract.

CSS does not enforce privacy: custom properties still inherit and can be overridden.
The underscore is an ownership convention. Consumers must not depend on or override
private properties; expose a public token or explicit variant when customization is
intended. Audit existing consumers before renaming a public property.

Study audits distinguish existing public tokens, proposed private composition,
missing shared foundations, and structural CSS/fixtures. Record derivations and
ownership, rather than demanding a public token for every value. Existing global
`--button-*` names remain compatibility aliases. Shared buttons now own private
composition properties; shared button groups own `--_group-spacing` and
`--_stack-max`. The canonical `/lab/buttons` and application consume these same
definitions from core styles/buttons.css.

## Ship builder alpha — 0.4.0

`mode-a/lib/schemas/loadout.ts` validates chassis, parts and fixed-slot loadouts.
`build-flight.ts` owns assembled propulsion and energy calculations; Simulation
branches on an optional validated loadout while preserving legacy stock trials.
`build-renderer.ts` draws the same procedural fittings in the builder and flight.
`/builder` and `/lab/builder` compose the same ShipBuilder and FlightDeck components.
Resource power is absolute nonnegative energy; runtime clamps it to build capacity.
Custom runs are unranked and cannot use the stock score submission path.
See [Hangar](specs/hangar/spec.md) for assembly and flight handoff; the
[ship-builder history](history/ship-builder.md) retains provisional physics and tuning decisions.


### Ion motion integration — 0.4.2

Validated `FlightSettings.ion` owns custom ion acceleration/ceiling/rotation tuning;
`Loadout.stabilizers` now defaults true when absent in version-2 saves; explicit
choices survive, except Wasp and Fiddler always enable stabilizers. Simulation keeps
angular velocity, budgets engine and automatic stabilizer demand per substep, and
uses the same mounted emitter list as the renderer. Custom ions combine directional
force; other response families retain their pulse/charge behavior. Ranked stock
physics remains separate. FlightDeck draws the effective simulation loadout, so
imported Lab configurations and builder flights share rendering and power capacity.


### Default fleet — 0.4.3

Main-game `gameSettings` now supplies the fixed assembled Light-ion fleet, replacing
the legacy stock simulation at the game entry. New scores use `ion-1` IDs and queries;
Firestore retains the older challenge namespaces. `stockSettings` stays available
for legacy trials; `labSettings` retains the two-side-engine tuning fixture.

### LHI Fiddler flight integration — 2026-11-03

`fiddler-form.ts` preserves the supplied sketch's planar construction;
`fiddler.ts` owns the accepted scaled hull, Wasp-sized window, mount coordinates,
and four stabilizers. Study and production drawing share these definitions. The
right-wing crossed-edge gap is repaired in that common geometry.

Fiddler uses two required matching engine pairs, five independent below-hull
fittings, and the shared LHI four-stabilizer control path. Linking on commands the
two mains on the turning/braking side for forward thrust only; it leaves angular
authority with the stabilizers. Linking off separates main drive from single-input
turning. Fiddler profiles without a loadout acquire a valid default at the flight
schema boundary, so they cannot fall through to legacy stock physics or art.

It enters the main menu as 05 and the Hangar as an unranked flight trial. Score
validation retains the existing ranked fleet. Existing v3 Hangar stores gain a
Fiddler starting build without replacing their other ships. See the
[Hangar contract](specs/hangar/spec.md#fiddler-flight-trial--2026-11-03) for the
accepted starting fit and remaining human flight review.
