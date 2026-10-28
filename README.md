# Void Drift

**"Newtonian Chaos in a Shared Browser Tab"**

Void Drift is a multiplayer, top-down space brawler that prioritizes "game feel" (drift, inertia) over complex controls. Features distinct, high-contrast neon vector aesthetics.

## Architecture

This project is a Monorepo managed by `pnpm`:

- **`packages/core`**: Shared physics, input, rendering, procedural assets, and styles.
- **`packages/mode-a`**: Survival rules, ship profiles, schemas, and backend integration.
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

- [Rebuild Charter](./docs/rebuild-charter.md)
- [Architecture](./docs/architecture.md)
- [Experience Design](./docs/design.md)
- [Development and Verification](./docs/development.md)
- [Agent Guidelines](./AGENTS.md)

Run `pnpm verify` for the combined checks and a local evidence report. The rebuild
starts with known legacy lint/type debt; see the development guide for current coverage.

## OpenCode Config

This repo includes an OpenCode project config at `opencode.json`.

- MCP server: `ASDLC` (remote)
- URL: `https://asdlc.io/mcp`
