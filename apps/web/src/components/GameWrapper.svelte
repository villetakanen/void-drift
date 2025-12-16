<script lang="ts">
  import { onMount } from "svelte";
  import {
    CONFIG,
    Input,
    GameLoop,
    updateShip,
    Vec2,
    Renderer,
    type Star,
  } from "@void-drift/engine";

  let canvas: HTMLCanvasElement;
  let renderer: Renderer | undefined;
  let input: Input | undefined;
  let loop: GameLoop | undefined;

  // Reactivity for UI
  let leftActive = $state(false);
  let rightActive = $state(false);
  let showRotateOverlay = $state(false);

  const ship = {
    pos: new Vec2(0, 0),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: -Math.PI / 2,
    radius: CONFIG.SHIP_RADIUS,
  };

  let star: Star | undefined = $state(undefined);

  function update(dt: number) {
    if (!renderer || !input) return;

    // Sync Input State to UI (for feedback)
    leftActive = input.state.leftThruster;
    rightActive = input.state.rightThruster;

    // Physics
    const width = window.innerWidth;
    const height = window.innerHeight;
    updateShip(ship, input.state, dt, width, height, star);

    // Render
    renderer.clear();

    // Draw Star (if exists)
    if (star) {
      renderer.drawStar(star, performance.now());
    }

    renderer.drawShip(ship);
  }

  onMount(() => {
    const rx = window.innerWidth / 2;
    const ry = window.innerHeight / 2;

    // Position Ship slightly offset
    ship.pos.set(rx - 300, ry);

    // Create a Star in the center
    star = {
      pos: new Vec2(rx, ry),
      radius: 40,
      influenceRadius: 300,
      mass: 500, // Tunable gravity strength
      color: "#FFA500", // Orange
    };

    renderer = new Renderer(canvas);
    input = new Input();

    const onResize = () => {
      renderer?.resize(window.innerWidth, window.innerHeight);
      // Requirement: Game must be Landscape.
      // If Height > Width (Portrait), show overlay.
      showRotateOverlay = window.innerHeight > window.innerWidth;
    };
    window.addEventListener("resize", onResize);
    onResize();

    loop = new GameLoop(update);
    loop.start();

    return () => {
      loop?.stop();
      input?.destroy();
      window.removeEventListener("resize", onResize);
    };
  });
</script>

<canvas bind:this={canvas} class="game-canvas"></canvas>

<!-- Touch Zone Feedback -->
<div class="zone-feedback left" class:active={leftActive}></div>
<div class="zone-feedback right" class:active={rightActive}></div>

<!-- UI Overlay -->
<div class="ui-overlay">
  <div class="controls-hint desktop-only">WASD / Arrows to Thrust</div>
  <div class="controls-hint mobile-only">Tap Sides to Thrust</div>
</div>

<div class="version-display">
  α {__APP_VERSION__}
</div>

<!-- Orientation Warning -->
{#if showRotateOverlay}
  <div class="rotate-overlay">
    <h1>VOID DRIFT</h1>
    <p>Please Rotate Device</p>
  </div>
{/if}

<style>
  .game-canvas {
    display: block;
    width: 100vw;
    height: 100vh;
  }

  .ui-overlay {
    position: absolute;
    bottom: 20px;
    width: 100%;
    text-align: center;
    pointer-events: none;
    color: var(--color-text-dim);
    font-family: "Noto Sans Math", sans-serif;
    z-index: 10;
  }

  .version-display {
    position: absolute;
    bottom: 10px;
    right: 10px;
    color: var(--color-text-dim);
    font-family: "Noto Sans Math", sans-serif;
    font-size: 12px;
    pointer-events: none;
    z-index: 10;
  }

  /* Feedback Zones */
  .zone-feedback {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
    pointer-events: none;
    transition: background 0.1s;
    z-index: 5;
  }
  .zone-feedback.left {
    left: 0;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
  }
  .zone-feedback.right {
    right: 0;
  }
  .zone-feedback.active {
    background: rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 0 50px rgba(0, 240, 255, 0.2);
  }

  /* Orientation Overlay */
  .rotate-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--color-void);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    color: var(--color-text);
    font-family: "Noto Sans Math", sans-serif;
  }
  .rotate-overlay h1 {
    color: var(--color-neon-blue);
    text-transform: uppercase;
    letter-spacing: 4px;
    margin-bottom: 20px;
  }

  /* Responsive Text */
  .mobile-only {
    display: none;
  }

  @media (pointer: coarse) {
    .desktop-only {
      display: none;
    }
    .mobile-only {
      display: block;
    }
  }
</style>
