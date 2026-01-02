<script lang="ts">
  import { onMount } from "svelte";
  import {
    CONFIG,
    Input,
    Vec2,
    Renderer,
    Camera,
    type Star,
    type Planet,
    ScreenShake,
    updatePower,
    updateHull,
    updateShip,
    SURVIVAL_CONFIG,
    createDamageFlash,
    triggerDamageFlash,
    updateDamageFlash,
    type Particle,
    createParticle,
    createCollisionBurst,
    getThrustHue,
  } from "@void-drift/core";
  import {
    updateTimer,
    createInitialGameState,
    getRandomSunType,
    createStar as createGameStar,
    GameLoop,
    type GameState,
    checkDeath,
    handleDeath,
    ensureAnonymousSession,
  } from "@void-drift/mode-a";
  import HUD from "./HUD.svelte";
  import GameOver from "./GameOver.svelte";
  import MenuOverlay from "./MenuOverlay.svelte";
  import { settings } from "../lib/stores/settings";

  let canvas: HTMLCanvasElement;
  let container: HTMLDivElement;
  let renderer: Renderer | undefined;
  let input: Input | undefined;
  let loop: GameLoop | undefined;
  let camera: Camera | undefined;
  let shake: ScreenShake | undefined;
  let damageFlash = createDamageFlash();
  let particles: Particle[] = [];

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

  let gameState: GameState = $state(createInitialGameState());

  let star: Star | undefined = $state(undefined);
  let planets: Planet[] = $state([]);

  function startGame() {
    // Select Sun Type
    const sunType = getRandomSunType();
    gameState.sunType = sunType;
    star = createGameStar(sunType, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);

    gameState.status = "PLAYING";
    gameState.startTime = Date.now();
  }

  function restartGame() {
    // Reset game state
    gameState.status = "MENU";
    gameState.startTime = null;
    gameState.elapsedTime = 0;
    gameState.resources.hull = 100;
    gameState.resources.power = 100;
    gameState.deathCause = null;

    // Reset Sun
    const sunType = getRandomSunType();
    gameState.sunType = sunType;
    star = createGameStar(sunType, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);

    // Reset ship
    ship.pos.set(LOGICAL_WIDTH / 2 - 500, LOGICAL_HEIGHT / 2);
    ship.vel.set(0, 0);
    ship.acc.set(0, 0);
    ship.rotation = -Math.PI / 2;

    // Reset Planets
    if (planets.length > 0) {
      planets[0].orbitAngle = 0;
    }

    // Reset Particles
    particles = [];

    // Reset Shake
    shake?.reset();
  }

  function update(dt: number) {
    if (!renderer || !input || !camera) return;

    // Get effective input (with potential inversion from settings)
    const effectiveInput = input.getEffectiveState($settings.invertControls);

    // Sync Input State to UI (for feedback) - show effective (inverted) state
    leftActive = effectiveInput.leftThruster;
    rightActive = effectiveInput.rightThruster;

    // Timer update (only during PLAYING)
    if (gameState.status === "PLAYING") {
      updateTimer(gameState);
    }

    if (gameState.status !== "PLAYING") return; // Only run physics during PLAYING

    // Physics (using logical viewport dimensions)
    updateShip(
      ship,
      effectiveInput,
      dt,
      LOGICAL_WIDTH,
      LOGICAL_HEIGHT,
      star,
      planets,
      gameState.resources,
      (type, magnitude, data) => {
        if (shake) {
          const trauma =
            type === "planet"
              ? SURVIVAL_CONFIG.TRAUMA_VALUES.planetCollision
              : 0.1;
          shake.addTrauma(trauma * magnitude);
        }
        if (type === "planet") {
          triggerDamageFlash(damageFlash, 0.8 * magnitude, 0.2);

          // Create collision burst particles
          if (data?.color && data?.x !== undefined && data?.y !== undefined) {
            const burst = createCollisionBurst(data.x, data.y, 10, data.color);
            particles.push(...burst);
          }
        }
      },
    );

    // Resource Updates
    if (star) {
      const dx = ship.pos.x - star.pos.x;
      const dy = ship.pos.y - star.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      updatePower(gameState.resources, dist, star, dt, {
        left: effectiveInput.leftThruster,
        right: effectiveInput.rightThruster,
      });

      updateHull(gameState.resources, dist, star, dt);

      // Death Check
      if (gameState.status === "PLAYING") {
        const deathCause = checkDeath(gameState, ship, star);
        if (deathCause) {
          handleDeath(gameState, deathCause, ship);
        }
      }
    }

    // Particle Update & Thrust Emission
    // Eject particles opposite to thrust
    if (effectiveInput.leftThruster || effectiveInput.rightThruster) {
      // Emit logic roughly based on ship rotation
      // For now, simple single emitter
      // Hue based on speed
      const speed = ship.vel.mag();
      const hue = getThrustHue(speed, gameState.resources.power);
      const opposite = ship.rotation + Math.PI;
      // Spread
      const angle = opposite + (Math.random() - 0.5) * 0.5;
      const blastSpeed = 150 + Math.random() * 50;

      const vx = Math.cos(angle) * blastSpeed + ship.vel.x * 0.2;
      const vy = Math.sin(angle) * blastSpeed + ship.vel.y * 0.2;

      // Emit from rear of ship (use ship radius for offset)
      const rearOffset = ship.radius + 2;
      particles.push(
        createParticle(
          ship.pos.x - Math.cos(ship.rotation) * rearOffset,
          ship.pos.y - Math.sin(ship.rotation) * rearOffset,
          vx,
          vy,
          hue,
          0.5,
        ),
      );
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt / p.maxLife;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Cap particle count to prevent unbounded growth
    const MAX_PARTICLES = 100;
    if (particles.length > MAX_PARTICLES) {
      particles.splice(0, particles.length - MAX_PARTICLES);
    }

    // Update Screen Shake
    if (shake) {
      const shakeOffset = shake.update(dt);
      camera.setOffset(shakeOffset.x, shakeOffset.y);
    }

    // Update Damage Flash
    updateDamageFlash(damageFlash, dt);

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

    // Draw Particles
    renderer.drawParticles(particles);

    // Draw Ship
    const hullPercent = gameState.resources.hull;
    let shipTint = "#ffffff";
    if (hullPercent <= 25) shipTint = "#ff3333";
    else if (hullPercent <= 50) shipTint = "#ffaa00";

    renderer.drawShip(ship, shipTint);

    // Draw Flash
    renderer.drawDamageFlash(damageFlash);

    // End camera transform
    renderer.endCamera();
  }

  onMount(() => {
    // Ensure user is authenticated before game starts
    ensureAnonymousSession().catch((error: unknown) => {
      console.error("Failed to authenticate:", error);
    });

    camera = new Camera({
      viewportWidth: LOGICAL_WIDTH,
      viewportHeight: LOGICAL_HEIGHT,
      smoothing: 1.0,
    });

    // Initialize Screen Shake
    shake = new ScreenShake(SURVIVAL_CONFIG.SCREEN_SHAKE);

    // Reset Flash
    damageFlash = createDamageFlash();

    // Position Ship slightly offset
    ship.pos.set(LOGICAL_WIDTH / 2 - 500, LOGICAL_HEIGHT / 2);

    // Create an initial Star for the menu (Class G)
    const initialSunType = "G";
    gameState.sunType = initialSunType;
    star = createGameStar(
      initialSunType,
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT / 2,
    );

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
    input = new Input(canvas);

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
      <HUD {gameState} />

      <!-- Logo -->
      <div class="logo">∅·Δ</div>

      <!-- Controls Hint (Bottom) -->
      <div class="controls-hint">
        <div class="desktop-only">WASD / Arrows to Thrust</div>
        <div class="mobile-only">Tap Sides to Thrust</div>
      </div>

      <!-- Version Display -->
      <div class="version-display">α {__APP_VERSION__}</div>

      <!-- Menu Overlay -->
      {#if gameState.status === "MENU"}
        <MenuOverlay onStart={startGame} {container} />
      {/if}

      <!-- Game Over Modal -->
      {#if gameState.status === "GAME_OVER"}
        <GameOver {gameState} onRestart={restartGame} />
      {/if}
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
    height: 100dvh;
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
