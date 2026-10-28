# Architecture

Read for changes to structure, simulation, or data flow. Product scope belongs in
[the charter](rebuild-charter.md); verification belongs in [development](development.md).

## Current implementation

- pnpm workspace; TypeScript, Astro routes, Svelte 5, and Vite.
- `packages/core/src/lib/`: physics, input, camera, renderer, procedural assets,
  effects, shared styles, and common schemas.
- `packages/mode-a/src/lib/`: survival rules, game loop, ship configuration,
  state/settings schemas, and the legacy Supabase integration.
- `apps/web/src/`: Astro pages, Svelte orchestration/UI, settings persistence,
  and Lab views. `GameWrapper.svelte` currently coordinates simulation and rendering.
- `packages/mode-a/src/schemas/highscore.ts`: legacy score data contract.
- Production is currently a static Astro build. Package dependencies and scripts
  are authoritative in their respective `package.json` files.

Current limitations: simulation uses variable frame deltas and global time/randomness;
ship profile flight values are not yet passed into physics; camera translation exists
but automatic framing/zoom is unfinished. Legacy explicit `any` and hot-loop allocation
remain cleanup work, not examples to follow.

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

## Backend transition

Firebase Auth and Firestore are the selected target. Supabase remains the current
implementation until a separately verified migration replaces it.

- Put Firestore documents under `artifacts/{appId}/...`.
- Validate incoming data and test security rules for allowed and rejected access.
- Treat clients as untrusted. Client schema validation does not prove score integrity.
- Decide score verification, versioning, and migration needs before deployment.
- Local game/Lab boot and deterministic checks must work without live credentials.
  Report unavailable shared scores honestly; label test fixtures as fixtures.
- Keep live service checks separate from repeatable local verification.

## Change discipline

Record significant architecture decisions with context and consequences. Keep current
implementation and planned targets distinct. Read relevant feature specs on demand;
historical roadmaps do not define current architecture requirements.
