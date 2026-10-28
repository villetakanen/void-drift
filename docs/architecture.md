# Architecture

Read for changes to structure, simulation, or data flow. Product scope belongs in
[the charter](rebuild-charter.md); verification belongs in [development](development.md).

## Current implementation

- pnpm workspace; strict TypeScript, Astro routes, Svelte 5 and Vite.
- Core owns physics, camera, input, procedural drawing and shared styles.
- Mode A owns the fixed 60 Hz `Simulation`, seeded trials, ship profiles and Firebase boundary.
- `FlightDeck.svelte` composes the same systems for the game and `/lab/flight`.
- Replay takes validated settings and ordered input/tick chunks. Rendering reads state;
  simulation time drives orbits and animation. Camera zoom frames the ship and star,
  with an explicit snap when crossing the circular arena boundary.
- `packages/mode-a/src/schemas/highscore.ts` defines the strict score contract.
- Production is a static Astro build; package manifests own dependency versions.

## Agreed boundaries

- Core remains independent of the web application and survival mode. Mode may use
  core; web composes both. Use existing packages rather than a new engine framework.
- Render with `CanvasRenderingContext2D`. Reuse vectors/buffers in hot loops;
  prefer scalar arithmetic and `Math.hypot` where appropriate.
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

- Documents live at `artifacts/void-drift/scores/{uid}_{shipId}`.
- A user retains one personal best per ship for challenge `alpha-1` (seed 2026).
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
