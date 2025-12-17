<script lang="ts">
  import { onMount } from "svelte";
  import {
    CONFIG,
    Input,
    GameLoop,
    updateShip,
    Vec2,
    Renderer,
    Camera,
    type Star,
    type Planet,
    SURVIVAL_CONFIG,
    updateFuel,
    updateHull,
    type GameState,
  } from "@void-drift/engine";
  import HUD from "./HUD.svelte";

  let canvas: HTMLCanvasElement;
  let container: HTMLDivElement;
  let renderer: Renderer | undefined;
  let input: Input | undefined;
  let loop: GameLoop | undefined;
  let camera: Camera | undefined;

  // Reactivity for UI
  let leftActive = $state(false);
  let rightActive = $state(false);
  let showRotateOverlay = $state(false);

  // 16:9 Logical Resolution
  const LOGICAL_WIDTH = 1920;
  const LOGICAL_HEIGHT = 1080;

  const ship = {
    pos: new Vec2(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: -Math.PI / 2,
    radius: CONFIG.SHIP_RADIUS,
  };

  let state: GameState = $state({
    resources: {
      hull: SURVIVAL_CONFIG.INITIAL_HULL,
      fuel: SURVIVAL_CONFIG.INITIAL_FUEL,
    },
  });

  let star: Star | undefined = $state(undefined);
  let planets: Planet[] = $state([]);

  function update(dt: number) {
    if (!renderer || !input || !camera) return;

    // Sync Input State to UI (for feedback)
    leftActive = input.state.leftThruster;
    rightActive = input.state.rightThruster;

    // Physics (using logical viewport dimensions)
    updateShip(
      ship,
      input.state,
      dt,
      LOGICAL_WIDTH,
      LOGICAL_HEIGHT,
      star,
      planets,
      state.resources,
    );

    // Resource Updates
    if (star) {
      const dx = ship.pos.x - star.pos.x;
      const dy = ship.pos.y - star.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      updateFuel(
        state.resources,
        input.state.leftThruster || input.state.rightThruster,
        dist,
        dt,
      );

      updateHull(state.resources, dist, star.radius, dt);
    }

    // Update Camera to follow ship
    camera.setTarget(ship.pos.x, ship.pos.y);
    camera.update(dt);

    // Render
    renderer.clear();

    // Begin camera transform
    renderer.beginCamera(camera);

    // Draw Background Stars (World Space)
    renderer.drawBackground();

    // Draw Arena Boundary
    renderer.drawArenaBoundary(1200);

    // Draw Star (if exists)
    if (star) {
      renderer.drawStar(star, performance.now());
    }

    // Draw Planets
    for (const planet of planets) {
      renderer.drawPlanet(planet);
    }

    // Draw Ship
    renderer.drawShip(ship);

    // End camera transform
    renderer.endCamera();
  }

  onMount(() => {
    // Initialize Camera with 16:9 viewport
    camera = new Camera({
      viewportWidth: LOGICAL_WIDTH,
      viewportHeight: LOGICAL_HEIGHT,
      smoothing: 1.0,
    });

    // Position Ship slightly offset
    ship.pos.set(LOGICAL_WIDTH / 2 - 500, LOGICAL_HEIGHT / 2);

    // Create a Star in the center
    star = {
      pos: new Vec2(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2),
      radius: 40,
      influenceRadius: 350,
      mass: 600,
      color: "#FFA500", // Orange
    };

    // Create Planets
    planets = [
      {
        pos: new Vec2(0, 0),
        orbitCenter: new Vec2(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2),
        orbitRadius: 700,
        orbitSpeed: 0.05,
        orbitAngle: 0,
        radius: 30,
        mass: 400,
        color: "#6666CC", // Slate Blue
      },
    ];

    // Initialize Renderer with logical resolution
    renderer = new Renderer(canvas);
    renderer.resize(LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Initialize Input
    input = new Input();

    const onResize = () => {
      if (!container) return;

      // Calculate scaling to fit 16:9 within window
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const windowRatio = windowWidth / windowHeight;
      const targetRatio = 16 / 9;

      let width: number;
      let height: number;

      if (windowRatio > targetRatio) {
        // Window is wider - fit to height
        height = windowHeight;
        width = height * targetRatio;
      } else {
        // Window is taller - fit to width
        width = windowWidth;
        height = width / targetRatio;
      }

      // Apply to container
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;

      // Check for portrait orientation warning
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

<div class="viewport-wrapper">
  <div class="game-container" bind:this={container}>
    <canvas bind:this={canvas} class="game-canvas"></canvas>

    <!-- Touch Zone Feedback -->
    <div class="zone-feedback left" class:active={leftActive}></div>
    <div class="zone-feedback right" class:active={rightActive}></div>

    <!-- HUD Overlay -->
    <div class="hud-overlay">
      <HUD {state} />

      <!-- Logo -->
      <div class="logo">∅·Δ</div>

      <!-- Controls Hint (Bottom) -->
      <div class="controls-hint">
        <div class="desktop-only">WASD / Arrows to Thrust</div>
        <div class="mobile-only">Tap Sides to Thrust</div>
      </div>

      <!-- Version Display -->
      <div class="version-display">α {__APP_VERSION__}</div>
    </div>
  </div>
</div>

<!-- Orientation Warning -->
{#if showRotateOverlay}
  <div class="rotate-overlay">
    <h1>VOID DRIFT</h1>
    <p>Please Rotate Device</p>
  </div>
{/if}

<style>
  .viewport-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-void);
    overflow: hidden;
  }

  .game-container {
    position: relative;
    /* Dimensions set dynamically by JS to maintain 16:9 */
    background: var(--color-void);
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
  }

  .game-canvas {
    display: block;
    width: 100%;
    height: 100%;
    image-rendering: crisp-edges;
  }

  /* HUD Overlay */
  .hud-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
  }

  .logo {
    position: absolute;
    top: var(--spacing-md);
    left: var(--spacing-md);
    font-family: "Noto Sans Math", sans-serif;
    font-size: 48px;
    font-weight: 300;
    color: var(--color-neon-blue);
    text-shadow: 0 0 10px var(--color-neon-blue);
    letter-spacing: 4px;
  }

  .controls-hint {
    position: absolute;
    bottom: var(--spacing-md);
    width: 100%;
    text-align: center;
    color: var(--color-text-dim);
    font-family: "Noto Sans Math", sans-serif;
    font-size: 14px;
  }

  .version-display {
    position: absolute;
    bottom: var(--spacing-sm);
    right: var(--spacing-md);
    color: var(--color-text-dim);
    font-family: "Noto Sans Math", sans-serif;
    font-size: 12px;
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
    box-shadow: inset 0 0 50px rgba(212, 255, 0, 0.2);
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

  @media (max-width: 768px) {
    .logo {
      font-size: 32px;
      top: var(--spacing-sm);
      left: var(--spacing-sm);
    }

    .controls-hint {
      font-size: 12px;
      bottom: var(--spacing-sm);
    }
  }
</style>
