# Technical Specification: Retro Arcade Particle System

## 1. Rendering Architecture

The system utilizes a **Dual-Canvas Stack** approach decoupled via CSS, allowing for independent rendering frequencies and blend modes between the game state and the visual effects.

### Layer Stack (Bottom to Top)

1.  **Game Logic Layer** (`<canvas id="game-layer">`)
    *   **Role:** Renders the persistent game world (player, enemies, grid).
    *   **Context:** Standard 2D Context.
    *   **Filters:** Applied filter: `blur(0.5px)` to simulate analog signal softness.

2.  **VFX Layer** (`<canvas id="particle-layer">`)
    *   **Role:** Renders transient high-frequency visual effects (sparks, fire, trails).
    *   **Compositing:** Uses CSS `mix-blend-mode: screen` to composite over the Game Layer.
    *   **Physics:** Independent update loop for particle entities.

3.  **CRT Post-Processing** (`<div>` overlays)
    *   **Scanlines:** CSS `linear-gradient` overlay mimicking interlaced video.
    *   **Vignette:** Inset `box-shadow` simulating CRT glass curvature and corner dimming.

## 2. Visual Pipeline & Blending Strategies

### A. Inter-Layer Blending (The "Glow" Effect)
Instead of calculating pixel transparency manually, the system relies on the browser's compositor.

*   **Technique:** `mix-blend-mode: screen` on the Particle Layer.
*   **Math:** `FinalColor = 1 - (1 - BaseColor) * (1 - BlendColor)`
*   **Result:**
    *   Black pixels (0,0,0) in the VFX layer become transparent.
    *   Bright pixels add luminosity to the underlying Game Layer.
    *   Overlapping colors blend additively (e.g., Red + Blue = Magenta), mimicking phosphor persistence.

### B. Intra-Layer Blending (The "Hotspot" Core)
Within the VFX layer itself, particles blend with each other before interacting with the background.

*   **Technique:** `ctx.globalCompositeOperation = 'lighter'` (Additive Blending).
*   **Result:** When particles cluster, their color values sum up, causing dense areas to blow out to white/bright colors. This simulates high-intensity heat or energy cores.

### C. The "Trail" Persistence Algorithm
Instead of standard frame clearing (`clearRect`), the system uses a **Fade-Over-Time** feedback loop to generate motion trails without tracking history arrays for every particle.

*   **Process (Per Frame):**
    1.  Do not clear the canvas.
    2.  Draw a full-screen rectangle: `fillStyle = rgba(0, 0, 0, alpha)`.
*   **Result:**
    *   Because of the screen blend mode, Black acts as transparency.
    *   Drawing semi-transparent black effectively reduces the brightness (alpha) of existing pixels by the specified percentage.
    *   **Low Alpha (0.05):** Long, dreamy trails (slow fade).
    *   **High Alpha (0.6):** Short, sharp staccato trails (fast fade).

## 3. Particle Entity Logic

### Data Structure
*   **State:** Position (x,y), Velocity (vx, vy), Life (0.0-1.0), Decay Rate, Hue.

### Initialization
*   Radial burst logic with random velocity vectors.

### Update Step
*   Velocity damping (0.98 friction).
*   Gravity well logic (pull towards screen center).
*   Life decrement.

### Rendering Optimization
*   **Batching:** Particles are drawn sequentially inside the `lighter` composite block to minimize state changes.
*   **Geometry:** Uses `ctx.arc` for dynamic coloring.
    *   *Note: For particle counts >5000, this should be swapped for `drawImage` using a pre-rendered sprite canvas to reduce draw-call overhead.*

## 4. Input & Interactivity

*   **Emitter Tracking:** The particle origin locks to Mouse coordinates (`mousemove`) or defaults to screen center.
*   **Dynamic Configuration:**
    *   **Trail Length:** Modifies the alpha value of the clearing rectangle.
    *   **Particle Count:** Dynamic array splicing (adding/removing entities) per frame to maintain target FPS.
