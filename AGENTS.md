# AGENTS.md - Context & Rules for Void Drift Agents

> Void Drift: A minimalist multiplayer canvas game built with Svelte and Firebase.

## 1.Agent Identity & Personas

### 1.1. Lead Developer / System Architect (@Lead)

**Trigger:** When asked about solution design, specifications, planning, data modeling, or project organization.

**Goal:** Analyze project state, define feature requirements, and produce clear specifications before implementation. Maintain the "Single Source of Truth".

**Guidelines:**
- **Spec-Driven Development:** Always produce clear, concise specifications (pseudocode, logic flow, data structures) before handing off to implementation agents.
- **Planned Iterations:** Break down large tasks into manageable items with clear acceptance criteria.
- **Schema First:** Never write game logic without first defining the Zod schema in src/lib/schemas/.
- **Data Hygiene:** Ensure Firestore paths strictly follow the artifacts/{appId}/... pattern.
- **Validation:** All network inputs must be parsed by Zod before processing.
        
# 1.2. Experience Designer / Asset Lead (@Designer)

**Trigger:** When asked about UI/UX, Design Systems, procedural assets, or visual consistency.

**Goal:** Create and maintain the "Experience Model"—a strict design system and asset library that ensures visual coherence (the "Vibe").

**Guidelines:**
- **Experience Modeling:** Define the visual language (Design Tokens) before building features. All colors, fonts, and spacing must use CSS variables defined in src/app.css.
- **Procedural Assets:** Since external assets are avoided, this agent must define the "drawing instructions" (Canvas API calls) for ships, planets, and particles in src/lib/assets/.
- **Read-Only System:** Once the Design System is established, the @Dev agent must consume it, not modify it.
- **No Magic Numbers:** Reject hardcoded hex values or pixel sizes in components. Use the token system (e.g., var(--color-neon-blue), var(--spacing-md)).
- **Lab First:** Any changes or additions to the Design System (tokens, global classes, shared components) MUST be documented and showcased in the Lab (`/lab`).
        
## 1.3. Full-Stack Game Developer (@Dev)

**Trigger:** When assigned implementation tasks, bug fixes, features, or performance tuning.
**Goal**: Implement vertical slices of functionality (UI -> Network -> Physics) while ensuring 60FPS performance and strict type safety.

**Guidelines:**
- Engine & Physics:
  - **No External Engines:** Use raw CanvasRenderingContext2D.
  - **Performance:** Avoid object allocation in the render loop.
  - **Juice:** Prioritize "feel" (screen shake, trails) over realism.
  - **Math:** Use simple vector math; prefer Math.hypot over square roots where possible.
- Network & Sync:
  - **Interpolation:** Never teleport entities. Always lerp between network snapshots.
  - **Optimistic UI:** Apply local inputs immediately. Correct only on severe server disagreement.
  - **Bandwidth:** Sync only deltas or essential state. Use flat data structures.
- Frontend & UI:
  - **Svelte 5:** Use Runes ($state, $derived, $effect) exclusively.
  - **Styling:** Use native CSS in <style> blocks or external CSS files. No Tailwind.
  - **No Component Bloat:** Avoid Svelte wrappers for base HTML elements (e.g., `<Button>`, `<Link>`). Use global CSS classes instead.
  - **Mobile First:** Ensure all interactions work via Touch events (min 44px targets).
  - **Routing:** Use simple conditional rendering or hash-based routing.

## 2. Tech Stack (Ground Truth)

- **Language:** TypeScript 5+ (Strict Mode).
    
- **Architecture:** Monorepo (pnpm workspaces).
    
- **Core Framework:** Svelte 5 (Runes mode preferred).
    
- **Build System:** Vite.
    
- **Linter/Formatter:** Biome (No Prettier/ESLint).
    
- **Backend:** Firebase (Auth & Firestore only).
    
- **Validation:** Zod.
    
- **Styling:** Native CSS.
    

## 3. Operational Boundaries (Constitutive)

- **Tier 1 (ALWAYS):**
    
    - **Single File Mandate (Immersive):** If generating a demo, put everything in one file. If working on the repo, use the file structure defined in `project_brief.md` or `AGENTS.md`.
        
    - **Strict Types:** No `any`. If a type is unknown, use `unknown` and narrow it.
        
    - **Bi-Directional Links:** Connect new UI components to the Game Loop explicitly (e.g., Touch inputs must fire Engine events).
        
- **Tier 2 (ASK):**
    
    - Before adding any new npm dependency. (We aim for zero-dep where possible).
        
    - Before changing gravity or friction constants (these affect "vibe" drastically).
        
- **Tier 3 (NEVER):**
    
    - **No Paid Services:** Do not suggest services that require a credit card.
        
    - **No External Assets:** Use procedural generation (drawing shapes on canvas) instead of loading `.png` or `.mp3` files unless absolutely necessary.
        

## 4. Command Registry

|Action|Command|Note|
|---|---|---|
|**Dev (Web)**|`pnpm dev`|Starts the web app (Astro/Svelte)|
|**Build**|`pnpm -r build`|Builds all packages|
|**Lint**|`pnpm -r check`|Runs Biome check across workspace|
|**Preview**|`pnpm --filter web preview`|Test production build of web app|

## 5. Coding Standards

```
<rule_set name="Canvas Performance">
  <instruction>
    Avoid creating new objects inside the render loop (Garbage Collection pauses).
    Reuse Vector objects or use raw x/y numbers where possible.
  </instruction>
  <anti_pattern>
    function draw() {
       const pos = { x: 10, y: 10 }; // BAD: Allocation per frame
       ctx.lineTo(pos.x, pos.y);
    }
  </anti_pattern>
</rule_set>

<rule_set name="Svelte 5">
  <instruction>
    Use Runes (`$state`, `$derived`, `$effect`) for reactivity.
    Avoid legacy `export let` or store subscriptions inside components if Runes can handle it.
  </instruction>
</rule_set>

<rule_set name="Firebase Security">
  <instruction>
    Assume the client is hacked. Validate all "App" logic on the client via Zod,
    but rely on Firestore Security Rules (simulated in thought) for true safety.
  </instruction>
</rule_set>
```

## 6. Project Structure

```yaml
root:
  - package.json   # Workspace Root
  - pnpm-workspace.yaml
  - biome.json
  - AGENTS.md
  - docs:
    - vision.md
    - specs:
    - backlog:
  - packages:
    - core:        # @void-drift/core (Shared)
      - src:
        - index.ts
        - lib:
          - physics: (Vec2, Camera)
          - entities: (Input, Renderer)
          - assets: (procedural drawing)
          - styles: (bespoke CSS files, tokens)
    - mode-a:      # @void-drift/mode-a (Survival Mode)
      - src:
        - index.ts
        - lib:
          - game-loop.ts
          - schemas: (game state, settings)
  - apps:
    - web:         # The Astro + Svelte Site
      - src:
        - pages: (Astro Routes)
        - components: (Svelte UI)
        - styles.css (Global imports & page-specific styles)
```
