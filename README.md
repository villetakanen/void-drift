# Void Drift

**"Newtonian Chaos in a Shared Browser Tab"**

Void Drift is a multiplayer, top-down space brawler that prioritizes "game feel" (drift, inertia) over complex controls. Features distinct, high-contrast neon vector aesthetics.

## Architecture

This project is a Monorepo managed by `pnpm`:

- **`packages/engine`**: The core game logic, physics, and renderer. Framework-agnostic (mostly) but currently leverages Svelte 5 stores.
- **`apps/web`**: The production website built with Astro and Svelte 5.

## Quick Start

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Run Development Server**
   ```bash
   pnpm dev
   ```
   This starts the Astro dev server for `apps/web` at `http://localhost:4321`.

3. **Build**
   ```bash
   pnpm -r build
   ```

## Key Technologies

- **Runtime**: Node.js / pnpm
- **Framework**: Svelte 5 (Runes) + Astro
- **Language**: TypeScript
- **Styling**: Native CSS (No Tailwind)
- **Linting**: Biome

## Documentation

- [Project Vision](./docs/project-vision.md)
- [Agent Guidelines](./AGENTS.md)
