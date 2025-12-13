# Specification: Project Scaffolding & Initialization

**Feature:** Initial Repository Setup
**Status:** DRAFT
**Owner:** @Lead
**Implementer:** @Dev

## 1. Goal
Initialize the `void-drift` repository with the core technology stack and directory structure defined in the Project Vision. This provides the blank canvas for the Game Engine implementation.

## 2. Technical Stack Checklist (Strict)
- **Runtime:** `pnpm` (User Preference).
- **Bundler:** Vite.
- **Framework:** Svelte 5 (Runes Mode). *Ensure `svelte` version is `^5.0.0`*.
- **Language:** TypeScript.
- **Linting:** Biome.
- **Styling:** Vanilla CSS (No Tailwind).

## 3. Implementation Steps

### 3.1. Initialize Vite Project
1. Run `pnpm create vite . --template svelte-ts` in the root.
2. Upgrade Svelte to Version 5:
   - `pnpm add -D svelte@next` (or latest stable Svelte 5).
   - Update `svelte.config.js` or `vite.config.ts` if specific Svelte 5 flags are required (usually standard vite plugin works).
3. Install Core Dependencies:
   - `pnpm add zod firebase`
   - `pnpm add -D @biomejs/biome`

### 3.2. Configure Tooling
1. **Biome:**
   - Run `npx @biomejs/biome init`.
   - Configure `biome.json` to enable formatting and linting suitable for Svelte/TS.
2. **TypeScript:**
   - Ensure `tsconfig.json` has `"strict": true`.

### 3.3. Directory Structure
Create the following folder hierarchy (pruning default Vite files like `Counter.svelte` or `lib/Counter.ts`):

```text
/
├── src/
│   ├── main.ts             # Entry point
│   ├── App.svelte          # Root component
│   ├── app.css             # Global reset / variables
│   ├── assets/             # (Empty for now)
│   ├── lib/
│   │   ├── config.ts       # Constants (Create empty file)
│   │   ├── firebase.ts     # Firebase Init (Create empty file)
│   │   ├── store.ts        # State Management (Create empty file)
│   │   ├── schemas/
│   │   │   ├── common.ts
│   │   │   └── game.ts
│   │   ├── engine/
│   │   │   ├── Loop.ts
│   │   │   ├── Physics.ts
│   │   │   ├── Renderer.ts
│   │   │   ├── Input.ts
│   │   │   └── Audio.ts
│   │   └── ui/
│   │       ├── Lobby.svelte
│   │       ├── GameHUD.svelte
│   │       ├── Joystick.svelte
│   │       └── Leaderboard.svelte
```

### 3.4. Clean Up
- Clear the contents of `App.svelte` to just render a simple "VOID DRIFT INITIALIZED" `<h1>`.
- Clear `app.css` and add a basic dark background reset:
  ```css
  :root {
    --color-void: #050510;
    --color-text: #ffffff;
  }
  body {
    background: var(--color-void);
    color: var(--color-text);
    margin: 0;
    overflow: hidden; /* Important for game canvas */
  }
  ```

## 4. Verification
1. Run `pnpm install`.
2. Run `pnpm dev`.
3. Open browser.
4. Verify "VOID DRIFT INITIALIZED" is visible on a dark background.
5. Run `npx @biomejs/biome check .` and ensure no errors.
