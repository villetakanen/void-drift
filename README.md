# Void Drift

**"Build a Ship. Survive the Newtonian Chaos."**

Void Drift is a physics-driven, top-down space survival game played in the browser. Choose a ship, fit its parts and fly through drift, gravity and explosive fights in a procedural star system. Play without an account, and compete through optional shared scores. Its visual language is high-contrast neon on the void.

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
   pnpm dev:ensure
   ```

   On the shared Mac checkout this starts or reuses the development service at `http://localhost:4321`.

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

## Ranked Challenge Names

| Release line | Challenge name     |
| ------------ | ------------------ |
| 0.5.x        | `alpha-1`          |
| 0.6.x        | `ion-storm`        |
| 0.7.x        | `fires-in-the-sky` |

A challenge name is changed only by a release to production; there are no development, temporary or per-feature challenge names. See [Release](./docs/development.md#release) for the process.

## Documentation

- [Vision](./docs/vision.md)
- [Architecture](./docs/architecture.md)
- [Experience Design](./docs/design.md)
- [Development and Verification](./docs/development.md)
- [Agent Guidelines](./AGENTS.md)

Run `pnpm verify` for the combined checks and a local evidence report. The rebuild
starts with known legacy lint/type debt; see the development guide for current coverage.

## Providence

This project is a testbed for [ASDLC.io] pattern libary and for a select [Futurice.com] FAB harness tools. YMMV.
